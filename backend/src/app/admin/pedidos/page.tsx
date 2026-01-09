import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface SearchParams {
  page?: string
  search?: string
  status?: string
  dateFrom?: string
  dateTo?: string
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

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const search = params.search || ''
  const status = params.status || ''
  const dateFrom = params.dateFrom || ''
  const dateTo = params.dateTo || ''

  // Construir filtros
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { userEmail: { contains: search, mode: 'insensitive' } },
      { userName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (status) {
    where.status = status
  }

  if (dateFrom) {
    where.createdAt = { ...(where.createdAt as object || {}), gte: new Date(dateFrom) }
  }

  if (dateTo) {
    const endDate = new Date(dateTo)
    endDate.setHours(23, 59, 59, 999)
    where.createdAt = { ...(where.createdAt as object || {}), lte: endDate }
  }

  const [orders, total, statusCounts] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: {
          select: { quantity: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Convertir counts a objeto
  const counts = statusCounts.reduce((acc, item) => {
    acc[item.status] = item._count
    return acc
  }, {} as Record<string, number>)

  // Construir URL con filtros actuales
  const buildUrl = (newParams: Record<string, string>) => {
    const url = new URLSearchParams()
    if (search) url.set('search', search)
    if (status) url.set('status', status)
    if (dateFrom) url.set('dateFrom', dateFrom)
    if (dateTo) url.set('dateTo', dateTo)

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        url.set(key, value)
      } else {
        url.delete(key)
      }
    })

    return `/admin/pedidos?${url.toString()}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-500 mt-1">{total} pedidos en total</p>
      </div>

      {/* Tabs de estado */}
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/admin/pedidos"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !status
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Todos ({Object.values(counts).reduce((a, b) => a + b, 0)})
        </Link>
        {[
          { key: 'PENDING', label: 'Pendientes' },
          { key: 'PAID', label: 'Pagados' },
          { key: 'PROCESSING', label: 'En preparacion' },
          { key: 'SHIPPED', label: 'Enviados' },
          { key: 'DELIVERED', label: 'Entregados' },
          { key: 'CANCELLED', label: 'Cancelados' },
        ].map((s) => (
          <Link
            key={s.key}
            href={buildUrl({ status: s.key, page: '' })}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              status === s.key
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {s.label} ({counts[s.key] || 0})
          </Link>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <form className="flex flex-wrap gap-4">
          <input type="hidden" name="status" value={status} />

          {/* Busqueda */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              placeholder="Buscar por numero, email o nombre..."
              defaultValue={search}
              className="input"
            />
          </div>

          {/* Fecha desde */}
          <div>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom}
              className="input"
            />
          </div>

          {/* Fecha hasta */}
          <div>
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo}
              className="input"
            />
          </div>

          <button type="submit" className="btn btn-secondary">
            Filtrar
          </button>

          {(search || dateFrom || dateTo) && (
            <Link href={status ? `/admin/pedidos?status=${status}` : '/admin/pedidos'} className="btn btn-outline">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Tabla de pedidos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => {
                const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0)
                return (
                  <tr key={order.id}>
                    <td>
                      <span className="font-mono font-medium text-gray-900">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-gray-900">{order.userName}</p>
                        <p className="text-sm text-gray-500">{order.userEmail}</p>
                      </div>
                    </td>
                    <td className="text-gray-500">
                      {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                    </td>
                    <td className="font-medium text-gray-900">
                      {Number(order.total).toFixed(2)} EUR
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="text-gray-500 text-sm">
                      {formatDate(order.createdAt)}
                    </td>
                    <td>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-yellow-600 hover:text-yellow-700 font-medium"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No se encontraron pedidos
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginacion */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="btn btn-outline btn-sm"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="btn btn-outline btn-sm"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
