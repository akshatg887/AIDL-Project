import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("token")?.value;

  // Explicitly ignore any paths that start with /api
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  const isPublicPath = path === "/login" || path === "/signup" || path === "/";

  // If the user is logged in (has a token) and tries to access a public page, redirect them to the dashboard.
  if (isPublicPath && token && path !== "/") {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  // Protected paths that require authentication
  const protectedPaths = ["/dashboard", "/projects", "/resume-generator"];
  const isProtectedPath = protectedPaths.some((protectedPath) =>
    path.startsWith(protectedPath)
  );

  // If the user is not logged in (has no token) and is trying to access a protected page, redirect them to login.
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
