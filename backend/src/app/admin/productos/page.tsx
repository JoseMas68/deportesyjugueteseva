import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface SearchParams {
  page?: string
  search?: string
  category?: string
  status?: string
  stock?: string
}

export default async function ProductosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = 20
  const search = params.search || ''
  const categoryFilter = params.category || ''
  const status = params.status || ''
  const stock = params.stock || ''

  // Construir filtros
  const where: Record<string, unknown> = {}

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { brand: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (categoryFilter) {
    where.categoryId = categoryFilter
  }

  if (status === 'active') {
    where.isActive = true
  } else if (status === 'inactive') {
    where.isActive = false
  }

  if (stock === 'low') {
    where.stock = { lt: 5, gt: 0 }
  } else if (stock === 'out') {
    where.stock = 0
  }

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        variants: {
          select: { id: true, size: true, color: true, colorHex: true, stock: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { parentId: { not: null } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const totalPages = Math.ceil(total / limit)

  // Construir URL con filtros actuales
  const buildUrl = (newParams: Record<string, string>) => {
    const url = new URLSearchParams()
    if (search) url.set('search', search)
    if (categoryFilter) url.set('category', categoryFilter)
    if (status) url.set('status', status)
    if (stock) url.set('stock', stock)

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        url.set(key, value)
      } else {
        url.delete(key)
      }
    })

    return `/admin/productos?${url.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">{total} productos en total</p>
        </div>
        <Link
          href="/admin/productos/nuevo"
          className="btn btn-primary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Producto
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <form className="flex flex-wrap gap-4">
          {/* Busqueda */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              placeholder="Buscar por nombre, SKU o marca..."
              defaultValue={search}
              className="input"
            />
          </div>

          {/* Categoria */}
          <select
            name="category"
            defaultValue={categoryFilter}
            className="input w-auto"
          >
            <option value="">Todas las categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Estado */}
          <select
            name="status"
            defaultValue={status}
            className="input w-auto"
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>

          {/* Stock */}
          <select
            name="stock"
            defaultValue={stock}
            className="input w-auto"
          >
            <option value="">Todo el stock</option>
            <option value="low">Bajo stock (&lt;5)</option>
            <option value="out">Sin stock</option>
          </select>

          <button type="submit" className="btn btn-secondary">
            Filtrar
          </button>

          {(search || categoryFilter || status || stock) && (
            <Link href="/admin/productos" className="btn btn-outline">
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Categoria</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.brand && (
                          <p className="text-sm text-gray-500">{product.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-500 font-mono text-sm">{product.sku}</td>
                  <td className="text-gray-500">{product.category.name}</td>
                  <td>
                    <div>
                      <span className="font-medium">{Number(product.price).toFixed(2)} EUR</span>
                      {product.compareAtPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">
                          {Number(product.compareAtPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className={`font-medium ${
                        product.stock === 0
                          ? 'text-red-600'
                          : product.stock < 5
                          ? 'text-yellow-600'
                          : 'text-green-600'
                      }`}>
                        {product.stock}
                      </span>
                      {product.hasVariants && product.variants.length > 0 && (
                        <div className="mt-1 text-xs text-gray-500 max-w-[200px]">
                          {product.variants.slice(0, 3).map((v, i) => {
                            const label = [v.size, v.color].filter(Boolean).join(' ') || `Var ${i + 1}`
                            const stockClass = v.stock === 0 ? 'text-red-500' : v.stock < 3 ? 'text-yellow-600' : 'text-gray-600'
                            return (
                              <span key={v.id} className="inline-flex items-center mr-2">
                                {v.colorHex && (
                                  <span
                                    className="w-2 h-2 rounded-full mr-1 border border-gray-300"
                                    style={{ backgroundColor: v.colorHex }}
                                  />
                                )}
                                <span className={stockClass}>{label}: {v.stock}</span>
                              </span>
                            )
                          })}
                          {product.variants.length > 3 && (
                            <span className="text-gray-400">+{product.variants.length - 3} mas</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {product.isActive ? (
                      <span className="badge badge-success">Activo</span>
                    ) : (
                      <span className="badge badge-danger">Inactivo</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/admin/productos/${product.id}`}
                      className="text-yellow-600 hover:text-yellow-700 font-medium"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">
                  No se encontraron productos
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Paginacion */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * limit + 1} - {Math.min(page * limit, total)} de {total}
            </p>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={buildUrl({ page: String(page - 1) })}
                  className="btn btn-outline btn-sm"
                >
                  Anterior
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={buildUrl({ page: String(page + 1) })}
                  className="btn btn-outline btn-sm"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
