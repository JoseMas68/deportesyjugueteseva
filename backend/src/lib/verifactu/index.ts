/**
 * Servicio principal de Verifactu
 * Integra todas las funcionalidades para facturación electrónica AEAT
 */

import { prisma } from '@/lib/prisma'
import type { PosSale, VerifactuRecord } from '@prisma/client'
import type {
  VerifactuConfig,
  VerifactuInvoice,
  VerifactuRecordData,
  AeatResponse,
  InvoiceType,
  TaxRate,
} from './types'
import { TAX_RATES } from './types'
import { generateHash, getHashInput, validateNif } from './hash'
import { generateQRContent, generateQRImage } from './qr'
import { generateInvoiceXML, generateCancellationXML, validateXML } from './xml'
import { submitInvoice, cancelInvoice, testConnection, type ConnectionTestResult } from './soap-client'
import {
  loadCertificate,
  getCertificateInfo,
  validateCertificate,
  certificateExists,
  saveCertificate,
  deleteCertificate,
  type CertificateValidation,
} from './certificate'

// Re-exportar tipos y funciones útiles
export * from './types'
export { validateNif, getHashSuffix } from './hash'
export { generateQRImage, generateQRSVG, generateQRBuffer } from './qr'
export { testConnection } from './soap-client'
export {
  getCertificateInfo,
  validateCertificate,
  certificateExists,
  saveCertificate,
  deleteCertificate,
} from './certificate'

/**
 * Servicio principal de Verifactu
 */
export class VerifactuService {
  private config: VerifactuConfig | null = null

  /**
   * Carga la configuración desde la base de datos
   */
  async loadConfig(): Promise<VerifactuConfig | null> {
    const settings = await prisma.siteConfig.findMany({
      where: {
        key: {
          startsWith: 'verifactu_',
        },
      },
    })

    const companySettings = await prisma.siteConfig.findMany({
      where: {
        key: {
          startsWith: 'company_',
        },
      },
    })

    const getValue = (key: string) =>
      [...settings, ...companySettings].find(s => s.key === key)?.value || ''

    const enabled = getValue('verifactu_enabled') === 'true'

    if (!enabled) {
      return null
    }

    this.config = {
      enabled: true,
      environment: (getValue('verifactu_environment') || 'test') as 'test' | 'production',
      companyNif: getValue('company_nif'),
      companyLegalName: getValue('company_legal_name'),
      companyAddress: getValue('company_address'),
      companyPostalCode: getValue('company_postal_code'),
      companyCity: getValue('company_city'),
      companyProvince: getValue('company_province'),
      companyCountry: getValue('company_country') || 'ES',
      certificatePath: getValue('verifactu_certificate_path') || undefined,
      certificatePassword: getValue('verifactu_certificate_password') || undefined,
      autoSubmit: getValue('verifactu_auto_submit') === 'true',
      defaultTaxRate: (parseInt(getValue('verifactu_default_tax_rate')) || TAX_RATES.GENERAL) as TaxRate,
    }

    return this.config
  }

  /**
   * Verifica si Verifactu está habilitado
   */
  async isEnabled(): Promise<boolean> {
    const config = await this.loadConfig()
    return config !== null && config.enabled
  }

  /**
   * Obtiene el último hash de la cadena
   */
  async getLastHash(): Promise<string | null> {
    const lastRecord = await prisma.verifactuRecord.findFirst({
      where: {
        status: { not: 'CANCELLED' },
      },
      orderBy: { createdAt: 'desc' },
      select: { currentHash: true },
    })

    return lastRecord?.currentHash || null
  }

  /**
   * Crea un registro Verifactu para una venta
   */
  async createRecordFromSale(sale: PosSale & { items?: unknown[] }): Promise<VerifactuRecord> {
    const config = await this.loadConfig()

    if (!config) {
      throw new Error('Verifactu no está habilitado')
    }

    // Validar NIF
    if (!validateNif(config.companyNif)) {
      throw new Error('NIF de la empresa no válido')
    }

    // Calcular importes con IVA
    const totalAmount = Number(sale.total)
    const taxRate = config.defaultTaxRate
    const baseAmount = totalAmount / (1 + taxRate / 100)
    const taxAmount = totalAmount - baseAmount

    // Crear objeto factura
    const invoice: VerifactuInvoice = {
      invoiceNumber: sale.saleNumber,
      invoiceDate: sale.createdAt,
      invoiceType: 'F2', // Factura simplificada (ticket)
      issuerNif: config.companyNif,
      issuerName: config.companyLegalName,
      recipientNif: undefined, // Opcional para F2
      recipientName: sale.customerName || undefined,
      baseAmount: Math.round(baseAmount * 100) / 100,
      taxRate,
      taxAmount: Math.round(taxAmount * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      description: 'Venta TPV',
    }

    return this.createRecord(invoice, sale.id)
  }

  /**
   * Crea un registro Verifactu
   */
  async createRecord(invoice: VerifactuInvoice, saleId?: string): Promise<VerifactuRecord> {
    const config = await this.loadConfig()

    if (!config) {
      throw new Error('Verifactu no está habilitado')
    }

    // Obtener hash anterior
    const previousHash = await this.getLastHash()

    // Generar hash
    const currentHash = generateHash(invoice, previousHash || undefined)
    const hashInput = getHashInput(invoice, previousHash || undefined)

    // Generar QR
    const qrContent = generateQRContent(invoice)

    // Generar XML
    const xmlContent = generateInvoiceXML(invoice, currentHash, config)

    // Validar XML
    const validation = validateXML(xmlContent)
    if (!validation.valid) {
      console.error('Errores en XML:', validation.errors)
      throw new Error(`XML inválido: ${validation.errors.join(', ')}`)
    }

    // Crear registro en base de datos
    const record = await prisma.verifactuRecord.create({
      data: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        invoiceType: invoice.invoiceType as InvoiceType,
        issuerNif: invoice.issuerNif,
        issuerName: invoice.issuerName,
        recipientNif: invoice.recipientNif,
        recipientName: invoice.recipientName,
        baseAmount: invoice.baseAmount,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        previousHash,
        currentHash,
        hashInput,
        qrContent,
        xmlContent,
        saleId,
        status: 'PENDING',
      },
    })

    return record
  }

  /**
   * Envía un registro a la AEAT
   */
  async submitToAEAT(recordId: string): Promise<AeatResponse> {
    const config = await this.loadConfig()

    if (!config) {
      throw new Error('Verifactu no está habilitado')
    }

    const record = await prisma.verifactuRecord.findUnique({
      where: { id: recordId },
    })

    if (!record) {
      throw new Error('Registro no encontrado')
    }

    if (record.status !== 'PENDING' && record.status !== 'REJECTED') {
      throw new Error('El registro no está pendiente de envío')
    }

    // Enviar a AEAT
    const response = await submitInvoice(record.xmlContent, config)

    // Actualizar registro
    await prisma.verifactuRecord.update({
      where: { id: recordId },
      data: {
        status: response.success ? 'ACCEPTED' : 'REJECTED',
        aeatResponse: JSON.parse(JSON.stringify(response)),
        aeatErrorCode: response.errorCode,
        aeatErrorMessage: response.errorMessage,
        submittedAt: new Date(),
      },
    })

    return response
  }

  /**
   * Anula un registro en la AEAT
   */
  async cancelRecord(recordId: string, reason: string): Promise<AeatResponse> {
    const config = await this.loadConfig()

    if (!config) {
      throw new Error('Verifactu no está habilitado')
    }

    const record = await prisma.verifactuRecord.findUnique({
      where: { id: recordId },
    })

    if (!record) {
      throw new Error('Registro no encontrado')
    }

    // Generar XML de anulación
    const xmlContent = generateCancellationXML(
      record.invoiceNumber,
      record.invoiceDate,
      reason,
      config
    )

    // Enviar anulación a AEAT
    const response = await cancelInvoice(xmlContent, config)

    // Actualizar registro
    await prisma.verifactuRecord.update({
      where: { id: recordId },
      data: {
        status: response.success ? 'CANCELLED' : record.status,
        aeatResponse: JSON.parse(JSON.stringify(response)),
        aeatErrorCode: response.errorCode,
        aeatErrorMessage: response.errorMessage,
      },
    })

    return response
  }

  /**
   * Crea una factura rectificativa
   */
  async createRectification(
    originalRecordId: string,
    reason: string,
    newAmount?: number
  ): Promise<VerifactuRecord> {
    const config = await this.loadConfig()

    if (!config) {
      throw new Error('Verifactu no está habilitado')
    }

    const originalRecord = await prisma.verifactuRecord.findUnique({
      where: { id: originalRecordId },
    })

    if (!originalRecord) {
      throw new Error('Registro original no encontrado')
    }

    // Determinar tipo de rectificativa
    let invoiceType: InvoiceType = 'R5' // Rectificativa de simplificada
    if (originalRecord.invoiceType === 'F1') {
      invoiceType = newAmount !== undefined ? 'R2' : 'R4'
    }

    // Generar número de factura rectificativa
    const rectNumber = `${originalRecord.invoiceNumber}-R1`

    const invoice: VerifactuInvoice = {
      invoiceNumber: rectNumber,
      invoiceDate: new Date(),
      invoiceType,
      issuerNif: originalRecord.issuerNif,
      issuerName: originalRecord.issuerName,
      recipientNif: originalRecord.recipientNif || undefined,
      recipientName: originalRecord.recipientName || undefined,
      baseAmount: newAmount ? newAmount / (1 + Number(originalRecord.taxRate) / 100) : Number(originalRecord.baseAmount),
      taxRate: Number(originalRecord.taxRate),
      taxAmount: newAmount ? newAmount - (newAmount / (1 + Number(originalRecord.taxRate) / 100)) : Number(originalRecord.taxAmount),
      totalAmount: newAmount || Number(originalRecord.totalAmount),
      description: `Rectificación: ${reason}`,
      originalInvoiceNumber: originalRecord.invoiceNumber,
      rectificationReason: reason,
    }

    // Obtener hash anterior
    const previousHash = await this.getLastHash()

    // Generar hash
    const currentHash = generateHash(invoice, previousHash || undefined)
    const hashInput = getHashInput(invoice, previousHash || undefined)

    // Generar QR
    const qrContent = generateQRContent(invoice)

    // Generar XML
    const xmlContent = generateInvoiceXML(invoice, currentHash, config)

    // Crear registro
    const record = await prisma.verifactuRecord.create({
      data: {
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: invoice.invoiceDate,
        invoiceType: invoice.invoiceType,
        issuerNif: invoice.issuerNif,
        issuerName: invoice.issuerName,
        recipientNif: invoice.recipientNif,
        recipientName: invoice.recipientName,
        baseAmount: invoice.baseAmount,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        previousHash,
        currentHash,
        hashInput,
        qrContent,
        xmlContent,
        originalInvoiceId: originalRecordId,
        status: 'PENDING',
      },
    })

    return record
  }

  /**
   * Obtiene estadísticas de registros
   */
  async getStats(): Promise<VerifactuStats> {
    try {
      // Verificar que el modelo existe en Prisma
      if (!prisma.verifactuRecord) {
        return { pending: 0, submitted: 0, accepted: 0, rejected: 0, cancelled: 0, total: 0 }
      }

      const [pending, submitted, accepted, rejected, cancelled] = await Promise.all([
        prisma.verifactuRecord.count({ where: { status: 'PENDING' } }),
        prisma.verifactuRecord.count({ where: { status: 'SUBMITTED' } }),
        prisma.verifactuRecord.count({ where: { status: 'ACCEPTED' } }),
        prisma.verifactuRecord.count({ where: { status: 'REJECTED' } }),
        prisma.verifactuRecord.count({ where: { status: 'CANCELLED' } }),
      ])

      return {
        pending,
        submitted,
        accepted,
        rejected,
        cancelled,
        total: pending + submitted + accepted + rejected + cancelled,
      }
    } catch (error) {
      console.error('Error getting Verifactu stats:', error)
      return { pending: 0, submitted: 0, accepted: 0, rejected: 0, cancelled: 0, total: 0 }
    }
  }

  /**
   * Prueba la conexión con AEAT
   */
  async testAEATConnection(): Promise<ConnectionTestResult> {
    const config = await this.loadConfig()

    if (!config) {
      return {
        success: false,
        message: 'Verifactu no está habilitado',
        details: {
          certificateValid: false,
          serverReachable: false,
        },
      }
    }

    return testConnection(config)
  }

  /**
   * Valida el certificado actual
   */
  async validateCurrentCertificate(): Promise<CertificateValidation | null> {
    const config = await this.loadConfig()

    if (!config?.certificatePath || !config?.certificatePassword) {
      return null
    }

    if (!certificateExists(config.certificatePath)) {
      return null
    }

    try {
      const loaded = await loadCertificate(config.certificatePath, config.certificatePassword)
      return validateCertificate(loaded.certificate)
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Error desconocido'],
        warnings: [],
        info: {
          subject: '',
          issuer: '',
          serialNumber: '',
          validFrom: new Date(),
          validTo: new Date(),
          isValid: false,
        },
      }
    }
  }
}

// Estadísticas
interface VerifactuStats {
  pending: number
  submitted: number
  accepted: number
  rejected: number
  cancelled: number
  total: number
}

// Instancia singleton del servicio
let serviceInstance: VerifactuService | null = null

export function getVerifactuService(): VerifactuService {
  if (!serviceInstance) {
    serviceInstance = new VerifactuService()
  }
  return serviceInstance
}

// Función helper para verificar si está habilitado
export async function isVerifactuEnabled(): Promise<boolean> {
  const service = getVerifactuService()
  return service.isEnabled()
}
