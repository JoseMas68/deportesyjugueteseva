'use client'

import { useState, useEffect } from 'react'

interface EmailTemplate {
  id: string
  type: string
  subject: string
  body: string
  isActive: boolean
  label: string
  description: string
  category: string
  updatedAt: string
}

interface ContentBlock {
  id: string
  type: 'text' | 'heading' | 'button' | 'divider' | 'image' | 'products' | 'order_info' | 'address'
  content: string
  settings?: {
    align?: 'left' | 'center' | 'right'
    color?: string
    buttonUrl?: string
    imageUrl?: string
  }
}

// Parsear HTML a bloques
function htmlToBlocks(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = []

  // Extraer el contenido del body principal (entre los comentarios o tags conocidos)
  const contentMatch = html.match(/<!-- CONTENT START -->([\s\S]*?)<!-- CONTENT END -->/i)
  if (!contentMatch) {
    // Si no encuentra marcadores, crear bloque de texto con contenido genérico
    blocks.push({
      id: crypto.randomUUID(),
      type: 'text',
      content: 'Contenido del email...',
    })
    return blocks
  }

  const content = contentMatch[1]

  // Parsear bloques conocidos
  const blockRegex = /<!-- BLOCK:([\w]+) -->([\s\S]*?)<!-- \/BLOCK -->/g
  let match

  while ((match = blockRegex.exec(content)) !== null) {
    const type = match[1].toLowerCase() as ContentBlock['type']
    const blockContent = match[2].trim()

    const block: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      settings: {},
    }

    if (type === 'heading') {
      const textMatch = blockContent.match(/>([^<]+)</)?.[1] || ''
      block.content = textMatch
    } else if (type === 'text') {
      // Extraer texto de párrafos
      const textMatch = blockContent.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || blockContent
      block.content = textMatch.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    } else if (type === 'button') {
      const textMatch = blockContent.match(/>([^<]+)</)?.[1] || 'Botón'
      const urlMatch = blockContent.match(/href="([^"]+)"/)?.[1] || '#'
      block.content = textMatch
      block.settings = { buttonUrl: urlMatch }
    } else if (type === 'image') {
      const urlMatch = blockContent.match(/src="([^"]+)"/)?.[1] || ''
      block.settings = { imageUrl: urlMatch }
    } else if (type === 'products' || type === 'order_info' || type === 'address') {
      block.content = blockContent
    }

    blocks.push(block)
  }

  if (blocks.length === 0) {
    blocks.push({
      id: crypto.randomUUID(),
      type: 'text',
      content: 'Hola {user_name},\n\nGracias por tu pedido.',
    })
  }

  return blocks
}

// Convertir bloques a HTML
function blocksToHtml(blocks: ContentBlock[], templateType: string): string {
  const blockHtml = blocks.map(block => {
    switch (block.type) {
      case 'heading':
        return `<!-- BLOCK:heading -->
        <h2 style="color: #333333; margin: 0 0 20px; font-size: 24px; text-align: ${block.settings?.align || 'left'};">
          ${block.content}
        </h2>
        <!-- /BLOCK -->`

      case 'text':
        const textWithBreaks = block.content.split('\n').map(line =>
          `<p style="color: #666666; line-height: 1.6; margin: 0 0 16px; text-align: ${block.settings?.align || 'left'};">${line}</p>`
        ).join('\n')
        return `<!-- BLOCK:text -->
        ${textWithBreaks}
        <!-- /BLOCK -->`

      case 'button':
        return `<!-- BLOCK:button -->
        <table cellpadding="0" cellspacing="0" style="margin: 20px 0;">
          <tr>
            <td style="background-color: #FFF64C; border-radius: 6px;">
              <a href="${block.settings?.buttonUrl || '#'}" style="display: inline-block; padding: 14px 28px; color: #000000; text-decoration: none; font-weight: bold;">
                ${block.content}
              </a>
            </td>
          </tr>
        </table>
        <!-- /BLOCK -->`

      case 'divider':
        return `<!-- BLOCK:divider -->
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;" />
        <!-- /BLOCK -->`

      case 'image':
        return `<!-- BLOCK:image -->
        <img src="${block.settings?.imageUrl || ''}" alt="" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" />
        <!-- /BLOCK -->`

      case 'products':
        return `<!-- BLOCK:products -->
        {products}
        <!-- /BLOCK -->`

      case 'order_info':
        return `<!-- BLOCK:order_info -->
        <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; background: #f9f9f9; border-bottom: 1px solid #eee;"><strong>Subtotal:</strong></td>
            <td style="padding: 12px; background: #f9f9f9; border-bottom: 1px solid #eee; text-align: right;">{subtotal}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background: #f9f9f9; border-bottom: 1px solid #eee;"><strong>Envío:</strong></td>
            <td style="padding: 12px; background: #f9f9f9; border-bottom: 1px solid #eee; text-align: right;">{shipping_cost}</td>
          </tr>
          <tr>
            <td style="padding: 12px; background: #FFF64C;"><strong>Total:</strong></td>
            <td style="padding: 12px; background: #FFF64C; text-align: right; font-size: 18px; font-weight: bold;">{total}</td>
          </tr>
        </table>
        <!-- /BLOCK -->`

      case 'address':
        return `<!-- BLOCK:address -->
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <strong style="color: #333;">Dirección de envío:</strong><br/>
          <span style="color: #666;">{address}</span>
        </div>
        <!-- /BLOCK -->`

      default:
        return ''
    }
  }).join('\n\n')

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

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <!-- CONTENT START -->
              ${blockHtml}
              <!-- CONTENT END -->
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <p style="color: #FFF64C; font-size: 14px; font-weight: bold; margin: 0 0 8px;">Deportes y Juguetes Eva</p>
              <p style="color: #888888; font-size: 12px; margin: 0 0 15px;">Tu tienda de confianza desde 1985</p>
              <p style="color: #666666; font-size: 11px; margin: 0;">
                Este email fue enviado a {user_email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  const [editedSubject, setEditedSubject] = useState('')
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [saving, setSaving] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const res = await fetch('/api/admin/email-templates')
      const data = await res.json()
      setTemplates(data.templates || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  function selectTemplate(template: EmailTemplate) {
    setSelectedTemplate(template)
    setEditedSubject(template.subject)
    setBlocks(htmlToBlocks(template.body))
    setActiveTab('editor')
    setMessage(null)
    setSelectedBlockId(null)
  }

  async function saveTemplate() {
    if (!selectedTemplate) return
    setSaving(true)
    setMessage(null)

    try {
      const html = blocksToHtml(blocks, selectedTemplate.type)

      const res = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: editedSubject,
          body: html,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      setMessage({ type: 'success', text: 'Plantilla guardada correctamente' })
      fetchTemplates()
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  async function sendTestEmail() {
    if (!selectedTemplate || !testEmail) return
    setSendingTest(true)
    setMessage(null)

    try {
      // Primero guardar los cambios
      const html = blocksToHtml(blocks, selectedTemplate.type)
      await fetch(`/api/admin/email-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editedSubject, body: html }),
      })

      const res = await fetch(`/api/admin/email-templates/${selectedTemplate.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar')
      }

      setMessage({ type: 'success', text: `Email de prueba enviado a ${testEmail}` })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Error al enviar' })
    } finally {
      setSendingTest(false)
    }
  }

  async function toggleActive(template: EmailTemplate) {
    try {
      await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: template.subject,
          body: template.body,
          isActive: !template.isActive,
        }),
      })
      fetchTemplates()
      if (selectedTemplate?.id === template.id) {
        setSelectedTemplate({ ...template, isActive: !template.isActive })
      }
    } catch (err) {
      console.error('Error toggling template:', err)
    }
  }

  function addBlock(type: ContentBlock['type']) {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: type === 'heading' ? 'Título' :
               type === 'text' ? 'Escribe tu texto aquí...' :
               type === 'button' ? 'Ver Pedido' : '',
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

  const clienteTemplates = templates.filter(t => t.category === 'cliente')
  const adminTemplates = templates.filter(t => t.category === 'admin')

  const selectedBlock = blocks.find(b => b.id === selectedBlockId)

  // Bloques disponibles para añadir
  const availableBlocks = [
    { type: 'heading' as const, label: 'Título', icon: 'H' },
    { type: 'text' as const, label: 'Texto', icon: 'T' },
    { type: 'button' as const, label: 'Botón', icon: '▢' },
    { type: 'divider' as const, label: 'Línea', icon: '—' },
    { type: 'products' as const, label: 'Productos', icon: '📦' },
    { type: 'order_info' as const, label: 'Resumen', icon: '💰' },
    { type: 'address' as const, label: 'Dirección', icon: '📍' },
  ]

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Sidebar - Lista de plantillas */}
      <div className="w-72 border-r bg-white overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b">
          <h1 className="text-lg font-bold text-gray-900">Plantillas de Email</h1>
          <p className="text-xs text-gray-500 mt-1">Personaliza los emails automáticos</p>
        </div>

        {loading ? (
          <div className="p-4 text-center text-gray-500">Cargando...</div>
        ) : (
          <div className="p-2">
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                Emails al Cliente
              </h3>
              {clienteTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">{template.label}</span>
                    <span className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
                </button>
              ))}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">
                Notificaciones Admin
              </h3>
              {adminTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => selectTemplate(template)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                    selectedTemplate?.id === template.id
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">{template.label}</span>
                    <span className={`w-2 h-2 rounded-full ${template.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{template.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
        {selectedTemplate ? (
          <>
            {/* Header */}
            <div className="bg-white border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedTemplate.label}</h2>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Activo</span>
                  <button
                    onClick={() => toggleActive(selectedTemplate)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      selectedTemplate.isActive ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        selectedTemplate.isActive ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </label>
                <button
                  onClick={saveTemplate}
                  disabled={saving}
                  className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>

            {/* Mensaje */}
            {message && (
              <div className={`mx-4 mt-3 p-3 rounded-lg text-sm ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.text}
              </div>
            )}

            {/* Tabs */}
            <div className="px-4 pt-3 flex-shrink-0">
              <div className="flex gap-1 bg-gray-200 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'editor' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Editar
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'preview' ? 'bg-white shadow text-gray-900' : 'text-gray-600'
                  }`}
                >
                  Vista Previa
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-hidden p-4">
              {activeTab === 'editor' ? (
                <div className="h-full flex gap-4">
                  {/* Área central - Bloques */}
                  <div className="flex-1 flex flex-col bg-white rounded-lg border overflow-hidden">
                    {/* Asunto */}
                    <div className="p-4 border-b bg-gray-50">
                      <label className="block text-xs font-medium text-gray-500 mb-1">ASUNTO DEL EMAIL</label>
                      <input
                        type="text"
                        value={editedSubject}
                        onChange={(e) => setEditedSubject(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        placeholder="Asunto..."
                      />
                    </div>

                    {/* Lista de bloques */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <div className="max-w-lg mx-auto space-y-3">
                        {blocks.map((block, index) => (
                          <div
                            key={block.id}
                            onClick={() => setSelectedBlockId(block.id)}
                            className={`group relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedBlockId === block.id
                                ? 'border-yellow-400 bg-yellow-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {/* Controles del bloque */}
                            <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }}
                                className="w-6 h-6 bg-gray-800 text-white rounded text-xs hover:bg-gray-700"
                                disabled={index === 0}
                              >
                                ↑
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }}
                                className="w-6 h-6 bg-gray-800 text-white rounded text-xs hover:bg-gray-700"
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

                            {/* Contenido del bloque */}
                            {block.type === 'heading' && (
                              <div className="font-bold text-lg text-gray-800">{block.content || 'Título'}</div>
                            )}
                            {block.type === 'text' && (
                              <div className="text-gray-600 text-sm whitespace-pre-wrap">{block.content || 'Texto...'}</div>
                            )}
                            {block.type === 'button' && (
                              <div className="flex justify-center">
                                <span className="bg-yellow-300 text-gray-900 font-bold px-6 py-2 rounded-lg text-sm">
                                  {block.content || 'Botón'}
                                </span>
                              </div>
                            )}
                            {block.type === 'divider' && (
                              <hr className="border-gray-300" />
                            )}
                            {block.type === 'products' && (
                              <div className="text-center py-4 bg-gray-100 rounded text-gray-500 text-sm">
                                📦 Lista de productos del pedido
                              </div>
                            )}
                            {block.type === 'order_info' && (
                              <div className="text-center py-4 bg-gray-100 rounded text-gray-500 text-sm">
                                💰 Resumen: Subtotal, Envío y Total
                              </div>
                            )}
                            {block.type === 'address' && (
                              <div className="text-center py-4 bg-gray-100 rounded text-gray-500 text-sm">
                                📍 Dirección de envío
                              </div>
                            )}

                            {/* Etiqueta del tipo */}
                            <span className="absolute bottom-1 right-2 text-[10px] text-gray-400 uppercase">
                              {block.type}
                            </span>
                          </div>
                        ))}

                        {blocks.length === 0 && (
                          <div className="text-center py-12 text-gray-400">
                            Añade bloques usando el panel de la derecha
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Panel derecho */}
                  <div className="w-64 flex flex-col gap-3 flex-shrink-0">
                    {/* Añadir bloques */}
                    <div className="bg-white rounded-lg border p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-3">Añadir bloque</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {availableBlocks.map(block => (
                          <button
                            key={block.type}
                            onClick={() => addBlock(block.type)}
                            className="flex flex-col items-center p-2 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                          >
                            <span className="text-lg mb-1">{block.icon}</span>
                            <span className="text-xs text-gray-600">{block.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Editar bloque seleccionado */}
                    {selectedBlock && (
                      <div className="bg-white rounded-lg border p-3">
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
                              Usa {'{user_name}'} para el nombre del cliente
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

                        {(selectedBlock.type === 'products' || selectedBlock.type === 'order_info' || selectedBlock.type === 'address' || selectedBlock.type === 'divider') && (
                          <p className="text-xs text-gray-500">
                            Este bloque se genera automáticamente con los datos del pedido.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Enviar prueba */}
                    <div className="bg-white rounded-lg border p-3">
                      <h3 className="font-semibold text-gray-900 text-sm mb-2">Enviar prueba</h3>
                      <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        placeholder="tu@email.com"
                        className="w-full border rounded px-3 py-2 text-sm mb-2"
                      />
                      <button
                        onClick={sendTestEmail}
                        disabled={!testEmail || sendingTest}
                        className="w-full bg-gray-900 text-white font-medium px-4 py-2 rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50"
                      >
                        {sendingTest ? 'Enviando...' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Vista previa */
                <div className="h-full bg-white rounded-lg border overflow-hidden flex flex-col">
                  <div className="bg-gray-100 border-b px-4 py-2 text-sm flex-shrink-0">
                    <span className="text-gray-500">Asunto:</span>{' '}
                    <span className="font-medium">{editedSubject}</span>
                  </div>
                  <iframe
                    srcDoc={blocksToHtml(blocks, selectedTemplate.type)}
                    className="flex-1 w-full border-0"
                    title="Vista previa del email"
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-medium">Selecciona una plantilla</p>
              <p className="text-sm mt-1">Elige una del panel izquierdo para editarla</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
