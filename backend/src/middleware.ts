import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase-middleware'

// ============ CORS ============
const allowedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:4321',
  'http://localhost:3000',
].filter(Boolean) as string[]

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0]
  return {
    'Access-Control-Allow-Origin': allowedOrigin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

// ============ RATE LIMITING ============
// Rate limiter simple en memoria (para producción usar Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

// Configuración de rate limiting por ruta
const RATE_LIMITS: Record<string, { requests: number; windowMs: number }> = {
  '/api/customers/auth/login': { requests: 5, windowMs: 60000 }, // 5 intentos por minuto
  '/api/customers/auth/register': { requests: 3, windowMs: 60000 }, // 3 registros por minuto
  '/api/customers/auth/change-password': { requests: 3, windowMs: 60000 }, // 3 cambios por minuto
  '/api/reviews': { requests: 10, windowMs: 60000 }, // 10 reviews por minuto
}

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         request.headers.get('x-real-ip') ||
         'unknown'
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  // Limpiar entradas expiradas periódicamente
  if (rateLimitMap.size > 10000) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime) rateLimitMap.delete(k)
    }
  }

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

// ============ RUTAS ============
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
  const origin = request.headers.get('origin')

  // ============ CORS PREFLIGHT ============
  // Manejar solicitudes OPTIONS (preflight) para CORS
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    })
  }

  // ============ RATE LIMITING ============
  // Aplicar rate limiting a rutas sensibles
  for (const [route, config] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(route) && request.method === 'POST') {
      const clientIP = getClientIP(request)
      const key = `${clientIP}:${route}`

      if (!checkRateLimit(key, config.requests, config.windowMs)) {
        return NextResponse.json(
          { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
          {
            status: 429,
            headers: {
              'Retry-After': '60',
            }
          }
        )
      }
    }
  }

  // ============ AUTENTICACIÓN ============
  // Permitir acceso a rutas publicas
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  if (isPublicRoute) {
    // Añadir headers CORS para rutas API públicas
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.next()
      const corsHeaders = getCorsHeaders(origin)
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return response
    }
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
    // Añadir headers CORS para rutas API de admin
    if (pathname.startsWith('/api/')) {
      const corsHeaders = getCorsHeaders(origin)
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
    }
    return response
  }

  // Otras rutas, permitir acceso
  // Añadir headers CORS para rutas API
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next()
    const corsHeaders = getCorsHeaders(origin)
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
    return response
  }
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
