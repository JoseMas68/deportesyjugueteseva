import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema para variante
const variantSchema = z.object({
  id: z.string().optional(),
  size: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  colorHex: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

// Schema de validacion para actualizar producto
const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).optional(),
  sku: z.string().optional(),
  categoryId: z.string().optional(),
  images: z.array(z.string()).optional(),
  thumbnailUrl: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isActive: z.boolean().optional(),
  hasVariants: z.boolean().optional(),
  variants: z.array(variantSchema).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Obtener producto por ID
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

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      product: {
        ...product,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        variants: product.variants.map(v => ({
          ...v,
          price: v.price ? Number(v.price) : null,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Error al obtener producto' },
      { status: 500 }
    )
  }
}

// PUT - Actualizar producto
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
    const validated = updateProductSchema.parse(body)

    // Verificar que el producto existe
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { variants: true }
    })
    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Si se cambia el slug, verificar que no exista
    if (validated.slug && validated.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: validated.slug },
      })
      if (slugExists) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese slug' },
          { status: 400 }
        )
      }
    }

    // Preparar datos para actualizar (sin variantes)
    const { variants: newVariants, ...productData } = validated

    // Calcular stock total si tiene variantes
    if (validated.hasVariants && newVariants?.length) {
      productData.stock = newVariants.reduce((sum, v) => sum + (v.stock || 0), 0)
    }

    // Actualizar producto
    const product = await prisma.product.update({
      where: { id },
      data: productData,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
      },
    })

    // Manejar variantes si se proporcionan
    if (newVariants !== undefined && validated.hasVariants) {
      // IDs de variantes existentes del producto
      const existingVariantIds = existing.variants.map(v => v.id)
      // IDs de variantes en la actualizacion (solo las que tienen id)
      const newVariantIds = newVariants.filter(v => v.id).map(v => v.id!)

      // Eliminar variantes que ya no estan
      const variantsToDelete = existingVariantIds.filter(existingId => !newVariantIds.includes(existingId))
      if (variantsToDelete.length > 0) {
        await prisma.productVariant.deleteMany({
          where: { id: { in: variantsToDelete } }
        })
      }

      // Verificar SKUs duplicados en las nuevas variantes (sin id)
      const newVariantsWithoutId = newVariants.filter(v => !v.id && v.sku)
      if (newVariantsWithoutId.length > 0) {
        const skusToCheck = newVariantsWithoutId.map(v => v.sku!).filter(Boolean)
        if (skusToCheck.length > 0) {
          const existingSkus = await prisma.productVariant.findMany({
            where: { sku: { in: skusToCheck } },
            select: { sku: true }
          })
          if (existingSkus.length > 0) {
            return NextResponse.json(
              { error: `SKU duplicado: ${existingSkus.map(s => s.sku).join(', ')}` },
              { status: 400 }
            )
          }
        }
      }

      // Actualizar o crear variantes
      for (const variant of newVariants) {
        // Verificar si la variante existe en la base de datos
        const existingVariant = variant.id
          ? await prisma.productVariant.findUnique({ where: { id: variant.id } })
          : null

        if (existingVariant) {
          // Actualizar existente
          await prisma.productVariant.update({
            where: { id: variant.id },
            data: {
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
              material: variant.material,
              price: variant.price,
              stock: variant.stock,
              sku: variant.sku || null,
              imageUrl: variant.imageUrl,
              isActive: variant.isActive,
            }
          })
        } else {
          // Crear nueva (sin id o con id que no existe)
          await prisma.productVariant.create({
            data: {
              productId: id,
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
              material: variant.material,
              price: variant.price,
              stock: variant.stock,
              sku: variant.sku || null,
              imageUrl: variant.imageUrl,
              isActive: variant.isActive,
            }
          })
        }
      }
    } else if (validated.hasVariants === false) {
      // Si se desactivan las variantes, eliminar todas
      await prisma.productVariant.deleteMany({
        where: { productId: id }
      })
    }

    // Obtener producto actualizado con variantes
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        brand: {
          select: { id: true, name: true, slug: true },
        },
        variants: true,
      },
    })

    return NextResponse.json({
      product: {
        ...updatedProduct!,
        price: Number(updatedProduct!.price),
        compareAtPrice: updatedProduct!.compareAtPrice ? Number(updatedProduct!.compareAtPrice) : null,
        variants: updatedProduct!.variants.map(v => ({
          ...v,
          price: v.price ? Number(v.price) : null,
        })),
      },
    })
  } catch (error) {
    console.error('Error updating product:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar producto' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar producto (soft delete)
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

    // Verificar que el producto existe
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si tiene pedidos asociados
    const ordersCount = await prisma.orderItem.count({
      where: { productId: id },
    })

    if (ordersCount > 0) {
      // Soft delete: desactivar en lugar de eliminar
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      })

      return NextResponse.json({
        success: true,
        message: 'Producto desactivado (tiene pedidos asociados)',
      })
    }

    // Hard delete si no tiene pedidos (las variantes se eliminan en cascada)
    await prisma.product.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Producto eliminado',
    })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto' },
      { status: 500 }
    )
  }
}
