'use client'

import { useState, useEffect } from 'react'
import { BentoGridConfig, Category } from '../types'

interface BentoGridBlockEditorProps {
  config: BentoGridConfig
  onChange: (config: BentoGridConfig) => void
}

export default function BentoGridBlockEditor({ config, onChange }: BentoGridBlockEditorProps) {
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

  const toggleCategory = (categoryId: string) => {
    const currentIds = config.categoryIds || []
    const newIds = currentIds.includes(categoryId)
      ? currentIds.filter(id => id !== categoryId)
      : [...currentIds, categoryId]
    onChange({ ...config, categoryIds: newIds })
  }

  const layoutOptions = [
    { value: '2x2', label: '2x2', description: '4 elementos en cuadricula' },
    { value: '3x3', label: '3x3', description: '9 elementos en cuadricula' },
    { value: '1-2-1', label: '1-2-1', description: '1 grande, 2 medianos, 1 grande' },
    { value: '2-1-2', label: '2-1-2', description: '2 medianos, 1 grande, 2 medianos' },
    { value: 'masonry', label: 'Masonry', description: 'Disposicion tipo Pinterest' },
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Titulo (opcional)</label>
          <input
            type="text"
            value={config.title || ''}
            onChange={e => onChange({ ...config, title: e.target.value })}
            placeholder="Ej: Explora nuestras categorias"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
          />
        </div>
      </div>

      {/* Fuente */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Tipo de contenido
        </h4>

        <div className="flex gap-2">
          <button
            onClick={() => onChange({ ...config, source: 'categories' })}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              config.source === 'categories'
                ? 'border-eva-yellow bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <svg className="w-6 h-6 mx-auto mb-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="font-medium">Categorias</span>
          </button>
          <button
            onClick={() => onChange({ ...config, source: 'products' })}
            className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
              config.source === 'products'
                ? 'border-eva-yellow bg-yellow-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <svg className="w-6 h-6 mx-auto mb-1 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="font-medium">Productos</span>
          </button>
        </div>
      </div>

      {/* Seleccion de categorias */}
      {config.source === 'categories' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Seleccionar categorias
          </h4>

          {loadingCategories ? (
            <div className="flex items-center gap-2 text-gray-500 p-4">
              <div className="w-4 h-4 border-2 border-eva-yellow border-t-transparent rounded-full animate-spin"></div>
              Cargando categorias...
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
              {categories.filter(c => !c.parentId).map(cat => (
                <label
                  key={cat.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                    (config.categoryIds || []).includes(cat.id) ? 'bg-yellow-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(config.categoryIds || []).includes(cat.id)}
                    onChange={() => toggleCategory(cat.id)}
                    className="w-4 h-4 rounded border-gray-300 text-eva-yellow focus:ring-eva-yellow"
                  />
                  <span className="font-medium text-gray-900">{cat.name}</span>
                </label>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Seleccionadas: {(config.categoryIds || []).length} categorias
          </p>
        </div>
      )}

      {/* Seleccion de categoria para productos */}
      {config.source === 'products' && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Seleccionar categoria</h4>
          {loadingCategories ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-eva-yellow border-t-transparent rounded-full animate-spin"></div>
              Cargando...
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

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Disposicion
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {layoutOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onChange({ ...config, layout: option.value as BentoGridConfig['layout'] })}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                config.layout === option.value
                  ? 'border-eva-yellow bg-yellow-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-bold text-gray-900">{option.label}</span>
              <p className="text-xs text-gray-500 mt-1">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Opciones de visualizacion */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Opciones de visualizacion
        </h4>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.showTitles}
              onChange={e => onChange({ ...config, showTitles: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-eva-yellow focus:ring-eva-yellow"
            />
            <div>
              <span className="font-medium text-gray-900">Mostrar titulos</span>
              <p className="text-sm text-gray-500">Muestra el nombre de cada elemento</p>
            </div>
          </label>

          {config.source === 'products' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.showPrices}
                onChange={e => onChange({ ...config, showPrices: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-eva-yellow focus:ring-eva-yellow"
              />
              <div>
                <span className="font-medium text-gray-900">Mostrar precios</span>
                <p className="text-sm text-gray-500">Muestra el precio de cada producto</p>
              </div>
            </label>
          )}
        </div>
      </div>
    </div>
  )
}
