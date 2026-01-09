import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Verificar autenticacion
  const admin = await requireAdmin()

  // Obtener numero de pedidos pendientes para el badge
  const pendingOrders = await prisma.order.count({
    where: { status: 'PENDING' }
  })

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar pendingOrders={pendingOrders} />
      <div className="flex-1 flex flex-col">
        <Header adminName={admin.name} adminEmail={admin.email} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
