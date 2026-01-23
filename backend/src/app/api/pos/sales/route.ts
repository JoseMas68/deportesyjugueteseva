import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getVerifactuService, isVerifactuEnabled } from '@/lib/verifactu'

const saleItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  productName: z.string(),
  productBarcode: z.string().optional().nullable(),
  productSku: z.string().optional().nullable(),
  variantInfo: z.string().optional().nullable(),
  quantity: z.number().int().positive(),
  unitPrice: z.number().positive(),
  discount: z.number().min(0).default(0),
})

const createSaleSchema = z.object({
  items: z.array(saleItemSchema).min(1),
  paymentMethod: z.enum(['CASH', 'CARD', 'BIZUM', 'MIXED']),
  cashReceived: z.number().min(0).optional(),
  cardAmount: z.number().min(0).optional(),
  bizumAmount: z.number().min(0).optional(),
  discount: z.number().min(0).default(0),
  customerName: z.string().optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
})

// Generar número de venta: TPV-YYYYMMDD-XXXX
async function generateSaleNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `TPV-${dateStr}-`

  // Buscar la última venta del día
  const lastSale = await prisma.posSale.findFirst({
    where: {
      saleNumber: { startsWith: prefix },
    },
    orderBy: { saleNumber: 'desc' },
  })

  let nextNumber = 1
  if (lastSale) {
    const lastNumber = parseInt(lastSale.saleNumber.split('-').pop() || '0', 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// GET /api/pos/sales - Listar ventas del día o historial
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const sessionId = searchParams.get('sessionId')
    const today = searchParams.get('today') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (sessionId) {
      where.sessionId = sessionId
    }

    if (today) {
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      where.createdAt = { gte: startOfDay }
    }

    const [sales, total] = await Promise.all([
      prisma.posSale.findMany({
        where,
        include: {
          items: true,
          _count: { select: { refunds: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.posSale.count({ where }),
    ])

    return NextResponse.json({
      sales: sales.map(s => ({
        id: s.id,
        saleNumber: s.saleNumber,
        subtotal: Number(s.subtotal),
        discount: Number(s.discount),
        total: Number(s.total),
        paymentMethod: s.paymentMethod,
        status: s.status,
        customerName: s.customerName,
        itemsCount: s.items.length,
        refundsCount: s._count.refunds,
        ticketPrinted: s.ticketPrinted,
        createdAt: s.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching sales:', error)
    return NextResponse.json(
      { error: 'Error al obtener ventas' },
      { status: 500 }
    )
  }
}

// POST /api/pos/sales - Crear nueva venta
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar sesión de caja activa
    const activeSession = await prisma.posCashSession.findFirst({
      where: { closedAt: null },
    })

    if (!activeSession) {
      return NextResponse.json(
        { error: 'No hay sesión de caja abierta' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validated = createSaleSchema.parse(body)

    // Calcular totales
    let subtotal = 0
    const itemsData = validated.items.map(item => {
      const totalPrice = (item.unitPrice * item.quantity) - item.discount
      subtotal += totalPrice
      return {
        ...item,
        totalPrice,
      }
    })

    const total = subtotal - validated.discount

    // Validar pago según método
    if (validated.paymentMethod === 'CASH') {
      if (!validated.cashReceived || validated.cashReceived < total) {
        return NextResponse.json(
          { error: 'El efectivo recibido es insuficiente' },
          { status: 400 }
        )
      }
    } else if (validated.paymentMethod === 'MIXED') {
      const totalPaid = (validated.cashReceived || 0) + (validated.cardAmount || 0) + (validated.bizumAmount || 0)
      if (totalPaid < total) {
        return NextResponse.json(
          { error: 'El total pagado es insuficiente' },
          { status: 400 }
        )
      }
    }

    const cashChange = validated.paymentMethod === 'CASH' || validated.paymentMethod === 'MIXED'
      ? Math.max(0, (validated.cashReceived || 0) - total)
      : 0

    // Generar número de venta
    const saleNumber = await generateSaleNumber()

    // Crear venta con items en transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const newSale = await tx.posSale.create({
        data: {
          saleNumber,
          sessionId: activeSession.id,
          subtotal,
          discount: validated.discount,
          total,
          paymentMethod: validated.paymentMethod,
          cashReceived: validated.cashReceived,
          cashChange,
          cardAmount: validated.cardAmount,
          bizumAmount: validated.bizumAmount,
          customerName: validated.customerName,
          customerEmail: validated.customerEmail,
          customerPhone: validated.customerPhone,
          notes: validated.notes,
          items: {
            create: itemsData.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              productBarcode: item.productBarcode,
              productSku: item.productSku,
              variantInfo: item.variantInfo,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              totalPrice: item.totalPrice,
            })),
          },
        },
        include: {
          items: true,
        },
      })

      // Actualizar stock de productos
      for (const item of itemsData) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      return newSale
    })

    // Crear registro Verifactu si está habilitado
    let verifactuRecord = null
    try {
      const verifactuEnabled = await isVerifactuEnabled()
      if (verifactuEnabled) {
        const service = getVerifactuService()
        const record = await service.createRecordFromSale(sale)
        verifactuRecord = {
          id: record.id,
          invoiceNumber: record.invoiceNumber,
          status: record.status,
          qrContent: record.qrContent,
          hash: record.currentHash.slice(-8), // Últimos 8 caracteres
        }

        // Enviar automáticamente si está configurado
        const config = await service.loadConfig()
        if (config?.autoSubmit) {
          try {
            await service.submitToAEAT(record.id)
          } catch (submitError) {
            console.error('Error enviando a AEAT:', submitError)
            // No fallar la venta por error de Verifactu
          }
        }
      }
    } catch (verifactuError) {
      console.error('Error creando registro Verifactu:', verifactuError)
      // No fallar la venta por error de Verifactu
    }

    return NextResponse.json({
      sale: {
        id: sale.id,
        saleNumber: sale.saleNumber,
        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        total: Number(sale.total),
        paymentMethod: sale.paymentMethod,
        cashReceived: sale.cashReceived ? Number(sale.cashReceived) : null,
        cashChange: sale.cashChange ? Number(sale.cashChange) : null,
        items: sale.items.map(i => ({
          id: i.id,
          productName: i.productName,
          variantInfo: i.variantInfo,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          totalPrice: Number(i.totalPrice),
        })),
        createdAt: sale.createdAt,
        verifactu: verifactuRecord,
      },
    })
  } catch (error) {
    console.error('Error creating sale:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear venta' },
      { status: 500 }
    )
  }
}
