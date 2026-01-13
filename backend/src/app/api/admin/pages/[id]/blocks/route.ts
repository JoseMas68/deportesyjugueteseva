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

// Schema general para crear bloque
const createBlockSchema = z.object({
  type: z.enum(['hero', 'product-slider', 'bento-grid']),
  title: z.string().optional(),
  config: z.record(z.unknown()),
  isActive: z.boolean().optional().default(true),
});

// Schema para reordenar bloques
const reorderBlocksSchema = z.object({
  blockIds: z.array(z.string()),
});

// POST - Crear bloque
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: pageId } = await params;
    const body = await request.json();
    const validated = createBlockSchema.parse(body);

    // Verificar que la página existe
    const page = await prisma.dynamicPage.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 });
    }

    // Validar config según el tipo
    let validatedConfig;
    switch (validated.type) {
      case 'hero':
        validatedConfig = heroConfigSchema.parse(validated.config);
        break;
      case 'product-slider':
        validatedConfig = productSliderConfigSchema.parse(validated.config);
        break;
      case 'bento-grid':
        validatedConfig = bentoGridConfigSchema.parse(validated.config);
        break;
      default:
        return NextResponse.json({ error: 'Tipo de bloque no válido' }, { status: 400 });
    }

    // Obtener el último orden
    const lastBlock = await prisma.pageBlock.findFirst({
      where: { pageId },
      orderBy: { displayOrder: 'desc' },
    });

    const displayOrder = lastBlock ? lastBlock.displayOrder + 1 : 0;

    const block = await prisma.pageBlock.create({
      data: {
        pageId,
        type: validated.type,
        title: validated.title,
        config: validatedConfig,
        displayOrder,
        isActive: validated.isActive ?? true,
      },
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating block:', error);
    return NextResponse.json({ error: 'Error al crear bloque' }, { status: 500 });
  }
}

// PUT - Reordenar bloques
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id: pageId } = await params;
    const body = await request.json();
    const validated = reorderBlocksSchema.parse(body);

    // Verificar que la página existe
    const page = await prisma.dynamicPage.findUnique({
      where: { id: pageId },
    });

    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 404 });
    }

    // Actualizar el orden de cada bloque
    const updates = validated.blockIds.map((blockId, index) =>
      prisma.pageBlock.update({
        where: { id: blockId },
        data: { displayOrder: index },
      })
    );

    await prisma.$transaction(updates);

    // Obtener bloques actualizados
    const blocks = await prisma.pageBlock.findMany({
      where: { pageId },
      orderBy: { displayOrder: 'asc' },
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error reordering blocks:', error);
    return NextResponse.json({ error: 'Error al reordenar bloques' }, { status: 500 });
  }
}
