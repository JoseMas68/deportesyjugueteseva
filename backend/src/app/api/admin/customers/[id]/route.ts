import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { z } from 'zod'

// Schema de validación para actualizar cliente
const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  isVip: z.boolean().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  acceptsMarketing: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

// GET - Obtener cliente específico
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

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        addresses: {
          orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        },
        wishlist: {
          orderBy: { addedAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Obtener pedidos del cliente por email
    const orders = await prisma.order.findMany({
      where: { userEmail: customer.email },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
          },
        },
      },
    })

    return NextResponse.json({ customer, orders })
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json({ error: 'Error al obtener cliente' }, { status: 500 })
  }
}

// PATCH - Actualizar cliente
export async function PATCH(
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
    const validation = updateCustomerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar que el cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Preparar datos para actualizar
    const updateData: any = {}

    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.taxId !== undefined) updateData.taxId = data.taxId
    if (data.birthDate !== undefined) {
      updateData.birthDate = data.birthDate ? new Date(data.birthDate) : null
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive
    if (data.loyaltyPoints !== undefined) updateData.loyaltyPoints = data.loyaltyPoints
    if (data.acceptsMarketing !== undefined) updateData.acceptsMarketing = data.acceptsMarketing
    if (data.notes !== undefined) updateData.notes = data.notes

    // Manejar cambio de estado VIP
    if (data.isVip !== undefined) {
      updateData.isVip = data.isVip
      if (data.isVip && !existingCustomer.isVip) {
        updateData.vipSince = new Date()
      } else if (!data.isVip) {
        updateData.vipSince = null
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        addresses: true,
      },
    })

    return NextResponse.json({ customer, message: 'Cliente actualizado correctamente' })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}

// DELETE - Eliminar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin puede eliminar clientes
    if (admin.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Se requiere rol de super administrador para eliminar clientes' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verificar que el cliente existe
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })
    }

    // Eliminar cliente (cascade eliminará direcciones y wishlist)
    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Cliente eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
  }
}
