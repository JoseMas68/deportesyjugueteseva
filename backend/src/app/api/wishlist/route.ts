import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Esquema de validación para agregar a wishlist
const addToWishlistSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
});

// GET /api/wishlist?customerId=xxx - Obtener wishlist de un cliente
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const wishlistItems = await prisma.wishlistItem.findMany({
      where: {
        customerId,
      },
      orderBy: {
        addedAt: 'desc',
      },
      select: {
        id: true,
        productId: true,
        productName: true,
        productSlug: true,
        productImage: true,
        productPrice: true,
        addedAt: true,
      },
    });

    return NextResponse.json(wishlistItems);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
}

// POST /api/wishlist - Agregar producto a wishlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar con Zod
    const validationResult = addToWishlistSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validationResult.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { customerId, productId } = validationResult.data;

    // Verificar si el producto existe
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        thumbnailUrl: true,
        images: true,
        price: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Verificar si ya existe en la wishlist
    const existingItem = await prisma.wishlistItem.findUnique({
      where: {
        customerId_productId: {
          customerId,
          productId,
        },
      },
    });

    if (existingItem) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Crear el item en la wishlist
    const wishlistItem = await prisma.wishlistItem.create({
      data: {
        customerId,
        productId,
        productName: product.name,
        productSlug: product.slug,
        productImage: product.thumbnailUrl || product.images[0] || null,
        productPrice: product.price,
      },
    });

    return NextResponse.json(wishlistItem, { status: 201 });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}
