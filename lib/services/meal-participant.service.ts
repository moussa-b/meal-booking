import { query, type MysqlInsertResult, type MysqlDeleteResult } from '@/lib/db/connection';
import type { MealParticipant } from '@/lib/models/meal-participant';
import type { OrganizationType } from '@/lib/models/organization';

interface MealParticipantRow {
  id: number;
  created: string | Date;
  lastName: string;
  firstName: string;
  class: string;
  type: string | null;
  feedingRegime: string | null;
  email: string | null;
}

function normalizeMealParticipantType(type: string | null): OrganizationType {
  return type === 'company' ? 'company' : 'school';
}

function mapMealParticipantRow(row: MealParticipantRow): MealParticipant {
  return {
    id: row.id,
    created: new Date(row.created),
    lastName: row.lastName,
    firstName: row.firstName,
    class: row.class,
    type: normalizeMealParticipantType(row.type),
    feedingRegime: row.feedingRegime,
    email: row.email || undefined,
  };
}

export async function getAllMealParticipants(): Promise<MealParticipant[]> {
  const results = await query<MealParticipantRow[]>(
    'SELECT id, created, lastName, firstName, class, type, feedingRegime, email FROM meal_participants ORDER BY created DESC'
  );
  return results.map(mapMealParticipantRow);
}

export async function getMealParticipantById(id: number): Promise<MealParticipant | null> {
  const results = await query<MealParticipantRow[]>(
    'SELECT id, created, lastName, firstName, class, type, feedingRegime, email FROM meal_participants WHERE id = ?',
    [id]
  );

  if (results.length === 0) {
    return null;
  }

  return mapMealParticipantRow(results[0]);
}

export async function getMealParticipantsByEmail(email: string): Promise<MealParticipant[]> {
  const results = await query<MealParticipantRow[]>(
    'SELECT id, created, lastName, firstName, class, type, feedingRegime, email FROM meal_participants WHERE email = ? ORDER BY created DESC',
    [email]
  );
  return results.map(mapMealParticipantRow);
}

export async function createMealParticipant(data: {
  lastName: string;
  firstName: string;
  class: string;
  type: OrganizationType;
  feedingRegime?: string | null;
  email?: string | null;
}): Promise<MealParticipant> {
  const result = await query<MysqlInsertResult>(
    'INSERT INTO meal_participants (lastName, firstName, class, type, feedingRegime, email) VALUES (?, ?, ?, ?, ?, ?)',
    [
      data.lastName,
      data.firstName,
      data.class,
      data.type,
      data.feedingRegime || null,
      data.email || null,
    ]
  );

  const mealParticipant = await getMealParticipantById(result.insertId);
  if (!mealParticipant) {
    throw new Error('Failed to retrieve created meal participant');
  }
  return mealParticipant;
}

export async function updateMealParticipant(
  id: number,
  data: {
    lastName?: string;
    firstName?: string;
    class?: string;
    type?: OrganizationType;
    feedingRegime?: string | null;
    email?: string | null;
  }
): Promise<MealParticipant> {
  const updates: string[] = [];
  const values: (string | number | null)[] = [];

  if (data.lastName !== undefined) {
    updates.push('lastName = ?');
    values.push(data.lastName);
  }
  if (data.firstName !== undefined) {
    updates.push('firstName = ?');
    values.push(data.firstName);
  }
  if (data.class !== undefined) {
    updates.push('class = ?');
    values.push(data.class);
  }
  if (data.type !== undefined) {
    updates.push('type = ?');
    values.push(data.type);
  }
  if (data.feedingRegime !== undefined) {
    updates.push('feedingRegime = ?');
    values.push(data.feedingRegime || null);
  }
  if (data.email !== undefined) {
    updates.push('email = ?');
    values.push(data.email || null);
  }

  if (updates.length === 0) {
    const mealParticipant = await getMealParticipantById(id);
    if (!mealParticipant) {
      throw new Error('Meal participant not found');
    }
    return mealParticipant;
  }

  values.push(id);
  await query(`UPDATE meal_participants SET ${updates.join(', ')} WHERE id = ?`, values);

  const mealParticipant = await getMealParticipantById(id);
  if (!mealParticipant) {
    throw new Error('Meal participant not found');
  }
  return mealParticipant;
}

export async function deleteMealParticipant(id: number): Promise<void> {
  const result = await query<MysqlDeleteResult>('DELETE FROM meal_participants WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    throw new Error('Meal participant not found');
  }
}

export interface MealParticipantsByEmail {
  email: string | null;
  mealParticipants: MealParticipant[];
}

export async function getMealParticipantsGroupedByEmail(): Promise<MealParticipantsByEmail[]> {
  const mealParticipants = await getAllMealParticipants();
  const grouped = new Map<string | null, MealParticipant[]>();

  for (const mealParticipant of mealParticipants) {
    const email = mealParticipant.email || null;
    if (!grouped.has(email)) {
      grouped.set(email, []);
    }
    grouped.get(email)!.push(mealParticipant);
  }

  return Array.from(grouped.entries())
    .map(([email, items]) => ({
      email,
      mealParticipants: items.sort((a, b) => {
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      }),
    }))
    .sort((a, b) => {
      if (a.email === null && b.email !== null) return 1;
      if (a.email !== null && b.email === null) return -1;
      if (a.email === null && b.email === null) return 0;
      return (a.email || '').localeCompare(b.email || '');
    });
}
