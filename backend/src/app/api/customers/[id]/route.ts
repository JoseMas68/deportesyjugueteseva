import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/customers/[id] - Actualizar datos del cliente
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { firstName, lastName, phone, gender, taxId, birthDate, acceptsMarketing } = body;

    const customer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone: phone || null,
        gender: gender || null,
        taxId: taxId || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        acceptsMarketing,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}
