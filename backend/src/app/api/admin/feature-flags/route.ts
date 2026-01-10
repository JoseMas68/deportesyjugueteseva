import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener todos los feature flags
export async function GET() {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const flags = await prisma.featureFlag.findMany({
      orderBy: [{ group: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ flags })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json(
      { error: 'Error al obtener feature flags' },
      { status: 500 }
    )
  }
}

// POST - Crear o actualizar un feature flag
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { key, name, description, isEnabled, group } = await request.json()

    if (!key || !name) {
      return NextResponse.json(
        { error: 'Key y name son obligatorios' },
        { status: 400 }
      )
    }

    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: { name, description, isEnabled, group },
      create: { key, name, description, isEnabled: isEnabled ?? false, group },
    })

    return NextResponse.json({ flag })
  } catch (error) {
    console.error('Error saving feature flag:', error)
    return NextResponse.json(
      { error: 'Error al guardar feature flag' },
      { status: 500 }
    )
  }
}
