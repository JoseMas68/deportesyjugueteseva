import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { z } from 'zod';

// Schema de validación para actualizar página
const updatePageSchema = z.object({
  title: z.string().min(1, 'El título es requerido').optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones').optional(),
  description: z.string().optional().nullable(),
  metaTitle: z.string().optional().nullable(),
  metaDescription: z.string().optional().nullable(),
  metaImage: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isHomePage: z.boolean().optional(),
});

// GET - Obtener página por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    const page = await prisma.dynamicPage.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 });
    }

    return NextResponse.json({ page });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json({ error: 'Error al obtener página' }, { status: 500 });
  }
}

// PUT - Actualizar página
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updatePageSchema.parse(body);

    // Verificar que la página existe
    const existingPage = await prisma.dynamicPage.findUnique({
      where: { id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 });
    }

    // Si cambia el slug, verificar que no exista
    if (validated.slug && validated.slug !== existingPage.slug) {
      const slugExists = await prisma.dynamicPage.findUnique({
        where: { slug: validated.slug },
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Ya existe una página con este slug' },
          { status: 400 }
        );
      }
    }

    // Si se activa como home, desactivar otras
    if (validated.isHomePage && !existingPage.isHomePage) {
      await prisma.dynamicPage.updateMany({
        where: { isHomePage: true, id: { not: id } },
        data: { isHomePage: false },
      });
    }

    // Si se activa y no tenía fecha de publicación, añadirla
    const updateData: Record<string, unknown> = { ...validated };
    if (validated.isActive && !existingPage.publishedAt) {
      updateData.publishedAt = new Date();
    }

    const page = await prisma.dynamicPage.update({
      where: { id },
      data: updateData,
      include: {
        blocks: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    return NextResponse.json({ page });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Error al actualizar página' }, { status: 500 });
  }
}

// DELETE - Eliminar página
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = await params;

    // Verificar que existe
    const page = await prisma.dynamicPage.findUnique({
      where: { id },
    });

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 });
    }

    // Eliminar (los bloques se eliminan en cascada)
    await prisma.dynamicPage.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Página eliminada correctamente' });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Error al eliminar página' }, { status: 500 });
  }
}
