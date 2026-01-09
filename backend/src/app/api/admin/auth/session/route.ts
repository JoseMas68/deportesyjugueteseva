import { NextResponse } from 'next/server'
import { getAdminSession, updateLastLogin } from '@/lib/auth'

export async function GET() {
  try {
    const admin = await getAdminSession()

    if (!admin) {
      return NextResponse.json({ admin: null })
    }

    // Actualizar ultimo login
    await updateLastLogin(admin.id)

    return NextResponse.json({ admin })
  } catch (error) {
    console.error('Error getting session:', error)
    return NextResponse.json(
      { error: 'Error al obtener la sesion' },
      { status: 500 }
    )
  }
}
