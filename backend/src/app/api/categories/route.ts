import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
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
