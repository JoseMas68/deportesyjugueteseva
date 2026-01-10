import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const sportType = searchParams.get('sportType')
    const productType = searchParams.get('productType')
    const collectionType = searchParams.get('collectionType')
    const isFeatured = searchParams.get('featured')
    const isNew = searchParams.get('new')
    const isBestSeller = searchParams.get('bestseller')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const search = searchParams.get('search')
    const brand = searchParams.get('brand')
    const color = searchParams.get('color')
    const inStock = searchParams.get('inStock')
    const sortBy = searchParams.get('sort')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {
      isActive: true,
      AND: [
        {
          OR: [
            { publishedAt: null },
            { publishedAt: { lte: new Date() } },
          ],
        },
      ],
    }

    if (category) {
      where.category = { slug: category }
    }

    if (sportType) {
      // Soportar múltiples tipos de deporte separados por coma
      const sportTypes = sportType.split(',').map(s => s.trim()).filter(Boolean)
      if (sportTypes.length === 1) {
        where.sportType = sportTypes[0]
      } else if (sportTypes.length > 1) {
        where.sportType = { in: sportTypes }
      }
    }

    if (productType) {
      // Soportar múltiples tipos de producto separados por coma
      const productTypes = productType.split(',').map(p => p.trim()).filter(Boolean)
      if (productTypes.length === 1) {
        where.productType = productTypes[0]
      } else if (productTypes.length > 1) {
        where.productType = { in: productTypes }
      }
    }

    if (collectionType) {
      // Soportar múltiples tipos de colección separados por coma
      const collectionTypes = collectionType.split(',').map(c => c.trim()).filter(Boolean)
      if (collectionTypes.length === 1) {
        where.collectionType = collectionTypes[0]
      } else if (collectionTypes.length > 1) {
        where.collectionType = { in: collectionTypes }
      }
    }

    if (isFeatured === 'true') {
      where.isFeatured = true
    }

    if (isNew === 'true') {
      where.isNew = true
    }

    if (isBestSeller === 'true') {
      where.isBestSeller = true
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice)
      if (maxPrice) where.price.lte = parseFloat(maxPrice)
    }

    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { name: { contains: search, mode: 'insensitive' } } },
        ],
      })
    }

    if (brand) {
      // Soportar múltiples marcas separadas por coma (usando slug de la marca)
      const brandSlugs = brand.split(',').map(b => b.trim()).filter(Boolean)
      if (brandSlugs.length === 1) {
        where.brand = { slug: brandSlugs[0] }
      } else if (brandSlugs.length > 1) {
        where.brand = { slug: { in: brandSlugs } }
      }
    }

    if (color) {
      // Soportar múltiples colores separados por coma
      const colors = color.split(',').map(c => c.trim()).filter(Boolean)
      if (colors.length === 1) {
        where.color = { equals: colors[0], mode: 'insensitive' }
      } else if (colors.length > 1) {
        where.AND.push({
          OR: colors.map(c => ({ color: { equals: c, mode: 'insensitive' } }))
        })
      }
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 }
    }

    // Determinar ordenación
    let orderBy: any = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]
    if (sortBy === 'price_asc') {
      orderBy = [{ price: 'asc' }]
    } else if (sortBy === 'price_desc') {
      orderBy = [{ price: 'desc' }]
    } else if (sortBy === 'newest') {
      orderBy = [{ createdAt: 'desc' }]
    } else if (sortBy === 'bestseller') {
      orderBy = [{ isBestSeller: 'desc' }, { createdAt: 'desc' }]
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({
      products,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { error: 'Error fetching products' },
      { status: 500 }
    )
  }
}
