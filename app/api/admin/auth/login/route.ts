import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserWithPasswordByUsernameOrEmail } from '@/lib/services/user.service';
import { verifyPassword } from '@/lib/auth/password';
import {
  signAdminJwt,
  getAdminJwtCookieName,
  getAdminJwtDefaultTtlSeconds,
} from '@/lib/auth/jwt';

const adminLoginSchema = z.object({
  identifier: z.string().min(1, 'Identifiant requis'),
  password: z.string().min(1, 'Mot de passe requis'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = adminLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: parsed.error.issues.map((e) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const user = await getUserWithPasswordByUsernameOrEmail(identifier);

    if (!user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Identifiants invalides',
        },
        { status: 401 }
      );
    }

    const passwordOk = await verifyPassword(password, user.password);
    if (!passwordOk) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Identifiants invalides',
        },
        { status: 401 }
      );
    }

    const tokenTtl = getAdminJwtDefaultTtlSeconds();
    const token = signAdminJwt({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    const cookieName = getAdminJwtCookieName();
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          username: user.username,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
        },
        message: 'Connexion réussie',
      },
      { status: 200 }
    );

    response.cookies.set(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenTtl,
    });

    return response;
  } catch (error) {
    console.error('Error during admin login:', error);
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: 'Erreur lors de la connexion',
      },
      { status: 500 }
    );
  }
}

