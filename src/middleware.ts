import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const privateRoutes = ['/create-blog', '/profile']

// Create a route matcher function
const isPrivateRoute = createRouteMatcher(privateRoutes)

export default clerkMiddleware((auth, req) => {
  if (isPrivateRoute(req)) {
    // Protect the private routes
    auth().protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
