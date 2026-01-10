import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener todas las plantillas de email
export async function GET() {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const templates = await prisma.emailTemplate.findMany({
      orderBy: { type: 'asc' },
    })

    // Añadir metadata de cada tipo de email
    const templatesWithMeta = templates.map(t => ({
      ...t,
      ...getEmailTypeMeta(t.type),
    }))

    return NextResponse.json({ templates: templatesWithMeta })
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Error al obtener plantillas' },
      { status: 500 }
    )
  }
}

// Metadata para cada tipo de email
function getEmailTypeMeta(type: string) {
  const meta: Record<string, { label: string; description: string; category: string }> = {
    CONFIRMATION: {
      label: 'Confirmación de Pedido',
      description: 'Se envía al cliente cuando crea un pedido',
      category: 'cliente',
    },
    PAID: {
      label: 'Pedido Pagado',
      description: 'Se envía al cliente cuando se confirma el pago',
      category: 'cliente',
    },
    PROCESSING: {
      label: 'En Preparación',
      description: 'Se envía al cliente cuando el pedido está en preparación',
      category: 'cliente',
    },
    SHIPPED: {
      label: 'Pedido Enviado',
      description: 'Se envía al cliente con el número de seguimiento',
      category: 'cliente',
    },
    DELIVERED: {
      label: 'Pedido Entregado',
      description: 'Se envía al cliente cuando se entrega el pedido',
      category: 'cliente',
    },
    CANCELLED: {
      label: 'Pedido Cancelado',
      description: 'Se envía al cliente si se cancela el pedido',
      category: 'cliente',
    },
    WELCOME: {
      label: 'Bienvenida',
      description: 'Se envía cuando un usuario se registra',
      category: 'cliente',
    },
    ADMIN_NEW_ORDER: {
      label: 'Nuevo Pedido (Admin)',
      description: 'Notificación al admin de nuevo pedido',
      category: 'admin',
    },
    ADMIN_PAID: {
      label: 'Pedido Pagado (Admin)',
      description: 'Notificación al admin de pago confirmado',
      category: 'admin',
    },
    ADMIN_CANCELLED: {
      label: 'Pedido Cancelado (Admin)',
      description: 'Notificación al admin de cancelación',
      category: 'admin',
    },
  }

  return meta[type] || { label: type, description: '', category: 'otro' }
}
