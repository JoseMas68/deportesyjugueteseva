import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  getVerifactuService,
  validateNif,
  saveCertificate,
  deleteCertificate,
  certificateExists,
} from '@/lib/verifactu'
import { z } from 'zod'

// Claves de configuración de Verifactu
const VERIFACTU_CONFIG_KEYS = [
  'verifactu_enabled',
  'verifactu_environment',
  'verifactu_auto_submit',
  'verifactu_default_tax_rate',
  'verifactu_certificate_path',
  'verifactu_certificate_password',
  'company_nif',
  'company_legal_name',
  'company_address',
  'company_postal_code',
  'company_city',
  'company_province',
  'company_country',
]

// GET /api/pos/verifactu/config - Obtener configuración
export async function GET() {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener configuración de la base de datos
    const configs = await prisma.siteConfig.findMany({
      where: {
        OR: [
          { key: { startsWith: 'verifactu_' } },
          { key: { startsWith: 'company_' } },
        ],
      },
    })

    const config: Record<string, string> = {}
    for (const item of configs) {
      // No devolver la contraseña del certificado
      if (item.key === 'verifactu_certificate_password') {
        config[item.key] = item.value ? '********' : ''
      } else {
        config[item.key] = item.value
      }
    }

    // Verificar estado del certificado si existe
    const certPath = config['verifactu_certificate_path']
    let certificateStatus = null

    if (certPath && certificateExists(certPath)) {
      const service = getVerifactuService()
      const validation = await service.validateCurrentCertificate()
      if (validation) {
        certificateStatus = {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          subject: validation.info.subject,
          validFrom: validation.info.validFrom,
          validTo: validation.info.validTo,
        }
      }
    }

    // Obtener estadísticas (manejo seguro de errores)
    let stats = { pending: 0, submitted: 0, accepted: 0, rejected: 0, cancelled: 0, total: 0 }
    try {
      const service = getVerifactuService()
      stats = await service.getStats()
    } catch (statsError) {
      console.error('Error getting Verifactu stats:', statsError)
    }

    return NextResponse.json({
      // Formato simplificado para el componente ConfigForm
      enabled: config['verifactu_enabled'] === 'true',
      environment: config['verifactu_environment'] || 'test',
      companyNif: config['company_nif'] || '',
      companyName: config['company_legal_name'] || '',
      certificateUploaded: !!config['verifactu_certificate_path'],
      autoSubmit: config['verifactu_auto_submit'] === 'true',
      // Datos completos para la página de configuración avanzada
      config,
      certificateStatus,
      stats,
    })
  } catch (error) {
    console.error('Error fetching verifactu config:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    )
  }
}

// PUT /api/pos/verifactu/config - Actualizar configuración
const updateSchema = z.object({
  // Formato simplificado (desde ConfigForm)
  enabled: z.boolean().optional(),
  // Formato completo
  verifactu_enabled: z.string().optional(),
  verifactu_environment: z.enum(['test', 'production']).optional(),
  verifactu_auto_submit: z.string().optional(),
  verifactu_default_tax_rate: z.string().optional(),
  verifactu_certificate_password: z.string().optional(),
  company_nif: z.string().optional(),
  company_legal_name: z.string().optional(),
  company_address: z.string().optional(),
  company_postal_code: z.string().optional(),
  company_city: z.string().optional(),
  company_province: z.string().optional(),
  company_country: z.string().optional(),
})

export async function PUT(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = updateSchema.parse(body)

    // Si viene 'enabled' booleano, convertir a formato de BD
    if (data.enabled !== undefined) {
      data.verifactu_enabled = data.enabled ? 'true' : 'false'
      delete data.enabled
    }

    // Validar NIF si se proporciona
    if (data.company_nif && !validateNif(data.company_nif)) {
      return NextResponse.json(
        { error: 'NIF no válido' },
        { status: 400 }
      )
    }

    // Actualizar configuraciones
    const updates = Object.entries(data).filter(([, value]) => value !== undefined)

    for (const [key, value] of updates) {
      // No actualizar contraseña si es el placeholder
      if (key === 'verifactu_certificate_password' && value === '********') {
        continue
      }

      await prisma.siteConfig.upsert({
        where: { key },
        create: {
          key,
          value: value as string,
          group: key.startsWith('company_') ? 'verifactu' : 'verifactu',
          type: 'text',
        },
        update: {
          value: value as string,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración actualizada',
    })
  } catch (error) {
    console.error('Error updating verifactu config:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    )
  }
}

// POST /api/pos/verifactu/config - Acciones especiales (subir certificado, probar conexión)
const actionSchema = z.object({
  action: z.enum(['uploadCertificate', 'testConnection', 'deleteCertificate']),
})

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar si es multipart (subida de archivo) o JSON
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      // Subida de certificado
      const formData = await request.formData()
      const file = formData.get('certificate') as File | null
      const password = formData.get('password') as string | null

      if (!file) {
        return NextResponse.json(
          { error: 'No se proporcionó archivo de certificado' },
          { status: 400 }
        )
      }

      if (!password) {
        return NextResponse.json(
          { error: 'Se requiere la contraseña del certificado' },
          { status: 400 }
        )
      }

      // Verificar extensión
      const filename = file.name.toLowerCase()
      if (!filename.endsWith('.pfx') && !filename.endsWith('.p12')) {
        return NextResponse.json(
          { error: 'El archivo debe ser .pfx o .p12' },
          { status: 400 }
        )
      }

      // Guardar certificado
      const buffer = Buffer.from(await file.arrayBuffer())
      const savedPath = await saveCertificate(buffer, `verifactu_${Date.now()}.pfx`)

      // Guardar ruta y contraseña en configuración
      await prisma.siteConfig.upsert({
        where: { key: 'verifactu_certificate_path' },
        create: {
          key: 'verifactu_certificate_path',
          value: savedPath,
          group: 'verifactu',
          type: 'text',
        },
        update: { value: savedPath },
      })

      await prisma.siteConfig.upsert({
        where: { key: 'verifactu_certificate_password' },
        create: {
          key: 'verifactu_certificate_password',
          value: password,
          group: 'verifactu',
          type: 'text',
        },
        update: { value: password },
      })

      // Validar el certificado
      const service = getVerifactuService()
      const validation = await service.validateCurrentCertificate()

      return NextResponse.json({
        success: true,
        message: 'Certificado subido correctamente',
        validation: validation ? {
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          info: {
            subject: validation.info.subject,
            validFrom: validation.info.validFrom,
            validTo: validation.info.validTo,
          },
        } : null,
      })
    }

    // Petición JSON normal
    const body = await request.json()
    const { action } = actionSchema.parse(body)

    switch (action) {
      case 'testConnection': {
        const service = getVerifactuService()
        const result = await service.testAEATConnection()
        return NextResponse.json({
          success: result.success,
          message: result.message,
          details: result.details,
        })
      }

      case 'deleteCertificate': {
        const config = await prisma.siteConfig.findUnique({
          where: { key: 'verifactu_certificate_path' },
        })

        if (config?.value) {
          deleteCertificate(config.value)
        }

        // Eliminar configuración
        await prisma.siteConfig.deleteMany({
          where: {
            key: {
              in: ['verifactu_certificate_path', 'verifactu_certificate_password'],
            },
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Certificado eliminado',
        })
      }

      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error processing verifactu config action:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al procesar acción' },
      { status: 500 }
    )
  }
}
