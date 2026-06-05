import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req: any) => {
  const { pathname } = req.nextUrl;

  if (pathname === "/api/admin/impersonate/stop") {
    return NextResponse.next();
  }

  const session = req.auth;

  const protectedRoutes = ["/learn", "/profile", "/my-courses", "/quiz"];
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !session) {
    const signInUrl = new URL("/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminRoute) {
    if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "INSTRUCTOR")) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/learn/:path*", "/profile/:path*", "/my-courses/:path*", "/quiz/:path*", "/admin/:path*", "/api/admin/:path*"],
};
