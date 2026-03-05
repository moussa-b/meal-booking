import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminJwt, getAdminJwtCookieName } from '@/lib/auth/jwt';

function isPublicApiPath(pathname: string): boolean {
  if (pathname.startsWith('/api/health')) return true;
  if (pathname.startsWith('/api/version')) return true;
  if (pathname.startsWith('/api/public/')) return true;
  if (pathname === '/api/admin/auth/login') return true;
  return pathname === '/api/admin/auth/logout';
}

function isPublicAdminUiPath(pathname: string): boolean {
  return pathname === '/admin/login';

}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminUi = pathname.startsWith('/admin');
  const isAdminApi = pathname.startsWith('/api/admin');

  if (!isAdminUi && !isAdminApi) {
    return NextResponse.next();
  }

  if (isAdminApi && isPublicApiPath(pathname)) {
    return NextResponse.next();
  }

  if (isAdminUi && isPublicAdminUiPath(pathname)) {
    return NextResponse.next();
  }

  const cookieName = getAdminJwtCookieName();
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    if (isAdminApi) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Admin authentication required',
        },
        { status: 401 }
      );
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    verifyAdminJwt(token);
    return NextResponse.next();
  } catch {
    if (isAdminApi) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Admin authentication required',
        },
        { status: 401 }
      );
    }

    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/admin/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

