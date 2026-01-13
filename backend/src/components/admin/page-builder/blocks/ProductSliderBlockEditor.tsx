'use client'

import { useState, useEffect } from 'react'
import { ProductSliderConfig, Category } from '../types'

interface ProductSliderBlockEditorProps {
  config: ProductSliderConfig
  onChange: (config: ProductSliderConfig) => void
}

export default function ProductSliderBlockEditor({ config, onChange }: ProductSliderBlockEditorProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/admin/categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const sourceOptions = [
    { value: 'featured', label: 'Productos destacados', description: 'Muestra productos marcados como destacados' },
    { value: 'new', label: 'Nuevos productos', description: 'Muestra productos marcados como nuevos' },
    { value: 'bestseller', label: 'Mas vendidos', description: 'Muestra productos marcados como best sellers' },
    { value: 'offers', label: 'Ofertas', description: 'Muestra productos con descuento' },
    { value: 'category', label: 'Por categoria', description: 'Muestra productos de una categoria especifica' },
  ]

  return (
    <div className="space-y-6">
      {/* Titulo */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Contenido
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titulo del slider</label>
          <input
            type="text"
            value={config.title || ''}
            onChange={e => onChange({ ...config, title: e.target.value })}
            placeholder="Ej: Los mas vendidos"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtitulo</label>
          <input
            type="text"
            value={config.subtitle || ''}
            onChange={e => onChange({ ...config, subtitle: e.target.value })}
            placeholder="Ej: Descubre nuestros productos estrella"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
          />
        </div>
      </div>

      {/* Fuente de productos */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Fuente de productos
        </h4>

        <div className="space-y-2">
          {sourceOptions.map(option => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                config.source === option.value
                  ? 'border-eva-yellow bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="source"
                value={option.value}
                checked={config.source === option.value}
                onChange={() => onChange({ ...config, source: option.value as ProductSliderConfig['source'] })}
                className="mt-1"
              />
              <div>
                <span className="font-medium text-gray-900">{option.label}</span>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </label>
          ))}
        </div>

        {config.source === 'category' && (
          <div className="pl-6 border-l-2 border-eva-yellow">
            <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar categoria</label>
            {loadingCategories ? (
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-eva-yellow border-t-transparent rounded-full animate-spin"></div>
                Cargando categorias...
              </div>
            ) : (
              <select
                value={config.categoryId || ''}
                onChange={e => onChange({ ...config, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
              >
                <option value="">Selecciona una categoria</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.parentId ? '└ ' : ''}{cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Configuracion */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Configuracion
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Numero de productos</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="4"
              max="20"
              value={config.limit}
              onChange={e => onChange({ ...config, limit: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-eva-yellow"
            />
            <span className="w-12 text-center font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded">
              {config.limit}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color de acento</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ ...config, accentColor: 'primary' })}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                config.accentColor === 'primary'
                  ? 'border-eva-yellow'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-eva-yellow mx-auto mb-1"></div>
              <span className="text-sm">Amarillo</span>
            </button>
            <button
              onClick={() => onChange({ ...config, accentColor: 'accent' })}
              className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                config.accentColor === 'accent'
                  ? 'border-eva-yellow'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-red-500 mx-auto mb-1"></div>
              <span className="text-sm">Rojo</span>
            </button>
          </div>
        </div>
      </div>

      {/* Link */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Enlace "Ver todo"
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto del enlace</label>
            <input
              type="text"
              value={config.linkText || ''}
              onChange={e => onChange({ ...config, linkText: e.target.value })}
              placeholder="Ver todo"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del enlace</label>
            <input
              type="text"
              value={config.linkUrl || ''}
              onChange={e => onChange({ ...config, linkUrl: e.target.value })}
              placeholder="/deportes"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">Deja vacio para ocultar el enlace</p>
      </div>
    </div>
  )
}
