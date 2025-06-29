import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  const url = request.nextUrl.clone();

  const secret = process.env.AUTH_SECRET;

  // Debug log environment secret
  if (!secret) {
    console.error('[Middleware] ❌ AUTH_SECRET is not defined in environment variables.');
    return NextResponse.next();
  }

  // Try getting the token
  const token = await getToken({ req: request, secret });

  console.log(token)

  // Redirect authenticated users away from auth pages
  const isAuthPage = pathname.startsWith('/auth/sign-in') || pathname.startsWith('/auth/sign-up');
  if (token && isAuthPage) {
    console.log('[Middleware] ✅ User is authenticated. Redirecting from auth page...');
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Protect authenticated-only routes
  const protectedRoutes = ['/profile', '/create-blog'];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (!token && isProtected) {
    console.log('[Middleware] 🔒 Protected route accessed without token. Redirecting to sign-in...');
    url.pathname = '/auth/sign-in';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/auth/sign-in/:path*',
    '/auth/sign-up',
    '/profile/:path*',
    '/create-blog',
  ],
};
