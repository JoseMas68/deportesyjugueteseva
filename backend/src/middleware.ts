import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-middleware'

// Rutas publicas que no requieren autenticacion
const publicRoutes = [
  '/api/products',
  '/api/categories',
  '/api/checkout',
  '/api/home-sections',
  '/_next',
  '/favicon.ico',
  '/login',
]

// Rutas que requieren autenticacion de admin
const adminRoutes = ['/admin', '/api/admin']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acceso a rutas publicas
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Verificar si es una ruta de admin
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))

  if (isAdminRoute) {
    const { supabase, response } = createMiddlewareClient(request)

    // Verificar sesion de Supabase
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // No hay sesion, redirigir a login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Usuario autenticado, permitir acceso
    // La verificacion de AdminUser se hace en el servidor (auth.ts)
    return response
  }

  // Otras rutas, permitir acceso
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
