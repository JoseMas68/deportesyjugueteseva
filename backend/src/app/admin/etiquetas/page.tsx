import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import TagList from '@/components/admin/TagList'

export default async function EtiquetasPage() {
  const tags = await prisma.productTag.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: [
      { sortOrder: 'asc' },
      { name: 'asc' }
    ]
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Etiquetas de Producto</h1>
          <p className="text-gray-500 mt-1">
            {tags.length} etiquetas · Usa etiquetas para agrupar productos en promociones
          </p>
        </div>
        <Link href="/admin/etiquetas/nueva" className="btn btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Etiqueta
        </Link>
      </div>

      {/* Tabla de etiquetas */}
      <TagList tags={tags} />
    </div>
  )
}
