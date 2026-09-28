import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  });
  const isAuth = !!token;
  const pathname = req.nextUrl.pathname;
  const isAuthPage = pathname === "/login" || pathname === "/register";

  // Jika user sudah login dan mencoba mengakses halaman login/register, arahkan ke beranda
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return null;
  }

  // Proteksi rute Admin: Wajib login dan harus memiliki role ADMIN
  if (pathname.startsWith("/admin")) {
    if (!isAuth) {
      const from = pathname + (req.nextUrl.search || "");
      return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url));
    }
    if ((token as any)?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Proteksi rute pembeli: Wajib login
  const isProtectedPage = pathname.startsWith("/orders");
  if (isProtectedPage && !isAuth) {
    const from = pathname + (req.nextUrl.search || "");
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Jalankan middleware pada rute otentikasi, rute pembeli, dan rute admin
  matcher: ["/login", "/register", "/orders/:path*", "/admin/:path*"]
};
