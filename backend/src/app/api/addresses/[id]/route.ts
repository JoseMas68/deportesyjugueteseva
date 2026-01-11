import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH /api/addresses/[id] - Actualizar dirección
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const {
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = body;

    // Verificar que la dirección existe
    const existingAddress = await prisma.customerAddress.findUnique({
      where: { id },
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // Separar fullName en firstName y lastName
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Si se marca como default, desmarcar las otras
    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId: existingAddress.customerId,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const updatedAddress = await prisma.customerAddress.update({
      where: { id },
      data: {
        firstName,
        lastName,
        phone,
        address: street,
        city,
        province: state,
        postalCode,
        country,
        isDefault: isDefault || false,
      },
    });

    // Transformar para el frontend
    const transformedAddress = {
      id: updatedAddress.id,
      customerId: updatedAddress.customerId,
      fullName: `${updatedAddress.firstName} ${updatedAddress.lastName}`,
      phone: updatedAddress.phone || '',
      street: updatedAddress.address,
      city: updatedAddress.city,
      state: updatedAddress.province || '',
      postalCode: updatedAddress.postalCode,
      country: updatedAddress.country,
      isDefault: updatedAddress.isDefault,
    };

    return NextResponse.json(transformedAddress);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}

// DELETE /api/addresses/[id] - Eliminar dirección
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const address = await prisma.customerAddress.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    await prisma.customerAddress.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Address deleted successfully' });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}
