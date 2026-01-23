import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const openSessionSchema = z.object({
  openingAmount: z.number().min(0),
  openingNotes: z.string().optional(),
})

// GET /api/pos/sessions - Obtener sesión activa o historial
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const active = searchParams.get('active') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (active) {
      // Buscar sesión activa (sin cerrar)
      const session = await prisma.posCashSession.findFirst({
        where: { closedAt: null },
        include: {
          sales: {
            where: { status: 'COMPLETED' },
            select: {
              id: true,
              total: true,
              paymentMethod: true,
            },
          },
          movements: true,
        },
        orderBy: { openedAt: 'desc' },
      })

      if (!session) {
        return NextResponse.json({ session: null })
      }

      // Calcular totales
      const cashSales = session.sales
        .filter(s => s.paymentMethod === 'CASH')
        .reduce((sum, s) => sum + Number(s.total), 0)
      const cardSales = session.sales
        .filter(s => s.paymentMethod === 'CARD')
        .reduce((sum, s) => sum + Number(s.total), 0)
      const bizumSales = session.sales
        .filter(s => s.paymentMethod === 'BIZUM')
        .reduce((sum, s) => sum + Number(s.total), 0)
      const mixedSales = session.sales
        .filter(s => s.paymentMethod === 'MIXED')
        .reduce((sum, s) => sum + Number(s.total), 0)

      const movementsIn = session.movements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => sum + Number(m.amount), 0)
      const movementsOut = session.movements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => sum + Number(m.amount), 0)

      return NextResponse.json({
        session: {
          id: session.id,
          adminName: session.adminName,
          openingAmount: Number(session.openingAmount),
          openedAt: session.openedAt,
          salesCount: session.sales.length,
          totals: {
            cash: cashSales,
            card: cardSales,
            bizum: bizumSales,
            mixed: mixedSales,
            movementsIn,
            movementsOut,
            expectedCash: Number(session.openingAmount) + cashSales + movementsIn - movementsOut,
          },
        },
      })
    }

    // Historial de sesiones
    const skip = (page - 1) * limit
    const [sessions, total] = await Promise.all([
      prisma.posCashSession.findMany({
        where: { closedAt: { not: null } },
        include: {
          _count: { select: { sales: true } },
        },
        orderBy: { closedAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.posCashSession.count({ where: { closedAt: { not: null } } }),
    ])

    return NextResponse.json({
      sessions: sessions.map(s => ({
        id: s.id,
        adminName: s.adminName,
        openingAmount: Number(s.openingAmount),
        closingAmount: s.closingAmount ? Number(s.closingAmount) : null,
        difference: s.difference ? Number(s.difference) : null,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        salesCount: s._count.sales,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Error al obtener sesiones' },
      { status: 500 }
    )
  }
}

// POST /api/pos/sessions - Abrir nueva sesión de caja
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que no haya sesión activa
    const activeSession = await prisma.posCashSession.findFirst({
      where: { closedAt: null },
    })
    if (activeSession) {
      return NextResponse.json(
        { error: 'Ya hay una sesión de caja abierta' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = openSessionSchema.parse(body)

    const session = await prisma.posCashSession.create({
      data: {
        adminId: admin.id,
        adminName: admin.name || admin.email,
        openingAmount: validated.openingAmount,
        openingNotes: validated.openingNotes,
      },
    })

    return NextResponse.json({
      session: {
        id: session.id,
        adminName: session.adminName,
        openingAmount: Number(session.openingAmount),
        openedAt: session.openedAt,
        salesCount: 0,
        totals: {
          cash: 0,
          card: 0,
          bizum: 0,
          mixed: 0,
          movementsIn: 0,
          movementsOut: 0,
          expectedCash: Number(session.openingAmount),
        },
      },
    })
  } catch (error) {
    console.error('Error opening session:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al abrir sesión de caja' },
      { status: 500 }
    )
  }
}
