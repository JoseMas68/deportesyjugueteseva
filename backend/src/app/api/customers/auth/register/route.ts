import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/customers/auth/register - Registrar nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, acceptsMarketing } = body;

    // Validaciones
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el cliente (guardamos la contraseña en notas por simplicidad)
    // En producción deberías usar Supabase Auth o similar
    const customer = await prisma.customer.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone: phone || null,
        acceptsMarketing: acceptsMarketing || false,
        isActive: true,
        // Guardamos el hash en notes temporalmente
        notes: `password_hash:${hashedPassword}`,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isVip: true,
        loyaltyPoints: true,
        acceptsMarketing: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'Cuenta creada exitosamente',
      customer,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    );
  }
}
