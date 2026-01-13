'use client'

import { useState } from 'react'
import { HeroConfig } from '../types'

interface HeroBlockEditorProps {
  config: HeroConfig
  onChange: (config: HeroConfig) => void
}

export default function HeroBlockEditor({ config, onChange }: HeroBlockEditorProps) {
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('files', file)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.urls?.[0]) {
        onChange({ ...config, backgroundImage: data.urls[0] })
      }
    } catch (error) {
      console.error('Error uploading:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Contenido */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Contenido
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titulo</label>
          <input
            type="text"
            value={config.title || ''}
            onChange={e => onChange({ ...config, title: e.target.value })}
            placeholder="Ej: Nueva Coleccion 2024"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subtitulo</label>
          <input
            type="text"
            value={config.subtitle || ''}
            onChange={e => onChange({ ...config, subtitle: e.target.value })}
            placeholder="Ej: Descubre las ultimas novedades"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
          />
        </div>
      </div>

      {/* Imagen de fondo */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Fondo
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de fondo</label>
          {config.backgroundImage ? (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img
                src={config.backgroundImage}
                alt="Background"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => onChange({ ...config, backgroundImage: '' })}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-eva-yellow transition-colors cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-2 border-eva-yellow border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-sm text-gray-500">Subiendo...</span>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500">Haz clic para subir una imagen</span>
                </>
              )}
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color de fondo</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={config.backgroundColor || '#FFD700'}
              onChange={e => onChange({ ...config, backgroundColor: e.target.value })}
              className="w-10 h-10 rounded border border-gray-200 cursor-pointer"
            />
            <input
              type="text"
              value={config.backgroundColor || '#FFD700'}
              onChange={e => onChange({ ...config, backgroundColor: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow font-mono text-sm"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Se usa si no hay imagen de fondo</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Color del texto</label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ ...config, textColor: 'dark' })}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                config.textColor === 'dark'
                  ? 'border-eva-yellow bg-gray-900 text-white'
                  : 'border-gray-200 bg-gray-900 text-white hover:border-gray-300'
              }`}
            >
              Oscuro
            </button>
            <button
              onClick={() => onChange({ ...config, textColor: 'light' })}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                config.textColor === 'light'
                  ? 'border-eva-yellow bg-white text-gray-900'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300'
              }`}
            >
              Claro
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
          Boton de accion (CTA)
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Texto del boton</label>
            <input
              type="text"
              value={config.ctaText || ''}
              onChange={e => onChange({ ...config, ctaText: e.target.value })}
              placeholder="Ej: Ver coleccion"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del boton</label>
            <input
              type="text"
              value={config.ctaUrl || ''}
              onChange={e => onChange({ ...config, ctaUrl: e.target.value })}
              placeholder="Ej: /deportes"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estilo del boton</label>
          <div className="flex gap-2">
            {(['primary', 'secondary', 'outline'] as const).map(style => (
              <button
                key={style}
                onClick={() => onChange({ ...config, ctaStyle: style })}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors capitalize ${
                  config.ctaStyle === style
                    ? 'border-eva-yellow'
                    : 'border-gray-200 hover:border-gray-300'
                } ${
                  style === 'primary' ? 'bg-eva-yellow text-gray-900' :
                  style === 'secondary' ? 'bg-gray-900 text-white' :
                  'bg-white text-gray-900 border-gray-900'
                }`}
              >
                {style === 'primary' ? 'Primario' : style === 'secondary' ? 'Secundario' : 'Outline'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          Diseño
        </h4>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alineacion</label>
          <div className="flex gap-2">
            {(['left', 'center', 'right'] as const).map(align => (
              <button
                key={align}
                onClick={() => onChange({ ...config, alignment: align })}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                  config.alignment === align
                    ? 'border-eva-yellow bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className={`w-5 h-5 mx-auto ${config.alignment === align ? 'text-gray-900' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {align === 'left' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />}
                  {align === 'center' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />}
                  {align === 'right' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />}
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Altura</label>
          <div className="grid grid-cols-4 gap-2">
            {(['small', 'medium', 'large', 'full'] as const).map(height => (
              <button
                key={height}
                onClick={() => onChange({ ...config, height })}
                className={`py-2 px-3 rounded-lg border-2 transition-colors text-sm ${
                  config.height === height
                    ? 'border-eva-yellow bg-gray-50 font-semibold'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {height === 'small' ? 'Pequeña' : height === 'medium' ? 'Media' : height === 'large' ? 'Grande' : 'Completa'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
