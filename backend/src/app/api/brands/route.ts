import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/brands - Obtener todas las marcas activas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')

    // Si se pasa una categoría, solo devolver marcas que tienen productos en esa categoría
    let where: any = { isActive: true }

    if (categorySlug) {
      // Buscar marcas que tienen al menos un producto en esta categoría
      const brandsWithProducts = await prisma.brand.findMany({
        where: {
          isActive: true,
          products: {
            some: {
              isActive: true,
              category: {
                OR: [
                  { slug: categorySlug },
                  { parent: { slug: categorySlug } }
                ]
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return NextResponse.json(brandsWithProducts)
    }

    // Sin filtro de categoría, devolver todas las marcas activas
    const brands = await prisma.brand.findMany({
      where,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { error: 'Error al obtener las marcas' },
      { status: 500 }
    )
  }
}
