import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas que requieren autenticación
const protectedRoutes = ["/antiguo/portal"];

// Rutas públicas
const publicRoutes = ["/", "/diagnostico", "/nuevo", "/antiguo", "/segunda-opinion"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Verificar cookie de sesión
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      // Redirigir a login
      const loginUrl = new URL("/antiguo", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

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
     * - public files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|fonts|icon.svg).*)",
  ],
};
