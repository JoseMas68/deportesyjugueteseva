// Gestión de autenticación de clientes con cookies httpOnly

export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  gender: string | null;
  taxId: string | null;
  birthDate: string | null;
  isVip: boolean;
  loyaltyPoints: number;
  acceptsMarketing: boolean;
  createdAt: string;
}

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

// Cache local de la sesión (solo para evitar llamadas repetidas en la misma carga de página)
let cachedCustomer: Customer | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minuto

/**
 * Obtiene el cliente actual desde el servidor (verifica la cookie de sesión)
 */
export async function getCurrentCustomer(): Promise<Customer | null> {
  if (typeof window === 'undefined') return null;

  // Usar cache si es reciente
  const now = Date.now();
  if (cachedCustomer && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedCustomer;
  }

  try {
    const response = await fetch(`${API_URL}/customers/auth/session`, {
      method: 'GET',
      credentials: 'include', // Incluir cookies
    });

    if (!response.ok) {
      cachedCustomer = null;
      return null;
    }

    const data = await response.json();

    if (data.authenticated && data.customer) {
      cachedCustomer = data.customer;
      cacheTimestamp = now;
      return data.customer;
    }

    cachedCustomer = null;
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    cachedCustomer = null;
    return null;
  }
}

/**
 * Actualiza el cache local del cliente (llamar después de login/registro exitoso)
 */
export function updateCustomerCache(customer: Customer): void {
  cachedCustomer = customer;
  cacheTimestamp = Date.now();

  // Disparar evento personalizado
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('customer-updated', { detail: customer }));
  }
}

/**
 * Limpia el cache local
 */
export function clearCustomerCache(): void {
  cachedCustomer = null;
  cacheTimestamp = 0;

  // Disparar evento
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('customer-logout'));
  }
}

/**
 * Verifica si hay un cliente autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const customer = await getCurrentCustomer();
  return customer !== null;
}

/**
 * Verifica autenticación de forma síncrona usando el cache
 * (útil para renderizado inicial, pero puede estar desactualizado)
 */
export function isAuthenticatedSync(): boolean {
  return cachedCustomer !== null;
}

/**
 * Registrar nuevo cliente
 */
export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptsMarketing?: boolean;
}): Promise<{ success: boolean; message?: string; errors?: string[]; customer?: Customer }> {
  try {
    const response = await fetch(`${API_URL}/customers/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Incluir cookies
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      updateCustomerCache(result.customer);
      return { success: true, customer: result.customer };
    } else {
      return {
        success: false,
        message: result.error || 'Error al registrar',
        errors: result.errors
      };
    }
  } catch (error) {
    console.error('Register error:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

/**
 * Iniciar sesión
 */
export async function login(email: string, password: string): Promise<{ success: boolean; message?: string; customer?: Customer }> {
  try {
    const response = await fetch(`${API_URL}/customers/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Incluir cookies
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok) {
      updateCustomerCache(result.customer);
      return { success: true, customer: result.customer };
    } else {
      return { success: false, message: result.error || 'Error al iniciar sesión' };
    }
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

/**
 * Cerrar sesión (llama al servidor para invalidar la cookie)
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${API_URL}/customers/auth/logout`, {
      method: 'POST',
      credentials: 'include', // Incluir cookies
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearCustomerCache();
  }
}

/**
 * Cambiar contraseña
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; errors?: string[] }> {
  try {
    const response = await fetch(`${API_URL}/customers/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Incluir cookies
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const result = await response.json();

    if (response.ok) {
      return { success: true, message: result.message };
    } else {
      return {
        success: false,
        message: result.error || 'Error al cambiar contraseña',
        errors: result.errors
      };
    }
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, message: 'Error de conexión' };
  }
}

/**
 * Refrescar sesión (extender expiración)
 */
export async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/customers/auth/session`, {
      method: 'POST',
      credentials: 'include',
    });

    return response.ok;
  } catch (error) {
    console.error('Refresh session error:', error);
    return false;
  }
}

/**
 * Obtener nombre completo del cliente
 */
export function getCustomerFullName(customer: Customer | null): string {
  if (!customer) return '';
  return `${customer.firstName} ${customer.lastName}`;
}

/**
 * Obtener cliente del cache (síncrono, puede ser null si no se ha cargado)
 */
export function getCachedCustomer(): Customer | null {
  return cachedCustomer;
}
