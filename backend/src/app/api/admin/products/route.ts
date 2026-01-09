import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validacion para crear producto
const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  slug: z.string().optional(),
  description: z.string().optional(),
  price: z.number().positive('El precio debe ser mayor a 0'),
  compareAtPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0, 'El stock no puede ser negativo'),
  sku: z.string().optional(),
  categoryId: z.string().min(1, 'La categoria es obligatoria'),
  images: z.array(z.string()).default([]),
  thumbnailUrl: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isActive: z.boolean().default(true),
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
        { brand: { contains: search, mode: 'insensitive' } },
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

    // Generar SKU si no se proporciona
    const sku = validated.sku || await generateSku()

    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug,
        description: validated.description || '',
        price: validated.price,
        compareAtPrice: validated.compareAtPrice,
        stock: validated.stock,
        sku,
        categoryId: validated.categoryId,
        images: validated.images,
        thumbnailUrl: validated.thumbnailUrl || validated.images[0] || null,
        brand: validated.brand,
        isFeatured: validated.isFeatured,
        isNew: validated.isNew,
        isBestSeller: validated.isBestSeller,
        isActive: validated.isActive,
      },
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json({
      product: {
        ...product,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
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
  const count = await prisma.product.count()
  const number = (count + 1).toString().padStart(6, '0')
  return `EVA-${number}`
}
