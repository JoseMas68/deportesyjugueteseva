'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ProductVariant {
  id: string
  size: string | null
  color: string | null
  colorHex: string | null
  stock: number
}

interface Product {
  id: string
  name: string
  sku: string | null
  thumbnailUrl: string | null
  price: number | string
  compareAtPrice: number | string | null
  stock: number
  isActive: boolean
  hasVariants: boolean
  category: { id: string; name: string }
  brand: { id: string; name: string } | null
  variants: ProductVariant[]
}

interface ProductListProps {
  products: Product[]
}

export default function ProductList({ products }: ProductListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

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

  const handleBulkAction = async (action: 'trash' | 'restore' | 'delete') => {
    if (selectedIds.size === 0) return

    const count = selectedIds.size
    const messages = {
      trash: `¿Mover ${count} producto${count > 1 ? 's' : ''} a la papelera?`,
      restore: `¿Restaurar ${count} producto${count > 1 ? 's' : ''} de la papelera?`,
      delete: `¿Eliminar permanentemente ${count} producto${count > 1 ? 's' : ''}? Esta accion no se puede deshacer.`,
    }

    if (!confirm(messages[action])) {
      return
    }

    setDeleting(true)
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
      setDeleting(false)
    }
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
              onClick={() => handleBulkAction('trash')}
              disabled={deleting}
              className="btn btn-danger btn-sm"
            >
              {deleting ? 'Moviendo...' : 'Mover a papelera'}
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
            <th>Stock</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product) => (
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
                        className="w-12 h-12 object-cover rounded-lg"
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
                <td className="text-gray-500 font-mono text-sm">{product.sku}</td>
                <td className="text-gray-500">{product.category.name}</td>
                <td>
                  <div>
                    <span className="font-medium">{Number(product.price).toFixed(2)} €</span>
                    {product.compareAtPrice && (
                      <span className="text-sm text-gray-400 line-through ml-2">
                        {Number(product.compareAtPrice).toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                <td>
                  <div>
                    <span className={`font-medium ${
                      product.stock === 0
                        ? 'text-red-600'
                        : product.stock < 5
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}>
                      {product.stock}
                    </span>
                    {product.hasVariants && product.variants.length > 0 && (
                      <div className="mt-1 text-xs text-gray-500 max-w-[200px]">
                        {product.variants.slice(0, 3).map((v, i) => {
                          const label = [v.size, v.color].filter(Boolean).join(' ') || `Var ${i + 1}`
                          const stockClass = v.stock === 0 ? 'text-red-500' : v.stock < 3 ? 'text-yellow-600' : 'text-gray-600'
                          return (
                            <span key={v.id} className="inline-flex items-center mr-2">
                              {v.colorHex && (
                                <span
                                  className="w-2 h-2 rounded-full mr-1 border border-gray-300"
                                  style={{ backgroundColor: v.colorHex }}
                                />
                              )}
                              <span className={stockClass}>{label}: {v.stock}</span>
                            </span>
                          )
                        })}
                        {product.variants.length > 3 && (
                          <span className="text-gray-400">+{product.variants.length - 3} mas</span>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  {product.isActive ? (
                    <span className="badge badge-success">Activo</span>
                  ) : (
                    <span className="badge badge-danger">Inactivo</span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/admin/productos/${product.id}`}
                    className="text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Editar
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="text-center py-12 text-gray-500">
                No se encontraron productos
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
