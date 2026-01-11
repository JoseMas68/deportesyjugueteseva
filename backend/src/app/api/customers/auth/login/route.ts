import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/customers/auth/login - Iniciar sesión
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    // Buscar el cliente
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
        isVip: true,
        loyaltyPoints: true,
        notes: true,
        acceptsMarketing: true,
        createdAt: true,
      },
    });

    if (!customer || !customer.isActive) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verificar contraseña (extraer del campo notes)
    const passwordHash = customer.notes?.split('password_hash:')[1] || '';

    if (!passwordHash) {
      return NextResponse.json(
        { error: 'Cuenta no configurada correctamente' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // No devolver el hash
    const { notes, ...customerData } = customer;

    return NextResponse.json({
      message: 'Inicio de sesión exitoso',
      customer: customerData,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
