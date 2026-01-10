import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/features'

// POST - Suscribirse al newsletter
export async function POST(request: NextRequest) {
  try {
    // Verificar si email marketing está habilitado
    const isEnabled = await isFeatureEnabled(FEATURE_FLAGS.EMAIL_MARKETING)
    if (!isEnabled) {
      return NextResponse.json(
        { error: 'El newsletter no está disponible en este momento' },
        { status: 503 }
      )
    }

    const { email, name, source } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'El email es obligatorio' },
        { status: 400 }
      )
    }

    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      )
    }

    // Verificar si ya existe
    const existing = await prisma.emailSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      if (!existing.isActive) {
        // Reactivar si estaba desuscrito
        await prisma.emailSubscriber.update({
          where: { email: email.toLowerCase() },
          data: { isActive: true, unsubscribedAt: null, name: name || existing.name },
        })
        return NextResponse.json({
          success: true,
          message: '¡Bienvenido de nuevo! Te has vuelto a suscribir.',
        })
      }
      return NextResponse.json({
        success: true,
        message: 'Ya estás suscrito a nuestro newsletter.',
      })
    }

    await prisma.emailSubscriber.create({
      data: {
        email: email.toLowerCase(),
        name: name || null,
        source: source || 'website',
      },
    })

    return NextResponse.json({
      success: true,
      message: '¡Gracias por suscribirte! Recibirás nuestras ofertas exclusivas.',
    })
  } catch (error) {
    console.error('Error subscribing:', error)
    return NextResponse.json(
      { error: 'Error al procesar la suscripción' },
      { status: 500 }
    )
  }
}
