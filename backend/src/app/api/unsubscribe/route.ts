import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Darse de baja del newsletter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!subscriber) {
      return NextResponse.json(
        { success: true, message: 'Email no encontrado en nuestra lista' },
      )
    }

    if (!subscriber.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Ya te has dado de baja anteriormente',
      })
    }

    await prisma.emailSubscriber.update({
      where: { email: email.toLowerCase() },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Te has dado de baja correctamente. Ya no recibirás más emails.',
    })
  } catch (error) {
    console.error('Error unsubscribing:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}

// POST - También soportamos POST por si acaso
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requerido' },
        { status: 400 }
      )
    }

    const subscriber = await prisma.emailSubscriber.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!subscriber || !subscriber.isActive) {
      return NextResponse.json({
        success: true,
        message: 'Ya no estás suscrito a nuestra lista',
      })
    }

    await prisma.emailSubscriber.update({
      where: { email: email.toLowerCase() },
      data: {
        isActive: false,
        unsubscribedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Te has dado de baja correctamente',
    })
  } catch (error) {
    console.error('Error unsubscribing:', error)
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    )
  }
}
