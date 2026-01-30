import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderStatusForm from '@/components/admin/OrderStatusForm'

interface PageProps {
  params: Promise<{ id: string }>
}

// Componente de badge de estado compacto
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    PAID: { label: 'Pagado', className: 'bg-blue-100 text-blue-800' },
    PROCESSING: { label: 'En preparación', className: 'bg-purple-100 text-purple-800' },
    SHIPPED: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-800' },
    DELIVERED: { label: 'Entregado', className: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800' },
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}

export default async function DetallePedidoPage({ params }: PageProps) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
        },
      },
    },
  })

  if (!order) {
    notFound()
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/pedidos"
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-gray-900">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-4">
          {/* Productos */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-200 bg-gray-50">
              <h2 className="text-sm font-semibold text-gray-900">Productos ({order.items.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="px-4 py-2 flex items-center gap-3">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    {item.productSku && (
                      <p className="text-xs text-gray-500 font-mono">{item.productSku}</p>
                    )}
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-gray-500">x{item.quantity}</span>
                    <span className="ml-2 font-medium">{Number(item.totalPrice).toFixed(2)}€</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 bg-gray-50 flex justify-between items-center text-sm">
              <div className="text-gray-600">
                <span>Subtotal: {Number(order.subtotal).toFixed(2)}€</span>
                <span className="mx-2">|</span>
                <span>Envío: {Number(order.shippingCost).toFixed(2)}€</span>
                {Number(order.discount) > 0 && (
                  <><span className="mx-2">|</span><span className="text-green-600">-{Number(order.discount).toFixed(2)}€</span></>
                )}
              </div>
              <span className="font-bold text-gray-900">{Number(order.total).toFixed(2)}€</span>
            </div>
          </div>

          {/* Timeline compacto */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-2">Historial</h2>
            <div className="flex flex-wrap gap-3 text-xs">
              {order.createdAt && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                  Creado {formatDate(order.createdAt)}
                </span>
              )}
              {order.paidAt && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-blue-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Pagado {formatDate(order.paidAt)}
                </span>
              )}
              {order.shippedAt && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 rounded text-indigo-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Enviado {formatDate(order.shippedAt)}
                </span>
              )}
              {order.deliveredAt && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-green-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Entregado {formatDate(order.deliveredAt)}
                </span>
              )}
              {order.cancelledAt && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 rounded text-red-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Cancelado {formatDate(order.cancelledAt)}
                </span>
              )}
            </div>
            {order.trackingNumber && (
              <p className="mt-2 text-xs text-gray-600">Tracking: <span className="font-mono">{order.trackingNumber}</span></p>
            )}
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-4">
          {/* Cambiar estado */}
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            trackingNumber={order.trackingNumber || ''}
            shippingCarrier={order.shippingCarrier || ''}
          />

          {/* Cliente y Envío combinados */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Cliente</h3>
                <p className="font-medium text-gray-900">{order.userName}</p>
                <p className="text-gray-600 text-xs">{order.userEmail}</p>
                <p className="text-gray-600 text-xs">{order.userPhone || '-'}</p>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">Envío</h3>
                <p className="text-gray-700 text-xs">{order.shippingAddress}</p>
                <p className="text-gray-700 text-xs">{order.shippingPostalCode} {order.shippingCity}</p>
                <p className="text-gray-700 text-xs">{order.shippingProvince}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
              <span className="text-gray-500">Pago:</span>
              <span className="font-medium capitalize">{order.paymentMethod.toLowerCase()} - {order.paymentStatus || 'Pendiente'}</span>
            </div>
          </div>

          {/* Notas */}
          {(order.customerNotes || order.adminNotes) && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase mb-2">Notas</h2>
              {order.customerNotes && (
                <p className="text-xs text-gray-700 bg-gray-50 p-2 rounded mb-2">{order.customerNotes}</p>
              )}
              {order.adminNotes && (
                <p className="text-xs text-gray-700 bg-yellow-50 p-2 rounded">{order.adminNotes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

