import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reviews/[id] - Obtener una reseña específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
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
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, ...updateData } = body;

    // Si es una acción de helpful/not helpful
    if (action === 'helpful') {
      const review = await prisma.review.update({
        where: { id: params.id },
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
        where: { id: params.id },
        data: {
          notHelpfulCount: {
            increment: 1,
          },
        },
      });
      return NextResponse.json(review);
    }

    // Actualización general (requiere autenticación admin en producción)
    const review = await prisma.review.update({
      where: { id: params.id },
      data: updateData,
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
  { params }: { params: { id: string } }
) {
  try {
    await prisma.review.delete({
      where: { id: params.id },
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
