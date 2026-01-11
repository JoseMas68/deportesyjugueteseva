import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/addresses?customerId=xxx - Obtener direcciones de un cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'CustomerId is required' },
        { status: 400 }
      );
    }

    const addresses = await prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transformar para el frontend (combinar firstName y lastName en fullName)
    const transformedAddresses = addresses.map(addr => ({
      id: addr.id,
      customerId: addr.customerId,
      fullName: `${addr.firstName} ${addr.lastName}`,
      phone: addr.phone || '',
      street: addr.address,
      city: addr.city,
      state: addr.province || '',
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
    }));

    return NextResponse.json(transformedAddresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}

// POST /api/addresses - Crear nueva dirección
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerId,
      fullName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault,
    } = body;

    if (!customerId || !fullName || !phone || !street || !city || !postalCode || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Separar fullName en firstName y lastName
    const nameParts = fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Si se marca como default, desmarcar las otras
    if (isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId,
        firstName,
        lastName,
        phone,
        address: street,
        city,
        province: state,
        postalCode,
        country,
        isDefault: isDefault || false,
        type: 'shipping',
      },
    });

    // Transformar para el frontend
    const transformedAddress = {
      id: address.id,
      customerId: address.customerId,
      fullName: `${address.firstName} ${address.lastName}`,
      phone: address.phone || '',
      street: address.address,
      city: address.city,
      state: address.province || '',
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    };

    return NextResponse.json(transformedAddress, { status: 201 });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}
