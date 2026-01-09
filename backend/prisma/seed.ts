import { PrismaClient, EmailType, PaymentMethod } from '@prisma/client'

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

  // ============ PRODUCTOS MOCK ============
  console.log('📦 Creating mock products...')

  // Productos Running
  await prisma.product.createMany({
    data: [
      {
        name: 'Zapatillas Nike Air Zoom Pegasus 40',
        slug: 'nike-pegasus-40',
        description: 'Las Pegasus 40 ofrecen una amortiguación reactiva y un ajuste cómodo para corredores de todos los niveles. Perfectas para entrenamientos diarios y carreras.',
        shortDescription: 'Zapatillas de running con amortiguación React',
        price: 129.99,
        compareAtPrice: 149.99,
        stock: 25,
        sku: 'NIKE-PEG40-001',
        categoryId: running.id,
        sportType: 'RUNNING',
        brand: 'Nike',
        color: 'Negro/Blanco',
        images: [
          'https://placeholder.co/600x600/000000/CCFF00?text=Nike+Pegasus+40',
          'https://placeholder.co/600x600/000000/FFFFFF?text=Nike+Pegasus+40',
        ],
        thumbnailUrl: 'https://placeholder.co/300x300/000000/CCFF00?text=Nike+Pegasus+40',
        isFeatured: true,
        isBestSeller: true,
        publishedAt: new Date(),
      },
      {
        name: 'Adidas Ultraboost 23',
        slug: 'adidas-ultraboost-23',
        description: 'Las Ultraboost 23 combinan comodidad excepcional con un diseño moderno. La tecnología Boost proporciona un retorno de energía incomparable.',
        shortDescription: 'Máxima comodidad y retorno de energía',
        price: 189.99,
        stock: 18,
        sku: 'ADIDAS-UB23-001',
        categoryId: running.id,
        sportType: 'RUNNING',
        brand: 'Adidas',
        color: 'Blanco/Gris',
        images: ['https://placeholder.co/600x600/FFFFFF/000000?text=Ultraboost+23'],
        thumbnailUrl: 'https://placeholder.co/300x300/FFFFFF/000000?text=Ultraboost+23',
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        name: 'Asics Gel-Nimbus 25',
        slug: 'asics-nimbus-25',
        description: 'Las Gel-Nimbus 25 ofrecen una amortiguación suave y duradera. Ideales para largas distancias con máximo confort.',
        shortDescription: 'Amortiguación superior para largas distancias',
        price: 169.99,
        stock: 20,
        sku: 'ASICS-NIM25-001',
        categoryId: running.id,
        sportType: 'RUNNING',
        brand: 'Asics',
        color: 'Azul/Amarillo',
        images: ['https://placeholder.co/600x600/0000FF/CCFF00?text=Asics+Nimbus'],
        thumbnailUrl: 'https://placeholder.co/300x300/0000FF/CCFF00?text=Asics+Nimbus',
        publishedAt: new Date(),
      },
    ],
  })

  // Productos Trail Running
  await prisma.product.createMany({
    data: [
      {
        name: 'Salomon Speedcross 6',
        slug: 'salomon-speedcross-6',
        description: 'Las Speedcross 6 dominan terrenos técnicos con su agresiva suela y ajuste preciso. Perfectas para trail runners exigentes.',
        shortDescription: 'Agarre extremo para trail',
        price: 149.99,
        stock: 15,
        sku: 'SALOMON-SC6-001',
        categoryId: trailRunning.id,
        sportType: 'TRAIL_RUNNING',
        brand: 'Salomon',
        color: 'Negro/Rojo',
        images: ['https://placeholder.co/600x600/000000/FF0000?text=Speedcross+6'],
        thumbnailUrl: 'https://placeholder.co/300x300/000000/FF0000?text=Speedcross+6',
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        name: 'Hoka Speedgoat 5',
        slug: 'hoka-speedgoat-5',
        description: 'Las Speedgoat 5 ofrecen máxima amortiguación y tracción en terrenos variados. Ideales para ultras y trails largos.',
        shortDescription: 'Máxima amortiguación para ultras',
        price: 159.99,
        stock: 12,
        sku: 'HOKA-SG5-001',
        categoryId: trailRunning.id,
        sportType: 'TRAIL_RUNNING',
        brand: 'Hoka',
        color: 'Azul/Naranja',
        images: ['https://placeholder.co/600x600/0000FF/FF6600?text=Speedgoat+5'],
        thumbnailUrl: 'https://placeholder.co/300x300/0000FF/FF6600?text=Speedgoat+5',
        publishedAt: new Date(),
      },
    ],
  })

  // Productos Fitness
  await prisma.product.createMany({
    data: [
      {
        name: 'Mancuernas Ajustables 20kg',
        slug: 'mancuernas-ajustables-20kg',
        description: 'Set de mancuernas ajustables de 2.5kg a 20kg. Perfectas para entrenar en casa, ahorran espacio y dinero.',
        shortDescription: 'Ajustables de 2.5 a 20kg',
        price: 89.99,
        stock: 30,
        sku: 'MANC-ADJ20-001',
        categoryId: fitness.id,
        sportType: 'FITNESS',
        brand: 'PowerTech',
        images: ['https://placeholder.co/600x600/333333/CCFF00?text=Mancuernas'],
        thumbnailUrl: 'https://placeholder.co/300x300/333333/CCFF00?text=Mancuernas',
        isBestSeller: true,
        publishedAt: new Date(),
      },
      {
        name: 'Esterilla Yoga Premium',
        slug: 'esterilla-yoga-premium',
        description: 'Esterilla de yoga antideslizante de 6mm. Material ecológico, perfecta para yoga, pilates y estiramientos.',
        shortDescription: 'Antideslizante 6mm, material eco',
        price: 34.99,
        stock: 50,
        sku: 'YOGA-MAT-001',
        categoryId: fitness.id,
        sportType: 'FITNESS',
        brand: 'YogaLife',
        color: 'Morado',
        images: ['https://placeholder.co/600x600/8B008B/FFFFFF?text=Yoga+Mat'],
        thumbnailUrl: 'https://placeholder.co/300x300/8B008B/FFFFFF?text=Yoga+Mat',
        publishedAt: new Date(),
      },
    ],
  })

  // Productos Natación
  await prisma.product.createMany({
    data: [
      {
        name: 'Gafas Natación Speedo Futura',
        slug: 'gafas-speedo-futura',
        description: 'Gafas de natación con visión panorámica y ajuste cómodo. Protección UV y antivaho.',
        shortDescription: 'Visión panorámica, antivaho',
        price: 24.99,
        stock: 40,
        sku: 'SPEEDO-FUT-001',
        categoryId: natacion.id,
        sportType: 'NATACION',
        brand: 'Speedo',
        color: 'Azul',
        images: ['https://placeholder.co/600x600/0066CC/FFFFFF?text=Speedo+Goggles'],
        thumbnailUrl: 'https://placeholder.co/300x300/0066CC/FFFFFF?text=Speedo+Goggles',
        publishedAt: new Date(),
      },
    ],
  })

  // Juguetes Infantiles
  await prisma.product.createMany({
    data: [
      {
        name: 'Bloques Construcción 100 Piezas',
        slug: 'bloques-construccion-100',
        description: 'Set de 100 bloques de construcción de colores. Estimula la creatividad y habilidades motoras. Para niños de 3+.',
        shortDescription: '100 piezas de colores, 3+ años',
        price: 29.99,
        stock: 60,
        sku: 'BLOCKS-100-001',
        categoryId: infantiles.id,
        brand: 'PlayBlocks',
        images: ['https://placeholder.co/600x600/FF6B6B/FFFFFF?text=Bloques'],
        thumbnailUrl: 'https://placeholder.co/300x300/FF6B6B/FFFFFF?text=Bloques',
        isNew: true,
        publishedAt: new Date(),
      },
      {
        name: 'Peluche Oso Teddy 40cm',
        slug: 'peluche-oso-teddy',
        description: 'Adorable oso de peluche suave de 40cm. Material hipoalergénico y lavable. Perfecto para regalar.',
        shortDescription: 'Suave, 40cm, hipoalergénico',
        price: 19.99,
        stock: 45,
        sku: 'TEDDY-40-001',
        categoryId: infantiles.id,
        brand: 'TeddyLand',
        color: 'Marrón',
        images: ['https://placeholder.co/600x600/8B4513/FFFFFF?text=Teddy+Bear'],
        thumbnailUrl: 'https://placeholder.co/300x300/8B4513/FFFFFF?text=Teddy+Bear',
        publishedAt: new Date(),
      },
    ],
  })

  // Juguetes Educativos
  await prisma.product.createMany({
    data: [
      {
        name: 'Puzzle Mapamundi 500 Piezas',
        slug: 'puzzle-mapamundi-500',
        description: 'Puzzle educativo del mapamundi de 500 piezas. Aprende geografía mientras te diviertes. 8+ años.',
        shortDescription: '500 piezas, aprende geografía',
        price: 24.99,
        stock: 35,
        sku: 'PUZZLE-MAP500-001',
        categoryId: educativos.id,
        brand: 'EduPuzzle',
        images: ['https://placeholder.co/600x600/4169E1/FFFFFF?text=Puzzle+Map'],
        thumbnailUrl: 'https://placeholder.co/300x300/4169E1/FFFFFF?text=Puzzle+Map',
        publishedAt: new Date(),
      },
    ],
  })

  // Scalextric
  await prisma.product.createMany({
    data: [
      {
        name: 'Circuito Scalextric GT Master',
        slug: 'scalextric-gt-master',
        description: 'Circuito Scalextric GT Master con 6.8m de pista, 2 coches GT, transformador y mandos. Incluye looping y peraltes.',
        shortDescription: '6.8m pista, 2 coches, looping',
        price: 159.99,
        compareAtPrice: 189.99,
        stock: 10,
        sku: 'SCAL-GTM-001',
        categoryId: scalextric.id,
        isCollectible: true,
        collectionType: 'SCALEXTRIC',
        brand: 'Scalextric',
        images: ['https://placeholder.co/600x600/FF0000/FFFFFF?text=Scalextric+GT'],
        thumbnailUrl: 'https://placeholder.co/300x300/FF0000/FFFFFF?text=Scalextric+GT',
        isFeatured: true,
        publishedAt: new Date(),
      },
      {
        name: 'Coche Scalextric Ferrari F1',
        slug: 'scalextric-ferrari-f1',
        description: 'Coche Scalextric Ferrari F1 edición oficial. Compatible con todos los circuitos Scalextric.',
        shortDescription: 'Ferrari F1 oficial, compatible',
        price: 34.99,
        stock: 25,
        sku: 'SCAL-FERRF1-001',
        categoryId: scalextric.id,
        isCollectible: true,
        collectionType: 'SCALEXTRIC',
        brand: 'Scalextric',
        color: 'Rojo',
        images: ['https://placeholder.co/600x600/DC0000/FFFFFF?text=Ferrari+F1'],
        thumbnailUrl: 'https://placeholder.co/300x300/DC0000/FFFFFF?text=Ferrari+F1',
        publishedAt: new Date(),
      },
    ],
  })

  // Trenes Eléctricos
  await prisma.product.createMany({
    data: [
      {
        name: 'Set Tren Eléctrico Iniciación',
        slug: 'tren-electrico-iniciacion',
        description: 'Set completo de tren eléctrico con locomotora, 3 vagones, vías ovaladas y transformador. Escala HO 1:87.',
        shortDescription: 'Set completo escala HO 1:87',
        price: 119.99,
        stock: 8,
        sku: 'TRAIN-START-001',
        categoryId: trenes.id,
        isCollectible: true,
        collectionType: 'TRENES_ELECTRICOS',
        brand: 'Mehano',
        images: ['https://placeholder.co/600x600/0047AB/FFFFFF?text=Train+Set'],
        thumbnailUrl: 'https://placeholder.co/300x300/0047AB/FFFFFF?text=Train+Set',
        isNew: true,
        publishedAt: new Date(),
      },
    ],
  })

  // Maquetas
  await prisma.product.createMany({
    data: [
      {
        name: 'Maqueta Avión Spitfire 1:48',
        slug: 'maqueta-spitfire-148',
        description: 'Maqueta de avión Spitfire Mk IX escala 1:48. Incluye 85 piezas, calcas y pintura. Nivel intermedio.',
        shortDescription: 'Escala 1:48, 85 piezas, nivel medio',
        price: 39.99,
        stock: 15,
        sku: 'MODEL-SPIT48-001',
        categoryId: maquetas.id,
        isCollectible: true,
        collectionType: 'MAQUETAS',
        brand: 'Airfix',
        images: ['https://placeholder.co/600x600/556B2F/FFFFFF?text=Spitfire+Model'],
        thumbnailUrl: 'https://placeholder.co/300x300/556B2F/FFFFFF?text=Spitfire+Model',
        publishedAt: new Date(),
      },
    ],
  })

  console.log('✅ Mock products created')

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
