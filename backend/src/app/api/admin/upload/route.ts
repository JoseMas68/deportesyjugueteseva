import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

// Crear cliente con service role para subir archivos (bypasses RLS)
function createStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron archivos' },
        { status: 400 }
      )
    }

    const supabase = createStorageClient()
    const uploadedUrls: string[] = []
    const errors: string[] = []

    // Verificar que el bucket existe
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()

    if (bucketError) {
      console.error('Error listing buckets:', bucketError)
      return NextResponse.json(
        { error: 'Error al conectar con el almacenamiento. Verifica la configuracion de Supabase.' },
        { status: 500 }
      )
    }

    const productsBucket = buckets?.find(b => b.name === 'products')
    if (!productsBucket) {
      // Intentar crear el bucket
      const { error: createError } = await supabase.storage.createBucket('products', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      })

      if (createError) {
        console.error('Error creating bucket:', createError)
        return NextResponse.json(
          { error: 'El bucket "products" no existe y no se pudo crear. Crealo manualmente en Supabase Storage.' },
          { status: 500 }
        )
      }
    }

    for (const file of files) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Tipo no permitido (${file.type}). Solo JPG, PNG, WebP, GIF.`)
        continue
      }

      // Validar tamano (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: El archivo supera los 5MB (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
        continue
      }

      // Generar nombre unico
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const fileName = `${timestamp}-${random}.${ext}`

      // Convertir File a ArrayBuffer y luego a Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '31536000', // 1 año
          upsert: false,
        })

      if (error) {
        console.error('Upload error for', file.name, ':', error)
        errors.push(`${file.name}: ${error.message || 'Error al subir'}`)
        continue
      }

      // Obtener URL publica
      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(data.path)

      uploadedUrls.push(urlData.publicUrl)
    }

    if (uploadedUrls.length === 0 && errors.length > 0) {
      return NextResponse.json(
        { error: 'No se pudo subir ninguna imagen', details: errors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      urls: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedUrls.length} imagen${uploadedUrls.length !== 1 ? 'es' : ''} subida${uploadedUrls.length !== 1 ? 's' : ''} correctamente`,
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al subir archivos' },
      { status: 500 }
    )
  }
}
