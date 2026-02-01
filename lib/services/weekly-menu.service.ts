import { query, getConnection, type MysqlInsertResult, type MysqlDeleteResult } from '@/lib/db/connection';
import type { WeeklyMenu, WeeklyMenuDay } from '@/lib/models/weekly-menu';
import { getWeekNumber, getYear, formatDateLocal, isMonday } from '@/lib/utils/date.utils';
import type { FieldPacket } from 'mysql2/promise';
import { getMealById } from '@/lib/services/meal.service';
import type { Meal } from '@/lib/models/meal';
import { getSchoolById } from '@/lib/services/school.service';

/**
 * Database row type for WeeklyMenu (as returned from MySQL)
 */
interface WeeklyMenuRow {
  id: number;
  created: string | Date;
  schoolId: number;
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
    'SELECT id, created, schoolId, weekStartDate, weekNumber, year FROM weekly_menus ORDER BY weekStartDate DESC'
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
    schoolId: row.schoolId,
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
    'SELECT id, created, schoolId, weekStartDate, weekNumber, year FROM weekly_menus WHERE id = ?',
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
    schoolId: menu.schoolId,
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
 * Get a weekly menu by school and week start date
 */
export async function getWeeklyMenuByWeekStart(weekStartDate: Date, schoolId: number): Promise<WeeklyMenu | null> {
  const dateStr = formatDateLocal(weekStartDate);
  const menus = await query<WeeklyMenuRow[]>(
    'SELECT id, created, schoolId, weekStartDate, weekNumber, year FROM weekly_menus WHERE schoolId = ? AND weekStartDate = ?',
    [schoolId, dateStr]
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
  schoolId: number;
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

    // Validate school exists
    const school = await getSchoolById(data.schoolId);
    if (!school) {
      throw new Error('School not found');
    }

    const weekStartDateStr = formatDateLocal(data.weekStartDate);
    const weekNum = getWeekNumber(data.weekStartDate);
    const year = getYear(data.weekStartDate);

    // Check if a menu already exists for this school and date
    const existing = await query<WeeklyMenuRow[]>(
      'SELECT id FROM weekly_menus WHERE schoolId = ? AND weekStartDate = ?',
      [data.schoolId, weekStartDateStr]
    );
    if (existing.length > 0) {
      throw new Error('Un menu existe déjà pour cette école et cette date');
    }

    // Insert the weekly menu
    const [menuResult] = await connection.execute(
      'INSERT INTO weekly_menus (schoolId, weekStartDate, weekNumber, year) VALUES (?, ?, ?, ?)',
      [data.schoolId, weekStartDateStr, weekNum, year]
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
    schoolId?: number;
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

    // Get current menu to check if schoolId or weekStartDate is being changed
    const currentMenu = await getWeeklyMenuById(id);
    if (!currentMenu) {
      throw new Error('Weekly menu not found');
    }

    const newSchoolId = data.schoolId ?? currentMenu.schoolId;
    const newWeekStartDate = data.weekStartDate ?? currentMenu.weekStartDate;

    // Check if schoolId or weekStartDate is being changed
    const isSchoolOrDateChanging = 
      (data.schoolId !== undefined && data.schoolId !== currentMenu.schoolId) ||
      (data.weekStartDate !== undefined && 
       formatDateLocal(data.weekStartDate) !== formatDateLocal(currentMenu.weekStartDate));

    // If schoolId or weekStartDate is being changed, verify uniqueness
    if (isSchoolOrDateChanging) {
      const weekStartDateStr = formatDateLocal(newWeekStartDate);
      const existing = await query<WeeklyMenuRow[]>(
        'SELECT id FROM weekly_menus WHERE schoolId = ? AND weekStartDate = ? AND id != ?',
        [newSchoolId, weekStartDateStr, id]
      );
      if (existing.length > 0) {
        throw new Error('Un menu existe déjà pour cette école et cette date');
      }
    }

    // Update weekly menu if weekStartDate or schoolId is provided
    if (data.weekStartDate || data.schoolId !== undefined) {
      const weekStartDateStr = formatDateLocal(newWeekStartDate);
      const weekNum = getWeekNumber(newWeekStartDate);
      const year = getYear(newWeekStartDate);

      if (data.schoolId !== undefined) {
        await connection.execute(
          'UPDATE weekly_menus SET schoolId = ?, weekStartDate = ?, weekNumber = ?, year = ? WHERE id = ?',
          [newSchoolId, weekStartDateStr, weekNum, year, id]
        );
      } else {
        await connection.execute(
          'UPDATE weekly_menus SET weekStartDate = ?, weekNumber = ?, year = ? WHERE id = ?',
          [weekStartDateStr, weekNum, year, id]
        );
      }
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
 * Get the weekly menu with full meal details for a given week and school.
 * @param weekStartDate - The Monday that starts the week (required, must be a Monday)
 * @param schoolId - The school ID (required)
 * @returns The week's menu with meal details, or null if not found
 * @throws Error if weekStartDate is not a Monday or schoolId is invalid
 */
export async function getWeeklyMenuWithMealsForDate(weekStartDate: Date, schoolId: number): Promise<WeeklyMenu | null> {
  const date = new Date(weekStartDate);
  date.setHours(0, 0, 0, 0);
  if (!isMonday(date)) {
    throw new Error('weekStartDate must be a Monday');
  }
  if (!schoolId || schoolId <= 0) {
    throw new Error('schoolId is required and must be a positive number');
  }

  const menu = await getWeeklyMenuByWeekStart(date, schoolId);

  if (!menu) {
    return null;
  }

  return getWeeklyMenuWithMeals(menu.id);
}
