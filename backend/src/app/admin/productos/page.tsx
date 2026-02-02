import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProductList from '@/components/admin/ProductList'

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

  // Construir filtros - excluir productos en papelera
  const where: Record<string, unknown> = {
    deletedAt: null,
  }

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

  const [products, total, categories, trashedCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true },
        },
        brand: {
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
    prisma.product.count({ where: { deletedAt: { not: null } } }),
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
        <div className="flex items-center gap-3">
          {trashedCount > 0 && (
            <Link
              href="/admin/papelera"
              className="btn btn-outline flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Papelera ({trashedCount})
            </Link>
          )}
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
      <ProductList
        products={products.map(p => ({
          ...p,
          price: Number(p.price),
          compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        }))}
      />

      {/* Paginacion */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm px-6 py-4 flex items-center justify-between">
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
  )
}
