import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setCustomerSessionCookie } from '@/lib/customer-session';

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
        gender: true,
        taxId: true,
        birthDate: true,
        isActive: true,
        isVip: true,
        loyaltyPoints: true,
        passwordHash: true,
        notes: true, // Para compatibilidad con cuentas antiguas
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

    // Verificar contraseña - primero intentar con el campo dedicado, luego con notes (compatibilidad)
    let passwordHash = customer.passwordHash;

    // Compatibilidad con cuentas antiguas que tienen el hash en notes
    if (!passwordHash && customer.notes) {
      const notesMatch = customer.notes.match(/password_hash:(.+)/);
      if (notesMatch) {
        passwordHash = notesMatch[1];
      }
    }

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

    // Actualizar lastLoginAt
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() }
    });

    // Establecer cookie de sesión segura
    try {
      await setCustomerSessionCookie({
        id: customer.id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        isVip: customer.isVip,
        loyaltyPoints: customer.loyaltyPoints,
      });
    } catch (cookieError) {
      console.error('Error setting session cookie (non-fatal):', cookieError);
    }

    // No devolver el hash ni notes
    const { passwordHash: _, notes, ...customerData } = customer;

    return NextResponse.json({
      message: 'Inicio de sesión exitoso',
      customer: customerData,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return NextResponse.json(
      { error: 'Error al iniciar sesión' },
      { status: 500 }
    );
  }
}
