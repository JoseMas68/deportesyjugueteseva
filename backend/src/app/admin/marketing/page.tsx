'use client'

import { useState, useEffect } from 'react'

interface Campaign {
  id: string
  name: string
  subject: string
  status: 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'CANCELLED'
  targetAudience: string
  totalRecipients: number
  totalSent: number
  totalOpened: number
  totalClicked: number
  scheduledAt: string | null
  sentAt: string | null
  createdAt: string
}

interface ContentBlock {
  id: string
  type: 'heading' | 'text' | 'button' | 'image' | 'divider'
  content: string
  settings?: {
    buttonUrl?: string
    imageUrl?: string
  }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Borrador', color: 'bg-gray-100 text-gray-700' },
  SCHEDULED: { label: 'Programada', color: 'bg-blue-100 text-blue-700' },
  SENDING: { label: 'Enviando', color: 'bg-yellow-100 text-yellow-700' },
  SENT: { label: 'Enviada', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
}

const audienceLabels: Record<string, string> = {
  all: 'Todos',
  customers: 'Solo clientes',
  subscribers: 'Solo suscriptores',
}

// Convertir bloques a HTML
function blocksToHtml(blocks: ContentBlock[]): string {
  const blockHtml = blocks.map(block => {
    switch (block.type) {
      case 'heading':
        return `<h2 style="color: #333333; margin: 0 0 20px; font-size: 24px;">${block.content}</h2>`
      case 'text':
        return block.content.split('\n').map(line =>
          `<p style="color: #666666; line-height: 1.6; margin: 0 0 16px;">${line}</p>`
        ).join('\n')
      case 'button':
        return `<table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
          <tr>
            <td style="background-color: #FFF64C; border-radius: 6px;">
              <a href="${block.settings?.buttonUrl || '#'}" style="display: inline-block; padding: 14px 28px; color: #000000; text-decoration: none; font-weight: bold;">${block.content}</a>
            </td>
          </tr>
        </table>`
      case 'image':
        return `<img src="${block.settings?.imageUrl || ''}" alt="" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />`
      case 'divider':
        return `<hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />`
      default:
        return ''
    }
  }).join('\n')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header con Logo -->
          <tr>
            <td style="background-color: #000000; padding: 20px 30px;">
              <table cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="vertical-align: middle;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle;">
                          <img src="data:image/png;base64,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" alt="Eva" style="height: 50px; width: auto; vertical-align: middle;" />
                        </td>
                        <td style="vertical-align: middle; padding-left: 15px;">
                          <span style="color: #FFF64C; font-size: 20px; font-weight: bold; font-family: Arial, sans-serif;">Deportes y Juguetes Eva</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Contenido -->
          <tr>
            <td style="padding: 40px 30px;">
              ${blockHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <p style="color: #FFF64C; font-size: 14px; font-weight: bold; margin: 0 0 8px;">Deportes y Juguetes Eva</p>
              <p style="color: #888888; font-size: 12px; margin: 0 0 15px;">Tu tienda de confianza desde 1985</p>
              <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 8px;"><a href="https://deportesyjugueteseva.com" style="color: #888888; font-size: 11px; text-decoration: none;">Web</a></td>
                  <td style="color: #444; font-size: 11px;">|</td>
                  <td style="padding: 0 8px;"><a href="{unsubscribe_url}" style="color: #888888; font-size: 11px; text-decoration: none;">Darse de baja</a></td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export default function MarketingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [isEnabled, setIsEnabled] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    targetAudience: 'all',
  })
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [togglingFeature, setTogglingFeature] = useState(false)
  const [activeTab, setActiveTab] = useState<'campaigns' | 'subscribers'>('campaigns')
  const [subscribers, setSubscribers] = useState<Array<{ id: string; email: string; name: string | null; isActive: boolean; createdAt: string }>>([])
  const [subscribersCount, setSubscribersCount] = useState({ total: 0, active: 0 })
  const [previewMode, setPreviewMode] = useState(false)

  useEffect(() => {
    fetchCampaigns()
    fetchFeatureStatus()
  }, [])

  async function fetchFeatureStatus() {
    try {
      const res = await fetch('/api/admin/feature-flags/email_marketing')
      if (res.ok) {
        const data = await res.json()
        setIsEnabled(data.flag?.isEnabled ?? false)
      }
    } catch (err) {
      console.error('Error fetching feature status:', err)
    }
  }

  async function fetchCampaigns() {
    try {
      const res = await fetch('/api/admin/campaigns')
      const data = await res.json()
      setCampaigns(data.campaigns || [])
      setIsEnabled(data.isEnabled ?? false)
    } catch (err) {
      console.error('Error fetching campaigns:', err)
    } finally {
      setLoading(false)
    }
  }

  async function fetchSubscribers() {
    try {
      const res = await fetch('/api/admin/subscribers')
      const data = await res.json()
      setSubscribers(data.subscribers || [])
      setSubscribersCount({ total: data.total, active: data.activeCount })
    } catch (err) {
      console.error('Error fetching subscribers:', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'subscribers') {
      fetchSubscribers()
    }
  }, [activeTab])

  async function toggleFeature() {
    setTogglingFeature(true)
    try {
      await fetch('/api/admin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'email_marketing',
          name: 'Email Marketing',
          description: 'Habilita las campañas de email marketing y newsletter',
          group: 'marketing',
          isEnabled: !isEnabled,
        }),
      })
      await fetch('/api/admin/feature-flags/email_marketing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !isEnabled }),
      })
      setIsEnabled(!isEnabled)
    } catch (err) {
      console.error('Error toggling feature:', err)
    } finally {
      setTogglingFeature(false)
    }
  }

  function openCreateEditor() {
    setEditingCampaign(null)
    setFormData({ name: '', subject: '', targetAudience: 'all' })
    setBlocks([
      { id: crypto.randomUUID(), type: 'heading', content: 'Hola {subscriber_name}' },
      { id: crypto.randomUUID(), type: 'text', content: 'Escribe aquí el contenido de tu campaña...' },
      { id: crypto.randomUUID(), type: 'button', content: 'Ver Ofertas', settings: { buttonUrl: 'https://deportesyjugueteseva.com' } },
    ])
    setSelectedBlockId(null)
    setError('')
    setShowEditor(true)
    setPreviewMode(false)
  }

  async function openEditEditor(campaign: Campaign) {
    setEditingCampaign(campaign)
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`)
      const data = await res.json()
      setFormData({
        name: data.campaign.name,
        subject: data.campaign.subject,
        targetAudience: data.campaign.targetAudience,
      })
      // Por ahora, crear bloques por defecto para campañas existentes
      setBlocks([
        { id: crypto.randomUUID(), type: 'heading', content: 'Hola {subscriber_name}' },
        { id: crypto.randomUUID(), type: 'text', content: 'Contenido de la campaña...' },
        { id: crypto.randomUUID(), type: 'button', content: 'Ver Ofertas', settings: { buttonUrl: 'https://deportesyjugueteseva.com' } },
      ])
      setSelectedBlockId(null)
      setError('')
      setShowEditor(true)
      setPreviewMode(false)
    } catch (err) {
      console.error('Error loading campaign:', err)
    }
  }

  async function saveCampaign() {
    setSaving(true)
    setError('')

    try {
      const html = blocksToHtml(blocks)
      const url = editingCampaign
        ? `/api/admin/campaigns/${editingCampaign.id}`
        : '/api/admin/campaigns'

      const res = await fetch(url, {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          body: html,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }

      setShowEditor(false)
      fetchCampaigns()
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function sendCampaign(campaign: Campaign) {
    if (!confirm(`¿Enviar la campaña "${campaign.name}" ahora?`)) return

    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/send`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error al enviar')
        return
      }

      alert(`Campaña enviada: ${data.sent} emails enviados, ${data.failed} fallidos`)
      fetchCampaigns()
    } catch (err) {
      alert('Error de conexión')
    }
  }

  async function deleteCampaign(campaign: Campaign) {
    if (!confirm(`¿Eliminar la campaña "${campaign.name}"?`)) return

    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Error al eliminar')
        return
      }
      fetchCampaigns()
    } catch (err) {
      alert('Error de conexión')
    }
  }

  function addBlock(type: ContentBlock['type']) {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: type === 'heading' ? 'Nuevo título' :
               type === 'text' ? 'Escribe tu texto aquí...' :
               type === 'button' ? 'Botón' : '',
      settings: type === 'button' ? { buttonUrl: '#' } : {},
    }
    setBlocks([...blocks, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  function updateBlock(id: string, updates: Partial<ContentBlock>) {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...updates } : b))
  }

  function deleteBlock(id: string) {
    setBlocks(blocks.filter(b => b.id !== id))
    setSelectedBlockId(null)
  }

  function moveBlock(id: string, direction: 'up' | 'down') {
    const index = blocks.findIndex(b => b.id === id)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    setBlocks(newBlocks)
  }

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)

  const availableBlocks = [
    { type: 'heading' as const, label: 'Título', icon: 'H' },
    { type: 'text' as const, label: 'Texto', icon: 'T' },
    { type: 'button' as const, label: 'Botón', icon: '▢' },
    { type: 'image' as const, label: 'Imagen', icon: '🖼' },
    { type: 'divider' as const, label: 'Línea', icon: '—' },
  ]

  const [uploadingImage, setUploadingImage] = useState(false)

  async function handleImageUpload(file: File, blockId: string) {
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('files', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.urls && data.urls.length > 0) {
          updateBlock(blockId, { settings: { imageUrl: data.urls[0] } })
        }
      } else {
        const errorData = await res.json()
        setError(errorData.error || 'Error al subir la imagen')
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      setError('Error al subir la imagen')
    } finally {
      setUploadingImage(false)
    }
  }

  // Vista del editor
  if (showEditor) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header del editor */}
        <div className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowEditor(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1 rounded text-sm ${!previewMode ? 'bg-white shadow' : ''}`}
              >
                Editar
              </button>
              <button
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1 rounded text-sm ${previewMode ? 'bg-white shadow' : ''}`}
              >
                Vista Previa
              </button>
            </div>
            <button
              onClick={saveCampaign}
              disabled={saving || !formData.name || !formData.subject}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Contenido */}
        <div className="flex-1 flex overflow-hidden">
          {previewMode ? (
            /* Vista previa */
            <div className="flex-1 bg-gray-100 p-6 overflow-auto">
              <div className="max-w-2xl mx-auto">
                <div className="bg-gray-800 text-white p-4 rounded-t-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-400">Para:</span>
                    <span>{audienceLabels[formData.targetAudience]}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="text-gray-400">Asunto:</span>
                    <span className="font-medium">{formData.subject || 'Sin asunto'}</span>
                  </div>
                </div>
                <iframe
                  srcDoc={blocksToHtml(blocks)}
                  className="w-full h-[600px] border-0 bg-white rounded-b-lg"
                  title="Vista previa"
                />
              </div>
            </div>
          ) : (
            /* Editor */
            <>
              {/* Área central */}
              <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
                {/* Configuración básica */}
                <div className="p-4 bg-white border-b">
                  <div className="grid grid-cols-3 gap-4 max-w-4xl">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">NOMBRE CAMPAÑA</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Ej: Ofertas de Enero"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">ASUNTO DEL EMAIL</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Ej: ¡Ofertas exclusivas!"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">ENVIAR A</label>
                      <select
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                      >
                        <option value="all">Todos</option>
                        <option value="customers">Solo clientes</option>
                        <option value="subscribers">Solo suscriptores</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Bloques */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-lg mx-auto space-y-3">
                    {blocks.map((block, index) => (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={`group relative p-4 border-2 rounded-lg cursor-pointer transition-all bg-white ${
                          selectedBlockId === block.id
                            ? 'border-yellow-400 bg-yellow-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* Controles */}
                        <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                            className="w-6 h-6 bg-gray-800 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50"
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                            className="w-6 h-6 bg-gray-800 text-white rounded text-xs hover:bg-gray-700 disabled:opacity-50"
                            disabled={index === blocks.length - 1}
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
                            className="w-6 h-6 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>

                        {/* Contenido */}
                        {block.type === 'heading' && (
                          <div className="font-bold text-lg text-gray-800">{block.content}</div>
                        )}
                        {block.type === 'text' && (
                          <div className="text-gray-600 text-sm whitespace-pre-wrap">{block.content}</div>
                        )}
                        {block.type === 'button' && (
                          <div className="flex justify-center">
                            <span className="bg-yellow-300 text-gray-900 font-bold px-6 py-2 rounded-lg text-sm">
                              {block.content}
                            </span>
                          </div>
                        )}
                        {block.type === 'divider' && <hr className="border-gray-300" />}
                        {block.type === 'image' && (
                          block.settings?.imageUrl ? (
                            <img src={block.settings.imageUrl} alt="" className="max-w-full h-auto rounded" />
                          ) : (
                            <label className="block cursor-pointer">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  e.stopPropagation()
                                  const file = e.target.files?.[0]
                                  if (file) handleImageUpload(file, block.id)
                                }}
                              />
                              <div className="text-center py-8 bg-gray-100 rounded text-gray-400 text-sm border-2 border-dashed border-gray-300 hover:border-[#FFF64C] hover:bg-gray-50 transition-colors">
                                <span className="text-2xl block mb-2">🖼️</span>
                                {uploadingImage ? 'Subiendo...' : 'Haz clic para subir imagen'}
                              </div>
                            </label>
                          )
                        )}

                        <span className="absolute bottom-1 right-2 text-[10px] text-gray-400 uppercase">
                          {block.type}
                        </span>
                      </div>
                    ))}

                    {blocks.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        Añade bloques desde el panel derecho
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Panel derecho */}
              <div className="w-64 bg-white border-l p-4 overflow-y-auto flex-shrink-0">
                {/* Añadir bloques */}
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 text-sm mb-3">Añadir bloque</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {availableBlocks.map(block => (
                      <button
                        key={block.type}
                        onClick={() => addBlock(block.type)}
                        className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                      >
                        <span className="text-lg mb-1">{block.icon}</span>
                        <span className="text-xs text-gray-600">{block.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editar bloque */}
                {selectedBlock && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 text-sm mb-3">Editar bloque</h3>

                    {(selectedBlock.type === 'heading' || selectedBlock.type === 'text') && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Contenido</label>
                        {selectedBlock.type === 'heading' ? (
                          <input
                            type="text"
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                          />
                        ) : (
                          <textarea
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm h-32 resize-none"
                          />
                        )}
                        <p className="text-[10px] text-gray-400 mt-2">
                          Usa {'{subscriber_name}'} para personalizar
                        </p>
                      </div>
                    )}

                    {selectedBlock.type === 'button' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Texto del botón</label>
                          <input
                            type="text"
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                            className="w-full border rounded px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">URL del enlace</label>
                          <input
                            type="text"
                            value={selectedBlock.settings?.buttonUrl || ''}
                            onChange={(e) => updateBlock(selectedBlock.id, { settings: { ...selectedBlock.settings, buttonUrl: e.target.value } })}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    )}

                    {selectedBlock.type === 'divider' && (
                      <p className="text-xs text-gray-500">
                        Línea separadora decorativa.
                      </p>
                    )}

                    {selectedBlock.type === 'image' && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-2">Subir imagen</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(file, selectedBlock.id)
                            }}
                            className="w-full text-sm"
                            disabled={uploadingImage}
                          />
                          {uploadingImage && (
                            <p className="text-xs text-[#FFF64C] mt-2">Subiendo...</p>
                          )}
                        </div>
                        <div className="text-center text-gray-400 text-xs">o</div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">URL de imagen</label>
                          <input
                            type="text"
                            value={selectedBlock.settings?.imageUrl || ''}
                            onChange={(e) => updateBlock(selectedBlock.id, { settings: { ...selectedBlock.settings, imageUrl: e.target.value } })}
                            className="w-full border rounded px-3 py-2 text-sm"
                            placeholder="https://..."
                          />
                        </div>
                        {selectedBlock.settings?.imageUrl && (
                          <div className="mt-2">
                            <img src={selectedBlock.settings.imageUrl} alt="Preview" className="w-full rounded border" />
                          </div>
                        )}
                        <p className="text-[10px] text-gray-400">
                          Ideal para banners, heros de Canva, etc.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  // Vista principal (lista de campañas)
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600">Gestiona campañas y suscriptores</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border">
            <span className="text-sm text-gray-600">Activado</span>
            <button
              onClick={toggleFeature}
              disabled={togglingFeature}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isEnabled ? 'bg-green-500' : 'bg-gray-300'
              } ${togglingFeature ? 'opacity-50' : ''}`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  isEnabled ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
          {isEnabled && (
            <button
              onClick={openCreateEditor}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva Campaña
            </button>
          )}
        </div>
      </div>

      {!isEnabled ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email Marketing Deshabilitado</h2>
          <p className="text-gray-600 mb-4">
            Activa el switch de arriba para crear campañas de email.
          </p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit mb-6">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'campaigns' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              Campañas
            </button>
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'subscribers' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
              }`}
            >
              Suscriptores ({subscribersCount.active})
            </button>
          </div>

          {activeTab === 'campaigns' ? (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-gray-500">Cargando...</div>
              ) : campaigns.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No hay campañas creadas</p>
                  <button
                    onClick={openCreateEditor}
                    className="mt-4 text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Crear primera campaña
                  </button>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Campaña</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Audiencia</th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Enviados</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {campaigns.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <span className="font-medium text-gray-900">{campaign.name}</span>
                            <p className="text-sm text-gray-500">{campaign.subject}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {audienceLabels[campaign.targetAudience]}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[campaign.status]?.color}`}>
                            {statusLabels[campaign.status]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-sm">
                          {campaign.status === 'SENT' ? campaign.totalSent : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') && (
                              <>
                                <button
                                  onClick={() => openEditEditor(campaign)}
                                  className="text-blue-600 hover:text-blue-800 p-1"
                                  title="Editar"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => sendCampaign(campaign)}
                                  className="text-green-600 hover:text-green-800 p-1"
                                  title="Enviar"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {campaign.status !== 'SENDING' && (
                              <button
                                onClick={() => deleteCampaign(campaign)}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b bg-gray-50">
                <span className="text-sm text-gray-600">
                  {subscribersCount.active} activos de {subscribersCount.total} total
                </span>
              </div>
              {subscribers.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No hay suscriptores</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Email</th>
                      <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nombre</th>
                      <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Estado</th>
                      <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{sub.email}</td>
                        <td className="px-6 py-4 text-gray-600">{sub.name || '-'}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            sub.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {sub.isActive ? 'Activo' : 'Baja'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-500">
                          {new Date(sub.createdAt).toLocaleDateString('es-ES')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
