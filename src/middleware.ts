import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  decodeAuthToken,
  readAuthFromCookieHeader,
} from "@/lib/shifty-auth";

const publicPages = new Set([
  "/",
  "/sign-in",
  "/sign-up",
  "/sign-up/page",
  "/plan",
  "/match",
  "/predict",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/inventory",
  "/api/listings",
  "/api/service-area",
  "/api/predict",
  "/api/recommendations",
  "/api/quotes",
]);

export default clerkMiddleware(async (_clerkAuth, request: NextRequest) => {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  if (
    [...publicPages].some((value) =>
      path === value || path.startsWith(`${value}/`),
    )
  ) {
    return NextResponse.next();
  }

  const cookieToken = readAuthFromCookieHeader(request.headers.get("cookie"));
  const shiftySession = cookieToken ? decodeAuthToken(cookieToken) : null;
  if (shiftySession?.sub) {
    return NextResponse.next();
  }

  const clerkAuth = await _clerkAuth();
  if (clerkAuth?.userId) {
    return NextResponse.next();
  }

  const destination = new URL("/sign-in", request.url);
  destination.searchParams.set("next", path);
  return NextResponse.redirect(destination);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:css|js|png|jpg|jpeg|gif|svg|webp|avif)).*)",
  ],
};
