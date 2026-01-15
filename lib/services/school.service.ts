import { query, type MysqlInsertResult, type MysqlDeleteResult } from '@/lib/db/connection';
import type { School } from '@/lib/models/school';

/**
 * Database row type for School (as returned from MySQL)
 */
interface SchoolRow {
  id: number;
  created: string | Date;
  name: string;
  code: string;
  description: string | null;
}

/**
 * Get all schools
 */
export async function getAllSchools(): Promise<School[]> {
  const results = await query<SchoolRow[]>(
    'SELECT id, created, name, code, description FROM schools ORDER BY created DESC'
  );
  return results.map((row: SchoolRow) => ({
    id: row.id,
    created: new Date(row.created),
    name: row.name,
    code: row.code,
    description: row.description || '',
  }));
}

/**
 * Get a school by ID
 */
export async function getSchoolById(id: number): Promise<School | null> {
  const results = await query<SchoolRow[]>(
    'SELECT id, created, name, code, description FROM schools WHERE id = ?',
    [id]
  );
  
  if (results.length === 0) {
    return null;
  }
  
  const row: SchoolRow = results[0];
  return {
    id: row.id,
    created: new Date(row.created),
    name: row.name,
    code: row.code,
    description: row.description || '',
  };
}

/**
 * Create a new school
 */
export async function createSchool(data: {
  name: string;
  code: string;
  description?: string;
}): Promise<School> {
  const result = await query<MysqlInsertResult>(
    'INSERT INTO schools (name, code, description) VALUES (?, ?, ?)',
    [data.name, data.code, data.description || null]
  );
  
  const insertedId: number = result.insertId;
  const school = await getSchoolById(insertedId);
  
  if (!school) {
    throw new Error('Failed to retrieve created school');
  }
  
  return school;
}

/**
 * Update a school
 */
export async function updateSchool(
  id: number,
  data: {
    name?: string;
    code?: string;
    description?: string;
  }
): Promise<School> {
  const updates: string[] = [];
  const values: (string | number | null)[] = [];
  
  if (data.name !== undefined) {
    updates.push('name = ?');
    values.push(data.name);
  }
  if (data.code !== undefined) {
    updates.push('code = ?');
    values.push(data.code);
  }
  if (data.description !== undefined) {
    updates.push('description = ?');
    values.push(data.description || null);
  }
  
  if (updates.length === 0) {
    const school = await getSchoolById(id);
    if (!school) {
      throw new Error('School not found');
    }
    return school;
  }
  
  values.push(id);
  await query(
    `UPDATE schools SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  const school = await getSchoolById(id);
  if (!school) {
    throw new Error('School not found');
  }
  
  return school;
}

/**
 * Delete a school
 */
export async function deleteSchool(id: number): Promise<void> {
  const result = await query<MysqlDeleteResult>(
    'DELETE FROM schools WHERE id = ?',
    [id]
  );
  
  if (result.affectedRows === 0) {
    throw new Error('School not found');
  }
}
