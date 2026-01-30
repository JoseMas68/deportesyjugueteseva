import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setCustomerSessionCookie, validatePasswordStrength } from '@/lib/customer-session';

// Número de salt rounds para bcrypt (12 es el recomendado para seguridad)
const BCRYPT_SALT_ROUNDS = 12;

// POST /api/customers/auth/register - Registrar nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, acceptsMarketing } = body;

    // Validaciones básicas
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'El formato del email no es válido' },
        { status: 400 }
      );
    }

    // Validar complejidad de la contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0], errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Validar longitud de nombres
    if (firstName.length < 2 || firstName.length > 50) {
      return NextResponse.json(
        { error: 'El nombre debe tener entre 2 y 50 caracteres' },
        { status: 400 }
      );
    }

    if (lastName.length < 2 || lastName.length > 50) {
      return NextResponse.json(
        { error: 'El apellido debe tener entre 2 y 50 caracteres' },
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

    // Hash de la contraseña con salt rounds aumentado
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Crear el cliente con contraseña hasheada
    const customer = await prisma.customer.create({
      data: {
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        acceptsMarketing: acceptsMarketing || false,
        isActive: true,
        passwordHash: hashedPassword,
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

    // Establecer cookie de sesión segura automáticamente al registrarse
    // Envolvemos en try-catch para que un fallo de cookie no rompa el registro
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
      // No fallamos el registro si la cookie falla
    }

    return NextResponse.json({
      message: 'Cuenta creada exitosamente',
      customer,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);

    let errorMessage = 'Error al crear la cuenta';

    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);

      // Errores comunes de Prisma/DB
      if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
        errorMessage = 'Error de conexión con la base de datos';
      } else if (error.message.includes('Unique constraint')) {
        errorMessage = 'Este email ya está registrado';
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
