import { prisma } from './prisma'

// Keys de feature flags predefinidos
export const FEATURE_FLAGS = {
  EMAIL_MARKETING: 'email_marketing',
  NEWSLETTER_POPUP: 'newsletter_popup',
  PRODUCT_REVIEWS: 'product_reviews',
  WISHLIST: 'wishlist',
  LOYALTY_POINTS: 'loyalty_points',
} as const

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS]

/**
 * Verifica si un feature flag está habilitado
 */
export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  try {
    const flag = await prisma.featureFlag.findUnique({
      where: { key },
      select: { isEnabled: true },
    })
    return flag?.isEnabled ?? false
  } catch (error) {
    console.error(`Error checking feature flag ${key}:`, error)
    return false
  }
}

/**
 * Obtiene el valor de un feature flag (incluye metadatos)
 */
export async function getFeatureFlag(key: FeatureFlagKey) {
  try {
    return await prisma.featureFlag.findUnique({
      where: { key },
    })
  } catch (error) {
    console.error(`Error getting feature flag ${key}:`, error)
    return null
  }
}

/**
 * Inicializa los feature flags predeterminados si no existen
 */
export async function initializeFeatureFlags() {
  const defaultFlags = [
    {
      key: FEATURE_FLAGS.EMAIL_MARKETING,
      name: 'Email Marketing',
      description: 'Habilita las campañas de email marketing y newsletter',
      group: 'marketing',
      isEnabled: false,
    },
    {
      key: FEATURE_FLAGS.NEWSLETTER_POPUP,
      name: 'Popup de Newsletter',
      description: 'Muestra un popup para suscribirse al newsletter',
      group: 'marketing',
      isEnabled: false,
    },
    {
      key: FEATURE_FLAGS.PRODUCT_REVIEWS,
      name: 'Reseñas de Productos',
      description: 'Permite a los clientes dejar reseñas en productos',
      group: 'products',
      isEnabled: false,
    },
    {
      key: FEATURE_FLAGS.WISHLIST,
      name: 'Lista de Deseos',
      description: 'Permite a los usuarios guardar productos en una lista de deseos',
      group: 'users',
      isEnabled: false,
    },
    {
      key: FEATURE_FLAGS.LOYALTY_POINTS,
      name: 'Puntos de Fidelidad',
      description: 'Sistema de puntos por compras',
      group: 'users',
      isEnabled: false,
    },
  ]

  for (const flag of defaultFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: {}, // No actualizar si ya existe
      create: flag,
    })
  }

  console.log('Feature flags initialized')
}
