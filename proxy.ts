import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const pathname = request.nextUrl.pathname;

  const isLoggedIn = !!request.auth?.user;
  const userRole = request.auth?.user?.role;

  const isAdminRoute =
    pathname.startsWith("/admin");

  const isDashboardRoute =
    pathname.startsWith("/dashboard");

  const isSubscribeRoute =
    pathname.startsWith("/subscribe");

  const isAccountRoute =
    pathname.startsWith("/account");

  const isNotificationsRoute =
  pathname.startsWith("/notifications");  

  const isProtectedRoute =
  isAdminRoute ||
  isDashboardRoute ||
  isSubscribeRoute ||
  isAccountRoute ||
  isNotificationsRoute;

  if (isProtectedRoute && !isLoggedIn) {
    const loginUrl = new URL(
      "/login",
      request.nextUrl
    );

    return NextResponse.redirect(loginUrl);
  }

  if (
    isAdminRoute &&
    userRole !== "ADMIN"
  ) {
    return NextResponse.redirect(
      new URL(
        "/dashboard",
        request.nextUrl
      )
    );
  }

  if (
    isDashboardRoute &&
    userRole === "ADMIN"
  ) {
    return NextResponse.redirect(
      new URL(
        "/admin",
        request.nextUrl
      )
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/subscribe/:path*",
    "/account/:path*",
    "/notifications/:path*",
  ],
};
