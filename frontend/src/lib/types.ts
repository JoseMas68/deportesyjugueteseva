// Tipos compartidos entre frontend y backend

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: number;
  parent?: Category;
  children?: Category[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  images: string[];
  thumbnailUrl?: string;
  categoryId: number;
  category?: Category;
  isActive: boolean;
  isFeatured: boolean;
  isNew?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
  price: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}

export interface ShippingAddress {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

export interface CreateOrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCountry: string;
  status: 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  items: Array<{
    id: number;
    productId: number;
    product?: Product;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  onSale?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: 'name' | 'price' | 'createdAt' | 'sold';
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
