import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

const refundSchema = z.object({
  amount: z.number().positive(),
  refundMethod: z.enum(['cash', 'card', 'voucher']),
  reason: z.string().optional(),
  items: z.array(z.object({
    itemId: z.string(),
    quantity: z.number().int().positive(),
  })).optional(),
})

// Generar número de devolución: DEV-YYYYMMDD-XXXX
async function generateRefundNumber(): Promise<string> {
  const today = new Date()
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `DEV-${dateStr}-`

  const lastRefund = await prisma.posSaleRefund.findFirst({
    where: {
      refundNumber: { startsWith: prefix },
    },
    orderBy: { refundNumber: 'desc' },
  })

  let nextNumber = 1
  if (lastRefund) {
    const lastNumber = parseInt(lastRefund.refundNumber.split('-').pop() || '0', 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`
}

// Generar código de vale
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'VALE-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET /api/pos/sales/[id] - Obtener detalle de venta
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

    const sale = await prisma.posSale.findUnique({
      where: { id },
      include: {
        items: true,
        refunds: true,
        session: {
          select: {
            adminName: true,
            openedAt: true,
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
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
        cardAmount: sale.cardAmount ? Number(sale.cardAmount) : null,
        bizumAmount: sale.bizumAmount ? Number(sale.bizumAmount) : null,
        customerName: sale.customerName,
        customerEmail: sale.customerEmail,
        customerPhone: sale.customerPhone,
        status: sale.status,
        ticketPrinted: sale.ticketPrinted,
        notes: sale.notes,
        createdAt: sale.createdAt,
        session: sale.session,
        items: sale.items.map(i => ({
          id: i.id,
          productId: i.productId,
          variantId: i.variantId,
          productName: i.productName,
          productBarcode: i.productBarcode,
          productSku: i.productSku,
          variantInfo: i.variantInfo,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          discount: Number(i.discount),
          totalPrice: Number(i.totalPrice),
          refundedQuantity: i.refundedQuantity,
        })),
        refunds: sale.refunds.map(r => ({
          id: r.id,
          refundNumber: r.refundNumber,
          amount: Number(r.amount),
          refundMethod: r.refundMethod,
          voucherCode: r.voucherCode,
          reason: r.reason,
          processedBy: r.processedBy,
          createdAt: r.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching sale:', error)
    return NextResponse.json(
      { error: 'Error al obtener venta' },
      { status: 500 }
    )
  }
}

// PUT /api/pos/sales/[id] - Marcar ticket como impreso
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

    const sale = await prisma.posSale.update({
      where: { id },
      data: { ticketPrinted: true },
    })

    return NextResponse.json({
      sale: {
        id: sale.id,
        ticketPrinted: sale.ticketPrinted,
      },
    })
  } catch (error) {
    console.error('Error updating sale:', error)
    return NextResponse.json(
      { error: 'Error al actualizar venta' },
      { status: 500 }
    )
  }
}

// POST /api/pos/sales/[id] - Crear devolución
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
    const validated = refundSchema.parse(body)

    // Verificar que la venta existe y está completada
    const sale = await prisma.posSale.findUnique({
      where: { id },
      include: { items: true, refunds: true },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    if (sale.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Esta venta ya fue devuelta completamente' },
        { status: 400 }
      )
    }

    // Calcular total ya devuelto
    const totalRefunded = sale.refunds.reduce((sum, r) => sum + Number(r.amount), 0)
    const maxRefundable = Number(sale.total) - totalRefunded

    if (validated.amount > maxRefundable) {
      return NextResponse.json(
        { error: `El monto máximo a devolver es ${maxRefundable.toFixed(2)}€` },
        { status: 400 }
      )
    }

    const refundNumber = await generateRefundNumber()

    // Generar vale si el método es voucher
    let voucherCode: string | null = null
    if (validated.refundMethod === 'voucher') {
      voucherCode = generateVoucherCode()
    }

    // Crear devolución en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear registro de devolución
      const refund = await tx.posSaleRefund.create({
        data: {
          saleId: id,
          refundNumber,
          amount: validated.amount,
          refundMethod: validated.refundMethod,
          voucherCode,
          voucherAmount: voucherCode ? validated.amount : null,
          reason: validated.reason,
          processedBy: admin.name || admin.email,
        },
      })

      // Si se genera vale, crear registro de vale
      if (voucherCode) {
        await tx.posVoucher.create({
          data: {
            code: voucherCode,
            amount: validated.amount,
            originRefundId: refund.id,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
          },
        })
      }

      // Actualizar cantidades devueltas si se especifican items
      if (validated.items && validated.items.length > 0) {
        for (const item of validated.items) {
          const saleItem = sale.items.find(i => i.id === item.itemId)
          if (saleItem) {
            await tx.posSaleItem.update({
              where: { id: item.itemId },
              data: {
                refundedQuantity: { increment: item.quantity },
              },
            })

            // Devolver stock
            if (saleItem.variantId) {
              await tx.productVariant.update({
                where: { id: saleItem.variantId },
                data: { stock: { increment: item.quantity } },
              })
            } else {
              await tx.product.update({
                where: { id: saleItem.productId },
                data: { stock: { increment: item.quantity } },
              })
            }
          }
        }
      }

      // Actualizar estado de la venta
      const newTotalRefunded = totalRefunded + validated.amount
      const newStatus = newTotalRefunded >= Number(sale.total) ? 'REFUNDED' : 'PARTIAL_REFUND'

      await tx.posSale.update({
        where: { id },
        data: { status: newStatus },
      })

      return refund
    })

    return NextResponse.json({
      refund: {
        id: result.id,
        refundNumber: result.refundNumber,
        amount: Number(result.amount),
        refundMethod: result.refundMethod,
        voucherCode: result.voucherCode,
        createdAt: result.createdAt,
      },
    })
  } catch (error) {
    console.error('Error creating refund:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al procesar devolución' },
      { status: 500 }
    )
  }
}

// DELETE /api/pos/sales/[id] - Anular venta (solo si la sesión está abierta)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const sale = await prisma.posSale.findUnique({
      where: { id },
      include: {
        session: true,
        items: true,
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    if (sale.session.closedAt) {
      return NextResponse.json(
        { error: 'No se puede anular una venta de una sesión cerrada' },
        { status: 400 }
      )
    }

    if (sale.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Solo se pueden anular ventas completadas' },
        { status: 400 }
      )
    }

    // Anular venta en transacción
    await prisma.$transaction(async (tx) => {
      // Devolver stock
      for (const item of sale.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          })
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
      }

      // Marcar venta como anulada
      await tx.posSale.update({
        where: { id },
        data: { status: 'VOIDED' },
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Venta anulada correctamente',
    })
  } catch (error) {
    console.error('Error voiding sale:', error)
    return NextResponse.json(
      { error: 'Error al anular venta' },
      { status: 500 }
    )
  }
}
