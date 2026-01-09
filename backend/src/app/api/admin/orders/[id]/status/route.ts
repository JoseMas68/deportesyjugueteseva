import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, EmailType } from '@/lib/email'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
  shippingCarrier: z.string().optional(),
  cancellationReason: z.string().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// PATCH - Cambiar estado del pedido
export async function PATCH(
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
    const validated = updateStatusSchema.parse(body)

    // Obtener pedido actual
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos de actualizacion
    const updateData: Record<string, unknown> = {
      status: validated.status,
    }

    // Actualizar campos segun el nuevo estado
    const now = new Date()

    switch (validated.status) {
      case 'PAID':
        updateData.paidAt = now
        updateData.paymentStatus = 'PAID'
        break

      case 'SHIPPED':
        updateData.shippedAt = now
        if (validated.trackingNumber) {
          updateData.trackingNumber = validated.trackingNumber
        }
        if (validated.shippingCarrier) {
          updateData.shippingCarrier = validated.shippingCarrier
        }
        break

      case 'DELIVERED':
        updateData.deliveredAt = now
        break

      case 'CANCELLED':
        updateData.cancelledAt = now
        if (validated.cancellationReason) {
          updateData.cancellationReason = validated.cancellationReason
        }
        // Restaurar stock de productos
        for (const item of order.items) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        }
        break
    }

    // Actualizar pedido
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // Enviar email al cliente segun el estado
    let emailType: EmailType | null = null

    switch (validated.status) {
      case 'PAID':
        emailType = EmailType.PAID
        break
      case 'SHIPPED':
        emailType = EmailType.SHIPPED
        break
      case 'DELIVERED':
        emailType = EmailType.DELIVERED
        break
      case 'CANCELLED':
        emailType = EmailType.CANCELLED
        break
    }

    if (emailType) {
      // Enviar email en background (no bloquear la respuesta)
      sendEmail(emailType, updatedOrder, order.userEmail).catch(err => {
        console.error('Error sending email:', err)
      })
    }

    return NextResponse.json({
      order: {
        ...updatedOrder,
        subtotal: Number(updatedOrder.subtotal),
        shippingCost: Number(updatedOrder.shippingCost),
        discount: Number(updatedOrder.discount),
        total: Number(updatedOrder.total),
        items: updatedOrder.items.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          totalPrice: Number(item.totalPrice),
        })),
      },
      message: `Estado actualizado a ${validated.status}`,
    })
  } catch (error) {
    console.error('Error updating order status:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar estado' },
      { status: 500 }
    )
  }
}
