/**
 * Generación de hash SHA-256 para Verifactu
 * Según especificación AEAT para encadenamiento de facturas
 */

import crypto from 'crypto'
import type { HashInputData, VerifactuInvoice } from './types'

/**
 * Genera el string de entrada para el hash según especificación AEAT
 * Formato: NIF=X&NumSerieFactura=X&FechaExpedicionFactura=X&TipoFactura=X&CuotaTotal=X&ImporteTotal=X&Huella=X
 */
export function getHashInput(invoice: VerifactuInvoice, previousHash?: string): string {
  const data: HashInputData = {
    nif: invoice.issuerNif,
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate: formatDate(invoice.invoiceDate),
    invoiceType: invoice.invoiceType,
    taxAmount: formatAmount(invoice.taxAmount),
    totalAmount: formatAmount(invoice.totalAmount),
    previousHash: previousHash,
  }

  // Construir el string según especificación AEAT
  const parts = [
    `NIF=${data.nif}`,
    `NumSerieFactura=${data.invoiceNumber}`,
    `FechaExpedicionFactura=${data.invoiceDate}`,
    `TipoFactura=${data.invoiceType}`,
    `CuotaTotal=${data.taxAmount}`,
    `ImporteTotal=${data.totalAmount}`,
  ]

  // Solo añadir Huella si existe (no es la primera factura)
  if (data.previousHash) {
    parts.push(`Huella=${data.previousHash}`)
  }

  return parts.join('&')
}

/**
 * Genera el hash SHA-256 del registro
 */
export function generateHash(invoice: VerifactuInvoice, previousHash?: string): string {
  const input = getHashInput(invoice, previousHash)
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex').toUpperCase()
}

/**
 * Verifica que un hash sea válido para los datos dados
 */
export function verifyHash(hash: string, invoice: VerifactuInvoice, previousHash?: string): boolean {
  const expectedHash = generateHash(invoice, previousHash)
  return hash.toUpperCase() === expectedHash.toUpperCase()
}

/**
 * Obtiene los últimos N caracteres del hash (para mostrar en ticket)
 */
export function getHashSuffix(hash: string, length: number = 8): string {
  return hash.slice(-length).toUpperCase()
}

/**
 * Formatea una fecha al formato requerido por AEAT (YYYY-MM-DD)
 */
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formatea un importe con 2 decimales (separador punto)
 */
function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/**
 * Valida que un NIF tenga formato correcto
 */
export function validateNif(nif: string): boolean {
  // Eliminar espacios y guiones
  const cleanNif = nif.replace(/[\s-]/g, '').toUpperCase()

  // NIF de persona física: 8 números + letra
  const nifRegex = /^[0-9]{8}[A-Z]$/

  // NIE: X, Y o Z + 7 números + letra
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/

  // CIF de empresa: letra + 7 números + dígito de control
  const cifRegex = /^[ABCDEFGHJKLMNPQRSUVW][0-9]{7}[0-9A-J]$/

  return nifRegex.test(cleanNif) || nieRegex.test(cleanNif) || cifRegex.test(cleanNif)
}

/**
 * Formatea un NIF para mostrar (con guión)
 */
export function formatNif(nif: string): string {
  const clean = nif.replace(/[\s-]/g, '').toUpperCase()
  if (clean.length === 9) {
    return `${clean.slice(0, 8)}-${clean.slice(8)}`
  }
  return clean
}
