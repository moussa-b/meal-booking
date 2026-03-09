# Testing Guide

This document explains how to run the integration tests for the Meal Booking application.

## Overview

The test suite uses **Vitest** as the testing framework and includes integration tests for the service layer (Organization and Meal CRUD operations). Tests use a **real database connection** instead of mocks, ensuring that database operations are tested against actual MySQL queries.

## Prerequisites

1. **Node.js** and **npm** installed
2. **MySQL database** running and accessible
3. **Test database** created (separate from development/production databases)
4. Dependencies installed: `npm install`

## Test Database Setup

### 1. Create Test Database

Create a separate test database (recommended name: `meal_booking_test`):

```sql
CREATE DATABASE meal_booking_test;
```

### 2. Grant Database Permissions

**Important:** The test user must have full permissions on the test database to run tests successfully. Tests need to create tables, insert/update/delete data, and truncate tables.

Connect to MySQL as root user and grant permissions:

```bash
mysql -h 127.0.0.1 -P 3306 -u root -prootpassword
```

Then run these SQL commands:

```sql
-- Grant all privileges on the test database to the test user
GRANT ALL PRIVILEGES ON meal_booking_test.* TO 'mealuser'@'%';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;
```

**One-liner command** (alternative):

```bash
mysql -h 127.0.0.1 -P 3306 -u root -prootpassword -e "GRANT ALL PRIVILEGES ON meal_booking_test.* TO 'mealuser'@'%'; FLUSH PRIVILEGES;"
```

**Verify permissions:**

```bash
mysql -h 127.0.0.1 -P 3306 -u root -prootpassword -e "SHOW GRANTS FOR 'mealuser'@'%';"
```

You should see privileges for both `meal_booking` and `meal_booking_test` databases.

**Required Permissions:**
- `CREATE` - To create tables during migrations
- `DROP` - To drop tables if needed
- `INSERT` - To insert test data
- `UPDATE` - To update test data
- `DELETE` - To delete test data
- `SELECT` - To query test data
- `TRUNCATE` - To clean tables between tests
- `ALTER` - To modify table structure if needed

### 3. Create `.env.test` File

**Create a `.env.test` file in the project root** with your test database configuration:

```bash
DATABASE_URL=mysql://mealuser:mealpassword@localhost:3306/meal_booking_test
```

**Important:** The `.env.test` file is automatically loaded by the test setup before any database connections are made. This ensures tests always use the test database and prevents accidental deletion of production/development data.

**Note:** 
- The `DATABASE_URL` format is: `mysql://[user[:password]@]host[:port]/[database]`
- Make sure `.env.test` is in your `.gitignore` if it contains sensitive credentials, or use a `.env.test.example` template file.

### 4. Run Migrations

Ensure the test database has all required tables by running migrations:

```bash
# Load .env.test and run migrations
# The migrate:up script will use DATABASE_URL from .env.test if it's loaded
npm run migrate:up:test
```

Or manually set the environment variable:
```bash
export DATABASE_URL=mysql://mealuser:mealpassword@localhost:3306/meal_booking_test
npm run migrate:up:test
```

## Running Tests

### Watch Mode (Development)

Run tests in watch mode (automatically re-runs on file changes):

```bash
npm test
```

This will:
- Start Vitest in watch mode
- Run all tests in `__tests__/` directory
- Watch for file changes and re-run affected tests
- Show test results in the terminal

### Single Run (CI/Production)

Run all tests once and exit:

```bash
npm run test:run
```

This is useful for:
- CI/CD pipelines
- Pre-commit hooks
- One-time test execution

### Coverage Report

Generate a test coverage report:

```bash
npm run test:coverage
```

This will:
- Run all tests
- Generate coverage statistics
- Show which lines, functions, and branches are covered
- Display results in the terminal

## Test Structure

```
__tests__/
├── helpers/
│   ├── setup.ts          # Global test setup (database connection)
│   ├── db.setup.ts       # Database utilities (cleanup, isolation)
│   └── test-data.ts      # Test data factories
└── services/
    ├── organization.service.test.ts  # Organization CRUD tests
    └── meal.service.test.ts     # Meal CRUD tests
```

## Test Coverage

The test suite covers all CRUD operations for both Organization and Meal services:

### Organization Service Tests
- ✅ `getAllOrganizations()` - List all organizations, ordering, empty results
- ✅ `getOrganizationById()` - Get single organization, not found scenarios
- ✅ `createOrganization()` - Create organization, duplicate code handling
- ✅ `updateOrganization()` - Update fields, partial updates, not found
- ✅ `deleteOrganization()` - Delete organization, not found scenarios

### Meal Service Tests
- ✅ `getAllMeals()` - List all meals, ordering, empty results
- ✅ `getMealById()` - Get single meal, not found scenarios
- ✅ `createMeal()` - Create meal, all meal types
- ✅ `updateMeal()` - Update fields, partial updates, not found
- ✅ `deleteMeal()` - Delete meal, not found scenarios

## Test Isolation

Tests are isolated using the following mechanisms:

1. **Table Truncation**: All test data is cleaned between tests using `TRUNCATE TABLE`
2. **Foreign Key Handling**: Foreign key checks are temporarily disabled during cleanup
3. **Before Each Hook**: Tables are cleaned before each test to ensure no data leakage

## Troubleshooting

### Database Connection Errors

If you see connection errors:

1. **Verify MySQL is running:**
   ```bash
   mysql -h localhost -u mealuser -p
   ```

2. **Check environment variables:**
   ```bash
   echo $DATABASE_URL
   ```

3. **Verify test database exists:**
   ```sql
   SHOW DATABASES LIKE 'meal_booking_test';
   ```

4. **Check database permissions:**
   If you see "Access denied" errors, grant permissions to the test user:
   ```bash
   mysql -h 127.0.0.1 -P 3306 -u root -prootpassword -e "GRANT ALL PRIVILEGES ON meal_booking_test.* TO 'mealuser'@'%'; FLUSH PRIVILEGES;"
   ```
   See the "Grant Database Permissions" section above for detailed instructions.

### Table Not Found Errors

If you see "table doesn't exist" errors:

1. **Run migrations on test database:**
   ```bash
   export DATABASE_URL=mysql://mealuser:mealpassword@localhost:3306/meal_booking_test
   npm run migrate:up:test
   ```

2. **Verify tables exist:**
   ```sql
   USE meal_booking_test;
   SHOW TABLES;
   ```

### Foreign Key Constraint Errors

If you see foreign key errors during cleanup:

- The test setup automatically handles this by disabling foreign key checks during truncation
- If issues persist, check the table order in `__tests__/helpers/db.setup.ts`

### Tests Failing Due to Data Conflicts

If tests fail due to duplicate data:

- Tests should be isolated, but if you see duplicate key errors:
  1. Manually clean the test database: `TRUNCATE TABLE organizations, meals;`
  2. Ensure test isolation is working (check `beforeEach` hooks)

## Best Practices

1. **Use Test Database**: Always use a separate test database, never use production or development databases
2. **Clean State**: Tests should be independent and not rely on data from other tests
3. **Real Database**: These are integration tests using real database queries, not unit tests with mocks
4. **Environment Variables**: Use `.env.test` with `DATABASE_URL` or set the `DATABASE_URL` environment variable to configure test database
5. **Run Before Committing**: Always run `npm run test:run` before committing code

## Continuous Integration

For CI/CD pipelines, use:

```bash
# Set test database environment variable
export DATABASE_URL=mysql://mealuser:mealpassword@localhost:3306/meal_booking_test

# Run migrations
npm run migrate:up:test

# Run tests
npm run test:run
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
