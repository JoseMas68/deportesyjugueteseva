import { createServerSupabaseClient } from './supabase-server'
import { prisma } from './prisma'
import { redirect } from 'next/navigation'

export interface AdminUser {
  id: string
  email: string
  name: string | null
  role: 'admin' | 'super_admin'
  isActive: boolean
  lastLoginAt: Date | null
}

/**
 * Obtiene la sesion del admin actual desde las cookies de Supabase
 * Retorna null si no hay sesion o el usuario no es admin
 */
export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    // Buscar el usuario en la tabla AdminUser
    const adminUser = await prisma.adminUser.findUnique({
      where: { supabaseId: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      }
    })

    if (!adminUser || !adminUser.isActive) {
      return null
    }

    return adminUser as AdminUser
  } catch (error) {
    console.error('Error getting admin session:', error)
    return null
  }
}

/**
 * Requiere que el usuario sea un admin autenticado
 * Redirige a /login si no lo es
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminSession()

  if (!admin) {
    redirect('/login')
  }

  return admin
}

/**
 * Requiere que el usuario sea un super_admin
 * Redirige a /admin si no lo es
 */
export async function requireSuperAdmin(): Promise<AdminUser> {
  const admin = await requireAdmin()

  if (admin.role !== 'super_admin') {
    redirect('/admin')
  }

  return admin
}

/**
 * Actualiza la fecha del ultimo login
 */
export async function updateLastLogin(adminId: string): Promise<void> {
  try {
    await prisma.adminUser.update({
      where: { id: adminId },
      data: { lastLoginAt: new Date() }
    })
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}
