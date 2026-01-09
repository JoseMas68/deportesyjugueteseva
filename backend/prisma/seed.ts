import { PrismaClient, EmailType, PaymentMethod } from '@prisma/client'
import { getProducts } from './seed-products'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ============ CATEGORÍAS ============
  console.log('📁 Creating categories...')

  // Deportes
  const deportes = await prisma.category.upsert({
    where: { slug: 'deportes' },
    update: {},
    create: {
      name: 'Deportes',
      slug: 'deportes',
      description: 'Equipamiento deportivo de alta calidad',
      menuSection: 'deportes',
      displayOrder: 1,
    },
  })

  const running = await prisma.category.upsert({
    where: { slug: 'running' },
    update: {},
    create: {
      name: 'Running',
      slug: 'running',
      description: 'Zapatillas y ropa para correr en asfalto',
      parentId: deportes.id,
      menuSection: 'deportes',
      displayOrder: 1,
    },
  })

  const trailRunning = await prisma.category.upsert({
    where: { slug: 'trail-running' },
    update: {},
    create: {
      name: 'Trail Running',
      slug: 'trail-running',
      description: 'Equipamiento para correr por montaña',
      parentId: deportes.id,
      menuSection: 'deportes',
      displayOrder: 2,
    },
  })

  const fitness = await prisma.category.upsert({
    where: { slug: 'fitness' },
    update: {},
    create: {
      name: 'Fitness',
      slug: 'fitness',
      description: 'Ropa y accesorios para gimnasio',
      parentId: deportes.id,
      menuSection: 'deportes',
      displayOrder: 3,
    },
  })

  const natacion = await prisma.category.upsert({
    where: { slug: 'natacion' },
    update: {},
    create: {
      name: 'Natación',
      slug: 'natacion',
      description: 'Bañadores, gafas y accesorios de natación',
      parentId: deportes.id,
      menuSection: 'deportes',
      displayOrder: 4,
    },
  })

  const outdoor = await prisma.category.upsert({
    where: { slug: 'outdoor' },
    update: {},
    create: {
      name: 'Outdoor',
      slug: 'outdoor',
      description: 'Equipamiento para actividades al aire libre',
      parentId: deportes.id,
      menuSection: 'deportes',
      displayOrder: 5,
    },
  })

  const casual = await prisma.category.upsert({
    where: { slug: 'casual' },
    update: {},
    create: {
      name: 'Casual / Lifestyle',
      slug: 'casual',
      description: 'Ropa y calzado deportivo casual',
      parentId: deportes.id,
      menuSection: 'deportes',
      displayOrder: 6,
    },
  })

  // Juguetes
  const juguetes = await prisma.category.upsert({
    where: { slug: 'juguetes' },
    update: {},
    create: {
      name: 'Juguetes',
      slug: 'juguetes',
      description: 'Juguetes para todas las edades',
      menuSection: 'juguetes',
      displayOrder: 2,
    },
  })

  const infantiles = await prisma.category.upsert({
    where: { slug: 'infantiles' },
    update: {},
    create: {
      name: 'Infantiles',
      slug: 'infantiles',
      description: 'Juguetes para los más pequeños',
      parentId: juguetes.id,
      menuSection: 'juguetes',
      displayOrder: 1,
    },
  })

  const educativos = await prisma.category.upsert({
    where: { slug: 'educativos' },
    update: {},
    create: {
      name: 'Educativos',
      slug: 'educativos',
      description: 'Juguetes que estimulan el aprendizaje',
      parentId: juguetes.id,
      menuSection: 'juguetes',
      displayOrder: 2,
    },
  })

  const aireLibre = await prisma.category.upsert({
    where: { slug: 'aire-libre' },
    update: {},
    create: {
      name: 'Aire Libre',
      slug: 'aire-libre',
      description: 'Juguetes para jugar al aire libre',
      parentId: juguetes.id,
      menuSection: 'juguetes',
      displayOrder: 3,
    },
  })

  // Hobbies / Coleccionismo
  const hobbies = await prisma.category.upsert({
    where: { slug: 'hobbies' },
    update: {},
    create: {
      name: 'Hobbies y Coleccionismo',
      slug: 'hobbies',
      description: 'Scalextric, trenes, maquetas y más',
      menuSection: 'hobbies',
      displayOrder: 3,
    },
  })

  const scalextric = await prisma.category.upsert({
    where: { slug: 'scalextric' },
    update: {},
    create: {
      name: 'Scalextric',
      slug: 'scalextric',
      description: 'Circuitos y coches Scalextric',
      parentId: hobbies.id,
      menuSection: 'hobbies',
      displayOrder: 1,
    },
  })

  const trenes = await prisma.category.upsert({
    where: { slug: 'trenes-electricos' },
    update: {},
    create: {
      name: 'Trenes Eléctricos',
      slug: 'trenes-electricos',
      description: 'Trenes y accesorios de modelismo',
      parentId: hobbies.id,
      menuSection: 'hobbies',
      displayOrder: 2,
    },
  })

  const maquetas = await prisma.category.upsert({
    where: { slug: 'maquetas' },
    update: {},
    create: {
      name: 'Maquetas',
      slug: 'maquetas',
      description: 'Maquetas de aviones, barcos y vehículos',
      parentId: hobbies.id,
      menuSection: 'hobbies',
      displayOrder: 3,
    },
  })

  console.log('✅ Categories created')

  // ============ PRODUCTOS MOCK (50 productos) ============
  console.log('📦 Creating 50 mock products...')

  const products = getProducts({
    running,
    trailRunning,
    fitness,
    natacion,
    outdoor,
    casual,
    infantiles,
    educativos,
    aireLibre,
    scalextric,
    trenes,
    maquetas,
  })

  await prisma.product.createMany({
    data: products,
  })

  console.log(`✅ ${products.length} products created`)

  // ============ PLANTILLAS DE EMAIL ============
  console.log('📧 Creating email templates...')

  const emailTemplates = [
    {
      type: EmailType.CONFIRMATION,
      subject: 'Tu pedido {order_number} ha sido recibido - Deportes y Juguetes Eva',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f4f4f4;">
  <div style="background: #000; padding: 30px; text-align: center;">
    <h1 style="color: #CCFF00; margin: 0; font-size: 32px; font-weight: bold;">EVA</h1>
    <p style="color: #fff; margin: 10px 0 0 0; font-size: 14px;">DEPORTES Y JUGUETES</p>
  </div>

  <div style="background: #fff; padding: 40px 30px;">
    <h2 style="color: #000; margin-top: 0;">¡Gracias por tu compra, {user_name}!</h2>

    <p>Hemos recibido tu pedido <strong>{order_number}</strong> y estamos procesándolo.</p>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #000; margin-top: 0;">Resumen del pedido</h3>
      {products}
    </div>

    <div style="margin: 30px 0; padding-top: 20px; border-top: 2px solid #eee;">
      <table style="width: 100%; font-size: 16px;">
        <tr>
          <td style="padding: 8px 0;"><strong>Subtotal:</strong></td>
          <td style="text-align: right; padding: 8px 0;">{subtotal}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;"><strong>Envío:</strong></td>
          <td style="text-align: right; padding: 8px 0;">{shipping_cost}</td>
        </tr>
        <tr style="font-size: 20px; color: #CCFF00; background: #000;">
          <td style="padding: 15px;"><strong>Total:</strong></td>
          <td style="text-align: right; padding: 15px;"><strong>{total}</strong></td>
        </tr>
      </table>
    </div>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <h3 style="color: #000; margin-top: 0;">Envío a:</h3>
      <p style="margin: 0; white-space: pre-line;">{address}</p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/pedidos/{order_id}"
         style="background: #CCFF00; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 16px;">
        Ver estado del pedido
      </a>
    </div>
  </div>

  <div style="background: #000; padding: 30px; text-align: center; color: #999; font-size: 14px;">
    <p style="margin: 5px 0;">Deportes y Juguetes Eva</p>
    <p style="margin: 5px 0;">contacto@deportesyjugueteseva.com</p>
    <p style="margin: 5px 0;">© 2026 Todos los derechos reservados</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.PAID,
      subject: '✅ Tu pedido {order_number} ha sido confirmado y pagado',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f4f4f4;">
  <div style="background: #000; padding: 30px; text-align: center;">
    <h1 style="color: #CCFF00; margin: 0; font-size: 32px; font-weight: bold;">EVA</h1>
  </div>

  <div style="background: #fff; padding: 40px 30px;">
    <h2 style="color: #000;">¡Tu pago ha sido confirmado!</h2>

    <p>Hola {user_name},</p>
    <p>Tu pedido <strong>{order_number}</strong> ha sido pagado correctamente y estamos preparándolo para el envío.</p>

    <div style="background: #f0fff0; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0;">
      <p style="margin: 0; color: #28a745; font-weight: bold;">✅ Pago recibido: {total}</p>
    </div>

    <p>Te avisaremos cuando tu pedido sea enviado.</p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/pedidos/{order_id}"
         style="background: #CCFF00; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        Ver mi pedido
      </a>
    </div>
  </div>

  <div style="background: #000; padding: 30px; text-align: center; color: #999; font-size: 14px;">
    <p>Deportes y Juguetes Eva</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.SHIPPED,
      subject: '📦 Tu pedido {order_number} está en camino',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f4f4f4;">
  <div style="background: #000; padding: 30px; text-align: center;">
    <h1 style="color: #CCFF00; margin: 0; font-size: 32px; font-weight: bold;">EVA</h1>
  </div>

  <div style="background: #fff; padding: 40px 30px;">
    <h2 style="color: #000;">¡Tu pedido está en camino! 🚚</h2>

    <p>Hola {user_name},</p>
    <p>Tu pedido <strong>{order_number}</strong> ha sido enviado y está en camino a tu dirección.</p>

    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Número de seguimiento:</strong></p>
      <p style="margin: 0; font-size: 18px; color: #CCFF00; background: #000; padding: 15px; border-radius: 4px; text-align: center; font-weight: bold;">{tracking_number}</p>
    </div>

    <p>Recibirás tu pedido en los próximos días laborables.</p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/pedidos/{order_id}"
         style="background: #CCFF00; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        Seguir mi pedido
      </a>
    </div>
  </div>

  <div style="background: #000; padding: 30px; text-align: center; color: #999; font-size: 14px;">
    <p>Deportes y Juguetes Eva</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.CANCELLED,
      subject: 'Tu pedido {order_number} ha sido cancelado',
      body: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background: #f4f4f4;">
  <div style="background: #000; padding: 30px; text-align: center;">
    <h1 style="color: #CCFF00; margin: 0; font-size: 32px; font-weight: bold;">EVA</h1>
  </div>

  <div style="background: #fff; padding: 40px 30px;">
    <h2 style="color: #000;">Pedido cancelado</h2>

    <p>Hola {user_name},</p>
    <p>Tu pedido <strong>{order_number}</strong> ha sido cancelado.</p>

    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 30px 0;">
      <p style="margin: 0 0 10px 0; font-weight: bold;">Motivo:</p>
      <p style="margin: 0;">{cancellation_reason}</p>
    </div>

    <p>Si realizaste un pago, será reembolsado en los próximos 5-7 días laborables.</p>
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="https://deportesyjugueteseva.com/contacto"
         style="background: #CCFF00; color: #000; padding: 15px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
        Contactar soporte
      </a>
    </div>
  </div>

  <div style="background: #000; padding: 30px; text-align: center; color: #999; font-size: 14px;">
    <p>Deportes y Juguetes Eva</p>
  </div>
</body>
</html>`,
    },
    {
      type: EmailType.ADMIN_NEW_ORDER,
      subject: '[ADMIN] Nuevo pedido {order_number}',
      body: `<!DOCTYPE html>
<html>
<body style="font-family: monospace; padding: 20px; background: #000; color: #CCFF00;">
  <h2>🔔 NUEVO PEDIDO RECIBIDO</h2>

  <p><strong>Pedido:</strong> {order_number}</p>
  <p><strong>Cliente:</strong> {user_name} ({user_email})</p>
  <p><strong>Total:</strong> {total}</p>

  <hr style="border-color: #CCFF00;">

  <h3>Productos:</h3>
  {products}

  <hr style="border-color: #CCFF00;">

  <p><strong>Dirección de envío:</strong></p>
  <p style="white-space: pre-line;">{address}</p>

  <p style="margin-top: 30px;">
    <a href="{admin_link}" style="background: #CCFF00; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      VER EN PANEL ADMIN
    </a>
  </p>
</body>
</html>`,
    },
    {
      type: EmailType.ADMIN_PAID,
      subject: '[ADMIN] Pedido pagado {order_number}',
      body: `<!DOCTYPE html>
<html>
<body style="font-family: monospace; padding: 20px; background: #000; color: #00ff00;">
  <h2>✅ PEDIDO PAGADO</h2>

  <p><strong>Pedido:</strong> {order_number}</p>
  <p><strong>Total pagado:</strong> {total}</p>

  <p style="margin-top: 20px;">
    <a href="{admin_link}" style="background: #00ff00; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      VER PEDIDO
    </a>
  </p>
</body>
</html>`,
    },
    {
      type: EmailType.ADMIN_CANCELLED,
      subject: '[ADMIN] Pedido cancelado {order_number}',
      body: `<!DOCTYPE html>
<html>
<body style="font-family: monospace; padding: 20px; background: #000; color: #ff6b6b;">
  <h2>❌ PEDIDO CANCELADO</h2>

  <p><strong>Pedido:</strong> {order_number}</p>
  <p><strong>Motivo:</strong> {cancellation_reason}</p>

  <p style="margin-top: 20px;">
    <a href="{admin_link}" style="background: #ff6b6b; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">
      VER DETALLES
    </a>
  </p>
</body>
</html>`,
    },
  ]

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type: template.type },
      update: template,
      create: template,
    })
  }

  console.log('✅ Email templates created')

  // ============ CONFIGURACIÓN DE MÉTODOS DE PAGO ============
  console.log('💳 Creating payment method configs...')

  await prisma.paymentMethodConfig.upsert({
    where: { method: PaymentMethod.STRIPE },
    update: {},
    create: {
      method: PaymentMethod.STRIPE,
      isEnabled: true,
      displayName: 'Tarjeta de crédito/débito',
      description: 'Pago seguro con tarjeta mediante Stripe',
      displayOrder: 1,
    },
  })

  await prisma.paymentMethodConfig.upsert({
    where: { method: PaymentMethod.TRANSFER },
    update: {},
    create: {
      method: PaymentMethod.TRANSFER,
      isEnabled: true,
      displayName: 'Transferencia bancaria',
      description: 'Realiza una transferencia a nuestra cuenta',
      instructions: `Por favor, realiza la transferencia a:

Titular: Deportes y Juguetes Eva
IBAN: ES00 0000 0000 0000 0000 0000
Concepto: Pedido {order_number}

Envía el comprobante a: pagos@deportesyjugueteseva.com`,
      displayOrder: 2,
      config: {
        accountHolder: 'Deportes y Juguetes Eva',
        iban: 'ES00 0000 0000 0000 0000 0000',
        swift: 'XXXXXXXXXXX',
      },
    },
  })

  await prisma.paymentMethodConfig.upsert({
    where: { method: PaymentMethod.CASH },
    update: {},
    create: {
      method: PaymentMethod.CASH,
      isEnabled: false,
      displayName: 'Pago en efectivo (recogida en tienda)',
      description: 'Paga en efectivo al recoger tu pedido',
      instructions: 'Podrás pagar en efectivo cuando vengas a recoger tu pedido a nuestra tienda.',
      displayOrder: 3,
    },
  })

  console.log('✅ Payment methods configured')

  // ============ CONFIGURACIÓN GENERAL ============
  console.log('⚙️ Creating site config...')

  const siteConfigs = [
    { key: 'site_name', value: 'Deportes y Juguetes Eva', group: 'general', description: 'Nombre de la tienda' },
    { key: 'admin_email', value: 'admin@deportesyjugueteseva.com', group: 'general', description: 'Email del administrador' },
    { key: 'contact_email', value: 'contacto@deportesyjugueteseva.com', group: 'general', description: 'Email de contacto público' },
    { key: 'contact_phone', value: '+34 XXX XXX XXX', group: 'general', description: 'Teléfono de contacto' },
    { key: 'shipping_cost_standard', value: '4.99', group: 'shipping', type: 'number', description: 'Coste de envío estándar' },
    { key: 'free_shipping_threshold', value: '50', group: 'shipping', type: 'number', description: 'Envío gratis a partir de (€)' },
    { key: 'currency', value: 'EUR', group: 'general', description: 'Moneda' },
    { key: 'currency_symbol', value: '€', group: 'general', description: 'Símbolo de moneda' },
  ]

  for (const config of siteConfigs) {
    await prisma.siteConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    })
  }

  console.log('✅ Site config created')

  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
