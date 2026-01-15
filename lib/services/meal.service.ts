import { query, type MysqlInsertResult, type MysqlDeleteResult } from '@/lib/db/connection';
import type { Meal } from '@/lib/models/meal';
import { MealType } from '@/lib/models/meal';

/**
 * Database row type for Meal (as returned from MySQL)
 */
interface MealRow {
  id: number;
  created: string | Date;
  name: string;
  type: string;
  description: string;
}

/**
 * Get all meals
 */
export async function getAllMeals(): Promise<Meal[]> {
  const results = await query<MealRow[]>(
    'SELECT id, created, name, type, description FROM meals ORDER BY created DESC'
  );
  return results.map((row: MealRow) => ({
    id: row.id,
    created: new Date(row.created),
    name: row.name,
    type: row.type as MealType,
    description: row.description,
  }));
}

/**
 * Get a meal by ID
 */
export async function getMealById(id: number): Promise<Meal | null> {
  const results = await query<MealRow[]>(
    'SELECT id, created, name, type, description FROM meals WHERE id = ?',
    [id]
  );
  
  if (results.length === 0) {
    return null;
  }
  
  const row: MealRow = results[0];
  return {
    id: row.id,
    created: new Date(row.created),
    name: row.name,
    type: row.type as MealType,
    description: row.description,
  };
}

/**
 * Create a new meal
 */
export async function createMeal(data: {
  name: string;
  type: string;
  description: string;
}): Promise<Meal> {
  const result = await query<MysqlInsertResult>(
    'INSERT INTO meals (name, type, description) VALUES (?, ?, ?)',
    [data.name, data.type, data.description]
  );
  
  const insertedId: number = result.insertId;
  const meal = await getMealById(insertedId);
  
  if (!meal) {
    throw new Error('Failed to retrieve created meal');
  }
  
  return meal;
}

/**
 * Update a meal
 */
export async function updateMeal(
  id: number,
  data: {
    name?: string;
    type?: string;
    description?: string;
  }
): Promise<Meal> {
  const updates: string[] = [];
  const values: (string | number)[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description);
  }
  
  if (updates.length === 0) {
    const meal = await getMealById(id);
    if (!meal) {
      throw new Error('Meal not found');
    }
    return meal;
  }
  
  values.push(id);
  await query(
    `UPDATE meals SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  const meal = await getMealById(id);
  if (!meal) {
    throw new Error('Meal not found');
  }
  
  return meal;
}

/**
 * Delete a meal
 */
export async function deleteMeal(id: number): Promise<void> {
  const result = await query<MysqlDeleteResult>(
    'DELETE FROM meals WHERE id = ?',
    [id]
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Meal not found');
  }
}
