'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { PageBlock, DynamicPage, BlockConfig, BlockType, getDefaultConfig, blockTypeNames, blockTypeIcons } from './types'
import BlockItem from './BlockItem'
import BlockEditor from './BlockEditor'

interface PageBuilderProps {
  page: DynamicPage
  onUpdate: () => void
}

export default function PageBuilder({ page, onUpdate }: PageBuilderProps) {
  const [blocks, setBlocks] = useState<PageBlock[]>(page.blocks)
  const [editingBlock, setEditingBlock] = useState<PageBlock | null>(null)
  const [addingBlockType, setAddingBlockType] = useState<BlockType | null>(null)
  const [showAddMenu, setShowAddMenu] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === active.id)
      const newIndex = blocks.findIndex(b => b.id === over.id)

      const newBlocks = arrayMove(blocks, oldIndex, newIndex)
      setBlocks(newBlocks)

      // Guardar nuevo orden en el servidor
      try {
        await fetch(`/api/admin/pages/${page.id}/blocks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ blockIds: newBlocks.map(b => b.id) }),
        })
      } catch (error) {
        console.error('Error reordering blocks:', error)
        // Revertir en caso de error
        setBlocks(blocks)
      }
    }
  }

  const handleAddBlock = async (type: BlockType) => {
    setShowAddMenu(false)
    const defaultConfig = getDefaultConfig(type)

    try {
      const res = await fetch(`/api/admin/pages/${page.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          config: defaultConfig,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setBlocks([...blocks, data.block])
        setEditingBlock(data.block)
      }
    } catch (error) {
      console.error('Error adding block:', error)
    }
  }

  const handleUpdateBlock = async (blockId: string, config: BlockConfig, title?: string) => {
    try {
      const res = await fetch(`/api/admin/pages/${page.id}/blocks/${blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, title }),
      })

      if (res.ok) {
        const data = await res.json()
        setBlocks(blocks.map(b => b.id === blockId ? data.block : b))
      }
    } catch (error) {
      console.error('Error updating block:', error)
      throw error
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Seguro que quieres eliminar este bloque?')) return

    try {
      const res = await fetch(`/api/admin/pages/${page.id}/blocks/${blockId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setBlocks(blocks.filter(b => b.id !== blockId))
      }
    } catch (error) {
      console.error('Error deleting block:', error)
    }
  }

  const handleToggleBlockActive = async (block: PageBlock) => {
    try {
      const res = await fetch(`/api/admin/pages/${page.id}/blocks/${block.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !block.isActive }),
      })

      if (res.ok) {
        const data = await res.json()
        setBlocks(blocks.map(b => b.id === block.id ? data.block : b))
      }
    } catch (error) {
      console.error('Error toggling block:', error)
    }
  }

  const blockTypes: BlockType[] = ['hero', 'product-slider', 'bento-grid']

  return (
    <div className="space-y-6">
      {/* Bloques */}
      {blocks.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Esta pagina no tiene bloques</h3>
          <p className="text-gray-500 mb-6">Añade bloques para empezar a diseñar tu pagina</p>
          <button
            onClick={() => setShowAddMenu(true)}
            className="inline-flex items-center gap-2 bg-eva-yellow hover:bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Añadir primer bloque
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {blocks.map(block => (
                <BlockItem
                  key={block.id}
                  block={block}
                  onEdit={() => setEditingBlock(block)}
                  onDelete={() => handleDeleteBlock(block.id)}
                  onToggleActive={() => handleToggleBlockActive(block)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Botón añadir bloque */}
      {blocks.length > 0 && (
        <button
          onClick={() => setShowAddMenu(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-eva-yellow hover:text-gray-700 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir bloque
        </button>
      )}

      {/* Modal añadir bloque */}
      {showAddMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Añadir bloque</h2>
              <button
                onClick={() => setShowAddMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-3">
              {blockTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleAddBlock(type)}
                  className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-eva-yellow hover:bg-yellow-50 transition-colors text-left"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    type === 'hero' ? 'bg-blue-100 text-blue-600' :
                    type === 'product-slider' ? 'bg-green-100 text-green-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={blockTypeIcons[type]} />
                    </svg>
                  </div>
                  <div>
                    <span className="font-bold text-gray-900">{blockTypeNames[type]}</span>
                    <p className="text-sm text-gray-500">
                      {type === 'hero' && 'Banner grande con imagen y texto'}
                      {type === 'product-slider' && 'Carrusel de productos'}
                      {type === 'bento-grid' && 'Cuadricula de categorias o productos'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor de bloque */}
      {editingBlock && (
        <BlockEditor
          block={editingBlock}
          onSave={(config, title) => handleUpdateBlock(editingBlock.id, config, title)}
          onClose={() => setEditingBlock(null)}
        />
      )}
    </div>
  )
}
