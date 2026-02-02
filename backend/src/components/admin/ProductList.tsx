'use client'

import { useState, useEffect } from 'react'
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

interface ProductTag {
  id: string
  name: string
  color: string | null
}

interface ProductListProps {
  products: Product[]
}

export default function ProductList({ products }: ProductListProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [availableTags, setAvailableTags] = useState<ProductTag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set())
  const [tagAction, setTagAction] = useState<'add' | 'remove' | 'set'>('add')
  const [applyingTags, setApplyingTags] = useState(false)

  // Cargar etiquetas disponibles
  useEffect(() => {
    async function loadTags() {
      try {
        const response = await fetch('/api/product-tags?active=true')
        if (response.ok) {
          const data = await response.json()
          setAvailableTags(data)
        }
      } catch (error) {
        console.error('Error loading tags:', error)
      }
    }
    loadTags()
  }, [])

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

  const handleBulkTags = async () => {
    if (selectedIds.size === 0 || selectedTagIds.size === 0) return

    setApplyingTags(true)
    try {
      const response = await fetch('/api/admin/products/bulk-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productIds: Array.from(selectedIds),
          tagIds: Array.from(selectedTagIds),
          action: tagAction,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al aplicar etiquetas')
      }

      alert(data.message)
      setSelectedIds(new Set())
      setSelectedTagIds(new Set())
      setShowTagModal(false)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al aplicar etiquetas')
    } finally {
      setApplyingTags(false)
    }
  }

  const toggleTag = (tagId: string) => {
    const newSet = new Set(selectedTagIds)
    if (newSet.has(tagId)) {
      newSet.delete(tagId)
    } else {
      newSet.add(tagId)
    }
    setSelectedTagIds(newSet)
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
            {availableTags.length > 0 && (
              <button
                onClick={() => setShowTagModal(true)}
                className="btn btn-outline btn-sm"
              >
                Etiquetas
              </button>
            )}
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

      {/* Modal de etiquetas */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Asignar etiquetas
              </h3>
              <button
                onClick={() => {
                  setShowTagModal(false)
                  setSelectedTagIds(new Set())
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {selectedIds.size} producto{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
            </p>

            {/* Acción */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Accion</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTagAction('add')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    tagAction === 'add'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  Añadir
                </button>
                <button
                  onClick={() => setTagAction('remove')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    tagAction === 'remove'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  Quitar
                </button>
                <button
                  onClick={() => setTagAction('set')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    tagAction === 'set'
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                      : 'bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200'
                  }`}
                >
                  Reemplazar
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {tagAction === 'add' && 'Añade las etiquetas seleccionadas a los productos'}
                {tagAction === 'remove' && 'Quita las etiquetas seleccionadas de los productos'}
                {tagAction === 'set' && 'Reemplaza todas las etiquetas por las seleccionadas'}
              </p>
            </div>

            {/* Lista de etiquetas */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableTags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedTagIds.has(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                    />
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: tag.color || '#6B7280' }}
                    >
                      {tag.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowTagModal(false)
                  setSelectedTagIds(new Set())
                }}
                className="flex-1 btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkTags}
                disabled={selectedTagIds.size === 0 || applyingTags}
                className="flex-1 btn btn-primary disabled:opacity-50"
              >
                {applyingTags ? 'Aplicando...' : 'Aplicar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
