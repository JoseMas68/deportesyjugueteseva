'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// Toast simple
interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  isActive: boolean
  isVip: boolean
  loyaltyPoints: number
  totalOrders: number
  totalSpent: string
  lastOrderAt: string | null
  acceptsMarketing: boolean
  createdAt: string
  _count: {
    wishlist: number
    addresses: number
  }
}

interface NewCustomerAddress {
  type: 'shipping' | 'billing'
  label: string
  firstName: string
  lastName: string
  company: string
  address: string
  addressLine2: string
  city: string
  province: string
  postalCode: string
  country: string
  phone: string
  isDefault: boolean
}

interface NewCustomer {
  email: string
  firstName: string
  lastName: string
  phone: string
  taxId: string
  birthDate: string
  isVip: boolean
  acceptsMarketing: boolean
  notes: string
  // Dirección de envío
  shippingAddress: NewCustomerAddress
  // Dirección de facturación (opcional, si es diferente)
  useSameAddress: boolean
  billingAddress: NewCustomerAddress
}

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sistema de toasts
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  // Filtros y paginación
  const [search, setSearch] = useState('')
  const [isVipFilter, setIsVipFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Modal de nuevo cliente
  const [showNewModal, setShowNewModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'datos' | 'envio' | 'facturacion'>('datos')
  const emptyAddress: NewCustomerAddress = {
    type: 'shipping',
    label: '',
    firstName: '',
    lastName: '',
    company: '',
    address: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'España',
    phone: '',
    isDefault: true,
  }
  const [newCustomer, setNewCustomer] = useState<NewCustomer>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    taxId: '',
    birthDate: '',
    isVip: false,
    acceptsMarketing: false,
    notes: '',
    shippingAddress: { ...emptyAddress, type: 'shipping', label: 'Casa' },
    useSameAddress: true,
    billingAddress: { ...emptyAddress, type: 'billing', label: 'Facturación' },
  })
  const [creating, setCreating] = useState(false)

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (search) params.append('search', search)
      if (isVipFilter) params.append('isVip', isVipFilter)

      const res = await fetch(`/api/admin/customers?${params}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setCustomers(data.customers)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [page, isVipFilter])

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchCustomers()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowNewModal(false)
      setActiveTab('datos')
      setNewCustomer({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        taxId: '',
        birthDate: '',
        isVip: false,
        acceptsMarketing: false,
        notes: '',
        shippingAddress: { ...emptyAddress, type: 'shipping', label: 'Casa' },
        useSameAddress: true,
        billingAddress: { ...emptyAddress, type: 'billing', label: 'Facturación' },
      })
      fetchCustomers()
      showToast('Cliente creado correctamente', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al crear cliente', 'error')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatMoney = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">
            {total} cliente{total !== 1 ? 's' : ''} en total
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="btn btn-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="admin-card">
        <div className="flex flex-wrap gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>

          {/* Filtro VIP */}
          <select
            value={isVipFilter}
            onChange={(e) => {
              setIsVipFilter(e.target.value)
              setPage(1)
            }}
            className="input w-auto"
          >
            <option value="">Todos los clientes</option>
            <option value="true">Solo VIP</option>
            <option value="false">No VIP</option>
          </select>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="admin-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eva-yellow"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay clientes</h3>
            <p className="mt-1 text-sm text-gray-500">
              {search ? 'No se encontraron clientes con esa búsqueda' : 'Comienza añadiendo un cliente'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Pedidos</th>
                  <th>Total Gastado</th>
                  <th>Puntos</th>
                  <th>Último Pedido</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          customer.isVip ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {customer.firstName[0]}{customer.lastName[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {customer.firstName} {customer.lastName}
                            </p>
                            {customer.isVip && (
                              <span className="badge badge-warning text-xs">VIP</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{customer.email}</p>
                          {customer.phone && (
                            <p className="text-xs text-gray-400">{customer.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${customer.isActive ? 'badge-success' : 'badge-secondary'}`}>
                        {customer.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                      {customer.acceptsMarketing && (
                        <span className="badge badge-info ml-1 text-xs">Marketing</span>
                      )}
                    </td>
                    <td>
                      <span className="font-medium">{customer.totalOrders}</span>
                    </td>
                    <td>
                      <span className="font-medium text-green-600">
                        {formatMoney(customer.totalSpent)}
                      </span>
                    </td>
                    <td>
                      <span className={`font-medium ${customer.loyaltyPoints > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                        {customer.loyaltyPoints}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {formatDate(customer.lastOrderAt)}
                    </td>
                    <td>
                      <Link
                        href={`/admin/clientes/${customer.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        Ver detalles
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn btn-outline btn-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn btn-outline btn-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal Nuevo Cliente */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Nuevo Cliente</h2>
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Tabs */}
              <div className="flex gap-4 mt-4 border-b border-gray-200 -mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('datos')}
                  className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'datos'
                      ? 'border-eva-yellow text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Datos Personales
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('envio')}
                  className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'envio'
                      ? 'border-eva-yellow text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Dirección de Envío
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('facturacion')}
                  className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'facturacion'
                      ? 'border-eva-yellow text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Facturación
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateCustomer} className="p-6 space-y-4">
              {/* Tab: Datos Personales */}
              {activeTab === 'datos' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={newCustomer.firstName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, firstName: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={newCustomer.lastName}
                        onChange={(e) => setNewCustomer({ ...newCustomer, lastName: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        className="input"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        className="input"
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        DNI/NIF/NIE
                      </label>
                      <input
                        type="text"
                        value={newCustomer.taxId}
                        onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value.toUpperCase() })}
                        className="input"
                        placeholder="12345678A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de nacimiento
                      </label>
                      <input
                        type="date"
                        value={newCustomer.birthDate}
                        onChange={(e) => setNewCustomer({ ...newCustomer, birthDate: e.target.value })}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCustomer.isVip}
                        onChange={(e) => setNewCustomer({ ...newCustomer, isVip: e.target.checked })}
                        className="w-4 h-4 text-eva-yellow rounded focus:ring-eva-yellow"
                      />
                      <span className="text-sm text-gray-700">Cliente VIP</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCustomer.acceptsMarketing}
                        onChange={(e) => setNewCustomer({ ...newCustomer, acceptsMarketing: e.target.checked })}
                        className="w-4 h-4 text-eva-yellow rounded focus:ring-eva-yellow"
                      />
                      <span className="text-sm text-gray-700">Acepta marketing</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas internas
                    </label>
                    <textarea
                      value={newCustomer.notes}
                      onChange={(e) => setNewCustomer({ ...newCustomer, notes: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="Notas internas sobre el cliente..."
                    />
                  </div>
                </>
              )}

              {/* Tab: Dirección de Envío */}
              {activeTab === 'envio' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-700">
                      Esta será la dirección principal de envío del cliente.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Etiqueta
                      </label>
                      <input
                        type="text"
                        value={newCustomer.shippingAddress.label}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, label: e.target.value }
                        })}
                        className="input"
                        placeholder="Casa, Trabajo, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Empresa (opcional)
                      </label>
                      <input
                        type="text"
                        value={newCustomer.shippingAddress.company}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, company: e.target.value }
                        })}
                        className="input"
                        placeholder="Nombre de empresa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre *
                      </label>
                      <input
                        type="text"
                        value={newCustomer.shippingAddress.firstName}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, firstName: e.target.value }
                        })}
                        className="input"
                        placeholder="Nombre del destinatario"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apellidos *
                      </label>
                      <input
                        type="text"
                        value={newCustomer.shippingAddress.lastName}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, lastName: e.target.value }
                        })}
                        className="input"
                        placeholder="Apellidos del destinatario"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      value={newCustomer.shippingAddress.address}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer,
                        shippingAddress: { ...newCustomer.shippingAddress, address: e.target.value }
                      })}
                      className="input"
                      placeholder="Calle, número"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Piso, puerta, escalera (opcional)
                    </label>
                    <input
                      type="text"
                      value={newCustomer.shippingAddress.addressLine2}
                      onChange={(e) => setNewCustomer({
                        ...newCustomer,
                        shippingAddress: { ...newCustomer.shippingAddress, addressLine2: e.target.value }
                      })}
                      className="input"
                      placeholder="2º B, Escalera izquierda"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código Postal *
                      </label>
                      <input
                        type="text"
                        value={newCustomer.shippingAddress.postalCode}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, postalCode: e.target.value }
                        })}
                        className="input"
                        placeholder="28001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ciudad *
                      </label>
                      <input
                        type="text"
                        value={newCustomer.shippingAddress.city}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, city: e.target.value }
                        })}
                        className="input"
                        placeholder="Madrid"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provincia
                      </label>
                      <input
                        type="text"
                        value={newCustomer.shippingAddress.province}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, province: e.target.value }
                        })}
                        className="input"
                        placeholder="Madrid"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        País
                      </label>
                      <select
                        value={newCustomer.shippingAddress.country}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, country: e.target.value }
                        })}
                        className="input"
                      >
                        <option value="España">España</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Francia">Francia</option>
                        <option value="Andorra">Andorra</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono de contacto
                      </label>
                      <input
                        type="tel"
                        value={newCustomer.shippingAddress.phone}
                        onChange={(e) => setNewCustomer({
                          ...newCustomer,
                          shippingAddress: { ...newCustomer.shippingAddress, phone: e.target.value }
                        })}
                        className="input"
                        placeholder="+34 600 000 000"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Tab: Facturación */}
              {activeTab === 'facturacion' && (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-amber-700">
                      Datos para la emisión de facturas. El DNI/NIF se configura en la pestaña de datos personales.
                    </p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer mb-4">
                    <input
                      type="checkbox"
                      checked={newCustomer.useSameAddress}
                      onChange={(e) => setNewCustomer({ ...newCustomer, useSameAddress: e.target.checked })}
                      className="w-4 h-4 text-eva-yellow rounded focus:ring-eva-yellow"
                    />
                    <span className="text-sm text-gray-700">Usar la misma dirección de envío para facturación</span>
                  </label>

                  {!newCustomer.useSameAddress && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre/Razón Social *
                          </label>
                          <input
                            type="text"
                            value={newCustomer.billingAddress.firstName}
                            onChange={(e) => setNewCustomer({
                              ...newCustomer,
                              billingAddress: { ...newCustomer.billingAddress, firstName: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Apellidos
                          </label>
                          <input
                            type="text"
                            value={newCustomer.billingAddress.lastName}
                            onChange={(e) => setNewCustomer({
                              ...newCustomer,
                              billingAddress: { ...newCustomer.billingAddress, lastName: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Empresa (para facturas a empresa)
                        </label>
                        <input
                          type="text"
                          value={newCustomer.billingAddress.company}
                          onChange={(e) => setNewCustomer({
                            ...newCustomer,
                            billingAddress: { ...newCustomer.billingAddress, company: e.target.value }
                          })}
                          className="input"
                          placeholder="Nombre de la empresa"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Dirección de facturación *
                        </label>
                        <input
                          type="text"
                          value={newCustomer.billingAddress.address}
                          onChange={(e) => setNewCustomer({
                            ...newCustomer,
                            billingAddress: { ...newCustomer.billingAddress, address: e.target.value }
                          })}
                          className="input"
                          placeholder="Calle, número"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Piso, puerta (opcional)
                        </label>
                        <input
                          type="text"
                          value={newCustomer.billingAddress.addressLine2}
                          onChange={(e) => setNewCustomer({
                            ...newCustomer,
                            billingAddress: { ...newCustomer.billingAddress, addressLine2: e.target.value }
                          })}
                          className="input"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Código Postal *
                          </label>
                          <input
                            type="text"
                            value={newCustomer.billingAddress.postalCode}
                            onChange={(e) => setNewCustomer({
                              ...newCustomer,
                              billingAddress: { ...newCustomer.billingAddress, postalCode: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ciudad *
                          </label>
                          <input
                            type="text"
                            value={newCustomer.billingAddress.city}
                            onChange={(e) => setNewCustomer({
                              ...newCustomer,
                              billingAddress: { ...newCustomer.billingAddress, city: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Provincia
                          </label>
                          <input
                            type="text"
                            value={newCustomer.billingAddress.province}
                            onChange={(e) => setNewCustomer({
                              ...newCustomer,
                              billingAddress: { ...newCustomer.billingAddress, province: e.target.value }
                            })}
                            className="input"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          País
                        </label>
                        <select
                          value={newCustomer.billingAddress.country}
                          onChange={(e) => setNewCustomer({
                            ...newCustomer,
                            billingAddress: { ...newCustomer.billingAddress, country: e.target.value }
                          })}
                          className="input"
                        >
                          <option value="España">España</option>
                          <option value="Portugal">Portugal</option>
                          <option value="Francia">Francia</option>
                          <option value="Andorra">Andorra</option>
                        </select>
                      </div>
                    </>
                  )}

                  {newCustomer.useSameAddress && (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2">Se usará la dirección de envío para facturación</p>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="flex gap-2">
                  {activeTab !== 'datos' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'facturacion' ? 'envio' : 'datos')}
                      className="btn btn-outline"
                    >
                      Anterior
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewModal(false)}
                    className="btn btn-outline"
                  >
                    Cancelar
                  </button>
                  {activeTab !== 'facturacion' ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab(activeTab === 'datos' ? 'envio' : 'facturacion')}
                      className="btn btn-primary"
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={creating}
                      className="btn btn-primary"
                    >
                      {creating ? 'Creando...' : 'Crear Cliente'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-slide-in ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{toast.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="ml-2 hover:opacity-75"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
