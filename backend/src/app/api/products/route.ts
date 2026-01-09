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
      where.sportType = sportType
    }

    if (productType) {
      where.productType = productType
    }

    if (collectionType) {
      where.collectionType = collectionType
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
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      })
    }

    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' }
    }

    if (color) {
      where.color = { equals: color, mode: 'insensitive' }
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
