/**
 * Generación de código QR para Verifactu
 * El QR contiene una URL de verificación de la AEAT
 */

import QRCode from 'qrcode'
import { QR_VALIDATION_URL, type QRData, type VerifactuInvoice } from './types'

/**
 * Genera el contenido del QR (URL de verificación AEAT)
 * Formato: https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=X&numserie=X&fecha=X&importe=X
 */
export function generateQRContent(invoice: VerifactuInvoice): string {
  const data: QRData = {
    nif: encodeURIComponent(invoice.issuerNif),
    invoiceNumber: encodeURIComponent(invoice.invoiceNumber),
    invoiceDate: formatDateForQR(invoice.invoiceDate),
    totalAmount: invoice.totalAmount.toFixed(2),
  }

  const params = new URLSearchParams({
    nif: data.nif,
    numserie: data.invoiceNumber,
    fecha: data.invoiceDate,
    importe: data.totalAmount,
  })

  return `${QR_VALIDATION_URL}?${params.toString()}`
}

/**
 * Genera una imagen QR en formato Base64 (PNG)
 * Dimensiones según especificación AEAT: 30-40mm
 * A 300 DPI, 30mm = ~354px, 40mm = ~472px
 */
export async function generateQRImage(content: string, options?: QROptions): Promise<string> {
  const qrOptions: QRCode.QRCodeToDataURLOptions = {
    type: 'image/png',
    width: options?.width || 400,  // ~34mm a 300 DPI
    margin: options?.margin || 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',  // Nivel medio de corrección de errores
  }

  try {
    const dataUrl = await QRCode.toDataURL(content, qrOptions)
    return dataUrl
  } catch (error) {
    console.error('Error generando QR:', error)
    throw new Error('No se pudo generar el código QR')
  }
}

/**
 * Genera el QR como Buffer (para impresión térmica)
 */
export async function generateQRBuffer(content: string, width: number = 200): Promise<Buffer> {
  const qrOptions: QRCode.QRCodeToBufferOptions = {
    type: 'png',
    width,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  }

  try {
    return await QRCode.toBuffer(content, qrOptions)
  } catch (error) {
    console.error('Error generando QR buffer:', error)
    throw new Error('No se pudo generar el código QR')
  }
}

/**
 * Genera el QR como string SVG (para renderizado web)
 */
export async function generateQRSVG(content: string, width: number = 200): Promise<string> {
  const qrOptions: QRCode.QRCodeToStringOptions = {
    type: 'svg',
    width,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  }

  try {
    return await QRCode.toString(content, qrOptions)
  } catch (error) {
    console.error('Error generando QR SVG:', error)
    throw new Error('No se pudo generar el código QR')
  }
}

/**
 * Formatea la fecha para el QR (DD-MM-YYYY según AEAT)
 */
function formatDateForQR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

// Opciones para la generación del QR
interface QROptions {
  width?: number
  margin?: number
}

/**
 * Valida que una URL de QR sea válida para Verifactu
 */
export function validateQRContent(content: string): boolean {
  try {
    const url = new URL(content)
    return (
      url.hostname === 'www2.agenciatributaria.gob.es' &&
      url.pathname.includes('ValidarQR') &&
      url.searchParams.has('nif') &&
      url.searchParams.has('numserie') &&
      url.searchParams.has('fecha') &&
      url.searchParams.has('importe')
    )
  } catch {
    return false
  }
}
