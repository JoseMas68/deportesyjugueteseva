import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { getCustomerSession, validatePasswordStrength } from '@/lib/customer-session';

// Número de salt rounds para bcrypt (12 es el recomendado para seguridad)
const BCRYPT_SALT_ROUNDS = 12;

// POST /api/customers/auth/change-password - Cambiar contraseña
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Obtener sesión actual (más seguro que confiar en el email del body)
    const session = await getCustomerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No hay sesión activa. Por favor, inicia sesión.' },
        { status: 401 }
      );
    }

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'La contraseña actual y la nueva son requeridas' },
        { status: 400 }
      );
    }

    // Validar complejidad de la nueva contraseña
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0], errors: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Buscar cliente por ID de sesión (más seguro)
    const customer = await prisma.customer.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        passwordHash: true,
        notes: true, // Para compatibilidad con cuentas antiguas
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar contraseña actual - primero campo dedicado, luego notes (compatibilidad)
    let storedHash = customer.passwordHash;

    // Compatibilidad con cuentas antiguas
    if (!storedHash && customer.notes) {
      const notesMatch = customer.notes.match(/password_hash:(.+)/);
      if (notesMatch) {
        storedHash = notesMatch[1];
      }
    }

    if (!storedHash) {
      return NextResponse.json(
        { error: 'No se encontró contraseña guardada' },
        { status: 400 }
      );
    }

    const isValidPassword = await bcrypt.compare(currentPassword, storedHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 401 }
      );
    }

    // Hashear nueva contraseña con salt rounds aumentado
    const newHashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

    // Actualizar contraseña en el campo dedicado y limpiar notes si tenía hash antiguo
    const updateData: { passwordHash: string; notes?: string | null } = {
      passwordHash: newHashedPassword,
    };

    // Si tenía el hash en notes, limpiarlo
    if (!customer.passwordHash && customer.notes?.includes('password_hash:')) {
      updateData.notes = null;
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: updateData,
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
