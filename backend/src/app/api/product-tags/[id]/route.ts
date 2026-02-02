import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/product-tags/[id] - Obtener una etiqueta
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const tag = await prisma.productTag.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                thumbnailUrl: true,
                price: true,
                isActive: true,
              }
            }
          }
        }
      }
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Etiqueta no encontrada' },
        { status: 404 }
      )
    }

    // Transformar productos
    const tagWithProducts = {
      ...tag,
      products: tag.products.map(p => p.product)
    }

    return NextResponse.json(tagWithProducts)
  } catch (error) {
    console.error('Error fetching product tag:', error)
    return NextResponse.json(
      { error: 'Error al obtener la etiqueta' },
      { status: 500 }
    )
  }
}

// Schema de actualización
const updateTagSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().optional(),
  description: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
})

// PATCH /api/product-tags/[id] - Actualizar etiqueta
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const data = updateTagSchema.parse(body)

    // Verificar que existe
    const existing = await prisma.productTag.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Etiqueta no encontrada' },
        { status: 404 }
      )
    }

    // Si se cambia el slug, verificar que no exista otro
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.productTag.findUnique({
        where: { slug: data.slug }
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'Ya existe una etiqueta con ese slug' },
          { status: 400 }
        )
      }
    }

    const tag = await prisma.productTag.update({
      where: { id },
      data: {
        ...data,
        startDate: data.startDate === null ? null : data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate === null ? null : data.endDate ? new Date(data.endDate) : undefined,
      }
    })

    return NextResponse.json(tag)
  } catch (error) {
    console.error('Error updating product tag:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar la etiqueta' },
      { status: 500 }
    )
  }
}

// DELETE /api/product-tags/[id] - Eliminar etiqueta
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // Verificar que existe
    const existing = await prisma.productTag.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Etiqueta no encontrada' },
        { status: 404 }
      )
    }

    await prisma.productTag.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Etiqueta eliminada' })
  } catch (error) {
    console.error('Error deleting product tag:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la etiqueta' },
      { status: 500 }
    )
  }
}
