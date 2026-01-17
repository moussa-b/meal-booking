import { query, getConnection, type MysqlInsertResult, type MysqlDeleteResult } from '@/lib/db/connection';
import type { WeeklyMenu, WeeklyMenuDay } from '@/lib/models/weekly-menu';
import { getWeekNumber, getYear, formatDateLocal } from '@/lib/utils/date.utils';
import type { FieldPacket } from 'mysql2/promise';

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
    `SELECT id, weeklyMenuId, dayOfWeek, mainDishId, appetizerId, dessertId 
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
    'SELECT id, weeklyMenuId, dayOfWeek, mainDishId, appetizerId, dessertId FROM weekly_menu_days WHERE weeklyMenuId = ? ORDER BY dayOfWeek',
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
        'INSERT INTO weekly_menu_days (weeklyMenuId, dayOfWeek, mainDishId, appetizerId, dessertId) VALUES (?, ?, ?, ?, ?)',
        [weeklyMenuId, day.dayOfWeek, day.mainDishId, day.appetizerId ?? null, day.dessertId ?? null]
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
          'INSERT INTO weekly_menu_days (weeklyMenuId, dayOfWeek, mainDishId, appetizerId, dessertId) VALUES (?, ?, ?, ?, ?)',
          [id, day.dayOfWeek, day.mainDishId, day.appetizerId ?? null, day.dessertId ?? null]
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
