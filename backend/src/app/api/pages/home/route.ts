import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Obtener la página marcada como home
export async function GET(request: NextRequest) {
  try {
    const page = await prisma.dynamicPage.findFirst({
      where: {
        isHomePage: true,
        isActive: true,
      },
      include: {
        blocks: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ page: null });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error fetching home page:', error);
    return NextResponse.json({ error: 'Error al obtener página de inicio' }, { status: 500 });
  }
}
