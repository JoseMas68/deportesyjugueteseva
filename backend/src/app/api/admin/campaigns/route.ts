import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isFeatureEnabled, FEATURE_FLAGS } from '@/lib/features'
import { z } from 'zod'

const createCampaignSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  subject: z.string().min(1, 'El asunto es obligatorio'),
  previewText: z.string().optional(),
  body: z.string().min(1, 'El contenido es obligatorio'),
  targetAudience: z.enum(['all', 'customers', 'subscribers']).default('all'),
  targetFilters: z.object({}).passthrough().optional(),
})

// GET - Listar campañas
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si email marketing está habilitado
    const isEnabled = await isFeatureEnabled(FEATURE_FLAGS.EMAIL_MARKETING)

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}
    if (status) {
      where.status = status
    }

    const [campaigns, total] = await Promise.all([
      prisma.emailCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.emailCampaign.count({ where }),
    ])

    return NextResponse.json({
      campaigns,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      isEnabled,
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Error al obtener campañas' },
      { status: 500 }
    )
  }
}

// POST - Crear campaña
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const validated = createCampaignSchema.parse(body)

    const campaign = await prisma.emailCampaign.create({
      data: validated,
    })

    return NextResponse.json({ campaign })
  } catch (error) {
    console.error('Error creating campaign:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear campaña' },
      { status: 500 }
    )
  }
}
