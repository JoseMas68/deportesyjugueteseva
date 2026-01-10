import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  previewText: z.string().optional().nullable(),
  body: z.string().min(1).optional(),
  targetAudience: z.enum(['all', 'customers', 'subscribers']).optional(),
  targetFilters: z.object({}).passthrough().optional().nullable(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'CANCELLED']).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
})

// GET - Obtener campaña
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

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error fetching campaign:', error)
    return NextResponse.json(
      { error: 'Error al obtener campaña' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar campaña
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
    const validated = updateCampaignSchema.parse(body)

    // Verificar que la campaña existe y no está enviada
    const existing = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    if (existing.status === 'SENT' || existing.status === 'SENDING') {
      return NextResponse.json(
        { error: 'No se puede editar una campaña enviada o en proceso' },
        { status: 400 }
      )
    }

    const campaign = await prisma.emailCampaign.update({
      where: { id },
      data: {
        ...validated,
        scheduledAt: validated.scheduledAt ? new Date(validated.scheduledAt) : undefined,
      },
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error updating campaign:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar campaña' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar campaña
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

    const existing = await prisma.emailCampaign.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    if (existing.status === 'SENDING') {
      return NextResponse.json(
        { error: 'No se puede eliminar una campaña en proceso de envío' },
        { status: 400 }
      )
    }

    await prisma.emailCampaign.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json(
      { error: 'Error al eliminar campaña' },
      { status: 500 }
    )
  }
}
