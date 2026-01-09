import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

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

    const supabase = await createServerSupabaseClient()
    const uploadedUrls: string[] = []
    const errors: string[] = []

    for (const file of files) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: No es una imagen valida`)
        continue
      }

      // Validar tamano (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`${file.name}: El archivo supera los 5MB`)
        continue
      }

      // Generar nombre unico
      const ext = file.name.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const fileName = `products/${timestamp}-${random}.${ext}`

      // Convertir File a ArrayBuffer y luego a Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('products')
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error('Upload error:', error)
        errors.push(`${file.name}: Error al subir`)
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
    })
  } catch (error) {
    console.error('Error uploading files:', error)
    return NextResponse.json(
      { error: 'Error al subir archivos' },
      { status: 500 }
    )
  }
}
