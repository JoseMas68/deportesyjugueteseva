import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Esquema para acciones de helpful/not-helpful
const reviewActionSchema = z.object({
  action: z.enum(['helpful', 'not-helpful']),
});

// Esquema para actualización de moderación (solo campos permitidos)
const reviewUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  adminNotes: z.string().max(1000).optional(),
});

// GET /api/reviews/[id] - Obtener una reseña específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PATCH /api/reviews/[id] - Actualizar una reseña (para moderación o helpful votes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validar ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid review ID' },
        { status: 400 }
      );
    }

    // Intentar validar como acción de helpful/not-helpful
    const actionResult = reviewActionSchema.safeParse(body);
    if (actionResult.success) {
      const { action } = actionResult.data;

      if (action === 'helpful') {
        const review = await prisma.review.update({
          where: { id },
          data: {
            helpfulCount: {
              increment: 1,
            },
          },
        });
        return NextResponse.json(review);
      }

      if (action === 'not-helpful') {
        const review = await prisma.review.update({
          where: { id },
          data: {
            notHelpfulCount: {
              increment: 1,
            },
          },
        });
        return NextResponse.json(review);
      }
    }

    // Validar como actualización de moderación (solo campos permitidos)
    const updateResult = reviewUpdateSchema.safeParse(body);
    if (!updateResult.success) {
      return NextResponse.json(
        { error: 'Invalid update data. Only status and adminNotes can be updated.' },
        { status: 400 }
      );
    }

    // Solo permitir campos validados
    const review = await prisma.review.update({
      where: { id },
      data: updateResult.data,
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/reviews/[id] - Eliminar una reseña
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.review.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
