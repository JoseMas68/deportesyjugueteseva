import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/admin/products/[id]/tags - Obtener tags de un producto
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    const tags = product.tags.map(t => t.tag)
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error fetching product tags:', error)
    return NextResponse.json(
      { error: 'Error al obtener los tags del producto' },
      { status: 500 }
    )
  }
}

// Schema para asignar tags
const assignTagsSchema = z.object({
  tagIds: z.array(z.string())
})

// PUT /api/admin/products/[id]/tags - Reemplazar todos los tags de un producto
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { tagIds } = assignTagsSchema.parse(body)

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Eliminar todos los tags actuales y añadir los nuevos
    await prisma.$transaction([
      prisma.productsOnTags.deleteMany({
        where: { productId: id }
      }),
      prisma.productsOnTags.createMany({
        data: tagIds.map(tagId => ({
          productId: id,
          tagId
        }))
      })
    ])

    // Obtener los tags actualizados
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    })

    const tags = updatedProduct?.tags.map(t => t.tag) || []
    return NextResponse.json(tags)
  } catch (error) {
    console.error('Error updating product tags:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar los tags del producto' },
      { status: 500 }
    )
  }
}

// POST /api/admin/products/[id]/tags - Añadir un tag a un producto
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { tagId } = z.object({ tagId: z.string() }).parse(body)

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el tag existe
    const tag = await prisma.productTag.findUnique({
      where: { id: tagId }
    })

    if (!tag) {
      return NextResponse.json(
        { error: 'Etiqueta no encontrada' },
        { status: 404 }
      )
    }

    // Crear la relación (upsert para evitar duplicados)
    await prisma.productsOnTags.upsert({
      where: {
        productId_tagId: {
          productId: id,
          tagId
        }
      },
      create: {
        productId: id,
        tagId
      },
      update: {}
    })

    return NextResponse.json({ success: true, message: 'Tag añadido al producto' })
  } catch (error) {
    console.error('Error adding tag to product:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al añadir el tag al producto' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id]/tags - Eliminar un tag de un producto
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tagId = searchParams.get('tagId')

    if (!tagId) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro tagId' },
        { status: 400 }
      )
    }

    await prisma.productsOnTags.delete({
      where: {
        productId_tagId: {
          productId: id,
          tagId
        }
      }
    })

    return NextResponse.json({ success: true, message: 'Tag eliminado del producto' })
  } catch (error) {
    console.error('Error removing tag from product:', error)
    return NextResponse.json(
      { error: 'Error al eliminar el tag del producto' },
      { status: 500 }
    )
  }
}
