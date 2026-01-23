'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface VerifactuRecord {
  id: string
  invoiceNumber: string
  invoiceDate: string
  invoiceType: string
  issuerNif: string
  issuerName: string
  recipientNif?: string
  recipientName?: string
  totalAmount: number
  status: 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'
  aeatErrorCode?: string
  aeatErrorMessage?: string
  submittedAt?: string
  saleId?: string
  createdAt: string
}

interface Stats {
  pending: number
  submitted: number
  accepted: number
  rejected: number
  cancelled: number
  total: number
}

interface RecordDetail extends VerifactuRecord {
  baseAmount: number
  taxRate: number
  taxAmount: number
  previousHash?: string
  currentHash: string
  hashSuffix: string
  hashInput: string
  qrContent: string
  qrImage: string
  aeatResponse?: Record<string, unknown>
  xmlContent: string
  sale?: {
    id: string
    saleNumber: string
    total: number
    createdAt: string
  }
}

interface CertificateStatus {
  valid: boolean
  errors: string[]
  warnings: string[]
  subject: string
  validFrom: string
  validTo: string
}

interface Config {
  verifactu_enabled?: string
  verifactu_environment?: string
  verifactu_auto_submit?: string
  verifactu_default_tax_rate?: string
  verifactu_certificate_path?: string
  verifactu_certificate_password?: string
  company_nif?: string
  company_legal_name?: string
  company_address?: string
  company_postal_code?: string
  company_city?: string
  company_province?: string
  company_country?: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  SUBMITTED: { label: 'Enviado', color: 'bg-blue-100 text-blue-700' },
  ACCEPTED: { label: 'Aceptado', color: 'bg-green-100 text-green-700' },
  REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Anulado', color: 'bg-gray-100 text-gray-700' },
}

const INVOICE_TYPE_LABELS: Record<string, string> = {
  F1: 'Factura completa',
  F2: 'Factura simplificada',
  R1: 'Rectificativa (error derecho)',
  R2: 'Rectificativa (error importe)',
  R3: 'Rectificativa (devolución)',
  R4: 'Rectificativa (otros)',
  R5: 'Rectificativa (simplificada)',
}

export default function VerifactuPage() {
  // Estados de registros
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [records, setRecords] = useState<VerifactuRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [selectedRecord, setSelectedRecord] = useState<RecordDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [toggling, setToggling] = useState(false)

  // Estados de configuración
  const [showConfig, setShowConfig] = useState(false)
  const [config, setConfig] = useState<Config>({})
  const [certificateStatus, setCertificateStatus] = useState<CertificateStatus | null>(null)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mensaje global
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchRecords()
    fetchConfig()
  }, [page, statusFilter])

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // ===== FUNCIONES DE REGISTROS =====
  const fetchRecords = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      })
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/pos/verifactu?${params}`)
      if (!res.ok) {
        console.error('Error fetching records:', res.status)
        setLoading(false)
        return
      }
      const data = await res.json()

      setEnabled(data.enabled ?? false)
      setRecords(data.records || [])
      setStats(data.stats || null)
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecordDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/pos/verifactu/${id}`)
      const data = await res.json()
      setSelectedRecord(data.record)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleToggleVerifactu = async () => {
    setToggling(true)
    try {
      const res = await fetch('/api/pos/verifactu/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })
      if (res.ok) {
        setEnabled(!enabled)
        setConfig(prev => ({ ...prev, verifactu_enabled: (!enabled) ? 'true' : 'false' }))
        if (!enabled) {
          fetchRecords()
          setShowConfig(true) // Mostrar configuración al activar
        }
      }
    } catch (error) {
      console.error('Error toggling Verifactu:', error)
    } finally {
      setToggling(false)
    }
  }

  const handleAction = async (action: 'submit' | 'cancel', reason?: string) => {
    if (!selectedRecord) return

    setActionLoading(true)
    try {
      const res = await fetch(`/api/pos/verifactu/${selectedRecord.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()

      if (data.success) {
        showMessage('success', data.message)
        fetchRecords()
        fetchRecordDetail(selectedRecord.id)
      } else {
        showMessage('error', data.message || 'Error al procesar')
      }
    } catch (error) {
      showMessage('error', 'Error de conexión')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSubmit = () => handleAction('submit')

  const handleCancel = () => {
    const reason = prompt('Motivo de anulación:')
    if (reason) handleAction('cancel', reason)
  }

  // ===== FUNCIONES DE CONFIGURACIÓN =====
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/pos/verifactu/config')
      if (!res.ok) {
        console.error('Error fetching config:', res.status)
        return
      }
      const data = await res.json()
      setConfig(data.config || {})
      setCertificateStatus(data.certificateStatus || null)
    } catch (error) {
      console.error('Error cargando configuración:', error)
    }
  }

  const saveConfig = async (updates: Partial<Config>) => {
    setSaving(true)
    try {
      const res = await fetch('/api/pos/verifactu/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConfig(prev => ({ ...prev, ...updates }))
      showMessage('success', 'Configuración guardada')
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const res = await fetch('/api/pos/verifactu/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'testConnection' }),
      })
      const data = await res.json()
      if (data.success) {
        showMessage('success', data.message)
      } else {
        showMessage('error', data.message)
      }
    } catch (error) {
      showMessage('error', 'Error al probar conexión')
    } finally {
      setTesting(false)
    }
  }

  const handleUploadCertificate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const password = prompt('Introduce la contraseña del certificado:')
    if (!password) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('certificate', file)
      formData.append('password', password)

      const res = await fetch('/api/pos/verifactu/config', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (data.validation) {
        setCertificateStatus(data.validation)
      }
      showMessage('success', 'Certificado subido correctamente')
      fetchConfig()
    } catch (error) {
      showMessage('error', error instanceof Error ? error.message : 'Error al subir certificado')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteCertificate = async () => {
    if (!confirm('¿Seguro que quieres eliminar el certificado?')) return

    try {
      const res = await fetch('/api/pos/verifactu/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteCertificate' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCertificateStatus(null)
      showMessage('success', 'Certificado eliminado')
      fetchConfig()
    } catch (error) {
      showMessage('error', 'Error al eliminar certificado')
    }
  }

  // ===== RENDER =====
  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    )
  }

  // Cuando está desactivado
  if (!enabled) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Verifactu</h1>
              <p className="text-gray-500">Sistema de facturación electrónica AEAT</p>
            </div>
            <button
              onClick={handleToggleVerifactu}
              disabled={toggling}
              className="relative"
            >
              <div
                className={`w-14 h-8 rounded-full transition-colors ${
                  enabled ? 'bg-yellow-400' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                    enabled ? 'translate-x-7' : 'translate-x-1'
                  } mt-1`}
                />
              </div>
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Verifactu será obligatorio a partir de 2027.
              Puedes activar el módulo cuando estés preparado.
            </p>
          </div>

          <div className="text-center py-8">
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Módulo desactivado</h2>
            <p className="text-gray-600 mb-6">
              Activa el interruptor de arriba para empezar a registrar facturas electrónicas.
            </p>
          </div>

          {/* Info sobre Verifactu */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-gray-800 mb-2">¿Qué es Verifactu?</h3>
            <p className="text-gray-600 mb-4">
              Verifactu es el sistema de la AEAT para la facturación electrónica en España.
              Requiere que cada factura se registre con un hash encadenado y se envíe a Hacienda.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Obligatorio para empresas desde enero 2027</li>
              <li>• Obligatorio para autónomos desde julio 2027</li>
              <li>• Requiere certificado digital de la FNMT</li>
              <li>• Penalización de 50.000€ por incumplimiento</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  // Cuando está activado
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Registros Verifactu</h1>
          <p className="text-gray-500">Facturación electrónica AEAT</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showConfig
                ? 'bg-yellow-400 text-black'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {showConfig ? 'Ocultar configuración' : 'Configuración'}
          </button>
          <button
            onClick={handleToggleVerifactu}
            disabled={toggling}
            className="relative"
            title={enabled ? 'Desactivar Verifactu' : 'Activar Verifactu'}
          >
            <div
              className={`w-14 h-8 rounded-full transition-colors ${
                enabled ? 'bg-yellow-400' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform ${
                  enabled ? 'translate-x-7' : 'translate-x-1'
                } mt-1`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mensaje global */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Panel de configuración */}
      {showConfig && (
        <div className="mb-6 space-y-4">
          {/* Entorno */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Entorno</h2>
            <div className="flex gap-4">
              <button
                onClick={() => saveConfig({ verifactu_environment: 'test' })}
                disabled={saving}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  config.verifactu_environment === 'test' || !config.verifactu_environment
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-gray-800">Test</div>
                <div className="text-sm text-gray-500">Entorno de pruebas de AEAT</div>
              </button>
              <button
                onClick={() => saveConfig({ verifactu_environment: 'production' })}
                disabled={saving}
                className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
                  config.verifactu_environment === 'production'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-bold text-gray-800">Producción</div>
                <div className="text-sm text-gray-500">Envío real a AEAT</div>
              </button>
            </div>
            {config.verifactu_environment === 'production' && (
              <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700">
                  <strong>Atención:</strong> En modo producción, los registros se envían a la AEAT real.
                </p>
              </div>
            )}
          </div>

          {/* Datos Fiscales */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Datos Fiscales</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIF/CIF *</label>
                <input
                  type="text"
                  value={config.company_nif || ''}
                  onChange={(e) => setConfig({ ...config, company_nif: e.target.value.toUpperCase() })}
                  onBlur={() => config.company_nif && saveConfig({ company_nif: config.company_nif })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="12345678A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                <input
                  type="text"
                  value={config.company_legal_name || ''}
                  onChange={(e) => setConfig({ ...config, company_legal_name: e.target.value })}
                  onBlur={() => config.company_legal_name && saveConfig({ company_legal_name: config.company_legal_name })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Nombre o Razón Social"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
                <input
                  type="text"
                  value={config.company_address || ''}
                  onChange={(e) => setConfig({ ...config, company_address: e.target.value })}
                  onBlur={() => config.company_address && saveConfig({ company_address: config.company_address })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Calle, número, piso..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
                <input
                  type="text"
                  value={config.company_postal_code || ''}
                  onChange={(e) => setConfig({ ...config, company_postal_code: e.target.value })}
                  onBlur={() => config.company_postal_code && saveConfig({ company_postal_code: config.company_postal_code })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
                <input
                  type="text"
                  value={config.company_city || ''}
                  onChange={(e) => setConfig({ ...config, company_city: e.target.value })}
                  onBlur={() => config.company_city && saveConfig({ company_city: config.company_city })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  value={config.company_province || ''}
                  onChange={(e) => setConfig({ ...config, company_province: e.target.value })}
                  onBlur={() => saveConfig({ company_province: config.company_province || '' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Provincia"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
                <input
                  type="text"
                  value={config.company_country || 'ES'}
                  onChange={(e) => setConfig({ ...config, company_country: e.target.value.toUpperCase() })}
                  onBlur={() => saveConfig({ company_country: config.company_country || 'ES' })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="ES"
                />
              </div>
            </div>
          </div>

          {/* Certificado Digital */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Certificado Digital</h2>

            {certificateStatus ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border ${
                    certificateStatus.valid
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl ${certificateStatus.valid ? 'text-green-500' : 'text-red-500'}`}>
                      {certificateStatus.valid ? '✓' : '✗'}
                    </span>
                    <span className="font-bold">
                      {certificateStatus.valid ? 'Certificado válido' : 'Certificado inválido'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Titular:</strong> {certificateStatus.subject}</p>
                    <p>
                      <strong>Válido desde:</strong>{' '}
                      {new Date(certificateStatus.validFrom).toLocaleDateString()}
                      {' hasta '}
                      {new Date(certificateStatus.validTo).toLocaleDateString()}
                    </p>
                  </div>
                  {certificateStatus.warnings.length > 0 && (
                    <div className="mt-2 text-sm text-orange-600">
                      {certificateStatus.warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
                    </div>
                  )}
                  {certificateStatus.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      {certificateStatus.errors.map((e, i) => <p key={i}>❌ {e}</p>)}
                    </div>
                  )}
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                  >
                    {uploading ? 'Subiendo...' : 'Cambiar certificado'}
                  </button>
                  <button
                    onClick={handleDeleteCertificate}
                    className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-500">
                  No hay certificado configurado. Sube un archivo .pfx o .p12 con tu certificado digital.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="px-6 py-3 bg-yellow-400 hover:bg-yellow-500 rounded-lg font-bold text-black transition-colors"
                >
                  {uploading ? 'Subiendo...' : 'Subir certificado'}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pfx,.p12"
              onChange={handleUploadCertificate}
              className="hidden"
            />

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Necesitas un certificado digital de la FNMT u otra autoridad
                certificadora reconocida. Puedes obtenerlo en{' '}
                <a
                  href="https://www.sede.fnmt.gob.es/certificados"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  sede.fnmt.gob.es
                </a>
              </p>
            </div>
          </div>

          {/* Opciones */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Opciones</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.verifactu_auto_submit === 'true'}
                  onChange={(e) =>
                    saveConfig({ verifactu_auto_submit: e.target.checked ? 'true' : 'false' })
                  }
                  className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
                />
                <div>
                  <div className="font-medium text-gray-800">Envío automático a AEAT</div>
                  <div className="text-sm text-gray-500">
                    Enviar registros automáticamente al crear cada venta
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de IVA por defecto
                </label>
                <select
                  value={config.verifactu_default_tax_rate || '21'}
                  onChange={(e) => saveConfig({ verifactu_default_tax_rate: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="21">21% - General</option>
                  <option value="10">10% - Reducido</option>
                  <option value="4">4% - Superreducido</option>
                  <option value="0">0% - Exento</option>
                </select>
              </div>
            </div>
          </div>

          {/* Probar conexión */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Probar Conexión</h2>
            <p className="text-gray-500 mb-4">
              Verifica que el certificado y la conexión con AEAT funcionan correctamente.
            </p>
            <button
              onClick={handleTestConnection}
              disabled={testing || !certificateStatus?.valid}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-bold text-white transition-colors"
            >
              {testing ? 'Probando...' : 'Probar conexión con AEAT'}
            </button>
            {!certificateStatus?.valid && (
              <p className="mt-2 text-sm text-gray-500">
                Necesitas un certificado válido para probar la conexión.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`p-4 rounded-xl transition-all ${
              statusFilter === 'PENDING'
                ? 'ring-2 ring-yellow-500 bg-yellow-100'
                : 'bg-yellow-50 hover:bg-yellow-100'
            }`}
          >
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pendientes</div>
          </button>
          <button
            onClick={() => setStatusFilter('SUBMITTED')}
            className={`p-4 rounded-xl transition-all ${
              statusFilter === 'SUBMITTED'
                ? 'ring-2 ring-blue-500 bg-blue-100'
                : 'bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <div className="text-3xl font-bold text-blue-600">{stats.submitted}</div>
            <div className="text-sm text-gray-600">Enviados</div>
          </button>
          <button
            onClick={() => setStatusFilter('ACCEPTED')}
            className={`p-4 rounded-xl transition-all ${
              statusFilter === 'ACCEPTED'
                ? 'ring-2 ring-green-500 bg-green-100'
                : 'bg-green-50 hover:bg-green-100'
            }`}
          >
            <div className="text-3xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600">Aceptados</div>
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`p-4 rounded-xl transition-all ${
              statusFilter === 'REJECTED'
                ? 'ring-2 ring-red-500 bg-red-100'
                : 'bg-red-50 hover:bg-red-100'
            }`}
          >
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Rechazados</div>
          </button>
          <button
            onClick={() => setStatusFilter('')}
            className={`p-4 rounded-xl transition-all ${
              statusFilter === ''
                ? 'ring-2 ring-gray-500 bg-gray-200'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <div className="text-3xl font-bold text-gray-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Lista de registros */}
        <div className="flex-1 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Factura</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Fecha</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tipo</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Total</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    onClick={() => fetchRecordDetail(record.id)}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedRecord?.id === record.id ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{record.invoiceNumber}</div>
                      {record.aeatErrorCode && (
                        <div className="text-xs text-red-500">{record.aeatErrorCode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(record.invoiceDate).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{record.invoiceType}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {record.totalAmount.toFixed(2)} €
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_LABELS[record.status]?.color || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {STATUS_LABELS[record.status]?.label || record.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No hay registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {total} registros
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panel de detalle */}
        {selectedRecord && (
          <div className="w-[450px] bg-white rounded-xl shadow-lg overflow-hidden">
            {detailLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
              </div>
            ) : (
              <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Cabecera */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {selectedRecord.invoiceNumber}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {INVOICE_TYPE_LABELS[selectedRecord.invoiceType] || selectedRecord.invoiceType}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      STATUS_LABELS[selectedRecord.status]?.color || 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_LABELS[selectedRecord.status]?.label || selectedRecord.status}
                  </span>
                </div>

                {/* QR */}
                {selectedRecord.qrImage && (
                  <div className="flex justify-center">
                    <img
                      src={selectedRecord.qrImage}
                      alt="QR Verificación"
                      className="w-32 h-32"
                    />
                  </div>
                )}

                {/* Importes */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Base imponible</span>
                    <span>{selectedRecord.baseAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">IVA ({selectedRecord.taxRate}%)</span>
                    <span>{selectedRecord.taxAmount.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2">
                    <span>Total</span>
                    <span>{selectedRecord.totalAmount.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Hash */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Hash (Huella)</h3>
                  <div className="bg-gray-100 rounded p-2 font-mono text-xs break-all">
                    {selectedRecord.currentHash}
                  </div>
                  {selectedRecord.previousHash && (
                    <div className="mt-2 text-xs text-gray-500">
                      Hash anterior: ...{selectedRecord.previousHash.slice(-16)}
                    </div>
                  )}
                </div>

                {/* Errores */}
                {selectedRecord.aeatErrorMessage && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-red-700 mb-1">
                      Error: {selectedRecord.aeatErrorCode}
                    </h3>
                    <p className="text-sm text-red-600">{selectedRecord.aeatErrorMessage}</p>
                  </div>
                )}

                {/* Venta relacionada */}
                {selectedRecord.sale && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Venta asociada</h3>
                    <Link
                      href={`/admin/tpv?sale=${selectedRecord.sale.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      {selectedRecord.sale.saleNumber}
                    </Link>
                  </div>
                )}

                {/* Acciones */}
                <div className="border-t pt-4 space-y-2">
                  {selectedRecord.status === 'PENDING' && (
                    <button
                      onClick={handleSubmit}
                      disabled={actionLoading}
                      className="w-full py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                    >
                      {actionLoading ? 'Enviando...' : 'Enviar a AEAT'}
                    </button>
                  )}
                  {selectedRecord.status === 'REJECTED' && (
                    <button
                      onClick={handleSubmit}
                      disabled={actionLoading}
                      className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                    >
                      {actionLoading ? 'Reenviando...' : 'Reintentar envío'}
                    </button>
                  )}
                  {(selectedRecord.status === 'ACCEPTED' || selectedRecord.status === 'SUBMITTED') && (
                    <button
                      onClick={handleCancel}
                      disabled={actionLoading}
                      className="w-full py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
                    >
                      {actionLoading ? 'Anulando...' : 'Anular registro'}
                    </button>
                  )}

                  {/* Ver XML */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Ver XML
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                      {selectedRecord.xmlContent}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
