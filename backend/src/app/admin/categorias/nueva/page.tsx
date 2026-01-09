'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ParentCategory {
  id: string
  name: string
  menuSection: string | null
}

export default function NuevaCategoriaPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [parentId, setParentId] = useState('')
  const [menuSection, setMenuSection] = useState<string>('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isActive, setIsActive] = useState(true)

  const [parents, setParents] = useState<ParentCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Cargar categorías padre
  useEffect(() => {
    async function loadParents() {
      try {
        const response = await fetch('/api/admin/categories')
        if (response.ok) {
          const data = await response.json()
          // Solo categorías sin padre pueden ser padres
          setParents(data.categories.filter((c: ParentCategory & { parentId: string | null }) => !c.parentId))
        }
      } catch (err) {
        console.error('Error loading parents:', err)
      }
    }
    loadParents()
  }, [])

  // Auto-generar slug desde nombre
  const handleNameChange = (value: string) => {
    setName(value)
    // Generar slug: minúsculas, sin acentos, espacios a guiones
    const generatedSlug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    setSlug(generatedSlug)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          description: description || null,
          imageUrl: imageUrl || null,
          parentId: parentId || null,
          menuSection: menuSection || null,
          displayOrder,
          isActive,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear categoría')
      }

      router.push('/admin/categorias')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear')
      setLoading(false)
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
          <h1 className="text-2xl font-bold text-gray-900">Nueva Categoria</h1>
          <p className="text-gray-500 mt-1">Crear una nueva categoria para la tienda</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info basica */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion Basica</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input"
                placeholder="Ej: Running, Juegos de Mesa..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL (Slug) *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="input font-mono"
                placeholder="ej: running"
                pattern="^[a-z0-9-]+$"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Solo letras minusculas, numeros y guiones. URL: /{slug || 'slug'}
              </p>
            </div>
          </div>
        </div>

        {/* Jerarquía */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Jerarquia</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Seccion del Menu
              </label>
              <select
                value={menuSection}
                onChange={(e) => setMenuSection(e.target.value)}
                className="input"
              >
                <option value="">Sin seccion (subcategoria)</option>
                <option value="deportes">Deportes</option>
                <option value="juguetes">Juguetes</option>
                <option value="hobbies">Hobbies</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Las categorias principales van en una seccion. Las subcategorias no.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria Padre
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="input"
              >
                <option value="">Sin padre (categoria principal)</option>
                {parents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name} ({parent.menuSection || 'otros'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Orden de Visualizacion
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
                className="input w-32"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Las categorias con numero menor aparecen primero
              </p>
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
                alt="Preview"
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
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
            />
            <span className="text-gray-700">Categoria activa</span>
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Las categorias inactivas no se muestran en el menu ni en la tienda
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50"
          >
            {loading ? 'Creando...' : 'Crear Categoria'}
          </button>
          <Link href="/admin/categorias" className="btn btn-outline">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
