import { prisma } from '@/lib/prisma'
import ConfigForm from '@/components/admin/ConfigForm'

export default async function ConfiguracionPage() {
  // Obtener configuracion actual (excluyendo configuración de Verifactu que se muestra en su propia sección)
  const [siteConfig, paymentMethods] = await Promise.all([
    prisma.siteConfig.findMany({
      where: {
        NOT: {
          OR: [
            { key: { startsWith: 'verifactu_' } },
            { key: { startsWith: 'company_' } },
          ],
        },
      },
      orderBy: [{ group: 'asc' }, { key: 'asc' }],
    }),
    prisma.paymentMethodConfig.findMany({
      orderBy: { method: 'asc' },
    }),
  ])

  // Agrupar configuracion por grupo
  const configByGroup = siteConfig.reduce((acc, item) => {
    const group = item.group ?? 'general'
    if (!acc[group]) acc[group] = []
    acc[group].push(item)
    return acc
  }, {} as Record<string, typeof siteConfig>)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-gray-500 mt-1">Ajustes generales de la tienda</p>
      </div>

      <ConfigForm
        configByGroup={configByGroup}
        paymentMethods={paymentMethods}
      />
    </div>
  )
}
