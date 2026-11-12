import { NextResponse, type NextRequest } from 'next/server';

const protectedPaths = ['/', '/dashboard', '/clients', '/leads', '/projects', '/workspaces'];

export function proxy(request: NextRequest) {
  const hasSessionCookie = Boolean(request.cookies.get('clientnest_session')?.value);
  const isProtected = protectedPaths.some((path) =>
    path === '/' ? request.nextUrl.pathname === '/' : request.nextUrl.pathname.startsWith(path),
  );

  if (isProtected && !hasSessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
