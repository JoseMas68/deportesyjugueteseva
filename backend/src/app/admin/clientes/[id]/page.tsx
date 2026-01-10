'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface CustomerAddress {
  id: string
  type: string
  label: string | null
  isDefault: boolean
  firstName: string
  lastName: string
  company: string | null
  address: string
  addressLine2: string | null
  city: string
  province: string | null
  postalCode: string
  country: string
  phone: string | null
}

interface WishlistItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  productImage: string | null
  productPrice: string
  addedAt: string
}

interface Customer {
  id: string
  email: string
  supabaseId: string | null
  firstName: string
  lastName: string
  phone: string | null
  taxId: string | null
  birthDate: string | null
  isActive: boolean
  isVip: boolean
  vipSince: string | null
  loyaltyPoints: number
  acceptsMarketing: boolean
  notes: string | null
  addresses: CustomerAddress[]
  wishlist: WishlistItem[]
  totalOrders: number
  totalSpent: string
  lastOrderAt: string | null
  createdAt: string
  updatedAt: string
}

interface Order {
  id: string
  orderNumber: string
  status: string
  total: string
  createdAt: string
  items: { productName: string; quantity: number }[]
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.id as string

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'addresses' | 'wishlist'>('info')

  // Estado de edición
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<Partial<Customer>>({})

  // Modal de dirección
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null)
  const [addressForm, setAddressForm] = useState({
    type: 'shipping',
    label: '',
    isDefault: false,
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
  })

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`)
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      setCustomer(data.customer)
      setOrders(data.orders || [])
      setEditData({
        firstName: data.customer.firstName,
        lastName: data.customer.lastName,
        phone: data.customer.phone,
        taxId: data.customer.taxId,
        birthDate: data.customer.birthDate?.split('T')[0] || '',
        isActive: data.customer.isActive,
        isVip: data.customer.isVip,
        loyaltyPoints: data.customer.loyaltyPoints,
        acceptsMarketing: data.customer.acceptsMarketing,
        notes: data.customer.notes,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomer()
  }, [customerId])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setCustomer(data.customer)
      setEditMode(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres eliminar este cliente? Esta acción no se puede deshacer.')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      router.push('/admin/clientes')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleSaveAddress = async () => {
    try {
      const url = editingAddress
        ? `/api/admin/customers/${customerId}/addresses/${editingAddress.id}`
        : `/api/admin/customers/${customerId}/addresses`

      const res = await fetch(url, {
        method: editingAddress ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setShowAddressModal(false)
      setEditingAddress(null)
      fetchCustomer()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al guardar dirección')
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('¿Eliminar esta dirección?')) return

    try {
      const res = await fetch(`/api/admin/customers/${customerId}/addresses/${addressId}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      fetchCustomer()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const openAddressModal = (address?: CustomerAddress) => {
    if (address) {
      setEditingAddress(address)
      setAddressForm({
        type: address.type,
        label: address.label || '',
        isDefault: address.isDefault,
        firstName: address.firstName,
        lastName: address.lastName,
        company: address.company || '',
        address: address.address,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        province: address.province || '',
        postalCode: address.postalCode,
        country: address.country,
        phone: address.phone || '',
      })
    } else {
      setEditingAddress(null)
      setAddressForm({
        type: 'shipping',
        label: '',
        isDefault: false,
        firstName: customer?.firstName || '',
        lastName: customer?.lastName || '',
        company: '',
        address: '',
        addressLine2: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'España',
        phone: customer?.phone || '',
      })
    }
    setShowAddressModal(true)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
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

  const statusLabels: Record<string, { label: string; class: string }> = {
    PENDING: { label: 'Pendiente', class: 'badge-warning' },
    PAID: { label: 'Pagado', class: 'badge-info' },
    PROCESSING: { label: 'Preparando', class: 'badge-info' },
    SHIPPED: { label: 'Enviado', class: 'badge-info' },
    DELIVERED: { label: 'Entregado', class: 'badge-success' },
    CANCELLED: { label: 'Cancelado', class: 'badge-danger' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-eva-yellow"></div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold text-gray-900">Cliente no encontrado</h2>
        <Link href="/admin/clientes" className="text-eva-yellow hover:underline mt-2 block">
          Volver a clientes
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/clientes"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
              customer.isVip ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {customer.firstName[0]}{customer.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {customer.firstName} {customer.lastName}
                </h1>
                {customer.isVip && (
                  <span className="badge badge-warning">VIP</span>
                )}
                <span className={`badge ${customer.isActive ? 'badge-success' : 'badge-secondary'}`}>
                  {customer.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-gray-500">{customer.email}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <button
                onClick={() => setEditMode(false)}
                className="btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="btn btn-outline"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-4 gap-4">
        <div className="admin-card text-center">
          <p className="text-3xl font-bold text-gray-900">{customer.totalOrders}</p>
          <p className="text-sm text-gray-500">Pedidos</p>
        </div>
        <div className="admin-card text-center">
          <p className="text-3xl font-bold text-green-600">{formatMoney(customer.totalSpent)}</p>
          <p className="text-sm text-gray-500">Total Gastado</p>
        </div>
        <div className="admin-card text-center">
          <p className="text-3xl font-bold text-amber-600">{customer.loyaltyPoints}</p>
          <p className="text-sm text-gray-500">Puntos</p>
        </div>
        <div className="admin-card text-center">
          <p className="text-3xl font-bold text-gray-900">{customer.wishlist.length}</p>
          <p className="text-sm text-gray-500">En Wishlist</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {(['info', 'orders', 'addresses', 'wishlist'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-eva-yellow text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'info' && 'Información'}
              {tab === 'orders' && `Pedidos (${orders.length})`}
              {tab === 'addresses' && `Direcciones (${customer.addresses.length})`}
              {tab === 'wishlist' && `Wishlist (${customer.wishlist.length})`}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="admin-card">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              {editMode ? (
                <input
                  type="text"
                  value={editData.firstName || ''}
                  onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900">{customer.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
              {editMode ? (
                <input
                  type="text"
                  value={editData.lastName || ''}
                  onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900">{customer.lastName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900">{customer.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              {editMode ? (
                <input
                  type="tel"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900">{customer.phone || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI/NIE</label>
              {editMode ? (
                <input
                  type="text"
                  value={editData.taxId || ''}
                  onChange={(e) => setEditData({ ...editData, taxId: e.target.value })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900">{customer.taxId || '-'}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de nacimiento</label>
              {editMode ? (
                <input
                  type="date"
                  value={editData.birthDate || ''}
                  onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900">{formatDate(customer.birthDate)}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puntos de fidelidad</label>
              {editMode ? (
                <input
                  type="number"
                  min="0"
                  value={editData.loyaltyPoints || 0}
                  onChange={(e) => setEditData({ ...editData, loyaltyPoints: parseInt(e.target.value) })}
                  className="input"
                />
              ) : (
                <p className="text-gray-900">{customer.loyaltyPoints}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente desde</label>
              <p className="text-gray-900">{formatDate(customer.createdAt)}</p>
            </div>
            {editMode && (
              <>
                <div className="col-span-2">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.isActive}
                        onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                        className="w-4 h-4 text-eva-yellow rounded focus:ring-eva-yellow"
                      />
                      <span className="text-sm text-gray-700">Activo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.isVip}
                        onChange={(e) => setEditData({ ...editData, isVip: e.target.checked })}
                        className="w-4 h-4 text-eva-yellow rounded focus:ring-eva-yellow"
                      />
                      <span className="text-sm text-gray-700">Cliente VIP</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editData.acceptsMarketing}
                        onChange={(e) => setEditData({ ...editData, acceptsMarketing: e.target.checked })}
                        className="w-4 h-4 text-eva-yellow rounded focus:ring-eva-yellow"
                      />
                      <span className="text-sm text-gray-700">Acepta marketing</span>
                    </label>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
              </>
            )}
            {!editMode && customer.notes && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas internas</label>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="admin-card">
          {orders.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Este cliente no tiene pedidos</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Estado</th>
                  <th>Productos</th>
                  <th>Total</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium">{order.orderNumber}</td>
                    <td>
                      <span className={`badge ${statusLabels[order.status]?.class || 'badge-secondary'}`}>
                        {statusLabels[order.status]?.label || order.status}
                      </span>
                    </td>
                    <td className="text-sm text-gray-500">
                      {order.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                    </td>
                    <td className="font-medium">{formatMoney(order.total)}</td>
                    <td className="text-sm text-gray-500">{formatDate(order.createdAt)}</td>
                    <td>
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-eva-yellow hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'addresses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openAddressModal()}
              className="btn btn-primary btn-sm"
            >
              Nueva Dirección
            </button>
          </div>
          {customer.addresses.length === 0 ? (
            <div className="admin-card text-center text-gray-500 py-8">
              Este cliente no tiene direcciones guardadas
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {customer.addresses.map((address) => (
                <div key={address.id} className="admin-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`badge ${address.type === 'shipping' ? 'badge-info' : 'badge-secondary'}`}>
                        {address.type === 'shipping' ? 'Envío' : 'Facturación'}
                      </span>
                      {address.isDefault && (
                        <span className="badge badge-success">Por defecto</span>
                      )}
                      {address.label && (
                        <span className="text-sm text-gray-500">{address.label}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openAddressModal(address)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="font-medium">{address.firstName} {address.lastName}</p>
                  {address.company && <p className="text-gray-500">{address.company}</p>}
                  <p className="text-gray-700">{address.address}</p>
                  {address.addressLine2 && <p className="text-gray-700">{address.addressLine2}</p>}
                  <p className="text-gray-700">{address.postalCode} {address.city}</p>
                  {address.province && <p className="text-gray-700">{address.province}</p>}
                  <p className="text-gray-700">{address.country}</p>
                  {address.phone && <p className="text-gray-500 mt-2">{address.phone}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'wishlist' && (
        <div className="admin-card">
          {customer.wishlist.length === 0 ? (
            <p className="text-center text-gray-500 py-8">La wishlist está vacía</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {customer.wishlist.map((item) => (
                <div key={item.id} className="border rounded-lg p-3">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-full h-32 object-cover rounded mb-2"
                    />
                  )}
                  <p className="font-medium text-sm line-clamp-2">{item.productName}</p>
                  <p className="text-eva-yellow font-bold">{formatMoney(item.productPrice)}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Añadido {formatDate(item.addedAt)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Dirección */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select
                    value={addressForm.type}
                    onChange={(e) => setAddressForm({ ...addressForm, type: e.target.value })}
                    className="input"
                  >
                    <option value="shipping">Envío</option>
                    <option value="billing">Facturación</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
                  <input
                    type="text"
                    value={addressForm.label}
                    onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                    className="input"
                    placeholder="Ej: Casa, Trabajo..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={addressForm.firstName}
                    onChange={(e) => setAddressForm({ ...addressForm, firstName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                  <input
                    type="text"
                    value={addressForm.lastName}
                    onChange={(e) => setAddressForm({ ...addressForm, lastName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <input
                  type="text"
                  value={addressForm.company}
                  onChange={(e) => setAddressForm({ ...addressForm, company: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <input
                  type="text"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Piso, puerta, etc.</label>
                <input
                  type="text"
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                  className="input"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">C.P. *</label>
                  <input
                    type="text"
                    value={addressForm.postalCode}
                    onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                  <input
                    type="text"
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="input"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 text-eva-yellow rounded focus:ring-eva-yellow"
                />
                <span className="text-sm text-gray-700">Usar como dirección por defecto</span>
              </label>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowAddressModal(false)
                    setEditingAddress(null)
                  }}
                  className="btn btn-outline"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAddress}
                  className="btn btn-primary"
                >
                  {editingAddress ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
