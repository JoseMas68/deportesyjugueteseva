import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Verificar autenticacion
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Fechas para filtros
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - 7)

    // Ejecutar todas las consultas en paralelo
    const [
      todaySalesResult,
      pendingOrders,
      lowStockProducts,
      weekOrders,
      recentOrders,
      totalProducts,
      totalOrders,
    ] = await Promise.all([
      // Ventas del dia (suma de totales de pedidos no cancelados)
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: 'CANCELLED' },
        },
        _sum: { total: true },
      }),

      // Pedidos pendientes
      prisma.order.count({
        where: { status: 'PENDING' },
      }),

      // Productos con bajo stock (menos de 5 unidades)
      prisma.product.count({
        where: {
          stock: { lt: 5 },
          isActive: true,
        },
      }),

      // Pedidos de la semana
      prisma.order.count({
        where: {
          createdAt: { gte: startOfWeek },
        },
      }),

      // Ultimos 5 pedidos
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          userName: true,
          userEmail: true,
          total: true,
          status: true,
          createdAt: true,
        },
      }),

      // Total de productos activos
      prisma.product.count({
        where: { isActive: true },
      }),

      // Total de pedidos
      prisma.order.count(),
    ])

    // Convertir Decimal a number para el total de ventas
    const todaySales = todaySalesResult._sum.total
      ? Number(todaySalesResult._sum.total)
      : 0

    // Formatear pedidos recientes
    const formattedOrders = recentOrders.map(order => ({
      ...order,
      total: Number(order.total),
    }))

    return NextResponse.json({
      todaySales,
      pendingOrders,
      lowStockProducts,
      weekOrders,
      recentOrders: formattedOrders,
      totalProducts,
      totalOrders,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadisticas' },
      { status: 500 }
    )
  }
}
