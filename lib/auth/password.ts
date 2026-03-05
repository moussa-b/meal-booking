import bcrypt from 'bcryptjs';

const DEFAULT_SALT_ROUNDS = 10;

export async function hashPassword(plain: string, saltRounds = DEFAULT_SALT_ROUNDS): Promise<string> {
  if (!plain) {
    throw new Error('Password must not be empty');
  }

  const rounds = Number.isFinite(saltRounds) && saltRounds > 0 ? saltRounds : DEFAULT_SALT_ROUNDS;
  return bcrypt.hash(plain, rounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!plain || !hash) {
    return false;
  }

  return bcrypt.compare(plain, hash);
}

