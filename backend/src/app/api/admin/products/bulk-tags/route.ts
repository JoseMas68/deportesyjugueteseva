import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkTagsSchema = z.object({
  productIds: z.array(z.string()).min(1, 'Se requiere al menos un producto'),
  tagIds: z.array(z.string()).min(1, 'Se requiere al menos una etiqueta'),
  action: z.enum(['add', 'remove', 'set']).default('add'),
})

// POST /api/admin/products/bulk-tags - Asignar etiquetas a multiples productos
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { productIds, tagIds, action } = bulkTagsSchema.parse(body)

    // Verificar que los productos existen
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true }
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: 'Algunos productos no existen' },
        { status: 400 }
      )
    }

    // Verificar que las etiquetas existen
    const tags = await prisma.productTag.findMany({
      where: { id: { in: tagIds } },
      select: { id: true, name: true }
    })

    if (tags.length !== tagIds.length) {
      return NextResponse.json(
        { error: 'Algunas etiquetas no existen' },
        { status: 400 }
      )
    }

    let updatedCount = 0

    if (action === 'set') {
      // Reemplazar todas las etiquetas de los productos seleccionados
      // Primero eliminar todas
      await prisma.productsOnTags.deleteMany({
        where: { productId: { in: productIds } }
      })

      // Luego crear las nuevas
      const newRelations = productIds.flatMap(productId =>
        tagIds.map(tagId => ({ productId, tagId }))
      )

      await prisma.productsOnTags.createMany({
        data: newRelations,
        skipDuplicates: true,
      })

      updatedCount = productIds.length
    } else if (action === 'add') {
      // Añadir etiquetas (sin duplicar)
      const newRelations = productIds.flatMap(productId =>
        tagIds.map(tagId => ({ productId, tagId }))
      )

      const result = await prisma.productsOnTags.createMany({
        data: newRelations,
        skipDuplicates: true,
      })

      updatedCount = result.count
    } else if (action === 'remove') {
      // Quitar etiquetas
      const result = await prisma.productsOnTags.deleteMany({
        where: {
          productId: { in: productIds },
          tagId: { in: tagIds },
        }
      })

      updatedCount = result.count
    }

    const tagNames = tags.map(t => t.name).join(', ')
    const actionText = action === 'add' ? 'añadidas' : action === 'remove' ? 'quitadas' : 'establecidas'

    return NextResponse.json({
      success: true,
      message: `Etiquetas ${actionText} correctamente a ${productIds.length} producto(s)`,
      updatedCount,
    })
  } catch (error) {
    console.error('Error bulk updating tags:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar etiquetas' },
      { status: 500 }
    )
  }
}
