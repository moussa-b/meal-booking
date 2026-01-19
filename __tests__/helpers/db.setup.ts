import { query, closePool } from '@/lib/db/connection';
import { beforeEach } from 'vitest';
import { execSync } from 'child_process';

/**
 * Tables to clean up between tests (in order to respect foreign key constraints)
 */
const TABLES_TO_CLEAN = [
  'booking_submissions',
  'menu_selections',
  'day_menus',
  'menu_items',
  'weekly_menu_days',
  'weekly_menus',
  'students',
  'meals',
  'schools',
  'users',
];

/**
 * Extract database name from DATABASE_URL
 */
function extractDatabaseName(url?: string): string | null {
  if (!url) {
    return null;
  }
  try {
    const parsedUrl = new URL(url);
    // Remove leading slash from pathname
    const dbName = parsedUrl.pathname.replace(/^\//, '');
    return dbName || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get current database name from connection
 */
async function getCurrentDatabase(): Promise<string> {
  const result = await query<Array<{ db_name: string }>>('SELECT DATABASE() as db_name');
  return result[0]?.db_name || '';
}

/**
 * Run migrations on test database
 */
async function runMigrations(): Promise<void> {
  try {
    console.log('Running migrations on test database...');
    execSync('npm run migrate:up:test', {
      stdio: 'inherit',
      env: { ...process.env },
    });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
}

/**
 * Setup test database
 * Runs migrations and verifies database connection
 */
export async function setupTestDb(): Promise<void> {
  // Verify database connection
  try {
    await query('SELECT 1');

    // Verify we're using the test database from .env.test
    const currentDb = await getCurrentDatabase();
    const expectedDb = extractDatabaseName(process.env.DATABASE_URL) || 'meal_booking_test';

    if (!process.env.DATABASE_URL) {
      throw new Error(
        `CRITICAL: DATABASE_URL environment variable is required. ` +
        `Please ensure .env.test file exists with DATABASE_URL=mysql://.../meal_booking_test`
      );
    }

    if (currentDb !== expectedDb) {
      throw new Error(
        `CRITICAL: Tests are using database "${currentDb}" instead of test database "${expectedDb}". ` +
        `This would delete production/development data! Aborting tests. ` +
        `Please ensure .env.test file exists with DATABASE_URL pointing to meal_booking_test`
      );
    }

    if (currentDb === 'meal_booking') {
      throw new Error(
        `CRITICAL: Tests are attempting to use production/development database "meal_booking". ` +
        `This would delete production data! Aborting tests. ` +
        `Please create .env.test file with DATABASE_URL pointing to meal_booking_test`
      );
    }

    console.log(`Test database connection successful (using: ${currentDb})`);

    // Run migrations on test database
    await runMigrations();
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
}

/**
 * Clean up test data by truncating tables
 */
export async function truncateTables(): Promise<void> {
  // Safety check: Verify we're using the test database before truncating
  const currentDb = await getCurrentDatabase();
  const expectedDb = extractDatabaseName(process.env.DATABASE_URL) || 'meal_booking_test';

  if (!process.env.DATABASE_URL) {
    throw new Error(
      `CRITICAL: DATABASE_URL environment variable is required. ` +
      `Please ensure .env.test file exists with DATABASE_URL=mysql://.../meal_booking_test`
    );
  }

  if (currentDb !== expectedDb) {
    throw new Error(
      `CRITICAL: Attempted to truncate tables in database "${currentDb}" instead of test database "${expectedDb}". ` +
      `Aborting to prevent data loss. Please ensure .env.test file has DATABASE_URL pointing to meal_booking_test`
    );
  }

  if (currentDb === 'meal_booking') {
    throw new Error(
      `CRITICAL: Attempted to truncate production/development database "meal_booking". ` +
      `Aborting to prevent data loss. Please ensure .env.test file has DATABASE_URL pointing to meal_booking_test`
    );
  }

  // Disable foreign key checks temporarily
  await query('SET FOREIGN_KEY_CHECKS = 0');

  try {
    for (const table of TABLES_TO_CLEAN) {
      try {
        await query(`TRUNCATE TABLE ${table}`);
      } catch (error) {
        // Table might not exist, which is okay for tests
        // Only log if it's not a "table doesn't exist" error
        if (error instanceof Error && !error.message.includes("doesn't exist")) {
          console.warn(`Failed to truncate table ${table}:`, error);
        }
      }
    }
  } finally {
    // Re-enable foreign key checks
    await query('SET FOREIGN_KEY_CHECKS = 1');
  }
}

/**
 * Teardown test database
 */
export async function teardownTestDb(): Promise<void> {
  await truncateTables();
  await closePool();
}

/**
 * Setup hook to clean tables before each test
 */
export function setupTestIsolation() {
  beforeEach(async () => {
    await truncateTables();
  });
}
