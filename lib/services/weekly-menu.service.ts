import { query, getConnection, type MysqlInsertResult, type MysqlDeleteResult } from '@/lib/db/connection';
import type { WeeklyMenu, WeeklyMenuDay } from '@/lib/models/weekly-menu';
import { getWeekNumber, getYear, formatDateLocal, isMonday } from '@/lib/utils/date.utils';
import type { FieldPacket } from 'mysql2/promise';
import { getMealById } from '@/lib/services/meal.service';
import type { Meal } from '@/lib/models/meal';
import { getOrganizationById } from '@/lib/services/organization.service';

/**
 * Database row type for WeeklyMenu (as returned from MySQL)
 */
interface WeeklyMenuRow {
  id: number;
  created: string | Date;
  organizationId: number;
  weekStartDate: string | Date;
  weekNumber: number | null;
  year: number | null;
  orderCount: number;
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
    `SELECT 
       wm.id, 
       wm.created, 
       wm.organizationId, 
       wm.weekStartDate, 
       wm.weekNumber, 
       wm.year,
       (SELECT COUNT(*) FROM bookings b WHERE b.menuId = wm.id) AS orderCount
     FROM weekly_menus wm
     ORDER BY wm.weekStartDate DESC`
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
    organizationId: row.organizationId,
    weekStartDate: new Date(row.weekStartDate),
    weekNumber: row.weekNumber ?? undefined,
    year: row.year ?? undefined,
    orderCount: row.orderCount,
    days: daysByMenuId.get(row.id) ?? [],
  }));
}

/**
 * Get a weekly menu by ID with its days
 */
export async function getWeeklyMenuById(id: number): Promise<WeeklyMenu | null> {
  const menus = await query<WeeklyMenuRow[]>(
    'SELECT id, created, organizationId, weekStartDate, weekNumber, year FROM weekly_menus WHERE id = ?',
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
    organizationId: menu.organizationId,
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
 * Get a weekly menu by organization and week start date
 */
export async function getWeeklyMenuByWeekStart(weekStartDate: Date, organizationId: number): Promise<WeeklyMenu | null> {
  const dateStr = formatDateLocal(weekStartDate);
  const menus = await query<WeeklyMenuRow[]>(
    'SELECT id, created, organizationId, weekStartDate, weekNumber, year FROM weekly_menus WHERE organizationId = ? AND weekStartDate = ?',
    [organizationId, dateStr]
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
  organizationId: number;
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

    // Validate organization exists
    const organization = await getOrganizationById(data.organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    const weekStartDateStr = formatDateLocal(data.weekStartDate);
    const weekNum = getWeekNumber(data.weekStartDate);
    const year = getYear(data.weekStartDate);

    // Check if a menu already exists for this organization and date
    const existing = await query<WeeklyMenuRow[]>(
      'SELECT id FROM weekly_menus WHERE organizationId = ? AND weekStartDate = ?',
      [data.organizationId, weekStartDateStr]
    );
    if (existing.length > 0) {
      throw new Error('Un menu existe déjà pour cet établissement et cette date');
    }

    // Insert the weekly menu
    const [menuResult] = await connection.execute(
      'INSERT INTO weekly_menus (organizationId, weekStartDate, weekNumber, year) VALUES (?, ?, ?, ?)',
      [data.organizationId, weekStartDateStr, weekNum, year]
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
    organizationId?: number;
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

    // Get current menu to check if organizationId or weekStartDate is being changed
    const currentMenu = await getWeeklyMenuById(id);
    if (!currentMenu) {
      throw new Error('Weekly menu not found');
    }

    const newOrganizationId = data.organizationId ?? currentMenu.organizationId;
    const newWeekStartDate = data.weekStartDate ?? currentMenu.weekStartDate;

    // Check if organizationId or weekStartDate is being changed
    const isOrganizationOrDateChanging =
      (data.organizationId !== undefined && data.organizationId !== currentMenu.organizationId) ||
      (data.weekStartDate !== undefined &&
       formatDateLocal(data.weekStartDate) !== formatDateLocal(currentMenu.weekStartDate));

    // If organizationId or weekStartDate is being changed, verify uniqueness
    if (isOrganizationOrDateChanging) {
      const weekStartDateStr = formatDateLocal(newWeekStartDate);
      const existing = await query<WeeklyMenuRow[]>(
        'SELECT id FROM weekly_menus WHERE organizationId = ? AND weekStartDate = ? AND id != ?',
        [newOrganizationId, weekStartDateStr, id]
      );
      if (existing.length > 0) {
        throw new Error('Un menu existe déjà pour cet établissement et cette date');
      }
    }

    // Update weekly menu if weekStartDate or organizationId is provided
    if (data.weekStartDate || data.organizationId !== undefined) {
      const weekStartDateStr = formatDateLocal(newWeekStartDate);
      const weekNum = getWeekNumber(newWeekStartDate);
      const year = getYear(newWeekStartDate);

      if (data.organizationId !== undefined) {
        await connection.execute(
          'UPDATE weekly_menus SET organizationId = ?, weekStartDate = ?, weekNumber = ?, year = ? WHERE id = ?',
          [newOrganizationId, weekStartDateStr, weekNum, year, id]
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
 * Get the weekly menu with full meal details for a given week and organization.
 * @param weekStartDate - The Monday that starts the week (required, must be a Monday)
 * @param organizationId - The organization ID (required)
 * @returns The week's menu with meal details, or null if not found
 * @throws Error if weekStartDate is not a Monday or organizationId is invalid
 */
export async function getWeeklyMenuWithMealsForDate(weekStartDate: Date, organizationId: number): Promise<WeeklyMenu | null> {
  const date = new Date(weekStartDate);
  date.setHours(0, 0, 0, 0);
  if (!isMonday(date)) {
    throw new Error('weekStartDate must be a Monday');
  }
  if (!organizationId || organizationId <= 0) {
    throw new Error('organizationId is required and must be a positive number');
  }

  const menu = await getWeeklyMenuByWeekStart(date, organizationId);

  if (!menu) {
    return null;
  }

  return getWeeklyMenuWithMeals(menu.id);
}
