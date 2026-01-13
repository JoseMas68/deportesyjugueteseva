import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { z } from 'zod';

// Schema de validación para crear página
const createPageSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaImage: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(false),
  isHomePage: z.boolean().optional().default(false),
});

// GET - Listar páginas
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const skip = (page - 1) * limit;

    // Construir filtros
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    const [pages, total] = await Promise.all([
      prisma.dynamicPage.findMany({
        where,
        include: {
          blocks: {
            select: {
              id: true,
              type: true,
              title: true,
            },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.dynamicPage.count({ where }),
    ]);

    return NextResponse.json({
      pages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Error al obtener páginas' }, { status: 500 });
  }
}

// POST - Crear página
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createPageSchema.parse(body);

    // Verificar slug único
    const existingPage = await prisma.dynamicPage.findUnique({
      where: { slug: validated.slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: 'Ya existe una página con este slug' },
        { status: 400 }
      );
    }

    // Si es página de inicio, quitar el flag de otras
    if (validated.isHomePage) {
      await prisma.dynamicPage.updateMany({
        where: { isHomePage: true },
        data: { isHomePage: false },
      });
    }

    const page = await prisma.dynamicPage.create({
      data: {
        ...validated,
        publishedAt: validated.isActive ? new Date() : null,
      },
      include: {
        blocks: true,
      },
    });

    return NextResponse.json({ page }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Error al crear página' }, { status: 500 });
  }
}
