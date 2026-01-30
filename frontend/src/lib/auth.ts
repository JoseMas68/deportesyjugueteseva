// Gestión de autenticación de clientes con JWT en localStorage

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
const TOKEN_KEY = 'customer_token';
const CUSTOMER_KEY = 'customer_data';

/**
 * Guarda el token y datos del cliente en localStorage
 */
function saveSession(token: string, customer: Customer): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  window.dispatchEvent(new CustomEvent('customer-updated', { detail: customer }));
}

/**
 * Obtiene el token de localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Obtiene el cliente actual desde localStorage
 */
export async function getCurrentCustomer(): Promise<Customer | null> {
  if (typeof window === 'undefined') return null;

  const customerData = localStorage.getItem(CUSTOMER_KEY);
  if (!customerData) return null;

  try {
    return JSON.parse(customerData) as Customer;
  } catch {
    return null;
  }
}

/**
 * Actualiza el cache local del cliente
 */
export function updateCustomerCache(customer: Customer): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  window.dispatchEvent(new CustomEvent('customer-updated', { detail: customer }));
}

/**
 * Limpia la sesión
 */
export function clearCustomerCache(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
  window.dispatchEvent(new CustomEvent('customer-logout'));
}

/**
 * Verifica si hay un cliente autenticado
 */
export async function isAuthenticated(): Promise<boolean> {
  const customer = await getCurrentCustomer();
  return customer !== null;
}

/**
 * Verifica autenticación de forma síncrona
 */
export function isAuthenticatedSync(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(TOKEN_KEY) !== null;
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
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.token) {
      saveSession(result.token, result.customer);
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
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();

    if (response.ok && result.token) {
      saveSession(result.token, result.customer);
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
 * Cerrar sesión
 */
export async function logout(): Promise<void> {
  clearCustomerCache();
}

/**
 * Cambiar contraseña
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message?: string; errors?: string[] }> {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/customers/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
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
 * Obtener nombre completo del cliente
 */
export function getCustomerFullName(customer: Customer | null): string {
  if (!customer) return '';
  return `${customer.firstName} ${customer.lastName}`;
}

/**
 * Obtener cliente del cache (síncrono)
 */
export function getCachedCustomer(): Customer | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(CUSTOMER_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Hacer petición autenticada (añade el token automáticamente)
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  return fetch(url, { ...options, headers });
}
