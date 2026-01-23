import { NextResponse } from 'next/server';
import { getCustomerSession, refreshCustomerSession } from '@/lib/customer-session';
import { prisma } from '@/lib/prisma';

// GET /api/customers/auth/session - Obtener sesión actual del cliente
export async function GET() {
  try {
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        customer: null,
      });
    }

    // Obtener datos completos del cliente
    const customer = await prisma.customer.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        gender: true,
        taxId: true,
        birthDate: true,
        isVip: true,
        loyaltyPoints: true,
        acceptsMarketing: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json({
        authenticated: false,
        customer: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      customer,
    });
  } catch (error) {
    console.error('Error getting session:', error);
    return NextResponse.json({
      authenticated: false,
      customer: null,
      error: 'Error al obtener sesión',
    });
  }
}

// POST /api/customers/auth/session - Refrescar sesión (extender expiración)
export async function POST() {
  try {
    const refreshed = await refreshCustomerSession();

    if (!refreshed) {
      return NextResponse.json({
        success: false,
        message: 'No hay sesión activa para refrescar',
      }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      message: 'Sesión refrescada exitosamente',
    });
  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json({
      success: false,
      error: 'Error al refrescar sesión',
    }, { status: 500 });
  }
}
