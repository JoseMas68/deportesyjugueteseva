import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// GET /api/admin/brands/[id] - Obtener una marca
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const brand = await prisma.brand.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true }
        }
      }
    })

    if (!brand) {
      return NextResponse.json(
        { error: 'Marca no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error fetching brand:', error)
    return NextResponse.json(
      { error: 'Error al obtener la marca' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/brands/[id] - Actualizar marca
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, logoUrl, isActive } = body

    const existing = await prisma.brand.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Marca no encontrada' },
        { status: 404 }
      )
    }

    const data: any = {}

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: 'El nombre es obligatorio' },
          { status: 400 }
        )
      }

      // Verificar que el nuevo nombre no exista en otra marca
      const duplicate = await prisma.brand.findFirst({
        where: {
          id: { not: id },
          OR: [
            { name: { equals: name.trim(), mode: 'insensitive' } },
            { slug: slugify(name.trim()) }
          ]
        }
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Ya existe otra marca con ese nombre' },
          { status: 400 }
        )
      }

      data.name = name.trim()
      data.slug = slugify(name.trim())
    }

    if (logoUrl !== undefined) {
      data.logoUrl = logoUrl || null
    }

    if (isActive !== undefined) {
      data.isActive = isActive
    }

    const brand = await prisma.brand.update({
      where: { id },
      data
    })

    return NextResponse.json(brand)
  } catch (error) {
    console.error('Error updating brand:', error)
    return NextResponse.json(
      { error: 'Error al actualizar la marca' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/brands/[id] - Eliminar marca
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar si tiene productos asociados
    const productsCount = await prisma.product.count({
      where: { brandId: id }
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: hay ${productsCount} producto(s) con esta marca` },
        { status: 400 }
      )
    }

    await prisma.brand.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json(
      { error: 'Error al eliminar la marca' },
      { status: 500 }
    )
  }
}
