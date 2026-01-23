import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getVerifactuService, isVerifactuEnabled, generateQRImage, getHashSuffix } from '@/lib/verifactu'
import { z } from 'zod'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/pos/verifactu/[id] - Obtener detalle de un registro
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const record = await prisma.verifactuRecord.findUnique({
      where: { id },
      include: {
        sale: {
          select: {
            id: true,
            saleNumber: true,
            total: true,
            createdAt: true,
          },
        },
        originalInvoice: {
          select: {
            id: true,
            invoiceNumber: true,
          },
        },
        rectifications: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
          },
        },
      },
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    // Generar imagen QR
    const qrImage = await generateQRImage(record.qrContent)

    return NextResponse.json({
      record: {
        id: record.id,
        invoiceNumber: record.invoiceNumber,
        invoiceDate: record.invoiceDate,
        invoiceType: record.invoiceType,
        issuerNif: record.issuerNif,
        issuerName: record.issuerName,
        recipientNif: record.recipientNif,
        recipientName: record.recipientName,
        baseAmount: Number(record.baseAmount),
        taxRate: Number(record.taxRate),
        taxAmount: Number(record.taxAmount),
        totalAmount: Number(record.totalAmount),
        previousHash: record.previousHash,
        currentHash: record.currentHash,
        hashSuffix: getHashSuffix(record.currentHash, 8),
        hashInput: record.hashInput,
        qrContent: record.qrContent,
        qrImage,
        status: record.status,
        aeatResponse: record.aeatResponse,
        aeatErrorCode: record.aeatErrorCode,
        aeatErrorMessage: record.aeatErrorMessage,
        submittedAt: record.submittedAt,
        xmlContent: record.xmlContent,
        sale: record.sale ? {
          ...record.sale,
          total: Number(record.sale.total),
        } : null,
        originalInvoice: record.originalInvoice,
        rectifications: record.rectifications,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching verifactu record:', error)
    return NextResponse.json(
      { error: 'Error al obtener registro Verifactu' },
      { status: 500 }
    )
  }
}

// POST /api/pos/verifactu/[id] - Acciones sobre un registro
const actionSchema = z.object({
  action: z.enum(['submit', 'cancel', 'rectify']),
  reason: z.string().optional(),
  newAmount: z.number().optional(),
})

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const enabled = await isVerifactuEnabled()
    if (!enabled) {
      return NextResponse.json(
        { error: 'Verifactu no está habilitado' },
        { status: 400 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { action, reason, newAmount } = actionSchema.parse(body)

    const service = getVerifactuService()

    switch (action) {
      case 'submit': {
        const response = await service.submitToAEAT(id)
        return NextResponse.json({
          success: response.success,
          message: response.success
            ? 'Registro enviado correctamente a AEAT'
            : `Error: ${response.errorMessage}`,
          response,
        })
      }

      case 'cancel': {
        if (!reason) {
          return NextResponse.json(
            { error: 'Se requiere una razón para anular' },
            { status: 400 }
          )
        }
        const response = await service.cancelRecord(id, reason)
        return NextResponse.json({
          success: response.success,
          message: response.success
            ? 'Registro anulado correctamente'
            : `Error: ${response.errorMessage}`,
          response,
        })
      }

      case 'rectify': {
        if (!reason) {
          return NextResponse.json(
            { error: 'Se requiere una razón para rectificar' },
            { status: 400 }
          )
        }
        const record = await service.createRectification(id, reason, newAmount)
        return NextResponse.json({
          success: true,
          message: 'Factura rectificativa creada',
          record: {
            id: record.id,
            invoiceNumber: record.invoiceNumber,
            status: record.status,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing verifactu action:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar acción' },
      { status: 500 }
    )
  }
}

// DELETE /api/pos/verifactu/[id] - Eliminar registro (solo si está pendiente)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { id } = await params

    const record = await prisma.verifactuRecord.findUnique({
      where: { id },
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    // Solo se pueden eliminar registros pendientes
    if (record.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo se pueden eliminar registros pendientes' },
        { status: 400 }
      )
    }

    await prisma.verifactuRecord.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Registro eliminado',
    })
  } catch (error) {
    console.error('Error deleting verifactu record:', error)
    return NextResponse.json(
      { error: 'Error al eliminar registro' },
      { status: 500 }
    )
  }
}
