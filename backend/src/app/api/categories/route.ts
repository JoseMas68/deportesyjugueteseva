import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const featured = searchParams.get('featured')

    // Si se pide featured, devolver solo subcategorías destacadas
    if (featured === 'true') {
      const featuredCategories = await prisma.category.findMany({
        where: {
          isActive: true,
          isFeatured: true,
          parentId: { not: null }, // Solo subcategorías
        },
        include: {
          parent: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { displayOrder: 'asc' },
      })

      return NextResponse.json({
        categories: featuredCategories,
      })
    }

    // Comportamiento normal: todas las categorías
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    })

    // Agrupar por sección para el megamenu
    const grouped = categories.reduce((acc, cat) => {
      if (!cat.parentId) {
        const section = cat.menuSection || 'otros'
        if (!acc[section]) acc[section] = []
        acc[section].push(cat)
      }
      return acc
    }, {} as Record<string, typeof categories>)

    return NextResponse.json({
      categories,
      grouped,
    })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error fetching categories' },
      { status: 500 }
    )
  }
}
