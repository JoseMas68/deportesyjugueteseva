import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifySessionToken } from '@/lib/customer-session';

// GET /api/customers/orders - Obtener pedidos del cliente autenticado
export async function GET(request: NextRequest) {
  try {
    // Obtener token del header Authorization
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar token
    const session = await verifySessionToken(token);

    if (!session) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const orders = await prisma.order.findMany({
      where: {
        userEmail: session.email.toLowerCase(),
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
