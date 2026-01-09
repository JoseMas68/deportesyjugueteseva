import { prisma } from '@/lib/prisma'
import ProductForm from '@/components/admin/ProductForm'
import Link from 'next/link'

export default async function NuevoProductoPage() {
  // Obtener categorias (solo subcategorias)
  const categories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

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
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
          <p className="text-gray-500 mt-1">Crear un nuevo producto en el catalogo</p>
        </div>
      </div>

      {/* Formulario */}
      <ProductForm categories={categories} />
    </div>
  )
}
