import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, generateOrderNumber } from '@/lib/email'
import { z } from 'zod'
import { EmailType, PaymentMethod } from '@prisma/client'

const checkoutSchema = z.object({
  userEmail: z.string().email(),
  userName: z.string().min(2),
  userPhone: z.string().min(9),
  shippingAddress: z.string().min(5),
  shippingCity: z.string().min(2),
  shippingPostalCode: z.string().min(4),
  shippingProvince: z.string().optional(),
  shippingCountry: z.string().default('España'),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1),
  })).min(1),
  paymentMethod: z.nativeEnum(PaymentMethod),
  taxId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = checkoutSchema.parse(body)

    // 1. Verificar que los productos existen y tienen stock
    const products = await prisma.product.findMany({
      where: {
        id: { in: data.items.map(item => item.productId) },
        isActive: true,
      },
    })

    if (products.length !== data.items.length) {
      return NextResponse.json(
        { error: 'Algunos productos no están disponibles' },
        { status: 400 }
      )
    }

    // 2. Verificar stock
    for (const item of data.items) {
      const product = products.find(p => p.id === item.productId)
      if (!product || product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${product?.name || 'producto'}` },
          { status: 400 }
        )
      }
    }

    // 3. Calcular totales
    let subtotal = 0
    const orderItems = data.items.map(item => {
      const product = products.find(p => p.id === item.productId)!
      const totalPrice = Number(product.price) * item.quantity
      subtotal += totalPrice

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice,
        productName: product.name,
        productImage: product.thumbnailUrl || product.images[0],
        productSku: product.sku,
      }
    })

    // 4. Calcular envío
    const shippingConfig = await prisma.siteConfig.findUnique({
      where: { key: 'shipping_cost_standard' },
    })
    const freeShippingConfig = await prisma.siteConfig.findUnique({
      where: { key: 'free_shipping_threshold' },
    })

    const shippingCost = subtotal >= Number(freeShippingConfig?.value || 50)
      ? 0
      : Number(shippingConfig?.value || 4.99)

    const total = subtotal + shippingCost

    // 5. Crear pedido
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userEmail: data.userEmail,
        userName: data.userName,
        userPhone: data.userPhone,
        shippingAddress: data.shippingAddress,
        shippingCity: data.shippingCity,
        shippingPostalCode: data.shippingPostalCode,
        shippingProvince: data.shippingProvince,
        shippingCountry: data.shippingCountry,
        taxId: data.taxId,
        paymentMethod: data.paymentMethod,
        subtotal,
        shippingCost,
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    // 6. Reducir stock
    for (const item of data.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      })
    }

    // 7. Enviar emails (async, no bloquea respuesta)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@deportesyjugueteseva.com'

    Promise.all([
      sendEmail(EmailType.CONFIRMATION, order, order.userEmail),
      sendEmail(EmailType.ADMIN_NEW_ORDER, order, adminEmail),
    ])
      .then(async () => {
        await prisma.order.update({
          where: { id: order.id },
          data: { emailSentConfirmed: true },
        })
      })
      .catch(err => console.error('Email error:', err))

    // 8. Si es Stripe, crear Payment Intent
    if (data.paymentMethod === PaymentMethod.STRIPE) {
      // TODO: Implementar Stripe Payment Intent
      // Por ahora, devolvemos el order para que el frontend pueda continuar
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        paymentMethod: order.paymentMethod,
      },
    })

  } catch (error) {
    console.error('Checkout error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error procesando el pedido' },
      { status: 500 }
    )
  }
}
