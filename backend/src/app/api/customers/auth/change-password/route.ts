import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// POST /api/customers/auth/change-password - Cambiar contraseña
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, currentPassword, newPassword } = body;

    if (!email || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Email, current password, and new password are required' },
        { status: 400 }
      );
    }

    // Buscar cliente por email
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar contraseña actual desde el campo notes
    const notesData = customer.notes || '';
    const passwordMatch = notesData.match(/password_hash:(.+)/);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'No se encontró contraseña guardada' },
        { status: 400 }
      );
    }

    const storedHash = passwordMatch[1];
    const isValidPassword = await bcrypt.compare(currentPassword, storedHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 401 }
      );
    }

    // Hashear nueva contraseña
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        notes: `password_hash:${newHashedPassword}`,
      },
    });

    return NextResponse.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'Error al cambiar contraseña' },
      { status: 500 }
    );
  }
}
