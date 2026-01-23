import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/pos/products - Buscar productos por código de barras o nombre
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const barcode = searchParams.get('barcode')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Búsqueda por código de barras (exacta)
    if (barcode) {
      // Primero buscar en productos
      const product = await prisma.product.findFirst({
        where: {
          barcode,
          isActive: true,
        },
        include: {
          brand: { select: { name: true } },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              size: true,
              color: true,
              colorHex: true,
              price: true,
              stock: true,
              barcode: true,
            },
          },
        },
      })

      if (product) {
        return NextResponse.json({
          product: {
            id: product.id,
            name: product.name,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            stock: product.stock,
            barcode: product.barcode,
            sku: product.sku,
            thumbnailUrl: product.thumbnailUrl,
            brand: product.brand?.name,
            hasVariants: product.hasVariants,
            variants: product.variants.map(v => ({
              ...v,
              price: v.price ? Number(v.price) : null,
            })),
          },
        })
      }

      // Si no se encuentra en productos, buscar en variantes
      const variant = await prisma.productVariant.findFirst({
        where: {
          barcode,
          isActive: true,
          product: { isActive: true },
        },
        include: {
          product: {
            include: {
              brand: { select: { name: true } },
            },
          },
        },
      })

      if (variant) {
        return NextResponse.json({
          product: {
            id: variant.product.id,
            variantId: variant.id,
            name: variant.product.name,
            variantInfo: [variant.size, variant.color].filter(Boolean).join(' - '),
            price: variant.price ? Number(variant.price) : Number(variant.product.price),
            compareAtPrice: variant.product.compareAtPrice ? Number(variant.product.compareAtPrice) : null,
            stock: variant.stock,
            barcode: variant.barcode,
            sku: variant.sku || variant.product.sku,
            thumbnailUrl: variant.imageUrl || variant.product.thumbnailUrl,
            brand: variant.product.brand?.name,
            hasVariants: true,
            selectedVariant: {
              id: variant.id,
              size: variant.size,
              color: variant.color,
              colorHex: variant.colorHex,
            },
          },
        })
      }

      return NextResponse.json({ product: null })
    }

    // Búsqueda por texto (nombre, SKU)
    if (search && search.length >= 2) {
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
          ],
        },
        include: {
          brand: { select: { name: true } },
          variants: {
            where: { isActive: true },
            select: {
              id: true,
              size: true,
              color: true,
              colorHex: true,
              price: true,
              stock: true,
              barcode: true,
            },
          },
        },
        take: limit,
        orderBy: { name: 'asc' },
      })

      return NextResponse.json({
        products: products.map(p => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
          stock: p.stock,
          barcode: p.barcode,
          sku: p.sku,
          thumbnailUrl: p.thumbnailUrl,
          brand: p.brand?.name,
          hasVariants: p.hasVariants,
          variants: p.variants.map(v => ({
            ...v,
            price: v.price ? Number(v.price) : null,
          })),
        })),
      })
    }

    return NextResponse.json({ products: [] })
  } catch (error) {
    console.error('Error searching products:', error)
    return NextResponse.json(
      { error: 'Error al buscar productos' },
      { status: 500 }
    )
  }
}
