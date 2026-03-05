import { describe, it, expect } from 'vitest';
import { getUserWithPasswordByUsernameOrEmail, insertUser } from '@/lib/services/user.service';
import { setupTestIsolation } from '../helpers/db.setup';
import { createTestUserData } from '../helpers/test-data';

// Ensure database isolation between tests
setupTestIsolation();

describe('user.service', () => {
  it('returns null when no user exists for identifier', async () => {
    const user = await getUserWithPasswordByUsernameOrEmail('does-not-exist');
    expect(user).toBeNull();
  });

  it('finds a user by username including password hash', async () => {
    const userData = createTestUserData({
      username: 'adminuser',
      email: 'admin@example.com',
      password: 'hashed-password',
    });
    const created = await insertUser(userData);

    const found = await getUserWithPasswordByUsernameOrEmail('adminuser');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.username).toBe(created.username);
    expect(found!.email).toBe(created.email);
    expect(found!.password).toBe(created.password);
  });

  it('finds a user by email including password hash', async () => {
    const userData = createTestUserData({
      username: 'adminuser2',
      email: 'admin2@example.com',
      password: 'hashed-password-2',
    });
    const created = await insertUser(userData);

    const found = await getUserWithPasswordByUsernameOrEmail('admin2@example.com');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.username).toBe(created.username);
    expect(found!.email).toBe(created.email);
    expect(found!.password).toBe(created.password);
  });
})
