import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from './prisma'

const SESSION_COOKIE_NAME = 'customer_session'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 días en ms

// Usar una clave segura desde variables de entorno, o generar una por defecto para desarrollo
const getSecretKey = () => {
  const secret = process.env.CUSTOMER_SESSION_SECRET || process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production-min-32-chars!'
  return new TextEncoder().encode(secret)
}

export interface CustomerSession {
  id: string
  email: string
  firstName: string
  lastName: string
  isVip: boolean
  loyaltyPoints: number
}

export interface CustomerSessionPayload extends CustomerSession {
  exp: number
  iat: number
}

/**
 * Crea un token JWT para la sesión del cliente
 */
export async function createSessionToken(customer: CustomerSession): Promise<string> {
  const token = await new SignJWT({ ...customer })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecretKey())

  return token
}

/**
 * Verifica y decodifica un token JWT
 */
export async function verifySessionToken(token: string): Promise<CustomerSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload as unknown as CustomerSessionPayload
  } catch {
    return null
  }
}

/**
 * Establece la cookie de sesión del cliente
 */
export async function setCustomerSessionCookie(customer: CustomerSession): Promise<void> {
  const token = await createSessionToken(customer)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION / 1000, // en segundos
  })
}

/**
 * Obtiene la sesión del cliente desde la cookie
 */
export async function getCustomerSession(): Promise<CustomerSession | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const payload = await verifySessionToken(sessionCookie.value)

    if (!payload) {
      return null
    }

    // Verificar que el cliente sigue activo en la base de datos
    const customer = await prisma.customer.findUnique({
      where: { id: payload.id },
      select: { isActive: true }
    })

    if (!customer?.isActive) {
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      isVip: payload.isVip,
      loyaltyPoints: payload.loyaltyPoints,
    }
  } catch {
    return null
  }
}

/**
 * Elimina la cookie de sesión del cliente
 */
export async function clearCustomerSessionCookie(): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0, // Expira inmediatamente
  })
}

/**
 * Refresca la sesión del cliente (extiende la expiración)
 */
export async function refreshCustomerSession(): Promise<boolean> {
  const session = await getCustomerSession()

  if (!session) {
    return false
  }

  // Obtener datos actualizados del cliente
  const customer = await prisma.customer.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isVip: true,
      loyaltyPoints: true,
      isActive: true,
    }
  })

  if (!customer?.isActive) {
    await clearCustomerSessionCookie()
    return false
  }

  // Crear nueva cookie con tiempo extendido
  await setCustomerSessionCookie({
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    isVip: customer.isVip,
    loyaltyPoints: customer.loyaltyPoints,
  })

  return true
}

/**
 * Valida la complejidad de una contraseña
 */
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una mayúscula')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una minúscula')
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
