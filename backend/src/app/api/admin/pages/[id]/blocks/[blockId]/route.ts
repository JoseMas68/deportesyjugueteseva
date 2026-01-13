import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { z } from 'zod';

// Esquemas de configuración por tipo de bloque
const heroConfigSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  backgroundImage: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.enum(['light', 'dark']).default('dark'),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional(),
  ctaStyle: z.enum(['primary', 'secondary', 'outline']).default('primary'),
  alignment: z.enum(['left', 'center', 'right']).default('center'),
  height: z.enum(['small', 'medium', 'large', 'full']).default('medium'),
});

const productSliderConfigSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.enum(['category', 'manual', 'featured', 'new', 'bestseller', 'offers']),
  categoryId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  limit: z.number().min(1).max(20).default(8),
  accentColor: z.enum(['primary', 'accent']).default('primary'),
  linkUrl: z.string().optional(),
  linkText: z.string().optional(),
});

const bentoGridConfigSchema = z.object({
  title: z.string().optional(),
  source: z.enum(['categories', 'products']),
  categoryIds: z.array(z.string()).optional(),
  categoryId: z.string().optional(),
  productIds: z.array(z.string()).optional(),
  layout: z.enum(['2x2', '3x3', '1-2-1', '2-1-2', 'masonry']).default('2x2'),
  showTitles: z.boolean().default(true),
  showPrices: z.boolean().default(true),
});

// Schema para actualizar bloque
const updateBlockSchema = z.object({
  title: z.string().optional().nullable(),
  config: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

// GET - Obtener bloque
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { blockId } = await params;

    const block = await prisma.pageBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      return NextResponse.json({ error: 'Bloque no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ block });
  } catch (error) {
    console.error('Error fetching block:', error);
    return NextResponse.json({ error: 'Error al obtener bloque' }, { status: 500 });
  }
}

// PUT - Actualizar bloque
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { blockId } = await params;
    const body = await request.json();
    const validated = updateBlockSchema.parse(body);

    // Verificar que el bloque existe
    const existingBlock = await prisma.pageBlock.findUnique({
      where: { id: blockId },
    });

    if (!existingBlock) {
      return NextResponse.json({ error: 'Bloque no encontrado' }, { status: 404 });
    }

    // Si se actualiza la configuración, validar según el tipo
    let validatedConfig = existingBlock.config;
    if (validated.config) {
      switch (existingBlock.type) {
        case 'hero':
          validatedConfig = heroConfigSchema.parse(validated.config);
          break;
        case 'product-slider':
          validatedConfig = productSliderConfigSchema.parse(validated.config);
          break;
        case 'bento-grid':
          validatedConfig = bentoGridConfigSchema.parse(validated.config);
          break;
      }
    }

    const block = await prisma.pageBlock.update({
      where: { id: blockId },
      data: {
        ...(validated.title !== undefined && { title: validated.title }),
        ...(validated.config && { config: validatedConfig }),
        ...(validated.isActive !== undefined && { isActive: validated.isActive }),
      },
    });

    return NextResponse.json({ block });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating block:', error);
    return NextResponse.json({ error: 'Error al actualizar bloque' }, { status: 500 });
  }
}

// DELETE - Eliminar bloque
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { blockId } = await params;

    // Verificar que existe
    const block = await prisma.pageBlock.findUnique({
      where: { id: blockId },
    });

    if (!block) {
      return NextResponse.json({ error: 'Bloque no encontrado' }, { status: 404 });
    }

    await prisma.pageBlock.delete({
      where: { id: blockId },
    });

    return NextResponse.json({ message: 'Bloque eliminado correctamente' });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json({ error: 'Error al eliminar bloque' }, { status: 500 });
  }
}
