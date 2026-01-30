import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerSession } from '@/lib/customer-session';

// GET /api/customers/orders - Obtener pedidos del cliente autenticado
export async function GET() {
  try {
    // Verificar sesión del cliente
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
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
