// Cliente API para consumir el backend de Next.js

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000/api';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  sku?: string;
  images: string[];
  thumbnailUrl?: string;
  category: Category;
  sportType?: string;
  isCollectible: boolean;
  collectionType?: string;
  brand?: string;
  color?: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  children?: Category[];
  menuSection?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  product?: Product;
}

export interface CheckoutData {
  userEmail: string;
  userName: string;
  userPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingProvince?: string;
  shippingCountry?: string;
  items: { productId: string; quantity: number }[];
  paymentMethod: 'STRIPE' | 'TRANSFER' | 'CASH';
  taxId?: string;
}

/**
 * Obtiene todos los productos con filtros opcionales
 */
export async function getProducts(filters?: {
  category?: string;
  sportType?: string;
  featured?: boolean;
  new?: boolean;
  bestseller?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  brand?: string;
  inStock?: boolean;
  sort?: string;
  limit?: number;
  offset?: number;
}): Promise<{ products: Product[]; total: number }> {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value));
      }
    });
  }

  const response = await fetch(`${API_URL}/products?${params}`);
  if (!response.ok) throw new Error('Error fetching products');

  return response.json();
}

/**
 * Obtiene un producto por slug
 */
export async function getProductBySlug(slug: string): Promise<{
  product: Product;
  relatedProducts: Product[];
}> {
  const response = await fetch(`${API_URL}/products/${slug}`);
  if (!response.ok) throw new Error('Product not found');

  return response.json();
}

/**
 * Obtiene todas las categorías agrupadas por sección
 */
export async function getCategories(): Promise<{
  categories: Category[];
  grouped: Record<string, Category[]>;
}> {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) throw new Error('Error fetching categories');

  return response.json();
}

/**
 * Realiza el checkout
 */
export async function checkout(data: CheckoutData): Promise<{
  success: boolean;
  order: {
    id: string;
    orderNumber: string;
    total: number;
    paymentMethod: string;
  };
}> {
  const response = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Error en el checkout');
  }

  return response.json();
}
