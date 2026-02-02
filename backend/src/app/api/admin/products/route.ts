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

// Schema de validacion para crear producto
const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser mayor a 0'),
  compareAtPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  sku: z.string().optional(),
  barcode: z.string().optional(), // Código de barras EAN-13
  categoryId: z.string().min(1, 'La categoria es obligatoria'),
  images: z.array(z.string()).default([]),
  thumbnailUrl: z.string().optional().nullable(),
  brandId: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isActive: z.boolean().default(true),
  hasVariants: z.boolean().default(false),
  variants: z.array(variantSchema).optional(),
  tagIds: z.array(z.string()).optional(),
})

// GET - Listar productos
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || '' // active, inactive, all
    const stock = searchParams.get('stock') || '' // low, out, all

    const skip = (page - 1) * limit

    // Construir filtros
    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    if (category) {
      where.categoryId = category
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (stock === 'low') {
      where.stock = { lt: 5, gt: 0 }
    } else if (stock === 'out') {
      where.stock = 0
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          brand: {
            select: { id: true, name: true, slug: true },
          },
          variants: true,
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip,
      }),
      prisma.product.count({ where }),
    ])

    // Convertir Decimals a numbers
    const formattedProducts = products.map(p => ({
      ...p,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      variants: p.variants.map(v => ({
        ...v,
        price: v.price ? Number(v.price) : null,
      })),
    }))

    return NextResponse.json({
      products: formattedProducts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}

// POST - Crear producto
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createProductSchema.parse(body)

    // Generar slug si no se proporciona
    const slug = validated.slug || generateSlug(validated.name)

    // Verificar que el slug no exista
    const existing = await prisma.product.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un producto con ese slug' },
        { status: 400 }
      )
    }

    // Generar SKU único
    let sku: string
    if (validated.sku && validated.sku.trim()) {
      sku = validated.sku.trim()
      // Verificar que no exista
      const skuExists = await prisma.product.findUnique({ where: { sku } })
      if (skuExists) {
        return NextResponse.json(
          { error: `El SKU "${sku}" ya existe` },
          { status: 400 }
        )
      }
    } else {
      // Generar SKU único con timestamp
      sku = `EVA-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    }
    console.log('SKU final:', sku)

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description || '',
        price: validated.price,
        compareAtPrice: validated.compareAtPrice,
        sku,
        barcode: validated.barcode && validated.barcode.trim() ? validated.barcode.trim() : null,
        categoryId: validated.categoryId,
        images: validated.images,
        thumbnailUrl: validated.thumbnailUrl || validated.images[0] || null,
        brandId: validated.brandId || null,
        isFeatured: validated.isFeatured,
        isNew: validated.isNew,
        isBestSeller: validated.isBestSeller,
        isActive: validated.isActive,
        hasVariants: validated.hasVariants,
        // Si tiene variantes, el stock es la suma de las variantes
        stock: validated.hasVariants && validated.variants?.length
          ? validated.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
          : validated.stock,
        variants: validated.hasVariants && validated.variants?.length
          ? {
              create: validated.variants.map(v => ({
                size: v.size || null,
                color: v.color || null,
                colorHex: v.colorHex || null,
                material: v.material || null,
                price: v.price,
                stock: v.stock,
                sku: v.sku && v.sku.trim() ? v.sku.trim() : null,
                imageUrl: v.imageUrl || null,
                isActive: v.isActive,
              })),
            }
          : undefined,
        tags: validated.tagIds?.length
          ? {
              create: validated.tagIds.map(tagId => ({
                tagId,
              })),
            }
          : undefined,
      },
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
    console.error('Error creating product:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear producto' },
      { status: 500 }
    )
  }
}

// Funciones auxiliares
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

async function generateSku(): Promise<string> {
  // Buscar todos los SKUs que empiezan con EVA-
  const products = await prisma.product.findMany({
    where: {
      sku: { startsWith: 'EVA-' }
    },
    select: { sku: true }
  })

  // Encontrar el número más alto
  let maxNumber = 0
  for (const p of products) {
    if (p.sku) {
      const match = p.sku.match(/EVA-(\d+)/)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNumber) maxNumber = num
      }
    }
  }

  // El siguiente número
  const nextNumber = maxNumber + 1
  return `EVA-${nextNumber.toString().padStart(6, '0')}`
}
