import { query, type MysqlInsertResult, type MysqlDeleteResult } from '@/lib/db/connection';
import type { Student } from '@/lib/models/student';

/**
 * Database row type for Student (as returned from MySQL)
 */
interface StudentRow {
  id: number;
  created: string | Date;
  lastName: string;
  firstName: string;
  class: string;
  feedingRegime: string | null;
  parentEmail: string | null;
}

/**
 * Get all students
 */
export async function getAllStudents(): Promise<Student[]> {
  const results = await query<StudentRow[]>(
    'SELECT id, created, lastName, firstName, class, feedingRegime, parentEmail FROM students ORDER BY created DESC'
  );
  return results.map((row: StudentRow) => ({
    id: row.id,
    created: new Date(row.created),
    lastName: row.lastName,
    firstName: row.firstName,
    class: row.class,
    feedingRegime: row.feedingRegime,
    parentEmail: row.parentEmail || undefined,
  }));
}

/**
 * Get a student by ID
 */
export async function getStudentById(id: number): Promise<Student | null> {
  const results = await query<StudentRow[]>(
    'SELECT id, created, lastName, firstName, class, feedingRegime, parentEmail FROM students WHERE id = ?',
    [id]
  );
  
  if (results.length === 0) {
    return null;
  }
  
  const row: StudentRow = results[0];
  return {
    id: row.id,
    created: new Date(row.created),
    lastName: row.lastName,
    firstName: row.firstName,
    class: row.class,
    feedingRegime: row.feedingRegime,
    parentEmail: row.parentEmail || undefined,
  };
}

/**
 * Get students by parent email
 */
export async function getStudentsByParentEmail(email: string): Promise<Student[]> {
  const results = await query<StudentRow[]>(
    'SELECT id, created, lastName, firstName, class, feedingRegime, parentEmail FROM students WHERE parentEmail = ? ORDER BY created DESC',
    [email]
  );
  return results.map((row: StudentRow) => ({
    id: row.id,
    created: new Date(row.created),
    lastName: row.lastName,
    firstName: row.firstName,
    class: row.class,
    feedingRegime: row.feedingRegime,
    parentEmail: row.parentEmail || undefined,
  }));
}

/**
 * Create a new student
 */
export async function createStudent(data: {
  lastName: string;
  firstName: string;
  class: string;
  feedingRegime?: string | null;
  parentEmail?: string | null;
}): Promise<Student> {
  const result = await query<MysqlInsertResult>(
    'INSERT INTO students (lastName, firstName, class, feedingRegime, parentEmail) VALUES (?, ?, ?, ?, ?)',
    [
      data.lastName,
      data.firstName,
      data.class,
      data.feedingRegime || null,
      data.parentEmail || null,
    ]
  );
  
  const insertedId: number = result.insertId;
  const student = await getStudentById(insertedId);
  
  if (!student) {
    throw new Error('Failed to retrieve created student');
  }
  
  return student;
}

/**
 * Update a student
 */
export async function updateStudent(
  id: number,
  data: {
    lastName?: string;
    firstName?: string;
    class?: string;
    feedingRegime?: string | null;
    parentEmail?: string | null;
  }
): Promise<Student> {
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
  if (data.feedingRegime !== undefined) {
    updates.push('feedingRegime = ?');
    values.push(data.feedingRegime || null);
  }
  if (data.parentEmail !== undefined) {
    updates.push('parentEmail = ?');
    values.push(data.parentEmail || null);
  }
  
  if (updates.length === 0) {
    const student = await getStudentById(id);
    if (!student) {
      throw new Error('Student not found');
    }
    return student;
  }
  
  values.push(id);
  await query(
    `UPDATE students SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  const student = await getStudentById(id);
  if (!student) {
    throw new Error('Student not found');
  }
  
  return student;
}

/**
 * Delete a student
 */
export async function deleteStudent(id: number): Promise<void> {
  const result = await query<MysqlDeleteResult>(
    'DELETE FROM students WHERE id = ?',
    [id]
  );
  
  if (result.affectedRows === 0) {
    throw new Error('Student not found');
  }
}

/**
 * Group type for students grouped by parent email
 */
export interface StudentsByParentEmail {
  parentEmail: string | null;
  students: Student[];
}

/**
 * Get all students grouped by parent email
 */
export async function getStudentsGroupedByParentEmail(): Promise<StudentsByParentEmail[]> {
  const students = await getAllStudents();
  
  // Group students by parentEmail
  const grouped = new Map<string | null, Student[]>();
  
  for (const student of students) {
    const email = student.parentEmail || null;
    if (!grouped.has(email)) {
      grouped.set(email, []);
    }
    grouped.get(email)!.push(student);
  }
  
  // Convert to array and sort
  const result: StudentsByParentEmail[] = Array.from(grouped.entries())
    .map(([parentEmail, students]) => ({
      parentEmail,
      students: students.sort((a, b) => {
        // Sort by last name, then first name
        const lastNameCompare = a.lastName.localeCompare(b.lastName);
        if (lastNameCompare !== 0) return lastNameCompare;
        return a.firstName.localeCompare(b.firstName);
      }),
    }))
    .sort((a, b) => {
      // Sort groups: null emails last, then alphabetically by email
      if (a.parentEmail === null && b.parentEmail !== null) return 1;
      if (a.parentEmail !== null && b.parentEmail === null) return -1;
      if (a.parentEmail === null && b.parentEmail === null) return 0;
      return (a.parentEmail || '').localeCompare(b.parentEmail || '');
    });
  
  return result;
}
