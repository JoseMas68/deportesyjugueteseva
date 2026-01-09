import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ProductForm from '@/components/admin/ProductForm'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditarProductoPage({ params }: PageProps) {
  const { id } = await params

  // Obtener producto
  const product = await prisma.product.findUnique({
    where: { id },
  })

  if (!product) {
    notFound()
  }

  // Obtener categorias (solo subcategorias)
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

  // Formatear producto para el formulario
  const formattedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: Number(product.price),
    compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    stock: product.stock,
    sku: product.sku || '',
    categoryId: product.categoryId,
    images: product.images,
    thumbnailUrl: product.thumbnailUrl,
    brand: product.brand,
    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isBestSeller: product.isBestSeller,
    isActive: product.isActive,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/productos"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
          <p className="text-gray-500 mt-1">{product.name}</p>
        </div>
      </div>

      {/* Formulario */}
      <ProductForm product={formattedProduct} categories={categories} />
    </div>
  )
}
