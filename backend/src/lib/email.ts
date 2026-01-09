import { Resend } from 'resend'
import { prisma } from './prisma'
import { EmailType, Order, OrderItem, Product } from '@prisma/client'

// Re-exportar EmailType para uso en otros archivos
export { EmailType }

const resend = new Resend(process.env.RESEND_API_KEY)

type OrderWithItems = Order & {
  items: (OrderItem & { product: Product })[]
}

/**
 * Envía un email basado en una plantilla de la base de datos
 */
export async function sendEmail(
  type: EmailType,
  order: OrderWithItems,
  recipientEmail: string,
  retries = 3
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Cargar plantilla de DB
    const template = await prisma.emailTemplate.findUnique({
      where: { type },
    })

    if (!template || !template.isActive) {
      console.warn(`Template ${type} not found or inactive`)
      return { success: false, error: 'Template not found or inactive' }
    }

    // 2. Reemplazar placeholders
    const subject = replacePlaceholders(template.subject, order)
    const html = replacePlaceholders(template.body, order)

    // 3. Enviar con Resend
    const { data, error } = await resend.emails.send({
      from: 'Deportes y Juguetes Eva <noreply@deportesyjugueteseva.com>',
      to: recipientEmail,
      subject,
      html,
    })

    if (error) {
      throw new Error(error.message)
    }

    // 4. Log exitoso
    await prisma.emailLog.create({
      data: {
        type,
        recipient: recipientEmail,
        subject,
        orderId: order.id,
        status: 'sent',
        sentAt: new Date(),
      },
    })

    console.log(`✅ Email ${type} sent successfully to ${recipientEmail}`)
    return { success: true }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`❌ Error sending ${type} email:`, errorMessage)

    // Log error
    await prisma.emailLog.create({
      data: {
        type,
        recipient: recipientEmail,
        subject: `Failed: ${type}`,
        orderId: order.id,
        status: 'failed',
        errorMessage,
      },
    })

    // Retry logic
    if (retries > 0) {
      console.log(`⏳ Retrying... (${retries} attempts left)`)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2s
      return sendEmail(type, order, recipientEmail, retries - 1)
    }

    return { success: false, error: errorMessage }
  }
}

/**
 * Reemplaza placeholders en el texto con datos reales del pedido
 */
function replacePlaceholders(text: string, order: OrderWithItems): string {
  // Generar HTML de productos
  const productsHtml = order.items
    .map(
      item => `
    <div style="padding: 15px 0; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong style="font-size: 16px;">${item.productName}</strong>
        <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
          Cantidad: ${item.quantity} × ${item.unitPrice}€
        </p>
      </div>
      <div style="font-size: 16px; font-weight: bold;">
        ${item.totalPrice}€
      </div>
    </div>
  `
    )
    .join('')

  // Formatear dirección
  const address = `${order.shippingAddress}
${order.shippingCity}, ${order.shippingPostalCode}
${order.shippingProvince || ''}
${order.shippingCountry}`

  // Reemplazar todos los placeholders
  return text
    .replace(/{order_number}/g, order.orderNumber)
    .replace(/{order_id}/g, order.id)
    .replace(/{user_name}/g, order.userName || 'Cliente')
    .replace(/{user_email}/g, order.userEmail)
    .replace(/{products}/g, productsHtml)
    .replace(/{subtotal}/g, `${order.subtotal}€`)
    .replace(/{shipping_cost}/g, `${order.shippingCost}€`)
    .replace(/{total}/g, `${order.total}€`)
    .replace(/{address}/g, address)
    .replace(/{tracking_number}/g, order.trackingNumber || 'Pendiente')
    .replace(/{cancellation_reason}/g, order.cancellationReason || 'No especificado')
    .replace(
      /{admin_link}/g,
      `${process.env.NEXT_PUBLIC_URL}/admin/pedidos/${order.id}`
    )
}

/**
 * Genera un número de pedido único en formato EVA-YYYYMMDD-NNNN
 */
export function generateOrderNumber(): string {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

  return `EVA-${year}${month}${day}-${random}`
}
