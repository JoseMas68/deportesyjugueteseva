import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener configuracion
export async function GET() {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const [siteConfig, paymentMethods] = await Promise.all([
      prisma.siteConfig.findMany({
        orderBy: [{ group: 'asc' }, { key: 'asc' }],
      }),
      prisma.paymentMethodConfig.findMany({
        orderBy: { method: 'asc' },
      }),
    ])

    return NextResponse.json({ siteConfig, paymentMethods })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuracion' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar configuracion
export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { config, paymentMethods } = body

    // Actualizar configuracion del sitio
    if (config && typeof config === 'object') {
      for (const [key, value] of Object.entries(config)) {
        await prisma.siteConfig.upsert({
          where: { key },
          update: { value: String(value) },
          create: {
            key,
            value: String(value),
            group: 'general',
          },
        })
      }
    }

    // Actualizar metodos de pago
    if (paymentMethods && typeof paymentMethods === 'object') {
      for (const [method, isEnabled] of Object.entries(paymentMethods)) {
        // Only update if it's a valid PaymentMethod enum value
        if (['STRIPE', 'TRANSFER', 'CASH'].includes(method)) {
          await prisma.paymentMethodConfig.updateMany({
            where: { method: method as 'STRIPE' | 'TRANSFER' | 'CASH' },
            data: { isEnabled: Boolean(isEnabled) },
          })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Error al actualizar configuracion' },
      { status: 500 }
    )
  }
}
