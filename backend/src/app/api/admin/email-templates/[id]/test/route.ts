import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

// Inicialización lazy de Resend para evitar errores en build time
let resendInstance: Resend | null = null

function getResend(): Resend {
  if (!resendInstance) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured')
    }
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Enviar email de prueba
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
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email de destino obligatorio' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      )
    }

    // Reemplazar placeholders con datos de ejemplo
    const testData = {
      order_number: 'EVA-20260110-TEST',
      order_id: 'test-id-12345',
      user_name: 'Cliente de Prueba',
      user_email: email,
      products: `
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f9f9f9;">
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="https://via.placeholder.com/60" alt="Producto" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
                <div>
                  <strong>Zapatillas Running Pro</strong><br/>
                  <span style="color: #666; font-size: 13px;">Talla: 42 - Color: Negro</span>
                </div>
              </div>
            </td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">2</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">89.90€</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <img src="https://via.placeholder.com/60" alt="Producto" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
                <div>
                  <strong>Camiseta Técnica</strong><br/>
                  <span style="color: #666; font-size: 13px;">Talla: L - Color: Azul</span>
                </div>
              </div>
            </td>
            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">1</td>
            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee; font-weight: bold;">29.95€</td>
          </tr>
        </table>
      `,
      subtotal: '209.75€',
      shipping_cost: '4.99€',
      total: '214.74€',
      address: 'Calle de Prueba 123, Piso 4B<br/>28001 Madrid, Madrid<br/>España',
      tracking_number: 'SEUR123456789',
      cancellation_reason: 'Solicitud del cliente',
      admin_link: `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/admin/pedidos/test-id-12345`,
    }

    let subject = template.subject
    let body = template.body

    // Reemplazar placeholders
    Object.entries(testData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g')
      subject = subject.replace(regex, value)
      body = body.replace(regex, value)
    })

    // Añadir banner de prueba
    body = `
      <div style="background: #FEF3C7; padding: 12px; text-align: center; font-size: 14px; color: #92400E; font-weight: 500;">
        ⚠️ ESTO ES UN EMAIL DE PRUEBA - Los datos son ficticios
      </div>
      ${body}
    `

    // Enviar email
    const result = await getResend().emails.send({
      from: 'Deportes y Juguetes Eva <noreply@deportesyjugueteseva.com>',
      to: email,
      subject: `[TEST] ${subject}`,
      html: body,
    })

    if (result.error) {
      console.error('Error sending test email:', result.error)
      return NextResponse.json(
        { error: result.error.message || 'Error al enviar email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Email de prueba enviado a ${email}`,
    })
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Error al enviar email de prueba' },
      { status: 500 }
    )
  }
}
