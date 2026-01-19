import mysql from 'mysql2/promise';
import type { PoolOptions } from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
// In test environment, .env.test should already be loaded by test setup
// This loads .env as fallback for non-test environments
if (process.env.VITEST && !process.env.DATABASE_URL) {
  // In test environment, try .env.test first if DATABASE_URL not set
  dotenv.config({ path: '.env.test' });
}
// Always load .env as fallback (won't override existing vars)
dotenv.config();

/**
 * Parse MySQL connection URL into PoolOptions
 */
function parseDatabaseUrl(url: string): PoolOptions {
  try {
    const parsedUrl = new URL(url);
    
    if (!parsedUrl.protocol.startsWith('mysql')) {
      throw new Error(`Unsupported protocol "${parsedUrl.protocol}". Expected "mysql:"`);
    }

    const config: PoolOptions = {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : 3306,
      user: parsedUrl.username || undefined,
      password: parsedUrl.password || undefined,
      database: parsedUrl.pathname ? parsedUrl.pathname.slice(1) : undefined,
    };

    return config;
  } catch (error) {
    throw new Error(`Invalid DATABASE_URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Database connection configuration from DATABASE_URL
 */
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Log DATABASE_URL (masked) for debugging
const maskedUrl = process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@');
console.log('[DB Config] DATABASE_URL:', maskedUrl);

/**
 * Create MySQL connection pool with DATABASE_URL and pool options
 * Parse the URL and combine with pool-specific options
 */
const connectionConfig = parseDatabaseUrl(process.env.DATABASE_URL);
export const pool = mysql.createPool({
  ...connectionConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

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
