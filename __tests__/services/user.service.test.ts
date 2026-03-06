import { describe, it, expect } from 'vitest';
import {
  getUserWithPasswordByUsernameOrEmail,
  insertUser,
  getUserById,
  getUserWithPasswordById,
  updateUser,
  updateUserCredentials,
} from '@/lib/services/user.service';
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

  it('insertUser stores lastname uppercased', async () => {
    const userData = createTestUserData({
      username: 'insertupper',
      lastname: 'jones',
      email: 'insertupper@example.com',
    });
    const created = await insertUser(userData);
    expect(created.lastname).toBe('JONES');

    const found = await getUserById(created.id);
    expect(found!.lastname).toBe('JONES');
  });

  it('getUserById returns null when no user exists for id', async () => {
    const user = await getUserById(999999);
    expect(user).toBeNull();
  });

  it('getUserById returns user without password when found', async () => {
    const userData = createTestUserData({
      username: 'getbyiduser',
      email: 'getbyid@example.com',
    });
    const created = await insertUser(userData);

    const found = await getUserById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.username).toBe(created.username);
    expect(found!.firstname).toBe(created.firstname);
    expect(found!.lastname).toBe(created.lastname);
    expect(found!.email).toBe(created.email);
    expect('password' in (found ?? {})).toBe(false);
  });

  it('updateUser updates firstname, lastname, email and returns user without password', async () => {
    const userData = createTestUserData({
      username: 'updateuser',
      firstname: 'OldFirst',
      lastname: 'OldLast',
      email: 'old@example.com',
    });
    const created = await insertUser(userData);

    const updated = await updateUser(created.id, {
      firstname: 'NewFirst',
      lastname: 'NewLast',
      email: 'new@example.com',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.username).toBe(created.username);
    expect(updated.firstname).toBe('NewFirst');
    expect(updated.lastname).toBe('NEWLAST');
    expect(updated.email).toBe('new@example.com');
    expect('password' in updated).toBe(false);

    const refetched = await getUserById(created.id);
    expect(refetched!.firstname).toBe('NewFirst');
    expect(refetched!.lastname).toBe('NEWLAST');
    expect(refetched!.email).toBe('new@example.com');
  });

  it('updateUser stores lastname uppercased', async () => {
    const userData = createTestUserData({
      username: 'loweruser',
      lastname: 'smith',
      email: 'lower@example.com',
    });
    const created = await insertUser(userData);

    const updated = await updateUser(created.id, {
      firstname: created.firstname,
      lastname: 'smith',
      email: created.email,
    });

    expect(updated.lastname).toBe('SMITH');
  });

  it('updateUser throws clear error on duplicate email', async () => {
    const userData1 = createTestUserData({
      username: 'user1dup',
      email: 'first@example.com',
    });
    const userData2 = createTestUserData({
      username: 'user2dup',
      email: 'second@example.com',
    });
    const created1 = await insertUser(userData1);
    await insertUser(userData2);

    expect(
      updateUser(created1.id, {
        firstname: 'F',
        lastname: 'L',
        email: 'second@example.com',
      })
    ).rejects.toThrow('Cet email est déjà utilisé.');
  });

  it('getUserWithPasswordById returns null when no user exists for id', async () => {
    const user = await getUserWithPasswordById(999999);
    expect(user).toBeNull();
  });

  it('getUserWithPasswordById returns user including password when found', async () => {
    const userData = createTestUserData({
      username: 'credbyiduser',
      email: 'credbyid@example.com',
      password: 'hashed-secret',
    });
    const created = await insertUser(userData);

    const found = await getUserWithPasswordById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.username).toBe(created.username);
    expect(found!.email).toBe(created.email);
    expect(found!.password).toBe(created.password);
  });

  it('updateUserCredentials updates username and password and returns user without password', async () => {
    const userData = createTestUserData({
      username: 'creduser',
      email: 'cred@example.com',
      password: 'old-hash',
    });
    const created = await insertUser(userData);

    const updated = await updateUserCredentials(created.id, {
      username: 'newusername',
      passwordHash: 'new-hash',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.username).toBe('newusername');
    expect(updated.firstname).toBe(created.firstname);
    expect(updated.email).toBe(created.email);
    expect('password' in updated).toBe(false);

    const withPassword = await getUserWithPasswordById(created.id);
    expect(withPassword!.username).toBe('newusername');
    expect(withPassword!.password).toBe('new-hash');
  });

  it('updateUserCredentials can update username without changing password', async () => {
    const userData = createTestUserData({
      username: 'credusernopw',
      email: 'crednopw@example.com',
      password: 'old-hash-nopw',
    });
    const created = await insertUser(userData);

    const updated = await updateUserCredentials(created.id, {
      username: 'newusername-nopw',
    });

    expect(updated.id).toBe(created.id);
    expect(updated.username).toBe('newusername-nopw');
    expect('password' in updated).toBe(false);

    const withPassword = await getUserWithPasswordById(created.id);
    expect(withPassword!.username).toBe('newusername-nopw');
    expect(withPassword!.password).toBe('old-hash-nopw');
  });

  it('updateUserCredentials throws clear error on duplicate username', async () => {
    const userData1 = createTestUserData({
      username: 'creduser1',
      email: 'cred1@example.com',
    });
    const userData2 = createTestUserData({
      username: 'creduser2',
      email: 'cred2@example.com',
    });
    const created1 = await insertUser(userData1);
    await insertUser(userData2);

    expect(
      updateUserCredentials(created1.id, {
        username: 'creduser2',
        passwordHash: 'any-hash',
      })
    ).rejects.toThrow('Cet identifiant est déjà utilisé.');
  });
});
