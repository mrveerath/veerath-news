<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> b48fbca26c30a6a27d53857c64c0245076d32823
import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
<<<<<<< HEAD
=======
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
    const secret = process.env.AUTH_SECRET
  const token = await getToken({ req: request,secret })
  const { pathname } = request.nextUrl

  // Redirect authenticated users away from auth pages
  if (token && (pathname.startsWith("/auth/sign-in") || pathname.startsWith("/auth/sign-up"))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Protect routes that require authentication
  if (!token && (pathname.startsWith("/profile") || pathname.startsWith("/create-blog"))) {
    return NextResponse.redirect(new URL('/auth/sign-in', request.url))
  }

  // Continue with the request if no redirect is needed
  return NextResponse.next()
}

export const config = {
  matcher: [
    "/auth/sign-in",
    "/auth/sign-up",
    "/profile/:path*",
    "/create-blog"
  ]
>>>>>>> master
=======
>>>>>>> b48fbca26c30a6a27d53857c64c0245076d32823
}