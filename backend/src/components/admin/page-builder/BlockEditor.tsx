'use client'

import { useState } from 'react'
import { PageBlock, BlockConfig, blockTypeNames, HeroConfig, ProductSliderConfig, BentoGridConfig } from './types'
import HeroBlockEditor from './blocks/HeroBlockEditor'
import ProductSliderBlockEditor from './blocks/ProductSliderBlockEditor'
import BentoGridBlockEditor from './blocks/BentoGridBlockEditor'

interface BlockEditorProps {
  block: PageBlock
  onSave: (config: BlockConfig, title?: string) => Promise<void>
  onClose: () => void
}

export default function BlockEditor({ block, onSave, onClose }: BlockEditorProps) {
  const [config, setConfig] = useState<BlockConfig>(block.config)
  const [title, setTitle] = useState(block.title || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(config, title || undefined)
      onClose()
    } catch (error) {
      console.error('Error saving block:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Editar {blockTypeNames[block.type]}</h2>
            <p className="text-sm text-gray-500 mt-1">Configura las opciones del bloque</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Nombre interno */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre interno (opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Banner promocional verano"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
            />
            <p className="text-xs text-gray-500 mt-1">Solo visible en el admin, para identificar el bloque</p>
          </div>

          {/* Editor específico por tipo */}
          {block.type === 'hero' && (
            <HeroBlockEditor
              config={config as HeroConfig}
              onChange={setConfig}
            />
          )}
          {block.type === 'product-slider' && (
            <ProductSliderBlockEditor
              config={config as ProductSliderConfig}
              onChange={setConfig}
            />
          )}
          {block.type === 'bento-grid' && (
            <BentoGridBlockEditor
              config={config as BentoGridConfig}
              onChange={setConfig}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-eva-yellow hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
