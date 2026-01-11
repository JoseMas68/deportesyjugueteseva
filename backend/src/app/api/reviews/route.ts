import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/reviews?productId=xxx - Obtener reseñas de un producto
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const status = searchParams.get('status') || 'approved'; // Por defecto solo aprobadas

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        pros: true,
        cons: true,
        authorName: true,
        isVerified: true,
        helpfulCount: true,
        notHelpfulCount: true,
        images: true,
        createdAt: true,
      },
    });

    // Calcular estadísticas
    const stats = await prisma.review.aggregate({
      where: {
        productId,
        status: 'approved',
      },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    // Distribución de ratings
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        productId,
        status: 'approved',
      },
      _count: {
        id: true,
      },
    });

    const distribution = [1, 2, 3, 4, 5].map((rating) => {
      const found = ratingDistribution.find((r) => r.rating === rating);
      return {
        rating,
        count: found?._count.id || 0,
      };
    });

    return NextResponse.json({
      reviews,
      stats: {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id || 0,
        distribution,
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Crear una nueva reseña
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      customerId,
      authorName,
      authorEmail,
      rating,
      title,
      comment,
      pros,
      cons,
      orderId,
      images = [],
    } = body;

    // Validaciones
    if (!productId || !authorName || !authorEmail || !rating || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Verificar si es una compra verificada
    let isVerified = false;
    if (orderId) {
      const order = await prisma.order.findFirst({
        where: {
          id: orderId,
          userEmail: authorEmail,
          status: 'DELIVERED',
          items: {
            some: {
              productId,
            },
          },
        },
      });
      isVerified = !!order;
    }

    // Crear la reseña
    const review = await prisma.review.create({
      data: {
        productId,
        customerId: customerId || null,
        authorName,
        authorEmail,
        rating,
        title: title || null,
        comment,
        pros: pros || null,
        cons: cons || null,
        orderId: orderId || null,
        isVerified,
        status: 'pending', // Requiere moderación
        images,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
