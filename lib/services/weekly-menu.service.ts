import { query, getConnection, type MysqlInsertResult, type MysqlDeleteResult } from '@/lib/db/connection';
import type { WeeklyMenu, WeeklyMenuDay } from '@/lib/models/weekly-menu';
import { getWeekNumber, getYear, formatDateLocal } from '@/lib/utils/date.utils';
import type { FieldPacket } from 'mysql2/promise';
import { getMealById } from '@/lib/services/meal.service';
import type { Meal } from '@/lib/models/meal';

/**
 * Database row type for WeeklyMenu (as returned from MySQL)
 */
interface WeeklyMenuRow {
  id: number;
  created: string | Date;
  weekStartDate: string | Date;
  weekNumber: number | null;
  year: number | null;
}

/**
 * Database row type for WeeklyMenuDay (as returned from MySQL)
 */
interface WeeklyMenuDayRow {
  id: number;
  weeklyMenuId: number;
  dayOfWeek: number;
  mainDishId: number;
  appetizerId: number | null;
  dessertId: number | null;
  price: number;
}

/**
 * Get all weekly menus with their days
 */
export async function getAllWeeklyMenus(): Promise<WeeklyMenu[]> {
  const menus = await query<WeeklyMenuRow[]>(
    'SELECT id, created, weekStartDate, weekNumber, year FROM weekly_menus ORDER BY weekStartDate DESC'
  );

  if (menus.length === 0) {
    return [];
  }

  const menuIds = menus.map(m => m.id);
  const placeholders = menuIds.map(() => '?').join(',');

  const days = await query<WeeklyMenuDayRow[]>(
    `SELECT id, weeklyMenuId, dayOfWeek, mainDishId, appetizerId, dessertId, price 
     FROM weekly_menu_days 
     WHERE weeklyMenuId IN (${placeholders})
     ORDER BY weeklyMenuId, dayOfWeek`,
    menuIds
  );

  const daysByMenuId = new Map<number, WeeklyMenuDay[]>();
  days.forEach((day: WeeklyMenuDayRow) => {
    if (!daysByMenuId.has(day.weeklyMenuId)) {
      daysByMenuId.set(day.weeklyMenuId, []);
    }
    daysByMenuId.get(day.weeklyMenuId)!.push({
      id: day.id,
      weeklyMenuId: day.weeklyMenuId,
      dayOfWeek: day.dayOfWeek,
      mainDishId: day.mainDishId,
      appetizerId: day.appetizerId,
      dessertId: day.dessertId,
      price: day.price,
    });
  });

  return menus.map((row: WeeklyMenuRow) => ({
    id: row.id,
    created: new Date(row.created),
    weekStartDate: new Date(row.weekStartDate),
    weekNumber: row.weekNumber ?? undefined,
    year: row.year ?? undefined,
    days: daysByMenuId.get(row.id) ?? [],
  }));
}

/**
 * Get a weekly menu by ID with its days
 */
export async function getWeeklyMenuById(id: number): Promise<WeeklyMenu | null> {
  const menus = await query<WeeklyMenuRow[]>(
    'SELECT id, created, weekStartDate, weekNumber, year FROM weekly_menus WHERE id = ?',
    [id]
  );

  if (menus.length === 0) {
    return null;
  }

  const menu = menus[0];
  const days = await query<WeeklyMenuDayRow[]>(
    'SELECT id, weeklyMenuId, dayOfWeek, mainDishId, appetizerId, dessertId, price FROM weekly_menu_days WHERE weeklyMenuId = ? ORDER BY dayOfWeek',
    [id]
  );

  return {
    id: menu.id,
    created: new Date(menu.created),
    weekStartDate: new Date(menu.weekStartDate),
    weekNumber: menu.weekNumber ?? undefined,
    year: menu.year ?? undefined,
    days: days.map((day: WeeklyMenuDayRow) => ({
      id: day.id,
      weeklyMenuId: day.weeklyMenuId,
      dayOfWeek: day.dayOfWeek,
      mainDishId: day.mainDishId,
      appetizerId: day.appetizerId,
      dessertId: day.dessertId,
      price: day.price,
    })),
  };
}

/**
 * Get a weekly menu by week start date
 */
export async function getWeeklyMenuByWeekStart(weekStartDate: Date): Promise<WeeklyMenu | null> {
  const dateStr = formatDateLocal(weekStartDate);
  const menus = await query<WeeklyMenuRow[]>(
    'SELECT id, created, weekStartDate, weekNumber, year FROM weekly_menus WHERE weekStartDate = ?',
    [dateStr]
  );

  if (menus.length === 0) {
    return null;
  }

  return getWeeklyMenuById(menus[0].id);
}

/**
 * Create a new weekly menu with its days
 */
export async function createWeeklyMenu(data: {
  weekStartDate: Date;
  days: Array<{
    dayOfWeek: number;
    mainDishId: number;
    appetizerId?: number | null;
    dessertId?: number | null;
    price: number;
  }>;
}): Promise<WeeklyMenu> {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    const weekStartDateStr = formatDateLocal(data.weekStartDate);
    const weekNum = getWeekNumber(data.weekStartDate);
    const year = getYear(data.weekStartDate);

    // Insert the weekly menu
    const [menuResult] = await connection.execute(
      'INSERT INTO weekly_menus (weekStartDate, weekNumber, year) VALUES (?, ?, ?)',
      [weekStartDateStr, weekNum, year]
    ) as [MysqlInsertResult, FieldPacket[]];

    const weeklyMenuId = menuResult.insertId;

    // Insert all days
    for (const day of data.days) {
      await connection.execute(
        'INSERT INTO weekly_menu_days (weeklyMenuId, dayOfWeek, mainDishId, appetizerId, dessertId, price) VALUES (?, ?, ?, ?, ?, ?)',
        [weeklyMenuId, day.dayOfWeek, day.mainDishId, day.appetizerId ?? null, day.dessertId ?? null, day.price]
      );
    }

    await connection.commit();

    const menu = await getWeeklyMenuById(weeklyMenuId);
    if (!menu) {
      throw new Error('Failed to retrieve created weekly menu');
    }

    return menu;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Update a weekly menu and its days
 */
export async function updateWeeklyMenu(
  id: number,
  data: {
    weekStartDate?: Date;
    days?: Array<{
      dayOfWeek: number;
      mainDishId: number;
      appetizerId?: number | null;
      dessertId?: number | null;
      price: number;
    }>;
  }
): Promise<WeeklyMenu> {
  const connection = await getConnection();

  try {
    await connection.beginTransaction();

    // Update weekly menu if weekStartDate is provided
    if (data.weekStartDate) {
      const weekStartDateStr = formatDateLocal(data.weekStartDate);
      const weekNum = getWeekNumber(data.weekStartDate);
      const year = getYear(data.weekStartDate);

      await connection.execute(
        'UPDATE weekly_menus SET weekStartDate = ?, weekNumber = ?, year = ? WHERE id = ?',
        [weekStartDateStr, weekNum, year, id]
      );
    }

    // Update days if provided
    if (data.days) {
      // Delete existing days
      await connection.execute(
        'DELETE FROM weekly_menu_days WHERE weeklyMenuId = ?',
        [id]
      );

      // Insert new days
      for (const day of data.days) {
        await connection.execute(
          'INSERT INTO weekly_menu_days (weeklyMenuId, dayOfWeek, mainDishId, appetizerId, dessertId, price) VALUES (?, ?, ?, ?, ?, ?)',
          [id, day.dayOfWeek, day.mainDishId, day.appetizerId ?? null, day.dessertId ?? null, day.price]
        );
      }
    }

    await connection.commit();

    const menu = await getWeeklyMenuById(id);
    if (!menu) {
      throw new Error('Weekly menu not found');
    }

    return menu;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Delete a weekly menu (cascade will delete the days)
 */
export async function deleteWeeklyMenu(id: number): Promise<void> {
  const result = await query<MysqlDeleteResult>(
    'DELETE FROM weekly_menus WHERE id = ?',
    [id]
  );

  if (result.affectedRows === 0) {
    throw new Error('Weekly menu not found');
  }
}

/**
 * Get a weekly menu by ID with full meal details (mainDish, appetizer, dessert)
 */
export async function getWeeklyMenuWithMeals(id: number): Promise<WeeklyMenu | null> {
  const menu = await getWeeklyMenuById(id);
  
  if (!menu || !menu.days) {
    return menu;
  }

  // Get all unique meal IDs
  const mealIds = new Set<number>();
  menu.days.forEach(day => {
    mealIds.add(day.mainDishId);
    if (day.appetizerId) mealIds.add(day.appetizerId);
    if (day.dessertId) mealIds.add(day.dessertId);
  });

  // Fetch all meals
  const meals = await Promise.all(
    Array.from(mealIds).map(id => getMealById(id))
  );
  const mealsMap = new Map<number, Meal>();
  meals.forEach(meal => {
    if (meal) mealsMap.set(meal.id, meal);
  });

  // Attach meal details to days
  const daysWithMeals: WeeklyMenuDay[] = menu.days.map(day => ({
    ...day,
    mainDish: mealsMap.get(day.mainDishId),
    appetizer: day.appetizerId ? mealsMap.get(day.appetizerId) ?? null : null,
    dessert: day.dessertId ? mealsMap.get(day.dessertId) ?? null : null,
  }));

  return {
    ...menu,
    days: daysWithMeals,
  };
}

/**
 * Get the current week's menu with full meal details
 * Returns the most recent menu if no menu exists for the current week
 */
export async function getCurrentWeeklyMenuWithMeals(): Promise<WeeklyMenu | null> {
  const today = new Date();
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1)); // Monday
  currentWeekStart.setHours(0, 0, 0, 0);

  // Try to get menu for current week
  let menu = await getWeeklyMenuByWeekStart(currentWeekStart);
  
  // If no menu for current week, get the most recent one
  if (!menu) {
    const allMenus = await getAllWeeklyMenus();
    if (allMenus.length > 0) {
      menu = allMenus[0]; // Most recent (ordered by weekStartDate DESC)
    }
  }

  if (!menu) {
    return null;
  }

  return getWeeklyMenuWithMeals(menu.id);
}
