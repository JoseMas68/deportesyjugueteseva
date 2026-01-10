import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

const updateTemplateSchema = z.object({
  subject: z.string().min(1, 'El asunto es obligatorio'),
  body: z.string().min(1, 'El contenido es obligatorio'),
  isActive: z.boolean().optional(),
})

// GET - Obtener una plantilla específica
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

    const template = await prisma.emailTemplate.findUnique({
      where: { id },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Plantilla no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json(
      { error: 'Error al obtener plantilla' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar una plantilla
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
    const validated = updateTemplateSchema.parse(body)

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating email template:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar plantilla' },
      { status: 500 }
    )
  }
}
