'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Tag {
  id: string
  name: string
  slug: string
  color: string | null
  isActive: boolean
  startDate: Date | null
  endDate: Date | null
  _count: { products: number }
}

interface TagListProps {
  tags: Tag[]
}

export default function TagList({ tags }: TagListProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date))
  }

  const handleDelete = async (tag: Tag) => {
    const productCount = tag._count.products
    const message = productCount > 0
      ? `¿Eliminar la etiqueta "${tag.name}"? Se quitara de ${productCount} producto${productCount > 1 ? 's' : ''}.`
      : `¿Eliminar la etiqueta "${tag.name}"?`

    if (!confirm(message)) return

    setDeletingId(tag.id)
    try {
      const response = await fetch(`/api/product-tags/${tag.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar')
      }

      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar')
    } finally {
      setDeletingId(null)
    }
  }

  if (tags.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Sin etiquetas</h3>
          <p className="mt-1 text-sm text-gray-500">
            Crea etiquetas como "Rebajas", "Navidad", "Black Friday" para agrupar productos.
          </p>
          <div className="mt-6">
            <Link href="/admin/etiquetas/nueva" className="btn btn-primary">
              Crear primera etiqueta
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Etiqueta
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Productos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vigencia
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tags.map((tag) => {
            const now = new Date()
            const isExpired = tag.endDate && new Date(tag.endDate) < now
            const notStarted = tag.startDate && new Date(tag.startDate) > now
            const isDeleting = deletingId === tag.id

            return (
              <tr key={tag.id} className={`hover:bg-gray-50 ${isDeleting ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    {tag.color && (
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                    )}
                    <div>
                      <div className="font-medium text-gray-900">{tag.name}</div>
                      <div className="text-sm text-gray-500">/{tag.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{tag._count.products}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {tag.startDate || tag.endDate ? (
                    <span className={isExpired ? 'text-red-600' : notStarted ? 'text-yellow-600' : ''}>
                      {formatDate(tag.startDate)} - {formatDate(tag.endDate)}
                    </span>
                  ) : (
                    <span className="text-gray-400">Permanente</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {!tag.isActive ? (
                    <span className="badge badge-danger">Inactiva</span>
                  ) : isExpired ? (
                    <span className="badge badge-danger">Expirada</span>
                  ) : notStarted ? (
                    <span className="badge badge-warning">Programada</span>
                  ) : (
                    <span className="badge badge-success">Activa</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/etiquetas/${tag.id}`}
                      className="text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(tag)}
                      disabled={isDeleting}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {isDeleting ? '...' : 'Eliminar'}
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
