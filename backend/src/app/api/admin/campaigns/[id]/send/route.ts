import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/features'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Enviar campaña
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si email marketing está habilitado
    const isEnabled = await isFeatureEnabled(FEATURE_FLAGS.EMAIL_MARKETING)
    if (!isEnabled) {
      return NextResponse.json(
        { error: 'Email marketing está deshabilitado' },
        { status: 403 }
      )
    }

    const { id } = await params

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Solo se pueden enviar campañas en borrador o programadas' },
        { status: 400 }
      )
    }

    // Obtener destinatarios según la audiencia
    let recipients: { email: string; name: string | null }[] = []

    if (campaign.targetAudience === 'subscribers' || campaign.targetAudience === 'all') {
      const subscribers = await prisma.emailSubscriber.findMany({
        where: { isActive: true },
        select: { email: true, name: true },
      })
      recipients = [...recipients, ...subscribers]
    }

    if (campaign.targetAudience === 'customers' || campaign.targetAudience === 'all') {
      // Obtener emails únicos de clientes que han hecho pedidos
      const orders = await prisma.order.findMany({
        select: { userEmail: true, userName: true },
        distinct: ['userEmail'],
      })
      const customers = orders.map(o => ({ email: o.userEmail, name: o.userName }))
      recipients = [...recipients, ...customers]
    }

    // Eliminar duplicados
    const uniqueRecipients = Array.from(
      new Map(recipients.map(r => [r.email, r])).values()
    )

    if (uniqueRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No hay destinatarios para esta campaña' },
        { status: 400 }
      )
    }

    // Actualizar estado a enviando
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SENDING',
        totalRecipients: uniqueRecipients.length,
      },
    })

    // Enviar emails (en un entorno real, esto debería ser un job en background)
    let sent = 0
    let failed = 0

    for (const recipient of uniqueRecipients) {
      try {
        // Personalizar body con nombre si está disponible
        let personalizedBody = campaign.body
        if (recipient.name) {
          personalizedBody = personalizedBody.replace(/\{subscriber_name\}/g, recipient.name)
        } else {
          personalizedBody = personalizedBody.replace(/\{subscriber_name\}/g, 'Cliente')
        }

        // Añadir link de unsubscribe
        const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${encodeURIComponent(recipient.email)}`
        personalizedBody = personalizedBody.replace(/\{unsubscribe_url\}/g, unsubscribeUrl)

        const result = await resend.emails.send({
          from: 'Deportes y Juguetes Eva <noreply@deportesyjugueteseva.com>',
          to: recipient.email,
          subject: campaign.subject,
          html: personalizedBody,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
          },
        })

        if (result.error) {
          throw new Error(result.error.message)
        }

        // Registrar envío exitoso
        await prisma.campaignEmailLog.create({
          data: {
            campaignId: id,
            recipient: recipient.email,
            status: 'sent',
            sentAt: new Date(),
          },
        })

        sent++
      } catch (error) {
        // Registrar fallo
        await prisma.campaignEmailLog.create({
          data: {
            campaignId: id,
            recipient: recipient.email,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Error desconocido',
          },
        })

        failed++
      }
    }

    // Actualizar campaña con resultados
    await prisma.emailCampaign.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        totalSent: sent,
        totalBounced: failed,
      },
    })

    return NextResponse.json({
      success: true,
      totalRecipients: uniqueRecipients.length,
      sent,
      failed,
    })
  } catch (error) {
    console.error('Error sending campaign:', error)

    // Revertir estado si hay error
    const { id } = await params
    await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'DRAFT' },
    })

    return NextResponse.json(
      { error: 'Error al enviar campaña' },
      { status: 500 }
    )
  }
}
