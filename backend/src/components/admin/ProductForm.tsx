'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Category {
  id: string
  name: string
}

interface ProductVariant {
  id?: string
  size?: string
  color?: string
  colorHex?: string
  material?: string
  price?: number | null
  stock: number
  sku?: string
  imageUrl?: string
  isActive: boolean
}

interface Product {
  id?: string
  name: string
  slug?: string
  description?: string
  price: number
  compareAtPrice?: number | null
  stock: number
  sku?: string
  categoryId: string
  images: string[]
  thumbnailUrl?: string | null
  brand?: string | null
  isFeatured: boolean
  isNew: boolean
  isBestSeller: boolean
  isActive: boolean
  hasVariants?: boolean
  variants?: ProductVariant[]
}

interface ProductFormProps {
  product?: Product
  categories: Category[]
}

export default function ProductForm({ product, categories }: ProductFormProps) {
  const router = useRouter()
  const isEditing = !!product?.id

  const [formData, setFormData] = useState<Product>({
    name: product?.name || '',
    slug: product?.slug || '',
    description: product?.description || '',
    price: product?.price || 0,
    compareAtPrice: product?.compareAtPrice || null,
    stock: product?.stock || 0,
    sku: product?.sku || '',
    categoryId: product?.categoryId || '',
    images: product?.images || [],
    thumbnailUrl: product?.thumbnailUrl || null,
    brand: product?.brand || '',
    isFeatured: product?.isFeatured || false,
    isNew: product?.isNew || false,
    isBestSeller: product?.isBestSeller || false,
    isActive: product?.isActive ?? true,
    hasVariants: product?.hasVariants || false,
    variants: product?.variants || [],
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)

  // Colores predefinidos
  const colorOptions = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Gris', hex: '#6B7280' },
    { name: 'Rojo', hex: '#EF4444' },
    { name: 'Azul', hex: '#3B82F6' },
    { name: 'Verde', hex: '#22C55E' },
    { name: 'Amarillo', hex: '#EAB308' },
    { name: 'Naranja', hex: '#F97316' },
    { name: 'Rosa', hex: '#EC4899' },
    { name: 'Morado', hex: '#A855F7' },
  ]

  // Tallas predefinidas
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46']

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...(prev.variants || []),
        { size: '', color: '', colorHex: '', material: '', price: null, stock: 0, sku: '', isActive: true },
      ],
    }))
  }

  const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean | null) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants?.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }))
  }

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants?.filter((_, i) => i !== index),
    }))
  }

  const handleColorSelect = (index: number, color: { name: string; hex: string }) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants?.map((v, i) =>
        i === index ? { ...v, color: color.name, colorHex: color.hex } : v
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const url = isEditing
        ? `/api/admin/products/${product.id}`
        : '/api/admin/products'

      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar producto')
      }

      router.push('/admin/productos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!product?.id) return
    if (!confirm('Esta seguro de eliminar este producto?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar')
      }

      router.push('/admin/productos')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)
    setUploadProgress(`Subiendo ${files.length} imagen${files.length > 1 ? 'es' : ''}...`)

    try {
      const formDataUpload = new FormData()
      Array.from(files).forEach(file => {
        formDataUpload.append('files', file)
      })

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      const data = await response.json()

      if (!response.ok) {
        // Mostrar detalles del error si existen
        const errorMsg = data.details
          ? `${data.error}: ${data.details.join(', ')}`
          : data.error || 'Error al subir imagenes'
        throw new Error(errorMsg)
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...data.urls],
        thumbnailUrl: prev.thumbnailUrl || data.urls[0],
      }))

      // Mostrar advertencias si hay errores parciales
      if (data.errors && data.errors.length > 0) {
        setError(`Algunas imagenes no se subieron: ${data.errors.join(', ')}`)
      }

      setUploadProgress(null)
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Error al subir imagenes')
      setUploadProgress(null)
    } finally {
      setUploading(false)
      // Reset input para permitir subir el mismo archivo de nuevo
      e.target.value = ''
    }
  }

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.images.length) return
    setFormData(prev => {
      const newImages = [...prev.images]
      const [removed] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, removed)
      return { ...prev, images: newImages }
    })
  }

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index)
      return {
        ...prev,
        images: newImages,
        thumbnailUrl: prev.thumbnailUrl === prev.images[index]
          ? newImages[0] || null
          : prev.thumbnailUrl,
      }
    })
  }

  const setAsThumbnail = (url: string) => {
    setFormData(prev => ({ ...prev, thumbnailUrl: url }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informacion basica */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion Basica</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="input"
                  placeholder="Se genera automaticamente si se deja vacio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripcion
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[120px]"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Imagenes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Imagenes</h2>
              <span className="text-sm text-gray-500">{formData.images.length} imagen{formData.images.length !== 1 ? 'es' : ''}</span>
            </div>

            <div className="space-y-4">
              {/* Imagen principal grande */}
              {formData.thumbnailUrl && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Imagen Principal</label>
                  <div className="relative w-full max-w-md">
                    <img
                      src={formData.thumbnailUrl}
                      alt="Imagen principal"
                      className="w-full h-64 object-cover rounded-lg ring-2 ring-yellow-400"
                    />
                    <span className="absolute top-2 left-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded">
                      Principal
                    </span>
                  </div>
                </div>
              )}

              {/* Galería de miniaturas */}
              {formData.images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Galeria ({formData.images.length} imagenes)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Haz clic en el icono de estrella para establecer como imagen principal. Usa las flechas para reordenar.
                  </p>
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Imagen ${index + 1}`}
                          className={`w-full h-24 object-cover rounded-lg border-2 ${
                            formData.thumbnailUrl === url
                              ? 'border-yellow-400'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                        {/* Overlay con acciones */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col items-center justify-center gap-1 p-1">
                          {/* Fila de navegación */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => moveImage(index, index - 1)}
                              disabled={index === 0}
                              className="p-1 bg-white rounded text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Mover izquierda"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => moveImage(index, index + 1)}
                              disabled={index === formData.images.length - 1}
                              className="p-1 bg-white rounded text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Mover derecha"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                          {/* Fila de acciones */}
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => setAsThumbnail(url)}
                              className={`p-1.5 rounded ${
                                formData.thumbnailUrl === url
                                  ? 'bg-yellow-400 text-black'
                                  : 'bg-white text-gray-700 hover:bg-yellow-400'
                              }`}
                              title="Usar como principal"
                            >
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="p-1.5 bg-white rounded text-red-600 hover:bg-red-100"
                              title="Eliminar"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        {/* Indicador de posición */}
                        <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1 rounded">
                          {index + 1}
                        </span>
                        {/* Badge de principal */}
                        {formData.thumbnailUrl === url && (
                          <span className="absolute top-1 left-1 bg-yellow-400 text-[10px] font-bold px-1 rounded">
                            ★
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-yellow-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={uploading}
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  {uploading ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="animate-spin w-8 h-8 text-yellow-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-gray-600 font-medium">{uploadProgress || 'Subiendo...'}</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-600 font-medium">Subir imagenes</p>
                      <p className="text-sm text-gray-400 mt-1">Arrastra o haz clic para seleccionar</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP, GIF - Max 5MB por imagen</p>
                    </>
                  )}
                </label>
              </div>

              {/* Mensaje si no hay imagenes */}
              {formData.images.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800 text-sm">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-medium">Sin imagenes</p>
                      <p className="mt-1">Sube al menos una imagen para el producto. La primera imagen sera la imagen principal.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Precios */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Precios</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="input pr-12"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">EUR</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Precio anterior (tachado)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compareAtPrice || ''}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">EUR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inventario */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Inventario</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="input font-mono"
                  placeholder="Se genera automaticamente"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock {!formData.hasVariants && '*'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  className="input"
                  required={!formData.hasVariants}
                  disabled={formData.hasVariants}
                />
                {formData.hasVariants && (
                  <p className="text-xs text-gray-500 mt-1">El stock se gestiona en las variantes</p>
                )}
              </div>
            </div>
          </div>

          {/* Variantes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Variantes</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasVariants}
                  onChange={(e) => setFormData({ ...formData, hasVariants: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                />
                <span className="text-sm text-gray-600">Este producto tiene variantes</span>
              </label>
            </div>

            {formData.hasVariants && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Añade variantes como talla, color o material. Cada variante puede tener su propio precio y stock.
                </p>

                {/* Lista de variantes */}
                {formData.variants && formData.variants.length > 0 && (
                  <div className="space-y-4">
                    {formData.variants.map((variant, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Talla */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Talla</label>
                            <select
                              value={variant.size || ''}
                              onChange={(e) => updateVariant(index, 'size', e.target.value)}
                              className="input text-sm"
                            >
                              <option value="">Sin talla</option>
                              {sizeOptions.map((size) => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>

                          {/* Color */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <select
                                  value={variant.color || ''}
                                  onChange={(e) => {
                                    const selected = colorOptions.find(c => c.name === e.target.value)
                                    if (selected) {
                                      handleColorSelect(index, selected)
                                    } else {
                                      updateVariant(index, 'color', e.target.value)
                                      updateVariant(index, 'colorHex', '')
                                    }
                                  }}
                                  className="input text-sm"
                                >
                                  <option value="">Sin color</option>
                                  {colorOptions.map((color) => (
                                    <option key={color.name} value={color.name}>{color.name}</option>
                                  ))}
                                </select>
                              </div>
                              {variant.colorHex && (
                                <div
                                  className="w-8 h-8 rounded border border-gray-300 flex-shrink-0"
                                  style={{ backgroundColor: variant.colorHex }}
                                />
                              )}
                            </div>
                          </div>

                          {/* Stock */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Stock *</label>
                            <input
                              type="number"
                              min="0"
                              value={variant.stock}
                              onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                              className="input text-sm"
                              required
                            />
                          </div>

                          {/* Precio (opcional) */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Precio (opcional)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={variant.price ?? ''}
                              onChange={(e) => updateVariant(index, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                              className="input text-sm"
                              placeholder={`${formData.price}€`}
                            />
                          </div>
                        </div>

                        {/* Segunda fila: SKU, Material */}
                        <div className="grid grid-cols-2 gap-4 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
                            <input
                              type="text"
                              value={variant.sku || ''}
                              onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                              className="input text-sm font-mono"
                              placeholder="Auto"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Material</label>
                            <input
                              type="text"
                              value={variant.material || ''}
                              onChange={(e) => updateVariant(index, 'material', e.target.value)}
                              className="input text-sm"
                              placeholder="Algodon, Poliester..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Boton añadir variante */}
                <button
                  type="button"
                  onClick={addVariant}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-yellow-400 hover:text-yellow-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Añadir variante
                </button>

                {formData.variants && formData.variants.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600">
                    <strong>Stock total:</strong> {formData.variants.reduce((sum, v) => sum + v.stock, 0)} unidades
                  </div>
                )}
              </div>
            )}

            {!formData.hasVariants && (
              <p className="text-sm text-gray-500">
                Activa las variantes si tu producto viene en diferentes tallas, colores o materiales.
              </p>
            )}
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-6">
          {/* Estado */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Estado</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                />
                <span className="text-gray-700">Producto activo</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                />
                <span className="text-gray-700">Destacado</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isNew}
                  onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                />
                <span className="text-gray-700">Nuevo</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isBestSeller}
                  onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400"
                />
                <span className="text-gray-700">Mas vendido</span>
              </label>
            </div>
          </div>

          {/* Organizacion */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizacion</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value || null })}
                  className="input"
                />
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
              </button>

              <button
                type="button"
                onClick={() => router.back()}
                className="w-full btn btn-outline"
              >
                Cancelar
              </button>

              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="w-full btn btn-danger disabled:opacity-50"
                >
                  Eliminar Producto
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
