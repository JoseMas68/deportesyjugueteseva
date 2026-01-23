/**
 * Script de migración: Mover hashes de contraseña de `notes` a `passwordHash`
 *
 * Ejecutar con: npx ts-node src/scripts/migrate-passwords.ts
 * O: npx tsx src/scripts/migrate-passwords.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migratePasswords() {
  console.log('🔄 Iniciando migración de contraseñas...\n');

  // Buscar clientes con hash en notes pero sin passwordHash
  const customersToMigrate = await prisma.customer.findMany({
    where: {
      passwordHash: null,
      notes: {
        contains: 'password_hash:',
      },
    },
    select: {
      id: true,
      email: true,
      notes: true,
    },
  });

  console.log(`📋 Encontrados ${customersToMigrate.length} clientes para migrar\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const customer of customersToMigrate) {
    try {
      // Extraer el hash del campo notes
      const match = customer.notes?.match(/password_hash:(.+)/);

      if (!match || !match[1]) {
        console.log(`⚠️  ${customer.email}: No se pudo extraer el hash`);
        errorCount++;
        continue;
      }

      const passwordHash = match[1].trim();

      // Actualizar: mover hash al campo dedicado y limpiar notes
      await prisma.customer.update({
        where: { id: customer.id },
        data: {
          passwordHash: passwordHash,
          notes: null, // Limpiar el campo notes
        },
      });

      console.log(`✅ ${customer.email}: Migrado correctamente`);
      successCount++;
    } catch (error) {
      console.error(`❌ ${customer.email}: Error - ${error}`);
      errorCount++;
    }
  }

  console.log('\n📊 Resumen de migración:');
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log(`   📋 Total: ${customersToMigrate.length}`);
}

migratePasswords()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
