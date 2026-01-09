import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function CategoriasPage() {
  // Obtener todas las categorias con sus padres
  const categories = await prisma.category.findMany({
    include: {
      parent: {
        select: { id: true, name: true },
      },
      _count: {
        select: { products: true },
      },
    },
    orderBy: [
      { menuSection: 'asc' },
      { displayOrder: 'asc' },
      { name: 'asc' },
    ],
  })

  // Agrupar por seccion de menu
  const groupedCategories = categories.reduce((acc, cat) => {
    const section = cat.menuSection || 'otros'
    if (!acc[section]) acc[section] = []
    acc[section].push(cat)
    return acc
  }, {} as Record<string, typeof categories>)

  const sectionLabels: Record<string, string> = {
    deportes: 'Deportes',
    juguetes: 'Juguetes',
    hobbies: 'Hobbies',
    otros: 'Otros',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
        <p className="text-gray-500 mt-1">{categories.length} categorias en total</p>
      </div>

      {/* Nota informativa */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Las categorias son fijas</p>
            <p className="text-sm mt-1">Solo puedes editar la descripcion y la imagen de cada categoria. No es posible crear o eliminar categorias.</p>
          </div>
        </div>
      </div>

      {/* Secciones */}
      {Object.entries(groupedCategories).map(([section, cats]) => (
        <div key={section} className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">{sectionLabels[section]}</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {cats.map((category) => (
              <div key={category.id} className="px-6 py-4 flex items-center gap-4">
                {category.imageUrl ? (
                  <img
                    src={category.imageUrl}
                    alt={category.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{category.name}</p>
                    {category.parent && (
                      <span className="text-xs text-gray-500">
                        (en {category.parent.name})
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {category._count.products} productos · /{category.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {category.isActive ? (
                    <span className="badge badge-success">Activa</span>
                  ) : (
                    <span className="badge badge-danger">Inactiva</span>
                  )}
                  <Link
                    href={`/admin/categorias/${category.id}`}
                    className="text-yellow-600 hover:text-yellow-700 font-medium"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
