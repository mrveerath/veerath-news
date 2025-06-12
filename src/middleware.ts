import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const privateRoutes = ['/create-blog', '/profile'];
const isPrivateRoute = createRouteMatcher(privateRoutes);

export default clerkMiddleware(async (auth, req) => {
  if (isPrivateRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      // Redirect unauthenticated users to the sign-in page
      return new Response(null, {
        status: 302,
        headers: {
          'Location': '/sign-in', // Adjust the sign-in route as needed
        },
      });
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
