import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Componente de tarjeta de estadistica
function StatCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'yellow' | 'blue' | 'red' | 'green'
  href?: string
}) {
  const colorClasses = {
    yellow: 'bg-yellow-100 text-yellow-700',
    blue: 'bg-blue-100 text-blue-700',
    red: 'bg-red-100 text-red-700',
    green: 'bg-green-100 text-green-700',
  }

  const Card = (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{Card}</Link>
  }

  return Card
}

// Componente de badge de estado
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    PAID: { label: 'Pagado', className: 'bg-blue-100 text-blue-800' },
    PROCESSING: { label: 'En preparacion', className: 'bg-purple-100 text-purple-800' },
    SHIPPED: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-800' },
    DELIVERED: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export default async function DashboardPage() {
  // Fechas para filtros
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  // Obtener estadisticas
  const [
    todaySalesResult,
    pendingOrders,
    lowStockProducts,
    weekOrders,
    recentOrders,
    totalProducts,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: {
        createdAt: { gte: startOfToday },
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { status: 'PENDING' },
    }),
    prisma.product.count({
      where: {
        stock: { lt: 5 },
        isActive: true,
      },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: startOfWeek },
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        userName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.product.count({
      where: { isActive: true },
    }),
  ])

  const todaySales = todaySalesResult._sum.total
    ? Number(todaySalesResult._sum.total).toFixed(2)
    : '0.00'

  return (
    <div className="space-y-6">
      {/* Titulo */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Resumen de tu tienda</p>
      </div>

      {/* Tarjetas de estadisticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas de Hoy"
          value={`${todaySales} EUR`}
          color="green"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Pedidos Pendientes"
          value={pendingOrders}
          color="yellow"
          href="/admin/pedidos?status=PENDING"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Bajo Stock"
          value={lowStockProducts}
          color="red"
          href="/admin/productos?stock=low"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />

        <StatCard
          title="Pedidos (7 dias)"
          value={weekOrders}
          color="blue"
          href="/admin/pedidos"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />
      </div>

      {/* Seccion inferior */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ultimos pedidos */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Ultimos Pedidos</h2>
            <Link href="/admin/pedidos" className="text-sm text-yellow-600 hover:text-yellow-700 font-medium">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/pedidos/${order.id}`}
                  className="block px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{order.userName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{Number(order.total).toFixed(2)} EUR</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay pedidos todavia
              </div>
            )}
          </div>
        </div>

        {/* Resumen rapido */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Acciones Rapidas</h2>
          </div>
          <div className="p-6 space-y-4">
            <Link
              href="/admin/productos/nuevo"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
            >
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Nuevo Producto</p>
                <p className="text-sm text-gray-500">Anadir un producto al catalogo</p>
              </div>
            </Link>

            <Link
              href="/admin/pedidos?status=PENDING"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Gestionar Pedidos</p>
                <p className="text-sm text-gray-500">{pendingOrders} pedidos pendientes</p>
              </div>
            </Link>

            <Link
              href="/admin/productos"
              className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-gray-900">Ver Productos</p>
                <p className="text-sm text-gray-500">{totalProducts} productos activos</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
