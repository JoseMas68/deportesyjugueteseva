import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { z } from 'zod'

// Schema de validación para dirección
const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']).default('shipping'),
  label: z.string().optional(),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  company: z.string().optional(),
  address: z.string().min(1, 'La dirección es requerida'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'La ciudad es requerida'),
  province: z.string().optional(),
  postalCode: z.string().min(1, 'El código postal es requerido'),
  country: z.string().default('España'),
  phone: z.string().optional(),
})

// GET - Listar direcciones del cliente
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    // Verificar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    const addresses = await prisma.customerAddress.findMany({
      where: { customerId: id },
      orderBy: [{ isDefault: 'desc' }, { type: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Error fetching addresses:', error)
    return NextResponse.json({ error: 'Error al obtener direcciones' }, { status: 500 })
  }
}

// POST - Crear nueva dirección
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Validar datos
    const validation = addressSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar que el cliente existe
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Si esta dirección será default, quitar default de las demás del mismo tipo
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId: id,
          type: data.type,
          isDefault: true,
        },
        data: { isDefault: false },
      })
    }

    // Crear dirección
    const address = await prisma.customerAddress.create({
      data: {
        customerId: id,
        type: data.type,
        label: data.label || null,
        isDefault: data.isDefault || false,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company || null,
        address: data.address,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        province: data.province || null,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone || null,
      },
    })

    return NextResponse.json({ address, message: 'Dirección creada correctamente' }, { status: 201 })
  } catch (error) {
    console.error('Error creating address:', error)
    return NextResponse.json({ error: 'Error al crear dirección' }, { status: 500 })
  }
}
