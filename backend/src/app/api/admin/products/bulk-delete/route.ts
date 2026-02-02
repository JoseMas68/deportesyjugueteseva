import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkActionSchema = z.object({
  ids: z.array(z.string()).min(1, 'Debe seleccionar al menos un producto'),
  action: z.enum(['trash', 'restore', 'delete']).optional().default('trash'),
})

// POST - Acciones masivas sobre productos
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { ids, action } = bulkActionSchema.parse(body)

    if (action === 'trash') {
      // Mover a papelera: establecer deletedAt
      const result = await prisma.product.updateMany({
        where: { id: { in: ids }, deletedAt: null },
        data: { deletedAt: new Date() },
      })

      return NextResponse.json({
        success: true,
        count: result.count,
        message: `${result.count} producto${result.count > 1 ? 's' : ''} movido${result.count > 1 ? 's' : ''} a la papelera`,
      })
    }

    if (action === 'restore') {
      // Restaurar de papelera: quitar deletedAt
      const result = await prisma.product.updateMany({
        where: { id: { in: ids }, deletedAt: { not: null } },
        data: { deletedAt: null },
      })

      return NextResponse.json({
        success: true,
        count: result.count,
        message: `${result.count} producto${result.count > 1 ? 's' : ''} restaurado${result.count > 1 ? 's' : ''}`,
      })
    }

    if (action === 'delete') {
      // Eliminar permanentemente
      // Primero verificar que no tengan pedidos
      const productsWithOrders = await prisma.product.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          name: true,
          _count: { select: { orderItems: true } },
        },
      })

      const cannotDelete = productsWithOrders.filter(p => p._count.orderItems > 0)

      if (cannotDelete.length > 0) {
        return NextResponse.json({
          error: `No se pueden eliminar ${cannotDelete.length} producto(s) porque tienen pedidos asociados`,
          products: cannotDelete.map(p => p.name),
        }, { status: 400 })
      }

      // Eliminar permanentemente (las variantes y tags se eliminan en cascada)
      const result = await prisma.product.deleteMany({
        where: { id: { in: ids } },
      })

      return NextResponse.json({
        success: true,
        count: result.count,
        message: `${result.count} producto${result.count > 1 ? 's' : ''} eliminado${result.count > 1 ? 's' : ''} permanentemente`,
      })
    }

    return NextResponse.json({ error: 'Accion no valida' }, { status: 400 })
  } catch (error) {
    console.error('Error bulk action products:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos invalidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al procesar productos' },
      { status: 500 }
    )
  }
}
