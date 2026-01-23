/**
 * Script para crear un cliente de prueba
 * Ejecutar con: npx tsx src/scripts/create-test-customer.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestCustomer() {
  const email = 'demo@eva.com';
  const password = 'demo1234';

  console.log('🔄 Creando cliente de prueba...\n');

  // Verificar si ya existe
  const existing = await prisma.customer.findUnique({
    where: { email },
  });

  if (existing) {
    console.log(`⚠️  El cliente ${email} ya existe. Actualizando contraseña...`);

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.customer.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    console.log(`✅ Contraseña actualizada\n`);
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.customer.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName: 'Usuario',
        lastName: 'Demo',
        phone: '600123456',
        isActive: true,
        acceptsMarketing: true,
      },
    });

    console.log(`✅ Cliente creado correctamente\n`);
  }

  console.log('📋 Credenciales de prueba:');
  console.log(`   📧 Email: ${email}`);
  console.log(`   🔑 Contraseña: ${password}`);
}

createTestCustomer()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
