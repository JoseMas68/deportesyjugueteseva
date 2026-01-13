'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PageBuilder from '@/components/admin/page-builder/PageBuilder'
import { DynamicPage } from '@/components/admin/page-builder/types'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditarPaginaPage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [page, setPage] = useState<DynamicPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    metaTitle: '',
    metaDescription: '',
    isActive: false,
    isHomePage: false,
  })

  useEffect(() => {
    fetchPage()
  }, [id])

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/admin/pages/${id}`)
      if (!res.ok) throw new Error('Page not found')
      const data = await res.json()
      setPage(data.page)
      setFormData({
        title: data.page.title,
        slug: data.page.slug,
        description: data.page.description || '',
        metaTitle: data.page.metaTitle || '',
        metaDescription: data.page.metaDescription || '',
        isActive: data.page.isActive,
        isHomePage: data.page.isHomePage,
      })
    } catch (error) {
      console.error('Error fetching page:', error)
      router.push('/admin/paginas')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setPage(data.page)
        setShowSettings(false)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    try {
      const res = await fetch(`/api/admin/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !page?.isActive }),
      })

      if (res.ok) {
        const data = await res.json()
        setPage(data.page)
        setFormData(prev => ({ ...prev, isActive: data.page.isActive }))
      }
    } catch (error) {
      console.error('Error toggling page:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-eva-yellow border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (!page) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/paginas"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{page.title}</h1>
              {page.isHomePage && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">HOME</span>
              )}
            </div>
            <p className="text-gray-500">/{page.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Vista previa */}
          {page.isActive && (
            <a
              href={`http://localhost:4321/p/${page.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver pagina
            </a>
          )}

          {/* Configuración */}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ajustes
          </button>

          {/* Publicar/Despublicar */}
          <button
            onClick={handleToggleActive}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-colors ${
              page.isActive
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-eva-yellow text-gray-900 hover:bg-yellow-400'
            }`}
          >
            {page.isActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Publicada
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Publicar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Page Builder */}
      <PageBuilder page={page} onUpdate={fetchPage} />

      {/* Modal de ajustes */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Ajustes de pagina</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Titulo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Titulo</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL (slug)</label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-200 rounded-l-lg text-gray-500 text-sm">/p/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Descripcion</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow resize-none"
                />
              </div>

              {/* SEO */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">SEO</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Titulo</label>
                    <input
                      type="text"
                      value={formData.metaTitle}
                      onChange={e => setFormData(prev => ({ ...prev, metaTitle: e.target.value }))}
                      maxLength={60}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Descripcion</label>
                    <textarea
                      value={formData.metaDescription}
                      onChange={e => setFormData(prev => ({ ...prev, metaDescription: e.target.value }))}
                      maxLength={160}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-eva-yellow resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Opciones */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Opciones</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isHomePage}
                      onChange={e => setFormData(prev => ({ ...prev, isHomePage: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-eva-yellow focus:ring-eva-yellow"
                    />
                    <div>
                      <span className="font-medium text-gray-900">Usar como pagina de inicio</span>
                      <p className="text-sm text-gray-500">Esta pagina reemplazara la home actual</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowSettings(false)}
                className="px-6 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-2 bg-eva-yellow hover:bg-yellow-400 text-gray-900 font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
