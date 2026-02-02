import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateCategorySchema = z.object({
  description: z.string().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Obtener categoria por ID
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

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: { id: true, name: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Error al obtener categoria' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar categoria (solo descripcion, imagen, y estado)
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
    const validated = updateCategorySchema.parse(body)

    // Verificar que la categoria existe
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Categoria no encontrada' },
        { status: 404 }
      )
    }

    // Preparar datos de actualizacion
    const updateData: Record<string, unknown> = {}

    if (validated.description !== undefined) {
      updateData.description = validated.description || null
    }

    if (validated.imageUrl !== undefined) {
      updateData.imageUrl = validated.imageUrl || null
    }

    if (validated.isActive !== undefined) {
      updateData.isActive = validated.isActive
    }

    if (validated.isFeatured !== undefined) {
      updateData.isFeatured = validated.isFeatured
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar categoria' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar categoria (soft delete si tiene productos)
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

    // Verificar que la categoria existe
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        _count: { select: { products: true } },
      },
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Categoria no encontrada' },
        { status: 404 }
      )
    }

    // No permitir eliminar si tiene subcategorías
    if (category.children.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar una categoria con subcategorias. Elimina primero las subcategorias.' },
        { status: 400 }
      )
    }

    // Si tiene productos, hacer soft delete (desactivar)
    if (category._count.products > 0) {
      await prisma.category.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json({
        success: true,
        message: `Categoria desactivada (tiene ${category._count.products} productos asociados)`,
        softDelete: true,
      })
    }

    // Si no tiene productos, eliminar permanentemente
    await prisma.category.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Categoria eliminada permanentemente',
      softDelete: false,
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoria' },
      { status: 500 }
    )
  }
}
