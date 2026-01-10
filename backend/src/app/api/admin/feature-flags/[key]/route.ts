import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: Promise<{ key: string }>
}

// GET - Obtener un feature flag específico
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { key } = await params

    const flag = await prisma.featureFlag.findUnique({
      where: { key },
    })

    if (!flag) {
      return NextResponse.json(
        { error: 'Feature flag no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ flag })
  } catch (error) {
    console.error('Error fetching feature flag:', error)
    return NextResponse.json(
      { error: 'Error al obtener feature flag' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar estado de un feature flag (toggle)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { key } = await params
    const { isEnabled } = await request.json()

    const flag = await prisma.featureFlag.update({
      where: { key },
      data: { isEnabled },
    })

    return NextResponse.json({ flag })
  } catch (error) {
    console.error('Error updating feature flag:', error)
    return NextResponse.json(
      { error: 'Error al actualizar feature flag' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar un feature flag
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { key } = await params

    await prisma.featureFlag.delete({
      where: { key },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting feature flag:', error)
    return NextResponse.json(
      { error: 'Error al eliminar feature flag' },
      { status: 500 }
    )
  }
}
