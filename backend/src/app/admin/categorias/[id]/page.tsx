'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  isFeatured: boolean
  parentId: string | null
}

export default function EditarCategoriaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [category, setCategory] = useState<Category | null>(null)
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [isFeatured, setIsFeatured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function loadCategory() {
      try {
        const response = await fetch(`/api/admin/categories/${id}`)
        if (!response.ok) throw new Error('Categoria no encontrada')
        const data = await response.json()
        setCategory(data.category)
        setDescription(data.category.description || '')
        setImageUrl(data.category.imageUrl || '')
        setIsActive(data.category.isActive)
        setIsFeatured(data.category.isFeatured)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar')
      } finally {
        setLoading(false)
      }
    }

    loadCategory()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, imageUrl, isActive, isFeatured }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar')
      }

      router.push('/admin/categorias')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setSaving(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('files', files[0])

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir imagen')
      }

      setImageUrl(data.urls[0])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!category) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Categoria no encontrada</p>
        <Link href="/admin/categorias" className="text-yellow-600 hover:underline mt-2 inline-block">
          Volver a categorias
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/categorias"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Categoria</h1>
          <p className="text-gray-500 mt-1">{category.name}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info basica (solo lectura) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={category.name}
                className="input bg-gray-100"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">El nombre no se puede modificar</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL (Slug)
              </label>
              <input
                type="text"
                value={`/${category.slug}`}
                className="input bg-gray-100 font-mono"
                disabled
              />
            </div>
          </div>
        </div>

        {/* Descripcion */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Descripcion</h2>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input min-h-[120px]"
            placeholder="Describe esta categoria..."
          />
        </div>

        {/* Imagen */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Imagen</h2>

          {imageUrl && (
            <div className="mb-4">
              <img
                src={imageUrl}
                alt={category.name}
                className="w-full max-w-xs h-48 object-cover rounded-lg"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="input flex-1"
              placeholder="URL de la imagen"
            />
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="btn btn-outline cursor-pointer"
              >
                {uploading ? 'Subiendo...' : 'Subir'}
              </label>
            </div>
          </div>
        </div>

        {/* Estado */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
              />
              <span className="text-gray-700">Categoria activa</span>
            </label>
            <p className="text-sm text-gray-500">
              Las categorias inactivas no se muestran en el menu ni en la tienda
            </p>

            {/* Destacada - solo para subcategorías */}
            {category.parentId && (
              <>
                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                    />
                    <div className="flex items-center gap-2">
                      <svg
                        className={`w-5 h-5 ${isFeatured ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`}
                        fill={isFeatured ? 'currentColor' : 'none'}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                      <span className="text-gray-700">Categoria destacada</span>
                    </div>
                  </label>
                  <p className="text-sm text-gray-500 mt-2">
                    Las categorias destacadas aparecen en el slider de la pagina principal
                  </p>
                </div>
              </>
            )}
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
          <Link href="/admin/categorias" className="btn btn-outline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
