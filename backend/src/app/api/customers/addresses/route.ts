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

// GET /api/customers/addresses - Obtener direcciones del cliente
export async function GET(request: NextRequest) {
  try {
    const customerId = await getCustomerId(request)

    if (!customerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const addresses = await prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error getting addresses:', error)
    return NextResponse.json(
      { error: 'Error al obtener direcciones' },
      { status: 500 }
    )
  }
}

// Schema para validar nueva dirección
const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']).default('shipping'),
  label: z.string().optional(),
  isDefault: z.boolean().default(false),
  firstName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  lastName: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
  company: z.string().optional(),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
  province: z.string().optional(),
  postalCode: z.string().min(4, 'El código postal debe tener al menos 4 caracteres'),
  country: z.string().default('España'),
  phone: z.string().optional(),
})

// POST /api/customers/addresses - Crear nueva dirección
export async function POST(request: NextRequest) {
  try {
    const customerId = await getCustomerId(request)

    if (!customerId) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const data = addressSchema.parse(body)

    // Si es default, quitar default de otras direcciones del mismo tipo
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId,
          type: data.type,
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    const address = await prisma.customerAddress.create({
      data: {
        customerId,
        ...data,
      },
    })

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    console.error('Error creating address:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al crear dirección' },
      { status: 500 }
    )
  }
}
