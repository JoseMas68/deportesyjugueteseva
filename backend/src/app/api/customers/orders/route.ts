import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/customers/orders?email=xxx - Obtener pedidos de un cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userEmail: email.toLowerCase(),
      },
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            productImage: true,
            quantity: true,
            unitPrice: true,
            totalPrice: true,
            variantSize: true,
            variantColor: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
