import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get('procureiq_session')?.value);
  if ((request.nextUrl.pathname.startsWith('/app') || request.nextUrl.pathname.startsWith('/admin')) && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (request.nextUrl.pathname === '/onboarding' && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/app/:path*', '/admin/:path*', '/onboarding'] };
