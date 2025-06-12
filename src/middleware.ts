import { clerkMiddleware, ClerkMiddlewareAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define private routes that require authentication
const privateRoutes = ['/create-blog', '/profile'];

// Define public routes that do not require authentication
const publicRoutes = ['/api/clerk/webhook'];

export default clerkMiddleware((auth:ClerkMiddlewareAuth, req) => {
  const { pathname } = req.nextUrl;

  // Check if the current route is a public route
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next(); // Allow access without authentication
  }

  // Check if the current route is a private route
  if (privateRoutes.includes(pathname)) {
    const data = auth();

    // If the user is not authenticated, redirect to the sign-in page
    if (!data) {
      const signInUrl = new URL('/sign-in', req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
