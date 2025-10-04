// middleware.ts
import { getSessionCookie } from 'better-auth/cookies';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  // Generate or retrieve request ID for audit correlation
  const reqId = request.headers.get('x-request-id') ?? crypto.randomUUID();

  // For protected routes, check authentication
  const protectedRoutes = ['/dashboard', '/complete-profile'];
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    const sessionCookie = getSessionCookie(request);

    // Redirect unauthenticated users trying to access protected routes
    if (!sessionCookie) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.headers.set('x-request-id', reqId);
      return response;
    }
  }

  const res = NextResponse.next();

  // Set request ID header for downstream audit logging on all requests
  res.headers.set('x-request-id', reqId);

  return res;
}

export const config = {
  // Match all routes to ensure request IDs are added everywhere
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
