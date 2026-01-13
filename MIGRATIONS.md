# Database Migrations

This project uses `db-migrate` for managing database schema migrations with raw SQL files.

## Setup

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Connection Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=mealuser
DB_PASSWORD=mealpassword
DB_NAME=meal_booking

# Admin User Configuration (for seed script)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_FIRSTNAME=Admin
ADMIN_LASTNAME=User
```

## Running Migrations

### Development

Run pending migrations:
```bash
npm run migrate:up
```

Rollback last migration:
```bash
npm run migrate:down
```

### Production

Run migrations in production:
```bash
npm run migrate:up:prod
```

### Setup Database (Migrations + Seed)

Run migrations and seed initial data:
```bash
npm run db:setup
```

## Creating New Migrations

Create a new migration file:
```bash
npm run migrate:create migration-name
```

This will create a new SQL file in the `migrations/` directory. Edit the file with your SQL statements.

## Migration Files

Migration files are located in the `migrations/sqls/` directory and follow the naming convention:
- `YYYYMMDDHHMMSS-description.up.sql` (for applying migrations)
- `YYYYMMDDHHMMSS-description.down.sql` (for rollbacks, optional)

Example: `20260113000001-create-users.up.sql`

**Note:** When using `npm run migrate:create`, db-migrate will automatically create files in the `migrations/sqls/` directory with the correct naming format.

## Seed Script

The seed script creates an initial admin user. It's idempotent - it won't create a duplicate if the admin user already exists.

Run the seed script:
```bash
npm run seed
```

## Docker Integration

When running in Docker, migrations are automatically executed on container startup via the entrypoint script (`scripts/docker-entrypoint.sh`). The script:

1. Waits for MySQL to be ready
2. Runs pending migrations
3. Runs the seed script (if admin user doesn't exist)
4. Starts the application

## Database Connection

The database connection is configured in `lib/db/connection.ts` and uses environment variables for all connection details. The connection pool is available for use throughout the application.
