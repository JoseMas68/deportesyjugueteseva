import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderStatusForm from '@/components/admin/OrderStatusForm'

interface PageProps {
  params: Promise<{ id: string }>
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
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.className}`}>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pedidos"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pedido {order.orderNumber}</h1>
            <p className="text-gray-500 mt-1">Creado el {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Productos */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Productos</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {order.items.map((item) => (
                <div key={item.id} className="px-6 py-4 flex items-center gap-4">
                  {item.productImage ? (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.productName}</p>
                    {item.productSku && (
                      <p className="text-sm text-gray-500 font-mono">{item.productSku}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">x{item.quantity}</p>
                    <p className="font-medium">{Number(item.unitPrice).toFixed(2)} EUR</p>
                  </div>
                  <div className="text-right w-24">
                    <p className="font-medium text-gray-900">
                      {Number(item.totalPrice).toFixed(2)} EUR
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{Number(order.subtotal).toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envio</span>
                <span>{Number(order.shippingCost).toFixed(2)} EUR</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Descuento</span>
                  <span>-{Number(order.discount).toFixed(2)} EUR</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>{Number(order.total).toFixed(2)} EUR</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Historial</h2>
            <div className="space-y-4">
              {order.createdAt && (
                <TimelineItem
                  title="Pedido creado"
                  date={formatDate(order.createdAt)}
                  icon="create"
                />
              )}
              {order.paidAt && (
                <TimelineItem
                  title="Pago recibido"
                  date={formatDate(order.paidAt)}
                  icon="paid"
                />
              )}
              {order.shippedAt && (
                <TimelineItem
                  title="Enviado"
                  date={formatDate(order.shippedAt)}
                  icon="shipped"
                  extra={order.trackingNumber ? `Tracking: ${order.trackingNumber}` : undefined}
                />
              )}
              {order.deliveredAt && (
                <TimelineItem
                  title="Entregado"
                  date={formatDate(order.deliveredAt)}
                  icon="delivered"
                />
              )}
              {order.cancelledAt && (
                <TimelineItem
                  title="Cancelado"
                  date={formatDate(order.cancelledAt)}
                  icon="cancelled"
                  extra={order.cancellationReason || undefined}
                />
              )}
            </div>
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Cambiar estado */}
          <OrderStatusForm
            orderId={order.id}
            currentStatus={order.status}
            trackingNumber={order.trackingNumber || ''}
            shippingCarrier={order.shippingCarrier || ''}
          />

          {/* Cliente */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Cliente</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium">{order.userName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{order.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Telefono</p>
                <p className="font-medium">{order.userPhone || '-'}</p>
              </div>
            </div>
          </div>

          {/* Direccion de envio */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Direccion de Envio</h2>
            <div className="text-gray-700 space-y-1">
              <p>{order.shippingAddress}</p>
              <p>{order.shippingPostalCode} {order.shippingCity}</p>
              <p>{order.shippingProvince}</p>
              <p>{order.shippingCountry}</p>
            </div>
          </div>

          {/* Metodo de pago */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Pago</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Metodo</p>
                <p className="font-medium capitalize">{order.paymentMethod.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium">{order.paymentStatus || 'Pendiente'}</p>
              </div>
            </div>
          </div>

          {/* Notas */}
          {(order.customerNotes || order.adminNotes) && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Notas</h2>
              {order.customerNotes && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-1">Del cliente:</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{order.customerNotes}</p>
                </div>
              )}
              {order.adminNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Internas:</p>
                  <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg">{order.adminNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TimelineItem({
  title,
  date,
  icon,
  extra,
}: {
  title: string
  date: string
  icon: string
  extra?: string
}) {
  const iconColors: Record<string, string> = {
    create: 'bg-gray-100 text-gray-600',
    paid: 'bg-blue-100 text-blue-600',
    shipped: 'bg-indigo-100 text-indigo-600',
    delivered: 'bg-green-100 text-green-600',
    cancelled: 'bg-red-100 text-red-600',
  }

  return (
    <div className="flex gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColors[icon]}`}>
        {icon === 'create' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        )}
        {icon === 'paid' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        {icon === 'shipped' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        )}
        {icon === 'delivered' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {icon === 'cancelled' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{date}</p>
        {extra && <p className="text-sm text-gray-600 mt-1">{extra}</p>}
      </div>
    </div>
  )
}
