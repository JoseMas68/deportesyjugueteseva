import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'
import { z } from 'zod'

// Schema de validación para dirección (todos los campos opcionales, se validan solo si address tiene contenido)
const addressSchema = z.object({
  type: z.enum(['shipping', 'billing']).optional(),
  label: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
})

// Schema de validación para crear cliente
const createCustomerSchema = z.object({
  email: z.string().email('Email inválido'),
  firstName: z.string().min(1, 'El nombre es requerido'),
  lastName: z.string().min(1, 'El apellido es requerido'),
  phone: z.string().optional(),
  taxId: z.string().optional(),
  birthDate: z.string().optional(),
  isVip: z.boolean().optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  acceptsMarketing: z.boolean().optional(),
  notes: z.string().optional(),
  // Direcciones opcionales
  shippingAddress: addressSchema.optional(),
  useSameAddress: z.boolean().optional(),
  billingAddress: addressSchema.optional(),
})

// GET - Listar clientes con filtros y paginación
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const isVip = searchParams.get('isVip')
    const isActive = searchParams.get('isActive')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const skip = (page - 1) * limit

    // Construir filtros
    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (isVip !== null && isVip !== undefined) {
      where.isVip = isVip === 'true'
    }

    if (isActive !== null && isActive !== undefined) {
      where.isActive = isActive === 'true'
    }

    // Validar campo de ordenación
    const validSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'totalOrders', 'totalSpent', 'lastOrderAt']
    const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc'

    // Obtener clientes y total
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderField]: orderDirection },
        include: {
          addresses: {
            where: { isDefault: true },
            take: 1,
          },
          _count: {
            select: { wishlist: true, addresses: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

// POST - Crear nuevo cliente
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    // Validar datos
    const validation = createCustomerSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: validation.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verificar que el email no exista
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: data.email },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con este email' },
        { status: 400 }
      )
    }

    // Preparar direcciones a crear
    const addressesToCreate: any[] = []

    // Dirección de envío (solo si tiene datos relevantes)
    const hasShippingData = data.shippingAddress &&
      data.shippingAddress.address &&
      data.shippingAddress.address.trim() !== ''

    if (hasShippingData) {
      // Validar campos requeridos para la dirección
      const sa = data.shippingAddress!
      if (!sa.firstName || !sa.lastName || !sa.city || !sa.postalCode) {
        return NextResponse.json(
          { error: 'La dirección de envío requiere: nombre, apellidos, ciudad y código postal' },
          { status: 400 }
        )
      }

      addressesToCreate.push({
        type: 'shipping',
        label: sa.label || 'Casa',
        firstName: sa.firstName,
        lastName: sa.lastName,
        company: sa.company || null,
        address: sa.address,
        addressLine2: sa.addressLine2 || null,
        city: sa.city,
        province: sa.province || null,
        postalCode: sa.postalCode,
        country: sa.country || 'España',
        phone: sa.phone || null,
        isDefault: true,
      })
    }

    // Dirección de facturación (solo si es diferente y tiene datos)
    const hasBillingData = !data.useSameAddress &&
      data.billingAddress &&
      data.billingAddress.address &&
      data.billingAddress.address.trim() !== ''

    if (hasBillingData) {
      const ba = data.billingAddress!
      if (!ba.firstName || !ba.city || !ba.postalCode) {
        return NextResponse.json(
          { error: 'La dirección de facturación requiere: nombre/razón social, ciudad y código postal' },
          { status: 400 }
        )
      }

      addressesToCreate.push({
        type: 'billing',
        label: ba.label || 'Facturación',
        firstName: ba.firstName,
        lastName: ba.lastName || '',
        company: ba.company || null,
        address: ba.address,
        addressLine2: ba.addressLine2 || null,
        city: ba.city,
        province: ba.province || null,
        postalCode: ba.postalCode,
        country: ba.country || 'España',
        phone: ba.phone || null,
        isDefault: true,
      })
    }

    // Crear cliente con direcciones
    const customer = await prisma.customer.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || null,
        taxId: data.taxId || null,
        birthDate: data.birthDate ? new Date(data.birthDate) : null,
        isVip: data.isVip || false,
        vipSince: data.isVip ? new Date() : null,
        loyaltyPoints: data.loyaltyPoints || 0,
        acceptsMarketing: data.acceptsMarketing || false,
        notes: data.notes || null,
        addresses: addressesToCreate.length > 0 ? {
          create: addressesToCreate,
        } : undefined,
      },
      include: {
        addresses: true,
      },
    })

    return NextResponse.json({ customer, message: 'Cliente creado correctamente' }, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
