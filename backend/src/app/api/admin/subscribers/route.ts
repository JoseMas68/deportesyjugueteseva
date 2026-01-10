import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar suscriptores
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'active', 'unsubscribed'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'unsubscribed') {
      where.isActive = false
    }

    const [subscribers, total, activeCount] = await Promise.all([
      prisma.emailSubscriber.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.emailSubscriber.count({ where }),
      prisma.emailSubscriber.count({ where: { isActive: true } }),
    ])

    return NextResponse.json({
      subscribers,
      total,
      activeCount,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching subscribers:', error)
    return NextResponse.json(
      { error: 'Error al obtener suscriptores' },
      { status: 500 }
    )
  }
}

// POST - Añadir suscriptor manualmente
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { email, name, source } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'El email es obligatorio' },
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
        const subscriber = await prisma.emailSubscriber.update({
          where: { email: email.toLowerCase() },
          data: { isActive: true, unsubscribedAt: null, name },
        })
        return NextResponse.json({ subscriber, reactivated: true })
      }
      return NextResponse.json(
        { error: 'Este email ya está suscrito' },
        { status: 400 }
      )
    }

    const subscriber = await prisma.emailSubscriber.create({
      data: {
        email: email.toLowerCase(),
        name,
        source: source || 'admin',
      },
    })

    return NextResponse.json({ subscriber })
  } catch (error) {
    console.error('Error adding subscriber:', error)
    return NextResponse.json(
      { error: 'Error al añadir suscriptor' },
      { status: 500 }
    )
  }
}
