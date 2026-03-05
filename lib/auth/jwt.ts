import jwt, { JwtPayload } from 'jsonwebtoken';

const ADMIN_JWT_COOKIE_NAME = 'admin_token';
const DEFAULT_ADMIN_JWT_TTL_SECONDS = 60 * 60 * 8; // 8 hours

export interface AdminJwtPayload extends JwtPayload {
  userId: number;
  username: string;
  email: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required for admin authentication');
  }
  return secret;
}

export function signAdminJwt(payload: Omit<AdminJwtPayload, 'iat' | 'exp'>, expiresInSeconds = DEFAULT_ADMIN_JWT_TTL_SECONDS): string {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn: expiresInSeconds,
  });
}

export function verifyAdminJwt(token: string): AdminJwtPayload {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
  });

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload');
  }

  return decoded as AdminJwtPayload;
}

export function getAdminJwtCookieName(): string {
  return ADMIN_JWT_COOKIE_NAME;
}

export function getAdminJwtDefaultTtlSeconds(): number {
  return DEFAULT_ADMIN_JWT_TTL_SECONDS;
}

