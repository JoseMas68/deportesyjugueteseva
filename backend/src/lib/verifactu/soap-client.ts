/**
 * Cliente SOAP para comunicación con la AEAT
 * Envío y recepción de registros Verifactu
 */

import https from 'https'
import fs from 'fs'
import { AEAT_ENDPOINTS, type AeatResponse, type VerifactuConfig } from './types'
import { parseAeatResponse } from './xml'
import { loadCertificate, type LoadedCertificate } from './certificate'

/**
 * Envía una factura a la AEAT
 */
export async function submitInvoice(
  xmlContent: string,
  config: VerifactuConfig
): Promise<AeatResponse> {
  const endpoint = config.environment === 'production'
    ? AEAT_ENDPOINTS.production.submit
    : AEAT_ENDPOINTS.test.submit

  return sendSoapRequest(endpoint, xmlContent, config)
}

/**
 * Envía una anulación de factura a la AEAT
 */
export async function cancelInvoice(
  xmlContent: string,
  config: VerifactuConfig
): Promise<AeatResponse> {
  const endpoint = config.environment === 'production'
    ? AEAT_ENDPOINTS.production.cancel
    : AEAT_ENDPOINTS.test.cancel

  return sendSoapRequest(endpoint, xmlContent, config)
}

/**
 * Realiza una petición SOAP a la AEAT con autenticación por certificado
 */
async function sendSoapRequest(
  endpoint: string,
  xmlContent: string,
  config: VerifactuConfig
): Promise<AeatResponse> {
  // Verificar que hay certificado configurado
  if (!config.certificatePath || !config.certificatePassword) {
    return {
      success: false,
      timestamp: new Date(),
      errorCode: 'NO_CERTIFICATE',
      errorMessage: 'No hay certificado digital configurado',
    }
  }

  // Verificar que el archivo existe
  if (!fs.existsSync(config.certificatePath)) {
    return {
      success: false,
      timestamp: new Date(),
      errorCode: 'CERTIFICATE_NOT_FOUND',
      errorMessage: 'No se encuentra el archivo de certificado',
    }
  }

  try {
    // Cargar el certificado
    const certificate = await loadCertificate(
      config.certificatePath,
      config.certificatePassword
    )

    // Realizar la petición HTTPS con certificado cliente
    const response = await makeHttpsRequest(endpoint, xmlContent, certificate)

    // Parsear la respuesta
    const parsed = await parseAeatResponse(response)

    return {
      success: parsed.success,
      timestamp: new Date(),
      responseCode: parsed.estadoEnvio,
      message: parsed.success ? 'Registro enviado correctamente' : undefined,
      errorCode: parsed.errorCode,
      errorMessage: parsed.errorMessage,
      rawResponse: response,
    }
  } catch (error) {
    console.error('Error enviando a AEAT:', error)

    return {
      success: false,
      timestamp: new Date(),
      errorCode: 'CONNECTION_ERROR',
      errorMessage: error instanceof Error ? error.message : 'Error de conexión con AEAT',
    }
  }
}

/**
 * Realiza una petición HTTPS con certificado cliente
 */
function makeHttpsRequest(
  endpoint: string,
  body: string,
  certificate: LoadedCertificate
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint)

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'Content-Length': Buffer.byteLength(body, 'utf8'),
        'SOAPAction': '""',
      },
      // Certificado cliente para autenticación mutua TLS
      cert: certificate.pem.certificate,
      key: certificate.pem.privateKey,
      // Deshabilitar verificación de certificado del servidor en test
      // En producción esto debería estar habilitado
      rejectUnauthorized: true,
    }

    const req = https.request(options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data)
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Timeout de conexión con AEAT'))
    })

    // Timeout de 30 segundos
    req.setTimeout(30000)

    req.write(body)
    req.end()
  })
}

/**
 * Prueba la conexión con el servidor de AEAT
 */
export async function testConnection(config: VerifactuConfig): Promise<ConnectionTestResult> {
  // Verificar certificado
  if (!config.certificatePath || !config.certificatePassword) {
    return {
      success: false,
      message: 'No hay certificado configurado',
      details: {
        certificateValid: false,
        serverReachable: false,
      },
    }
  }

  // Verificar que el archivo existe
  if (!fs.existsSync(config.certificatePath)) {
    return {
      success: false,
      message: 'Archivo de certificado no encontrado',
      details: {
        certificateValid: false,
        serverReachable: false,
      },
    }
  }

  try {
    // Intentar cargar el certificado
    const certificate = await loadCertificate(
      config.certificatePath,
      config.certificatePassword
    )

    // Verificar validez del certificado
    const certInfo = certificate.certificate
    const now = new Date()
    const isValid = now >= certInfo.validity.notBefore && now <= certInfo.validity.notAfter

    if (!isValid) {
      return {
        success: false,
        message: 'El certificado no es válido (caducado o no activo)',
        details: {
          certificateValid: false,
          serverReachable: false,
          certificateExpiry: certInfo.validity.notAfter,
        },
      }
    }

    // Intentar conectar al servidor (sin enviar datos)
    const endpoint = config.environment === 'production'
      ? AEAT_ENDPOINTS.production.submit
      : AEAT_ENDPOINTS.test.submit

    const serverReachable = await checkServerReachable(endpoint)

    return {
      success: serverReachable,
      message: serverReachable
        ? 'Conexión exitosa con AEAT'
        : 'Certificado válido pero no se pudo conectar al servidor',
      details: {
        certificateValid: true,
        serverReachable,
        certificateExpiry: certInfo.validity.notAfter,
        environment: config.environment,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido',
      details: {
        certificateValid: false,
        serverReachable: false,
      },
    }
  }
}

/**
 * Verifica si el servidor AEAT está accesible
 */
function checkServerReachable(endpoint: string): Promise<boolean> {
  return new Promise((resolve) => {
    const url = new URL(endpoint)

    const req = https.request({
      hostname: url.hostname,
      port: 443,
      method: 'HEAD',
      timeout: 10000,
    }, (res) => {
      // Cualquier respuesta significa que el servidor está accesible
      resolve(true)
    })

    req.on('error', () => {
      resolve(false)
    })

    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })

    req.end()
  })
}

// Tipos

interface ConnectionTestResult {
  success: boolean
  message: string
  details: {
    certificateValid: boolean
    serverReachable: boolean
    certificateExpiry?: Date
    environment?: string
  }
}

export type { ConnectionTestResult }
