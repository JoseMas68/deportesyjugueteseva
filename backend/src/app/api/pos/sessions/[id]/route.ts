import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

const closeSessionSchema = z.object({
  closingCash: z.number().min(0),
  closingCard: z.number().min(0).default(0),
  closingBizum: z.number().min(0).default(0),
  closingNotes: z.string().optional(),
})

const movementSchema = z.object({
  type: z.enum(['in', 'out']),
  amount: z.number().positive(),
  reason: z.string().min(1),
})

// GET /api/pos/sessions/[id] - Obtener detalle de sesión
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const session = await prisma.posCashSession.findUnique({
      where: { id },
      include: {
        sales: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        movements: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    // Calcular totales
    const totals = {
      cash: 0,
      card: 0,
      bizum: 0,
      mixed: 0,
      salesCount: session.sales.length,
      itemsCount: session.sales.reduce((sum, s) => sum + s.items.length, 0),
    }

    session.sales.forEach(sale => {
      const amount = Number(sale.total)
      switch (sale.paymentMethod) {
        case 'CASH':
          totals.cash += amount
          break
        case 'CARD':
          totals.card += amount
          break
        case 'BIZUM':
          totals.bizum += amount
          break
        case 'MIXED':
          totals.mixed += amount
          totals.cash += Number(sale.cashReceived || 0) - Number(sale.cashChange || 0)
          totals.card += Number(sale.cardAmount || 0)
          totals.bizum += Number(sale.bizumAmount || 0)
          break
      }
    })

    const movementsIn = session.movements
      .filter(m => m.type === 'in')
      .reduce((sum, m) => sum + Number(m.amount), 0)
    const movementsOut = session.movements
      .filter(m => m.type === 'out')
      .reduce((sum, m) => sum + Number(m.amount), 0)

    return NextResponse.json({
      session: {
        id: session.id,
        adminId: session.adminId,
        adminName: session.adminName,
        openingAmount: Number(session.openingAmount),
        closingAmount: session.closingAmount ? Number(session.closingAmount) : null,
        expectedAmount: session.expectedAmount ? Number(session.expectedAmount) : null,
        difference: session.difference ? Number(session.difference) : null,
        closingCash: session.closingCash ? Number(session.closingCash) : null,
        closingCard: session.closingCard ? Number(session.closingCard) : null,
        closingBizum: session.closingBizum ? Number(session.closingBizum) : null,
        openingNotes: session.openingNotes,
        closingNotes: session.closingNotes,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        totals: {
          ...totals,
          movementsIn,
          movementsOut,
          expectedCash: Number(session.openingAmount) + totals.cash + movementsIn - movementsOut,
          total: totals.cash + totals.card + totals.bizum,
        },
        sales: session.sales.map(s => ({
          id: s.id,
          saleNumber: s.saleNumber,
          total: Number(s.total),
          paymentMethod: s.paymentMethod,
          status: s.status,
          itemsCount: s.items.length,
          createdAt: s.createdAt,
        })),
        movements: session.movements.map(m => ({
          id: m.id,
          type: m.type,
          amount: Number(m.amount),
          reason: m.reason,
          createdAt: m.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Error al obtener sesión' },
      { status: 500 }
    )
  }
}

// PUT /api/pos/sessions/[id] - Cerrar sesión de caja
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = closeSessionSchema.parse(body)

    // Verificar que la sesión existe y está abierta
    const session = await prisma.posCashSession.findUnique({
      where: { id },
      include: {
        sales: {
          where: { status: 'COMPLETED' },
          select: {
            total: true,
            paymentMethod: true,
            cashReceived: true,
            cashChange: true,
          },
        },
        movements: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.closedAt) {
      return NextResponse.json(
        { error: 'La sesión ya está cerrada' },
        { status: 400 }
      )
    }

    // Calcular el efectivo esperado
    let expectedCash = Number(session.openingAmount)

    session.sales.forEach(sale => {
      if (sale.paymentMethod === 'CASH') {
        expectedCash += Number(sale.total)
      } else if (sale.paymentMethod === 'MIXED') {
        // En pagos mixtos, el efectivo neto es lo recibido menos el cambio
        expectedCash += Number(sale.cashReceived || 0) - Number(sale.cashChange || 0)
      }
    })

    session.movements.forEach(m => {
      if (m.type === 'in') {
        expectedCash += Number(m.amount)
      } else {
        expectedCash -= Number(m.amount)
      }
    })

    const closingAmount = validated.closingCash + validated.closingCard + validated.closingBizum
    const difference = validated.closingCash - expectedCash

    const updatedSession = await prisma.posCashSession.update({
      where: { id },
      data: {
        closingAmount,
        expectedAmount: expectedCash,
        difference,
        closingCash: validated.closingCash,
        closingCard: validated.closingCard,
        closingBizum: validated.closingBizum,
        closingNotes: validated.closingNotes,
        closedAt: new Date(),
      },
    })

    return NextResponse.json({
      session: {
        id: updatedSession.id,
        closingAmount: Number(updatedSession.closingAmount),
        expectedAmount: Number(updatedSession.expectedAmount),
        difference: Number(updatedSession.difference),
        closedAt: updatedSession.closedAt,
      },
    })
  } catch (error) {
    console.error('Error closing session:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    )
  }
}

// POST /api/pos/sessions/[id] - Añadir movimiento de caja
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = movementSchema.parse(body)

    // Verificar que la sesión existe y está abierta
    const session = await prisma.posCashSession.findUnique({
      where: { id },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      )
    }

    if (session.closedAt) {
      return NextResponse.json(
        { error: 'No se pueden añadir movimientos a una sesión cerrada' },
        { status: 400 }
      )
    }

    const movement = await prisma.posCashMovement.create({
      data: {
        sessionId: id,
        type: validated.type,
        amount: validated.amount,
        reason: validated.reason,
      },
    })

    return NextResponse.json({
      movement: {
        id: movement.id,
        type: movement.type,
        amount: Number(movement.amount),
        reason: movement.reason,
        createdAt: movement.createdAt,
      },
    })
  } catch (error) {
    console.error('Error adding movement:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al añadir movimiento' },
      { status: 500 }
    )
  }
}
