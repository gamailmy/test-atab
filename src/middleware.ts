import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware proteksi route.
 * - /login dan /api/auth/* adalah public (untuk login itu sendiri)
 * - Static assets (_next, public files) di-skip via matcher
 * - Semua route lain wajib punya session cookie NextAuth
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths: login page dan NextAuth API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Cek session cookie NextAuth (format http dan secure)
  const sessionToken =
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  if (!sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Matcher: jalankan middleware untuk SEMUA route KECUALI
   * - _next/static, _next/image (Next.js internals)
   * - favicon.ico, logo.svg, robots.txt, emon-fallback.json (public assets)
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|robots.txt|emon-fallback.json).*)"],
};
