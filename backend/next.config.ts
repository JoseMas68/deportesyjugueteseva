import type { NextConfig } from 'next'

// Orígenes permitidos para CORS (frontend y desarrollo)
// En producción, NEXT_PUBLIC_SITE_URL tiene prioridad
const allowedOrigins = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:4321',
  'http://localhost:3000',
].filter(Boolean) as string[]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'placeholder.co',
      },
    ],
  },
  // Headers de seguridad y CORS
  async headers() {
    return [
      {
        // Headers de seguridad para todas las rutas
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // CORS para API - en desarrollo permitimos localhost
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigins[0] || 'http://localhost:4321' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ]
  },
  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
