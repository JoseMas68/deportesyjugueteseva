'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Product {
  id: string
  name: string
  sku: string | null
  thumbnailUrl: string | null
  price: number
  deletedAt: Date
  category: { id: string; name: string }
  brand: { id: string; name: string } | null
}

interface TrashListProps {
  products: Product[]
}

export default function TrashList({ products }: TrashListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)

  const allSelected = products.length > 0 && selectedIds.size === products.length
  const someSelected = selectedIds.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map(p => p.id)))
    }
  }

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  const handleBulkAction = async (action: 'restore' | 'delete') => {
    if (selectedIds.size === 0) return

    const count = selectedIds.size
    const messages = {
      restore: `¿Restaurar ${count} producto${count > 1 ? 's' : ''}?`,
      delete: `¿Eliminar permanentemente ${count} producto${count > 1 ? 's' : ''}? Esta accion no se puede deshacer.`,
    }

    if (!confirm(messages[action])) {
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/admin/products/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), action }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar productos')
      }

      alert(data.message)
      setSelectedIds(new Set())
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al procesar productos')
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Papelera vacia</h3>
          <p className="mt-1 text-sm text-gray-500">
            No hay productos en la papelera.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Barra de acciones masivas */}
      {someSelected && (
        <div className="px-6 py-3 bg-yellow-50 border-b border-yellow-200 flex items-center justify-between">
          <span className="text-sm font-medium text-yellow-800">
            {selectedIds.size} producto{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancelar
            </button>
            <button
              onClick={() => handleBulkAction('restore')}
              disabled={processing}
              className="btn btn-secondary btn-sm"
            >
              {processing ? 'Procesando...' : 'Restaurar'}
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              disabled={processing}
              className="btn btn-danger btn-sm"
            >
              {processing ? 'Procesando...' : 'Eliminar permanentemente'}
            </button>
          </div>
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th className="w-12">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
            </th>
            <th>Producto</th>
            <th>SKU</th>
            <th>Categoria</th>
            <th>Precio</th>
            <th>Eliminado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className={selectedIds.has(product.id) ? 'bg-yellow-50' : ''}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(product.id)}
                  onChange={() => toggleOne(product.id)}
                  className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                />
              </td>
              <td>
                <div className="flex items-center gap-3">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg opacity-50"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    {product.brand && (
                      <p className="text-sm text-gray-500">{product.brand.name}</p>
                    )}
                  </div>
                </div>
              </td>
              <td className="text-gray-500 font-mono text-sm">{product.sku || '-'}</td>
              <td className="text-gray-500">{product.category.name}</td>
              <td className="font-medium">{product.price.toFixed(2)} EUR</td>
              <td className="text-gray-500 text-sm">{formatDate(product.deletedAt)}</td>
              <td>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setSelectedIds(new Set([product.id]))
                      handleBulkAction('restore')
                    }}
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    Restaurar
                  </button>
                  <button
                    onClick={() => {
                      setSelectedIds(new Set([product.id]))
                      handleBulkAction('delete')
                    }}
                    className="text-red-600 hover:text-red-700 font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
