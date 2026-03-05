import { NextResponse } from 'next/server';
import { getAdminJwtCookieName } from '@/lib/auth/jwt';

export async function POST() {
  const cookieName = getAdminJwtCookieName();

  const response = NextResponse.json(
    {
      message: 'Déconnexion réussie',
    },
    { status: 200 }
  );

  response.cookies.set(cookieName, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

