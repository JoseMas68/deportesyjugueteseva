'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { PageBlock, blockTypeNames, blockTypeIcons, HeroConfig, ProductSliderConfig, BentoGridConfig } from './types'

interface BlockItemProps {
  block: PageBlock
  onEdit: () => void
  onDelete: () => void
  onToggleActive: () => void
}

export default function BlockItem({ block, onEdit, onDelete, onToggleActive }: BlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getBlockSummary = () => {
    switch (block.type) {
      case 'hero': {
        const config = block.config as HeroConfig
        return config.title || 'Sin titulo'
      }
      case 'product-slider': {
        const config = block.config as ProductSliderConfig
        const sourceNames: Record<string, string> = {
          'category': 'Categoria',
          'manual': 'Manual',
          'featured': 'Destacados',
          'new': 'Nuevos',
          'bestseller': 'Mas vendidos',
          'offers': 'Ofertas',
        }
        return `${config.title || sourceNames[config.source]} (${config.limit} productos)`
      }
      case 'bento-grid': {
        const config = block.config as BentoGridConfig
        const layoutNames: Record<string, string> = {
          '2x2': '2x2',
          '3x3': '3x3',
          '1-2-1': '1-2-1',
          '2-1-2': '2-1-2',
          'masonry': 'Masonry',
        }
        return `${config.source === 'categories' ? 'Categorias' : 'Productos'} - ${layoutNames[config.layout]}`
      }
      default:
        return ''
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all ${
        isDragging ? 'shadow-xl ring-2 ring-eva-yellow z-50 opacity-90' : 'shadow-sm hover:shadow-md'
      } ${!block.isActive ? 'opacity-60' : ''}`}
    >
      <div className="flex items-stretch">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="px-3 bg-gray-50 border-r border-gray-200 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        </button>

        {/* Block Info */}
        <div className="flex-1 p-4 flex items-center gap-4">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            block.type === 'hero' ? 'bg-blue-100 text-blue-600' :
            block.type === 'product-slider' ? 'bg-green-100 text-green-600' :
            'bg-purple-100 text-purple-600'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={blockTypeIcons[block.type]} />
            </svg>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">{blockTypeNames[block.type]}</span>
              {block.title && (
                <span className="text-gray-400">·</span>
              )}
              {block.title && (
                <span className="text-sm text-gray-500 truncate">{block.title}</span>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate">{getBlockSummary()}</p>
          </div>

          {/* Status Badge */}
          <button
            onClick={onToggleActive}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
              block.isActive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {block.isActive ? 'Activo' : 'Oculto'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center border-l border-gray-200">
          <button
            onClick={onEdit}
            className="px-4 py-4 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
            title="Editar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="px-4 py-4 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
            title="Eliminar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
