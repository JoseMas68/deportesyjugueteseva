import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

// GET - Obtener un usuario específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin puede ver detalles de usuarios
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Se requiere rol de super administrador' }, { status: 403 })
    }

    const { id } = await params

    const user = await prisma.adminUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 })
  }
}

// PATCH - Actualizar usuario
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin puede editar usuarios
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Se requiere rol de super administrador' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, role, isActive } = body

    // Verificar que el usuario existe
    const existingUser = await prisma.adminUser.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // No permitir que un super_admin se quite a sí mismo el rol
    if (id === admin.id && role && role !== 'super_admin') {
      return NextResponse.json({ error: 'No puedes cambiar tu propio rol de super administrador' }, { status: 400 })
    }

    // No permitir desactivarse a sí mismo
    if (id === admin.id && isActive === false) {
      return NextResponse.json({ error: 'No puedes desactivar tu propia cuenta' }, { status: 400 })
    }

    // Validar rol si se proporciona
    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (isActive !== undefined) updateData.isActive = isActive

    const updatedUser = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updatedUser, message: 'Usuario actualizado correctamente' })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

// DELETE - Eliminar usuario
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin puede eliminar usuarios
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Se requiere rol de super administrador' }, { status: 403 })
    }

    const { id } = await params

    // No permitir eliminarse a sí mismo
    if (id === admin.id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    // Verificar que el usuario existe
    const existingUser = await prisma.adminUser.findUnique({
      where: { id },
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    await prisma.adminUser.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
