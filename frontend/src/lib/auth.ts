// Gestión de autenticación de clientes

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

const CUSTOMER_KEY = 'eva_customer';
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Obtiene el cliente actual del localStorage
 */
export function getCurrentCustomer(): Customer | null {
  if (typeof window === 'undefined') return null;

  const customerData = localStorage.getItem(CUSTOMER_KEY);
  return customerData ? JSON.parse(customerData) : null;
}

/**
 * Guarda el cliente en localStorage
 */
export function setCurrentCustomer(customer: Customer): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));

  // Disparar evento personalizado
  window.dispatchEvent(new CustomEvent('customer-updated', { detail: customer }));
}

/**
 * Elimina el cliente del localStorage (logout)
 */
export function clearCurrentCustomer(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(CUSTOMER_KEY);

  // Disparar evento
  window.dispatchEvent(new CustomEvent('customer-logout'));
}

/**
 * Verifica si hay un cliente autenticado
 */
export function isAuthenticated(): boolean {
  return getCurrentCustomer() !== null;
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
}): Promise<{ success: boolean; message?: string; customer?: Customer }> {
  try {
    const response = await fetch(`${API_URL}/customers/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      setCurrentCustomer(result.customer);
      return { success: true, customer: result.customer };
    } else {
      return { success: false, message: result.error || 'Error al registrar' };
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

    if (response.ok) {
      setCurrentCustomer(result.customer);
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
export function logout(): void {
  clearCurrentCustomer();
}

/**
 * Obtener nombre completo del cliente
 */
export function getCustomerFullName(customer: Customer | null): string {
  if (!customer) return '';
  return `${customer.firstName} ${customer.lastName}`;
}
