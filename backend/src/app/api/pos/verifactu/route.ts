import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVerifactuService, isVerifactuEnabled } from '@/lib/verifactu'
import { z } from 'zod'

// GET /api/pos/verifactu - Listar registros Verifactu
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si Verifactu está habilitado
    const enabled = await isVerifactuEnabled()

    // Stats por defecto
    const defaultStats = { pending: 0, submitted: 0, accepted: 0, rejected: 0, cancelled: 0, total: 0 }

    if (!enabled) {
      return NextResponse.json({
        enabled: false,
        records: [],
        total: 0,
        page: 1,
        totalPages: 1,
        stats: defaultStats,
        message: 'Verifactu no está habilitado',
      })
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Construir filtros
    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.invoiceDate = {}
      if (dateFrom) {
        (where.invoiceDate as Record<string, Date>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        (where.invoiceDate as Record<string, Date>).lte = new Date(dateTo)
      }
    }

    const skip = (page - 1) * limit

    // Intentar obtener registros (el modelo puede no existir si Prisma no está regenerado)
    let records: Array<{
      id: string
      invoiceNumber: string
      invoiceDate: Date
      invoiceType: string
      issuerNif: string
      issuerName: string
      recipientNif: string | null
      recipientName: string | null
      totalAmount: number
      status: string
      aeatErrorCode: string | null
      aeatErrorMessage: string | null
      submittedAt: Date | null
      saleId: string | null
      createdAt: Date
    }> = []
    let total = 0
    let stats = defaultStats

    try {
      if (prisma.verifactuRecord) {
        const [dbRecords, dbTotal, dbStats] = await Promise.all([
          prisma.verifactuRecord.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip,
            select: {
              id: true,
              invoiceNumber: true,
              invoiceDate: true,
              invoiceType: true,
              issuerNif: true,
              issuerName: true,
              recipientNif: true,
              recipientName: true,
              totalAmount: true,
              status: true,
              aeatErrorCode: true,
              aeatErrorMessage: true,
              submittedAt: true,
              saleId: true,
              createdAt: true,
            },
          }),
          prisma.verifactuRecord.count({ where }),
          getVerifactuService().getStats(),
        ])
        records = dbRecords.map(r => ({
          ...r,
          totalAmount: Number(r.totalAmount),
        }))
        total = dbTotal
        stats = dbStats
      }
    } catch (dbError) {
      console.error('Error accessing verifactuRecord:', dbError)
      // Continuar con valores por defecto
    }

    return NextResponse.json({
      enabled: true,
      records,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      stats,
    })
  } catch (error) {
    console.error('Error fetching verifactu records:', error)
    return NextResponse.json(
      { error: 'Error al obtener registros Verifactu' },
      { status: 500 }
    )
  }
}

// POST /api/pos/verifactu - Crear registro manualmente para una venta
const createSchema = z.object({
  saleId: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si Verifactu está habilitado
    const enabled = await isVerifactuEnabled()
    if (!enabled) {
      return NextResponse.json(
        { error: 'Verifactu no está habilitado' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { saleId } = createSchema.parse(body)

    // Verificar que la venta existe y no tiene registro Verifactu
    const sale = await prisma.posSale.findUnique({
      where: { id: saleId },
      include: {
        verifactuRecord: true,
        items: true,
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    if (sale.verifactuRecord) {
      return NextResponse.json(
        { error: 'Esta venta ya tiene un registro Verifactu' },
        { status: 400 }
      )
    }

    // Crear registro
    const service = getVerifactuService()
    const record = await service.createRecordFromSale(sale)

    return NextResponse.json({
      record: {
        id: record.id,
        invoiceNumber: record.invoiceNumber,
        status: record.status,
        currentHash: record.currentHash,
        qrContent: record.qrContent,
      },
    })
  } catch (error) {
    console.error('Error creating verifactu record:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear registro Verifactu' },
      { status: 500 }
    )
  }
}
