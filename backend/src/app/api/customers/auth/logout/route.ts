import { NextResponse } from 'next/server';
import { clearCustomerSessionCookie } from '@/lib/customer-session';

// POST /api/customers/auth/logout - Cerrar sesión
export async function POST() {
  try {
    // Eliminar la cookie de sesión
    await clearCustomerSessionCookie();

    return NextResponse.json({
      message: 'Sesión cerrada exitosamente',
    });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}
