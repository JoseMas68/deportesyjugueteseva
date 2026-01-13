// Tipos para el Page Builder

export interface HeroConfig {
  title?: string
  subtitle?: string
  backgroundImage?: string
  backgroundColor?: string
  textColor: 'light' | 'dark'
  ctaText?: string
  ctaUrl?: string
  ctaStyle: 'primary' | 'secondary' | 'outline'
  alignment: 'left' | 'center' | 'right'
  height: 'small' | 'medium' | 'large' | 'full'
}

export interface ProductSliderConfig {
  title?: string
  subtitle?: string
  source: 'category' | 'manual' | 'featured' | 'new' | 'bestseller' | 'offers'
  categoryId?: string
  productIds?: string[]
  limit: number
  accentColor: 'primary' | 'accent'
  linkUrl?: string
  linkText?: string
}

export interface BentoGridConfig {
  title?: string
  source: 'categories' | 'products'
  categoryIds?: string[]
  categoryId?: string
  productIds?: string[]
  layout: '2x2' | '3x3' | '1-2-1' | '2-1-2' | 'masonry'
  showTitles: boolean
  showPrices: boolean
}

export type BlockConfig = HeroConfig | ProductSliderConfig | BentoGridConfig

export type BlockType = 'hero' | 'product-slider' | 'bento-grid'

export interface PageBlock {
  id: string
  pageId: string
  type: BlockType
  title: string | null
  config: BlockConfig
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DynamicPage {
  id: string
  slug: string
  title: string
  description: string | null
  metaTitle: string | null
  metaDescription: string | null
  metaImage: string | null
  isActive: boolean
  isHomePage: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  blocks: PageBlock[]
}

export interface Category {
  id: string
  name: string
  slug: string
  parentId: string | null
}

export interface Product {
  id: string
  name: string
  slug: string
  price: number
  thumbnailUrl: string | null
}

// Default configs
export const defaultHeroConfig: HeroConfig = {
  title: '',
  subtitle: '',
  backgroundImage: '',
  backgroundColor: '#FFD700',
  textColor: 'dark',
  ctaText: '',
  ctaUrl: '',
  ctaStyle: 'primary',
  alignment: 'center',
  height: 'medium',
}

export const defaultProductSliderConfig: ProductSliderConfig = {
  title: '',
  subtitle: '',
  source: 'featured',
  limit: 8,
  accentColor: 'primary',
  linkUrl: '',
  linkText: 'Ver todo',
}

export const defaultBentoGridConfig: BentoGridConfig = {
  title: '',
  source: 'categories',
  layout: '2x2',
  showTitles: true,
  showPrices: true,
}

export const getDefaultConfig = (type: BlockType): BlockConfig => {
  switch (type) {
    case 'hero':
      return { ...defaultHeroConfig }
    case 'product-slider':
      return { ...defaultProductSliderConfig }
    case 'bento-grid':
      return { ...defaultBentoGridConfig }
  }
}

export const blockTypeNames: Record<BlockType, string> = {
  'hero': 'Hero Banner',
  'product-slider': 'Slider de Productos',
  'bento-grid': 'Bento Grid',
}

export const blockTypeIcons: Record<BlockType, string> = {
  'hero': 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  'product-slider': 'M4 6h16M4 10h16M4 14h16M4 18h16',
  'bento-grid': 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
}
