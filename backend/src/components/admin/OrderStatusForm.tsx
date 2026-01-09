'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OrderStatusFormProps {
  orderId: string
  currentStatus: string
  trackingNumber: string
  shippingCarrier: string
}

const statusOptions = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'PAID', label: 'Pagado' },
  { value: 'PROCESSING', label: 'En preparacion' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

export default function OrderStatusForm({
  orderId,
  currentStatus,
  trackingNumber: initialTracking,
  shippingCarrier: initialCarrier,
}: OrderStatusFormProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [trackingNumber, setTrackingNumber] = useState(initialTracking)
  const [shippingCarrier, setShippingCarrier] = useState(initialCarrier)
  const [cancellationReason, setCancellationReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(status === 'SHIPPED' && { trackingNumber, shippingCarrier }),
          ...(status === 'CANCELLED' && { cancellationReason }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar estado')
      }

      setSuccess(true)
      router.refresh()

      // Ocultar mensaje de exito despues de 3 segundos
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const hasChanged = status !== currentStatus ||
    (status === 'SHIPPED' && (trackingNumber !== initialTracking || shippingCarrier !== initialCarrier))

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Actualizar Estado</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          Estado actualizado correctamente
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Campos adicionales para envio */}
        {status === 'SHIPPED' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numero de Seguimiento
              </label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="input"
                placeholder="Ej: 1Z999AA10123456784"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transportista
              </label>
              <select
                value={shippingCarrier}
                onChange={(e) => setShippingCarrier(e.target.value)}
                className="input"
              >
                <option value="">Seleccionar...</option>
                <option value="SEUR">SEUR</option>
                <option value="MRW">MRW</option>
                <option value="Correos">Correos</option>
                <option value="DHL">DHL</option>
                <option value="UPS">UPS</option>
                <option value="GLS">GLS</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </>
        )}

        {/* Campo para cancelacion */}
        {status === 'CANCELLED' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de Cancelacion
            </label>
            <textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Indica el motivo de la cancelacion..."
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !hasChanged}
          className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Actualizando...' : 'Actualizar Estado'}
        </button>
      </form>
    </div>
  )
}
