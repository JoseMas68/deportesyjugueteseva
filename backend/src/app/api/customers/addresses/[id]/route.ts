import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCustomerSession, verifySessionToken } from '@/lib/customer-session'
import { z } from 'zod'

// Helper para obtener el customer ID desde cookie o Authorization header
async function getCustomerId(request: NextRequest): Promise<string | null> {
  // Primero intentar desde cookie (SSR)
  const session = await getCustomerSession()
  if (session?.id) {
    return session.id
  }

  // Si no hay cookie, intentar desde Authorization header (Astro frontend)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const payload = await verifySessionToken(token)
    if (payload?.id) {
      return payload.id
    }
  }

  return null
}

// GET /api/customers/addresses/[id] - Obtener una dirección específica
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const customerId = await getCustomerId(request)

    if (!customerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const address = await prisma.customerAddress.findFirst({
      where: {
        id,
        customerId, // Solo puede ver sus propias direcciones
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Error getting address:', error)
    return NextResponse.json(
      { error: 'Error al obtener dirección' },
      { status: 500 }
    )
  }
}

// Schema para actualizar dirección
const updateAddressSchema = z.object({
  type: z.enum(['shipping', 'billing']).optional(),
  label: z.string().nullable().optional(),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  company: z.string().nullable().optional(),
  address: z.string().min(5).optional(),
  addressLine2: z.string().nullable().optional(),
  city: z.string().min(2).optional(),
  province: z.string().nullable().optional(),
  postalCode: z.string().min(4).optional(),
  country: z.string().optional(),
  phone: z.string().nullable().optional(),
})

// PATCH /api/customers/addresses/[id] - Actualizar dirección
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const customerId = await getCustomerId(request)

    if (!customerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    const data = updateAddressSchema.parse(body)

    // Verificar que la dirección pertenece al cliente
    const existingAddress = await prisma.customerAddress.findFirst({
      where: {
        id,
        customerId,
      },
    })

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      )
    }

    // Si se marca como default, quitar default de otras direcciones del mismo tipo
    if (data.isDefault) {
      const type = data.type || existingAddress.type
      await prisma.customerAddress.updateMany({
        where: {
          customerId,
          type,
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      })
    }

    const address = await prisma.customerAddress.update({
      where: { id },
      data,
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Error updating address:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar dirección' },
      { status: 500 }
    )
  }
}

// DELETE /api/customers/addresses/[id] - Eliminar dirección
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const customerId = await getCustomerId(request)

    if (!customerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    // Verificar que la dirección pertenece al cliente
    const address = await prisma.customerAddress.findFirst({
      where: {
        id,
        customerId,
      },
    })

    if (!address) {
      return NextResponse.json(
        { error: 'Dirección no encontrada' },
        { status: 404 }
      )
    }

    await prisma.customerAddress.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Dirección eliminada' })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Error al eliminar dirección' },
      { status: 500 }
    )
  }
}
