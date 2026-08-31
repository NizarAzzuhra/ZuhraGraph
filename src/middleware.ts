import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET || 'secret123' });
  const isAuth = !!token;
  const isAuthPage = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/register";

  // Jika user sudah login dan mencoba mengakses halaman login/register, arahkan ke dashboard
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return null;
  }

  // Jika user belum login dan mencoba mengakses halaman yang dilindungi
  const isProtectedPage = req.nextUrl.pathname.startsWith("/orders");
  
  if (isProtectedPage && !isAuth) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }
    return NextResponse.redirect(new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  // Hanya jalankan middleware pada rute-rute ini
  matcher: ["/login", "/register", "/orders/:path*"]
};
