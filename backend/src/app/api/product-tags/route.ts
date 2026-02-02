import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/product-tags - Listar todas las etiquetas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const where = activeOnly ? { isActive: true } : {}

    const tags = await prisma.productTag.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    // Transformar para incluir el conteo de productos
    const tagsWithCount = tags.map(tag => ({
      ...tag,
      productCount: tag._count.products,
      _count: undefined
    }))

    return NextResponse.json(tagsWithCount)
  } catch (error) {
    console.error('Error fetching product tags:', error)
    return NextResponse.json(
      { error: 'Error al obtener las etiquetas' },
      { status: 500 }
    )
  }
}

// Schema de validación
const createTagSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
})

// POST /api/product-tags - Crear nueva etiqueta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTagSchema.parse(body)

    // Generar slug si no se proporciona
    const slug = data.slug || data.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Verificar que el slug no exista
    const existing = await prisma.productTag.findUnique({
      where: { slug }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe una etiqueta con ese nombre/slug' },
        { status: 400 }
      )
    }

    const tag = await prisma.productTag.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        color: data.color,
        icon: data.icon,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating product tag:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear la etiqueta' },
      { status: 500 }
    )
  }
}
