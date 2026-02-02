import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import TrashList from '@/components/admin/TrashList'

export default async function PapeleraPage() {
  const products = await prisma.product.findMany({
    where: {
      deletedAt: { not: null },
    },
    include: {
      category: {
        select: { id: true, name: true },
      },
      brand: {
        select: { id: true, name: true },
      },
    },
    orderBy: { deletedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold text-gray-900">Papelera</h1>
            <p className="text-gray-500 mt-1">
              {products.length} producto{products.length !== 1 ? 's' : ''} en la papelera
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Los productos en la papelera no se muestran en la tienda.</p>
            <p className="mt-1">Puedes restaurarlos o eliminarlos permanentemente. Los productos con pedidos asociados no pueden eliminarse permanentemente.</p>
          </div>
        </div>
      </div>

      {/* Lista de productos */}
      <TrashList
        products={products.map(p => ({
          ...p,
          price: Number(p.price),
          deletedAt: p.deletedAt!,
        }))}
      />
    </div>
  )
}
