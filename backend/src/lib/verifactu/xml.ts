/**
 * Generación de XML SOAP para Verifactu
 * Según especificación técnica de la AEAT
 */

import * as xml2js from 'xml2js'
import type { VerifactuInvoice, VerifactuConfig } from './types'

// Namespaces XML requeridos por AEAT
const NAMESPACES = {
  soapenv: 'http://schemas.xmlsoap.org/soap/envelope/',
  siiRL: 'https://www2.agenciatributaria.gob.es/static_files/common/internet/dep/aplicaciones/es/aeat/tike/cont/ws/SusumitroFactEmitidas.xsd',
}

/**
 * Genera el XML SOAP para envío de factura a AEAT
 */
export function generateInvoiceXML(
  invoice: VerifactuInvoice,
  hash: string,
  config: VerifactuConfig
): string {
  const invoiceDate = formatDateXML(invoice.invoiceDate)
  const currentDate = formatDateXML(new Date())

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${NAMESPACES.soapenv}" xmlns:siiRL="${NAMESPACES.siiRL}">
  <soapenv:Header/>
  <soapenv:Body>
    <siiRL:SuministroFactEmitidas>
      <siiRL:Cabecera>
        <siiRL:IDVersionSii>1.1</siiRL:IDVersionSii>
        <siiRL:Titular>
          <siiRL:NombreRazon>${escapeXml(config.companyLegalName)}</siiRL:NombreRazon>
          <siiRL:NIF>${escapeXml(config.companyNif)}</siiRL:NIF>
        </siiRL:Titular>
        <siiRL:TipoComunicacion>A0</siiRL:TipoComunicacion>
      </siiRL:Cabecera>
      <siiRL:RegistroFactEmitidas>
        <siiRL:PeriodoLiquidacion>
          <siiRL:Ejercicio>${invoice.invoiceDate.getFullYear()}</siiRL:Ejercicio>
          <siiRL:Periodo>${String(invoice.invoiceDate.getMonth() + 1).padStart(2, '0')}</siiRL:Periodo>
        </siiRL:PeriodoLiquidacion>
        <siiRL:IDFactura>
          <siiRL:IDEmisorFactura>
            <siiRL:NIF>${escapeXml(invoice.issuerNif)}</siiRL:NIF>
          </siiRL:IDEmisorFactura>
          <siiRL:NumSerieFacturaEmisor>${escapeXml(invoice.invoiceNumber)}</siiRL:NumSerieFacturaEmisor>
          <siiRL:FechaExpedicionFacturaEmisor>${invoiceDate}</siiRL:FechaExpedicionFacturaEmisor>
        </siiRL:IDFactura>
        <siiRL:FacturaExpedida>
          <siiRL:TipoFactura>${invoice.invoiceType}</siiRL:TipoFactura>
          <siiRL:ClaveRegimenEspecialOTrascendencia>01</siiRL:ClaveRegimenEspecialOTrascendencia>
          <siiRL:ImporteTotal>${formatAmountXML(invoice.totalAmount)}</siiRL:ImporteTotal>
          <siiRL:DescripcionOperacion>${escapeXml(invoice.description || 'Venta TPV')}</siiRL:DescripcionOperacion>
          ${generateRecipientXML(invoice)}
          <siiRL:TipoDesglose>
            <siiRL:DesgloseFactura>
              <siiRL:Sujeta>
                <siiRL:NoExenta>
                  <siiRL:TipoNoExenta>S1</siiRL:TipoNoExenta>
                  <siiRL:DesgloseIVA>
                    <siiRL:DetalleIVA>
                      <siiRL:TipoImpositivo>${formatAmountXML(invoice.taxRate)}</siiRL:TipoImpositivo>
                      <siiRL:BaseImponible>${formatAmountXML(invoice.baseAmount)}</siiRL:BaseImponible>
                      <siiRL:CuotaRepercutida>${formatAmountXML(invoice.taxAmount)}</siiRL:CuotaRepercutida>
                    </siiRL:DetalleIVA>
                  </siiRL:DesgloseIVA>
                </siiRL:NoExenta>
              </siiRL:Sujeta>
            </siiRL:DesgloseFactura>
          </siiRL:TipoDesglose>
          <siiRL:Huella>${hash}</siiRL:Huella>
          <siiRL:FechaHoraHusoGenRegistro>${formatTimestampXML(new Date())}</siiRL:FechaHoraHusoGenRegistro>
          <siiRL:NumRegistroAcuerdoFacturacion>VERIFACTU</siiRL:NumRegistroAcuerdoFacturacion>
          <siiRL:SistemaInformatico>
            <siiRL:NombreRazon>Deportes y Juguetes Eva TPV</siiRL:NombreRazon>
            <siiRL:NIF>${escapeXml(config.companyNif)}</siiRL:NIF>
            <siiRL:IdSistemaInformatico>EVDJ-TPV-001</siiRL:IdSistemaInformatico>
            <siiRL:Version>1.0</siiRL:Version>
            <siiRL:NumeroInstalacion>001</siiRL:NumeroInstalacion>
          </siiRL:SistemaInformatico>
        </siiRL:FacturaExpedida>
      </siiRL:RegistroFactEmitidas>
    </siiRL:SuministroFactEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`

  return xml.trim()
}

/**
 * Genera el XML para anulación de factura
 */
export function generateCancellationXML(
  invoiceNumber: string,
  invoiceDate: Date,
  reason: string,
  config: VerifactuConfig
): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="${NAMESPACES.soapenv}" xmlns:siiRL="${NAMESPACES.siiRL}">
  <soapenv:Header/>
  <soapenv:Body>
    <siiRL:BajaFactEmitidas>
      <siiRL:Cabecera>
        <siiRL:IDVersionSii>1.1</siiRL:IDVersionSii>
        <siiRL:Titular>
          <siiRL:NombreRazon>${escapeXml(config.companyLegalName)}</siiRL:NombreRazon>
          <siiRL:NIF>${escapeXml(config.companyNif)}</siiRL:NIF>
        </siiRL:Titular>
        <siiRL:TipoComunicacion>A1</siiRL:TipoComunicacion>
      </siiRL:Cabecera>
      <siiRL:RegistroFactEmitidas>
        <siiRL:PeriodoLiquidacion>
          <siiRL:Ejercicio>${invoiceDate.getFullYear()}</siiRL:Ejercicio>
          <siiRL:Periodo>${String(invoiceDate.getMonth() + 1).padStart(2, '0')}</siiRL:Periodo>
        </siiRL:PeriodoLiquidacion>
        <siiRL:IDFactura>
          <siiRL:IDEmisorFactura>
            <siiRL:NIF>${escapeXml(config.companyNif)}</siiRL:NIF>
          </siiRL:IDEmisorFactura>
          <siiRL:NumSerieFacturaEmisor>${escapeXml(invoiceNumber)}</siiRL:NumSerieFacturaEmisor>
          <siiRL:FechaExpedicionFacturaEmisor>${formatDateXML(invoiceDate)}</siiRL:FechaExpedicionFacturaEmisor>
        </siiRL:IDFactura>
      </siiRL:RegistroFactEmitidas>
    </siiRL:BajaFactEmitidas>
  </soapenv:Body>
</soapenv:Envelope>`

  return xml.trim()
}

/**
 * Genera el bloque XML del receptor (si existe)
 */
function generateRecipientXML(invoice: VerifactuInvoice): string {
  if (!invoice.recipientNif || !invoice.recipientName) {
    return ''
  }

  return `
          <siiRL:Contraparte>
            <siiRL:NombreRazon>${escapeXml(invoice.recipientName)}</siiRL:NombreRazon>
            <siiRL:NIF>${escapeXml(invoice.recipientNif)}</siiRL:NIF>
          </siiRL:Contraparte>`
}

/**
 * Parsea una respuesta XML de AEAT
 */
export async function parseAeatResponse(xmlResponse: string): Promise<AeatParsedResponse> {
  try {
    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
      tagNameProcessors: [xml2js.processors.stripPrefix],
    })

    const result = await parser.parseStringPromise(xmlResponse)
    const body = result?.Envelope?.Body

    if (!body) {
      return {
        success: false,
        errorCode: 'PARSE_ERROR',
        errorMessage: 'Respuesta XML inválida',
      }
    }

    // Buscar errores
    if (body.Fault) {
      return {
        success: false,
        errorCode: body.Fault.faultcode || 'SOAP_FAULT',
        errorMessage: body.Fault.faultstring || 'Error SOAP',
      }
    }

    // Buscar respuesta de registro
    const response = body.RespuestaFactEmitidas || body.RespuestaBajaFactEmitidas
    if (response) {
      const estadoEnvio = response.EstadoEnvio
      const success = estadoEnvio === 'Correcto' || estadoEnvio === 'AceptadoConErrores'

      return {
        success,
        estadoEnvio,
        csv: response.CSV,
        registros: response.RespuestaLinea,
      }
    }

    return {
      success: false,
      errorCode: 'UNKNOWN_RESPONSE',
      errorMessage: 'Formato de respuesta desconocido',
    }
  } catch (error) {
    return {
      success: false,
      errorCode: 'PARSE_ERROR',
      errorMessage: `Error parseando respuesta: ${error}`,
    }
  }
}

/**
 * Valida la estructura del XML antes de enviarlo
 */
export function validateXML(xml: string): ValidationResult {
  const errors: string[] = []

  // Verificar que sea XML válido
  if (!xml.startsWith('<?xml')) {
    errors.push('El XML debe comenzar con declaración XML')
  }

  // Verificar elementos obligatorios
  const requiredElements = [
    'soapenv:Envelope',
    'soapenv:Body',
    'NIF',
    'NumSerieFacturaEmisor',
    'FechaExpedicionFacturaEmisor',
    'TipoFactura',
    'ImporteTotal',
    'Huella',
  ]

  for (const element of requiredElements) {
    if (!xml.includes(element)) {
      errors.push(`Falta elemento obligatorio: ${element}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

// Funciones auxiliares

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDateXML(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTimestampXML(date: Date): string {
  return date.toISOString()
}

function formatAmountXML(amount: number): string {
  return amount.toFixed(2)
}

// Tipos auxiliares

interface AeatParsedResponse {
  success: boolean
  estadoEnvio?: string
  csv?: string
  registros?: unknown
  errorCode?: string
  errorMessage?: string
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}
