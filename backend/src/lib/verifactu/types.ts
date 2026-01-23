/**
 * Tipos para el sistema Verifactu
 * Sistema de facturación electrónica de la AEAT
 */

// Tipos de factura según especificación AEAT
export type InvoiceType = 'F1' | 'F2' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5'

// Estados del registro Verifactu
export type VerifactuRecordStatus = 'PENDING' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED'

// Tipos de IVA en España
export const TAX_RATES = {
  GENERAL: 21,      // IVA general
  REDUCED: 10,      // IVA reducido
  SUPER_REDUCED: 4, // IVA superreducido
  EXEMPT: 0,        // Exento de IVA
} as const

export type TaxRate = typeof TAX_RATES[keyof typeof TAX_RATES]

// Configuración del sistema Verifactu
export interface VerifactuConfig {
  enabled: boolean
  environment: 'test' | 'production'

  // Datos fiscales del emisor
  companyNif: string
  companyLegalName: string
  companyAddress: string
  companyPostalCode: string
  companyCity: string
  companyProvince: string
  companyCountry: string

  // Certificado digital
  certificatePath?: string
  certificatePassword?: string

  // Opciones
  autoSubmit: boolean  // Enviar automáticamente a AEAT
  defaultTaxRate: TaxRate
}

// Datos de una factura para Verifactu
export interface VerifactuInvoice {
  // Identificación
  invoiceNumber: string    // Número serie (TPV-20260119-0001)
  invoiceDate: Date
  invoiceType: InvoiceType

  // Emisor (siempre los datos de la tienda)
  issuerNif: string
  issuerName: string

  // Receptor (opcional para facturas simplificadas F2)
  recipientNif?: string
  recipientName?: string

  // Importes
  baseAmount: number      // Base imponible (sin IVA)
  taxRate: number         // Tipo impositivo (21, 10, 4, 0)
  taxAmount: number       // Cuota de IVA
  totalAmount: number     // Total factura

  // Descripción de la operación
  description?: string

  // Para facturas rectificativas
  originalInvoiceNumber?: string
  rectificationReason?: string
}

// Datos necesarios para generar el hash (según especificación AEAT)
export interface HashInputData {
  nif: string              // NIF del emisor
  invoiceNumber: string    // Número serie de la factura
  invoiceDate: string      // Fecha en formato YYYY-MM-DD
  invoiceType: string      // Tipo de factura (F1, F2, etc.)
  taxAmount: string        // Cuota de impuesto (formato con 2 decimales)
  totalAmount: string      // Importe total (formato con 2 decimales)
  previousHash?: string    // Hash del registro anterior
}

// Respuesta de la AEAT
export interface AeatResponse {
  success: boolean
  timestamp: Date
  responseCode?: string
  message?: string

  // Si hay error
  errorCode?: string
  errorMessage?: string

  // Datos de la respuesta original
  rawResponse?: string
}

// Datos del certificado digital
export interface CertificateInfo {
  subject: string
  issuer: string
  serialNumber: string
  validFrom: Date
  validTo: Date
  isValid: boolean
}

// Datos para el código QR
export interface QRData {
  nif: string
  invoiceNumber: string
  invoiceDate: string
  totalAmount: string
}

// Registro Verifactu completo (para crear en DB)
export interface VerifactuRecordData {
  invoiceNumber: string
  invoiceDate: Date
  invoiceType: InvoiceType

  issuerNif: string
  issuerName: string

  recipientNif?: string
  recipientName?: string

  baseAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number

  previousHash?: string
  currentHash: string
  hashInput: string

  qrContent: string
  xmlContent: string

  saleId?: string
  originalInvoiceId?: string
}

// Endpoints AEAT
export const AEAT_ENDPOINTS = {
  test: {
    submit: 'https://www7.aeat.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas',
    cancel: 'https://www7.aeat.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas',
    validate: 'https://www7.aeat.es/wlpl/TIKE-CONT/ws/ValidacionRegistros',
  },
  production: {
    submit: 'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas',
    cancel: 'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SuministroFactEmitidas',
    validate: 'https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/ValidacionRegistros',
  },
} as const

// URL base para el QR de verificación
export const QR_VALIDATION_URL = 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR'
