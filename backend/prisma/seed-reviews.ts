import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding reviews...');

  // Obtener algunos productos para añadir reseñas
  const products = await prisma.product.findMany({
    take: 10,
    select: { id: true, name: true },
  });

  if (products.length === 0) {
    console.log('⚠️  No products found. Please seed products first.');
    return;
  }

  console.log(`📦 Found ${products.length} products`);

  const reviewsData = [
    {
      rating: 5,
      title: '¡Excelente producto!',
      comment: 'Superó mis expectativas. La calidad es excepcional y llegó en perfectas condiciones. Totalmente recomendado para cualquiera que busque un producto de calidad.',
      pros: 'Excelente calidad, rápido envío, buen precio',
      cons: null,
      authorName: 'María García',
      authorEmail: 'maria.garcia@example.com',
      isVerified: true,
    },
    {
      rating: 4,
      title: 'Muy buena compra',
      comment: 'Estoy muy contento con la compra. El producto es tal como se describe y la relación calidad-precio es muy buena. Solo le falta algún detalle menor.',
      pros: 'Buena calidad, precio justo',
      cons: 'Podría mejorar el embalaje',
      authorName: 'Juan Martínez',
      authorEmail: 'juan.martinez@example.com',
      isVerified: true,
    },
    {
      rating: 5,
      title: 'Perfecto para mi hijo',
      comment: 'A mi hijo le encantó. Es justo lo que buscábamos. La calidad es muy buena y resistente. Definitivamente volveré a comprar aquí.',
      pros: 'Resistente, bonito diseño, fácil de usar',
      cons: null,
      authorName: 'Ana López',
      authorEmail: 'ana.lopez@example.com',
      isVerified: false,
    },
    {
      rating: 4,
      title: 'Buena relación calidad-precio',
      comment: 'Por el precio que tiene, está muy bien. Cumple perfectamente su función y la calidad es aceptable. Lo recomiendo si buscas algo económico pero funcional.',
      pros: 'Buen precio, funcional',
      cons: 'Tarda un poco en llegar',
      authorName: 'Pedro Sánchez',
      authorEmail: 'pedro.sanchez@example.com',
      isVerified: true,
    },
    {
      rating: 5,
      title: '¡Me encanta!',
      comment: 'Es el segundo que compro y estoy encantada. La calidad es increíble y el diseño es precioso. Sin duda volveré a comprar más productos de esta tienda.',
      pros: 'Diseño bonito, excelente calidad, atención al cliente',
      cons: null,
      authorName: 'Laura Fernández',
      authorEmail: 'laura.fernandez@example.com',
      isVerified: true,
    },
    {
      rating: 3,
      title: 'Correcto pero mejorable',
      comment: 'El producto está bien, pero esperaba un poco más por el precio. Cumple su función pero hay detalles que podrían mejorar. No está mal, pero tampoco es excepcional.',
      pros: 'Funciona bien',
      cons: 'Precio un poco alto para lo que ofrece, acabados mejorables',
      authorName: 'Carlos Rodríguez',
      authorEmail: 'carlos.rodriguez@example.com',
      isVerified: false,
    },
    {
      rating: 5,
      title: 'Increíble calidad',
      comment: 'No me esperaba esta calidad por el precio. Es robusto, bien construido y los materiales son de primera. Una compra totalmente acertada.',
      pros: 'Calidad excepcional, buenos materiales, diseño elegante',
      cons: null,
      authorName: 'Isabel Torres',
      authorEmail: 'isabel.torres@example.com',
      isVerified: true,
    },
    {
      rating: 4,
      title: 'Satisfecho con la compra',
      comment: 'Llegó rápido y bien empaquetado. El producto es de buena calidad y funciona perfectamente. Solo algunos pequeños detalles que pulir, pero en general muy contento.',
      pros: 'Rápido envío, buen embalaje, buena calidad',
      cons: 'Instrucciones un poco confusas',
      authorName: 'Miguel Jiménez',
      authorEmail: 'miguel.jimenez@example.com',
      isVerified: true,
    },
  ];

  let createdCount = 0;

  // Distribuir reseñas entre los productos
  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    // Cada producto recibe entre 2 y 4 reseñas
    const numReviews = Math.floor(Math.random() * 3) + 2;

    for (let j = 0; j < numReviews && j < reviewsData.length; j++) {
      const reviewIndex = (i + j) % reviewsData.length;
      const reviewTemplate = reviewsData[reviewIndex];

      try {
        await prisma.review.create({
          data: {
            productId: product.id,
            rating: reviewTemplate.rating,
            title: reviewTemplate.title,
            comment: reviewTemplate.comment,
            pros: reviewTemplate.pros,
            cons: reviewTemplate.cons,
            authorName: reviewTemplate.authorName,
            authorEmail: reviewTemplate.authorEmail,
            isVerified: reviewTemplate.isVerified,
            status: 'approved', // Aprobar directamente para testing
            createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
          },
        });
        createdCount++;
      } catch (error) {
        console.error(`Error creating review for product ${product.name}:`, error);
      }
    }
  }

  console.log(`✅ Created ${createdCount} reviews`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding reviews:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
