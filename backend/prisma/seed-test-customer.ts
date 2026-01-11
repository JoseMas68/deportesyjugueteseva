import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test customer...');

  // Verificar si ya existe
  const existing = await prisma.customer.findUnique({
    where: { email: 'test@test.com' },
  });

  if (existing) {
    console.log('✅ Test customer already exists:', existing.email);
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: test123');
    return;
  }

  // Hashear contraseña
  const hashedPassword = await bcrypt.hash('test123', 10);

  // Crear cliente de prueba
  const customer = await prisma.customer.create({
    data: {
      email: 'test@test.com',
      firstName: 'Cliente',
      lastName: 'Prueba',
      phone: '666777888',
      acceptsMarketing: true,
      notes: `password_hash:${hashedPassword}`,
    },
  });

  console.log('✅ Test customer created successfully!');
  console.log('📧 Email: test@test.com');
  console.log('🔑 Password: test123');
  console.log('👤 Name:', customer.firstName, customer.lastName);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
