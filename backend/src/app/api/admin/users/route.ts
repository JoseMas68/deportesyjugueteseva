import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminSession } from '@/lib/auth'

// GET - Listar usuarios admin
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin puede ver la lista de usuarios
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Se requiere rol de super administrador' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''

    const where: any = {}

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (role) {
      where.role = role
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    const users = await prisma.adminUser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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

    const total = await prisma.adminUser.count({ where })

    return NextResponse.json({ users, total })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

// POST - Crear nuevo usuario admin
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession()
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo super_admin puede crear usuarios
    if (admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Se requiere rol de super administrador' }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, role } = body

    if (!email) {
      return NextResponse.json({ error: 'El email es requerido' }, { status: 400 })
    }

    // Validar rol
    if (role && !['admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    // Verificar que el email no exista
    const existingUser = await prisma.adminUser.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 400 })
    }

    // Crear usuario con un supabaseId temporal (se actualizará cuando el usuario se registre)
    const newUser = await prisma.adminUser.create({
      data: {
        email,
        name: name || null,
        role: role || 'admin',
        supabaseId: `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: newUser, message: 'Usuario creado correctamente' })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}
