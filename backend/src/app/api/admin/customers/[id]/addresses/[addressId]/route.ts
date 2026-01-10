import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { z } from 'zod'

// Schema de validación para actualizar dirección
const updateAddressSchema = z.object({
  type: z.enum(['shipping', 'billing']).optional(),
  label: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  company: z.string().optional().nullable(),
  address: z.string().min(1).optional(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().min(1).optional(),
  province: z.string().optional().nullable(),
  postalCode: z.string().min(1).optional(),
  country: z.string().optional(),
  phone: z.string().optional().nullable(),
})

// PATCH - Actualizar dirección
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id, addressId } = await params
    const body = await request.json()

    // Validar datos
    const validation = updateAddressSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar que la dirección existe y pertenece al cliente
    const existingAddress = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId: id },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 })
    }

    // Si esta dirección será default, quitar default de las demás del mismo tipo
    if (data.isDefault) {
      const targetType = data.type || existingAddress.type
      await prisma.customerAddress.updateMany({
        where: {
          customerId: id,
          type: targetType,
          isDefault: true,
          id: { not: addressId },
        },
        data: { isDefault: false },
      })
    }

    // Actualizar dirección
    const address = await prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        type: data.type,
        label: data.label,
        isDefault: data.isDefault,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        address: data.address,
        addressLine2: data.addressLine2,
        city: data.city,
        province: data.province,
        postalCode: data.postalCode,
        country: data.country,
        phone: data.phone,
      },
    })

    return NextResponse.json({ address, message: 'Dirección actualizada correctamente' })
  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json({ error: 'Error al actualizar dirección' }, { status: 500 })
  }
}

// DELETE - Eliminar dirección
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; addressId: string }> }
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id, addressId } = await params

    // Verificar que la dirección existe y pertenece al cliente
    const existingAddress = await prisma.customerAddress.findFirst({
      where: { id: addressId, customerId: id },
    })

    if (!existingAddress) {
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 })
    }

    await prisma.customerAddress.delete({
      where: { id: addressId },
    })

    return NextResponse.json({ message: 'Dirección eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json({ error: 'Error al eliminar dirección' }, { status: 500 })
  }
}
