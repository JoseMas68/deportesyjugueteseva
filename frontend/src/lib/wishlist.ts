// Gestión de favoritos/wishlist con localStorage y API

export interface WishlistItem {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
  productPrice: number;
}

const WISHLIST_KEY = 'eva_wishlist';
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Obtiene la wishlist del localStorage
 */
export function getWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];

  const wishlist = localStorage.getItem(WISHLIST_KEY);
  return wishlist ? JSON.parse(wishlist) : [];
}

/**
 * Guarda la wishlist en localStorage
 */
export function saveWishlist(wishlist: WishlistItem[]): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));

  // Disparar evento personalizado para actualizar UI
  window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: wishlist }));
}

/**
 * Añade un producto a favoritos
 */
export function addToWishlist(item: WishlistItem): void {
  const wishlist = getWishlist();
  const existingItem = wishlist.find(i => i.productId === item.productId);

  if (!existingItem) {
    wishlist.push(item);
    saveWishlist(wishlist);
  }
}

/**
 * Elimina un producto de favoritos
 */
export function removeFromWishlist(productId: string): void {
  const wishlist = getWishlist();
  const newWishlist = wishlist.filter(i => i.productId !== productId);
  saveWishlist(newWishlist);
}

/**
 * Verifica si un producto está en favoritos
 */
export function isInWishlist(productId: string): boolean {
  const wishlist = getWishlist();
  return wishlist.some(i => i.productId === productId);
}

/**
 * Vacía la wishlist
 */
export function clearWishlist(): void {
  saveWishlist([]);
}

/**
 * Obtiene el número total de items en la wishlist
 */
export function getWishlistCount(): number {
  const wishlist = getWishlist();
  return wishlist.length;
}

/**
 * Sincroniza wishlist con el servidor (si el usuario está autenticado)
 */
export async function syncWishlistWithServer(customerId: string): Promise<void> {
  const localWishlist = getWishlist();

  try {
    // Obtener wishlist del servidor
    const response = await fetch(`${API_URL}/api/wishlist?customerId=${customerId}`);
    if (!response.ok) throw new Error('Failed to fetch wishlist');

    const serverWishlist = await response.json();

    // Mergear con la local (priorizar servidor)
    const mergedWishlist = [...serverWishlist];

    // Añadir items locales que no estén en el servidor
    for (const localItem of localWishlist) {
      if (!mergedWishlist.some(i => i.productId === localItem.productId)) {
        // Añadir al servidor
        await fetch(`${API_URL}/api/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId,
            productId: localItem.productId,
          }),
        });
        mergedWishlist.push(localItem);
      }
    }

    saveWishlist(mergedWishlist);
  } catch (error) {
    console.error('Error syncing wishlist:', error);
  }
}

/**
 * Añade un producto a favoritos en el servidor
 */
export async function addToWishlistServer(customerId: string, item: WishlistItem): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        productId: item.productId,
      }),
    });

    if (response.ok) {
      addToWishlist(item);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return false;
  }
}

/**
 * Elimina un producto de favoritos del servidor
 */
export async function removeFromWishlistServer(wishlistItemId: string, productId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/api/wishlist/${wishlistItemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      removeFromWishlist(productId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return false;
  }
}
