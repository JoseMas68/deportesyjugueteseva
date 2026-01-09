import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rutas públicas que no requieren autenticación
const publicRoutes = [
  '/api/products',
  '/api/categories',
  '/api/checkout',
  '/_next',
  '/favicon.ico',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acceso a rutas públicas
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Para rutas protegidas, permitir acceso por ahora (sin autenticación aún)
  // TODO: Implementar autenticación para el panel admin
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
