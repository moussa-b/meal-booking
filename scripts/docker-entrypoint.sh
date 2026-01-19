#!/bin/sh
set -e

echo "Waiting for MySQL to be ready..."

# Wait for MySQL to be ready with retry logic
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if node -e "
    const mysql = require('mysql2/promise');
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required');
      process.exit(1);
    }
    mysql.createConnection(process.env.DATABASE_URL)
      .then(conn => {
        conn.end();
        process.exit(0);
      })
      .catch(() => process.exit(1));
  " 2>/dev/null; then
    echo "MySQL is ready!"
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Waiting for MySQL... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Failed to connect to MySQL after $MAX_RETRIES attempts"
  exit 1
fi

# Run migrations
echo "Running database migrations..."
cd /app
db-migrate up --env prod || {
  echo "Migration failed, but continuing..."
}

# Run seed script (only if admin user doesn't exist)
echo "Running seed script..."
tsx scripts/seed.ts || {
  echo "Seed script failed or admin user already exists, continuing..."
}

# Start the application
echo "Starting application..."
exec "$@"
