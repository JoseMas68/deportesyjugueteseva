/**
 * Manejo de certificados digitales para Verifactu
 * Soporte para certificados .pfx/.p12
 */

import forge from 'node-forge'
import fs from 'fs'
import path from 'path'
import type { CertificateInfo } from './types'

/**
 * Carga un certificado digital desde un archivo .pfx/.p12
 */
export async function loadCertificate(
  certificatePath: string,
  password: string
): Promise<LoadedCertificate> {
  try {
    // Leer el archivo
    const pfxBuffer = fs.readFileSync(certificatePath)
    const pfxBase64 = pfxBuffer.toString('base64')

    // Decodificar el PFX
    const pfxAsn1 = forge.asn1.fromDer(forge.util.decode64(pfxBase64))
    const pfx = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, password)

    // Extraer el certificado
    const certBags = pfx.getBags({ bagType: forge.pki.oids.certBag })
    const certBag = certBags[forge.pki.oids.certBag]?.[0]

    if (!certBag || !certBag.cert) {
      throw new Error('No se encontró certificado en el archivo')
    }

    // Extraer la clave privada
    const keyBags = pfx.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]?.[0]

    if (!keyBag || !keyBag.key) {
      throw new Error('No se encontró clave privada en el archivo')
    }

    const cert = certBag.cert
    const privateKey = keyBag.key

    return {
      certificate: cert,
      privateKey,
      pem: {
        certificate: forge.pki.certificateToPem(cert),
        privateKey: forge.pki.privateKeyToPem(privateKey),
      },
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Invalid password')) {
        throw new Error('Contraseña del certificado incorrecta')
      }
      throw new Error(`Error cargando certificado: ${error.message}`)
    }
    throw error
  }
}

/**
 * Obtiene información del certificado
 */
export function getCertificateInfo(cert: forge.pki.Certificate): CertificateInfo {
  const subject = cert.subject.attributes
    .map(attr => `${attr.shortName}=${attr.value}`)
    .join(', ')

  const issuer = cert.issuer.attributes
    .map(attr => `${attr.shortName}=${attr.value}`)
    .join(', ')

  const now = new Date()
  const validFrom = cert.validity.notBefore
  const validTo = cert.validity.notAfter

  return {
    subject,
    issuer,
    serialNumber: cert.serialNumber,
    validFrom,
    validTo,
    isValid: now >= validFrom && now <= validTo,
  }
}

/**
 * Verifica que el certificado sea válido para Verifactu
 */
export function validateCertificate(cert: forge.pki.Certificate): CertificateValidation {
  const info = getCertificateInfo(cert)
  const errors: string[] = []
  const warnings: string[] = []

  // Verificar validez temporal
  if (!info.isValid) {
    const now = new Date()
    if (now < info.validFrom) {
      errors.push(`El certificado aún no es válido. Válido desde: ${info.validFrom.toLocaleDateString()}`)
    } else {
      errors.push(`El certificado ha caducado. Caducó el: ${info.validTo.toLocaleDateString()}`)
    }
  }

  // Advertir si caduca pronto (30 días)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  if (info.validTo < thirtyDaysFromNow && info.isValid) {
    warnings.push(`El certificado caduca pronto: ${info.validTo.toLocaleDateString()}`)
  }

  // Verificar que tenga los atributos necesarios
  const subjectNif = cert.subject.getField('serialNumber')
  if (!subjectNif) {
    warnings.push('El certificado no contiene NIF en el subject')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info,
  }
}

/**
 * Firma un documento XML con el certificado
 * Nota: Esta es una implementación simplificada.
 * Para producción se necesita XMLDSig completo.
 * AEAT usa autenticación por certificado SSL mutuo, no firma XMLDSig.
 */
export function signXML(
  xml: string,
  _certificate: LoadedCertificate
): string {
  // En Verifactu, la autenticación se realiza mediante certificado SSL mutuo
  // en la conexión HTTPS, no mediante firma XMLDSig del documento.
  // Por tanto, devolvemos el XML sin modificar.
  return xml
}

/**
 * Verifica si existe un certificado en la ruta especificada
 */
export function certificateExists(certificatePath: string): boolean {
  try {
    return fs.existsSync(certificatePath)
  } catch {
    return false
  }
}

/**
 * Guarda un certificado subido al servidor
 */
export async function saveCertificate(
  buffer: Buffer,
  filename: string
): Promise<string> {
  // Crear directorio de certificados si no existe
  const certsDir = path.join(process.cwd(), 'certs')
  if (!fs.existsSync(certsDir)) {
    fs.mkdirSync(certsDir, { recursive: true })
  }

  // Guardar el archivo
  const filePath = path.join(certsDir, filename)
  fs.writeFileSync(filePath, buffer)

  return filePath
}

/**
 * Elimina un certificado del servidor
 */
export function deleteCertificate(certificatePath: string): boolean {
  try {
    if (fs.existsSync(certificatePath)) {
      fs.unlinkSync(certificatePath)
      return true
    }
    return false
  } catch {
    return false
  }
}

// Tipos

interface LoadedCertificate {
  certificate: forge.pki.Certificate
  privateKey: forge.pki.PrivateKey
  pem: {
    certificate: string
    privateKey: string
  }
}

interface CertificateValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  info: CertificateInfo
}

export type { LoadedCertificate, CertificateValidation }
