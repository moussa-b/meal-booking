import dotenv from 'dotenv';
import { resolve } from 'path';
import { beforeAll, afterAll } from 'vitest';

// Load .env.test file BEFORE importing anything that uses database connection
// This ensures the connection pool is created with the correct test database
dotenv.config({ path: resolve(process.cwd(), '.env.test') });

// Import after environment is loaded
import { setupTestDb, teardownTestDb } from './db.setup';

beforeAll(async () => {
  await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb();
});
