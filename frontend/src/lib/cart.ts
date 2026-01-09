// Gestión del carrito de compras con localStorage

export interface CartItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const CART_KEY = 'eva_cart';

/**
 * Obtiene el carrito del localStorage
 */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return [];

  const cart = localStorage.getItem(CART_KEY);
  return cart ? JSON.parse(cart) : [];
}

/**
 * Guarda el carrito en localStorage
 */
export function saveCart(cart: CartItem[]): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(CART_KEY, JSON.stringify(cart));

  // Disparar evento personalizado para actualizar UI
  window.dispatchEvent(new CustomEvent('cart-updated', { detail: cart }));
}

/**
 * Añade un producto al carrito
 */
export function addToCart(item: Omit<CartItem, 'totalPrice'>): void {
  const cart = getCart();
  const existingItem = cart.find(i => i.productId === item.productId);

  if (existingItem) {
    existingItem.quantity += item.quantity;
    existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
  } else {
    cart.push({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    });
  }

  saveCart(cart);
}

/**
 * Actualiza la cantidad de un producto
 */
export function updateQuantity(productId: string, quantity: number): void {
  const cart = getCart();
  const item = cart.find(i => i.productId === productId);

  if (item) {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      item.quantity = quantity;
      item.totalPrice = item.quantity * item.unitPrice;
      saveCart(cart);
    }
  }
}

/**
 * Elimina un producto del carrito
 */
export function removeFromCart(productId: string): void {
  const cart = getCart();
  const newCart = cart.filter(i => i.productId !== productId);
  saveCart(newCart);
}

/**
 * Vacía el carrito
 */
export function clearCart(): void {
  saveCart([]);
}

/**
 * Obtiene el número total de items en el carrito
 */
export function getCartCount(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

/**
 * Obtiene el total del carrito
 */
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + item.totalPrice, 0);
}

/**
 * Obtiene el subtotal (antes de envío)
 */
export function getCartSubtotal(): number {
  return getCartTotal();
}

/**
 * Calcula el coste de envío
 */
export function getShippingCost(): number {
  const subtotal = getCartSubtotal();
  const FREE_SHIPPING_THRESHOLD = 50;
  const STANDARD_SHIPPING = 4.99;

  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
}

/**
 * Obtiene el total con envío
 */
export function getCartTotalWithShipping(): number {
  return getCartSubtotal() + getShippingCost();
}
