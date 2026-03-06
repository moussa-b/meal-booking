import { query } from '@/lib/db/connection';
import type { User } from '@/lib/models/user';

/**
 * Database row type for User (as returned from MySQL)
 */
interface UserRow {
  id: number;
  created: string | Date;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}

export interface UserWithPassword extends User {
  password: string;
}

function mapUserRow(row: UserRow): UserWithPassword {
  return {
    id: row.id,
    created: new Date(row.created),
    username: row.username,
    firstname: row.firstname,
    lastname: row.lastname,
    email: row.email,
    password: row.password,
  };
}

function mapUserRowToUser(row: UserRow): User {
  return {
    id: row.id,
    created: new Date(row.created),
    username: row.username,
    firstname: row.firstname,
    lastname: row.lastname,
    email: row.email,
  };
}

/**
 * Get a user by username or email, including password hash
 */
export async function getUserWithPasswordByUsernameOrEmail(identifier: string): Promise<UserWithPassword | null> {
  const results = await query<UserRow[]>(
    'SELECT id, created, username, firstname, lastname, email, password FROM users WHERE username = ? OR email = ? LIMIT 1',
    [identifier, identifier]
  );

  if (results.length === 0) {
    return null;
  }

  return mapUserRow(results[0]);
}

/**
 * Insert a new user and return it including password hash.
 *
 * This is primarily intended for internal use (e.g. tests or seeding)
 * where we already have a hashed password value.
 */
export async function insertUser(data: {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  password: string;
}): Promise<UserWithPassword> {
  const lastname = data.lastname.trim().toUpperCase();
  const result = await query<{ insertId: number }>(
    'INSERT INTO users (username, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)',
    [data.username, data.firstname, lastname, data.email, data.password]
  );

  const rows = await query<UserRow[]>(
    'SELECT id, created, username, firstname, lastname, email, password FROM users WHERE id = ?',
    [result.insertId]
  );

  if (!rows[0]) {
    throw new Error('Failed to load inserted user');
  }

  return mapUserRow(rows[0]);
}

/**
 * Get a user by id, without password
 */
export async function getUserById(id: number): Promise<User | null> {
  const rows = await query<UserRow[]>(
    'SELECT id, created, username, firstname, lastname, email, password FROM users WHERE id = ? LIMIT 1',
    [id]
  );
  if (rows.length === 0) {
    return null;
  }
  return mapUserRowToUser(rows[0]);
}

/**
 * Update firstname, lastname, and email for a user. Returns the updated user (without password).
 * Throws with a clear message on duplicate email.
 */
export async function updateUser(
  id: number,
  data: { firstname: string; lastname: string; email: string }
): Promise<User> {
  const lastname = data.lastname.trim().toUpperCase();
  try {
    await query(
      'UPDATE users SET firstname = ?, lastname = ?, email = ? WHERE id = ?',
      [data.firstname, lastname, data.email, id]
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('Duplicate') || message.includes('ER_DUP_ENTRY') || message.includes('1062')) {
      throw new Error('Cet email est déjà utilisé.');
    }
    throw err;
  }

  const updated = await getUserById(id);
  if (!updated) {
    throw new Error('User not found after update');
  }
  return updated;
}
