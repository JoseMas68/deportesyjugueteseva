'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SiteConfig {
  id: string
  key: string
  value: string
  group: string | null
  description: string | null
}

interface PaymentMethod {
  id: string
  method: string
  isEnabled: boolean
  displayName: string | null
  description: string | null
}

interface ConfigFormProps {
  configByGroup: Record<string, SiteConfig[]>
  paymentMethods: PaymentMethod[]
}

const groupLabels: Record<string, string> = {
  general: 'General',
  shipping: 'Envio',
  payment: 'Pagos',
  email: 'Email',
}

const keyLabels: Record<string, string> = {
  store_name: 'Nombre de la tienda',
  store_email: 'Email de contacto',
  store_phone: 'Telefono',
  store_address: 'Direccion',
  shipping_cost: 'Coste de envio (EUR)',
  free_shipping_threshold: 'Envio gratis a partir de (EUR)',
  admin_email: 'Email de notificaciones',
}

export default function ConfigForm({ configByGroup, paymentMethods }: ConfigFormProps) {
  const router = useRouter()
  const [config, setConfig] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    Object.values(configByGroup).flat().forEach(item => {
      initial[item.key] = item.value
    })
    return initial
  })

  const [methods, setMethods] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    paymentMethods.forEach(m => {
      initial[m.method] = m.isEnabled
    })
    return initial
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSaving(true)

    try {
      // Guardar configuracion general
      const configResponse = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, paymentMethods: methods }),
      })

      if (!configResponse.ok) {
        const data = await configResponse.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setSuccess(true)
      router.refresh()

      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleConfigChange = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleMethodToggle = (method: string) => {
    setMethods(prev => ({ ...prev, [method]: !prev[method] }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          Configuracion guardada correctamente
        </div>
      )}

      {/* Configuracion por grupos */}
      {Object.entries(configByGroup).map(([group, items]) => (
        <div key={group} className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {groupLabels[group] || group}
          </h2>
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {keyLabels[item.key] || item.key}
                </label>
                <input
                  type="text"
                  value={config[item.key] || ''}
                  onChange={(e) => handleConfigChange(item.key, e.target.value)}
                  className="input"
                />
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Metodos de pago */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Metodos de Pago</h2>
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <label
              key={method.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {method.displayName || method.method}
                </p>
                {method.description && (
                  <p className="text-sm text-gray-500">{method.description}</p>
                )}
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={methods[method.method] || false}
                  onChange={() => handleMethodToggle(method.method)}
                  className="sr-only"
                />
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${
                    methods[method.method] ? 'bg-yellow-400' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      methods[method.method] ? 'translate-x-5' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
