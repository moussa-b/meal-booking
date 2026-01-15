import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
// In test environment, .env.test should already be loaded by test setup
// This loads .env as fallback for non-test environments
if (process.env.VITEST && !process.env.DB_NAME) {
  // In test environment, try .env.test first if DB_NAME not set
  dotenv.config({ path: '.env.test' });
}
// Always load .env as fallback (won't override existing vars)
dotenv.config();

/**
 * Database connection configuration from environment variables
 */
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'mealuser',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'meal_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

/**
 * Create MySQL connection pool
 */
export const pool = mysql.createPool(dbConfig);

/**
 * Get a connection from the pool
 */
export async function getConnection() {
  return await pool.getConnection();
}

/**
 * MySQL result types for different operations
 */
export interface MysqlInsertResult {
  insertId: number;
  affectedRows: number;
}

export interface MysqlUpdateResult {
  affectedRows: number;
  changedRows: number;
}

export interface MysqlDeleteResult {
  affectedRows: number;
}

/**
 * Execute a query using the connection pool
 */
export async function query<T = unknown>(sql: string, params?: (string | number | null | boolean)[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

/**
 * Test database connection with retry logic
 */
export async function testConnection(maxRetries = 5, delayMs = 2000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query('SELECT 1');
      console.log('Database connection successful');
      return true;
    } catch (error) {
      console.log(`Database connection attempt ${i + 1}/${maxRetries} failed:`, error instanceof Error ? error.message : error);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  return false;
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}
