import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { query, testConnection, closePool } from '../lib/db/connection';

// Load environment variables
dotenv.config();

/**
 * Seed script to create an admin user
 * This script is idempotent - it checks if the admin user exists before creating
 */
async function seedAdminUser() {
  try {
    console.log('Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Failed to connect to database');
    }

    // Get admin credentials from environment variables
    const username = process.env.ADMIN_USERNAME || 'admin';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';

    if (!password) {
      throw new Error('ADMIN_PASSWORD environment variable is required');
    }

    console.log(`Checking if admin user '${username}' already exists...`);

    // Check if admin user already exists
    interface UserIdRow {
      id: number;
    }
    const existingUsers = await query<UserIdRow[]>(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      console.log(`Admin user '${username}' already exists. Skipping seed.`);
      return;
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get firstname and lastname from username or use defaults
    const firstname = process.env.ADMIN_FIRSTNAME || 'Admin';
    const lastname = process.env.ADMIN_LASTNAME || 'User';

    // Insert admin user
    console.log(`Creating admin user '${username}'...`);
    await query(
      'INSERT INTO users (username, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)',
      [username, firstname, lastname, email, hashedPassword]
    );

    console.log(`✅ Admin user '${username}' created successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run the seed script
if (require.main === module) {
  seedAdminUser()
    .then(() => {
      console.log('Seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed script failed:', error);
      process.exit(1);
    });
}

export { seedAdminUser };
