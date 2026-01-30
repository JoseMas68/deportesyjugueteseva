/**
 * Script para crear un superadmin
 * Ejecutar con: npx tsx src/scripts/create-superadmin.ts
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cargar variables de entorno manualmente
const envPath = resolve(__dirname, '../../.env');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    if (!process.env[key.trim()]) {
      process.env[key.trim()] = value;
    }
  }
});

const prisma = new PrismaClient();

// Cliente Supabase con Service Role Key (permisos de admin)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function createSuperAdmin() {
  const email = 'deporteseva@gmail.com';
  const password = 'DeportesEva81';
  const name = 'Eva Admin';

  console.log('🔄 Creando superadmin...\n');

  // 1. Verificar si ya existe en AdminUser
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`⚠️  El admin ${email} ya existe en la base de datos.`);
    console.log(`   ID: ${existingAdmin.id}`);
    console.log(`   Supabase ID: ${existingAdmin.supabaseId}`);

    // Verificar si el supabaseId es un UUID válido
    const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(existingAdmin.supabaseId);

    if (isValidUUID) {
      // Actualizar contraseña en Supabase
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingAdmin.supabaseId,
        { password }
      );

      if (updateError) {
        console.error('❌ Error actualizando contraseña:', updateError.message);
      } else {
        console.log('✅ Contraseña actualizada en Supabase\n');
      }
    } else {
      // El supabaseId no es válido, crear usuario en Supabase y actualizar
      console.log('⚠️  El supabaseId no es válido. Creando usuario en Supabase...');

      // Buscar si ya existe en Supabase Auth
      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      let supabaseUser = users?.users.find(u => u.email === email);

      if (supabaseUser) {
        console.log(`   Usuario encontrado en Supabase: ${supabaseUser.id}`);
        // Actualizar contraseña
        await supabaseAdmin.auth.admin.updateUserById(supabaseUser.id, { password });
      } else {
        // Crear usuario nuevo
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });

        if (authError) {
          console.error('❌ Error creando usuario:', authError.message);
          await prisma.$disconnect();
          return;
        }

        supabaseUser = authData.user;
        console.log(`   Usuario creado en Supabase: ${supabaseUser?.id}`);
      }

      // Actualizar AdminUser con el UUID correcto
      if (supabaseUser) {
        await prisma.adminUser.update({
          where: { id: existingAdmin.id },
          data: { supabaseId: supabaseUser.id },
        });
        console.log('✅ AdminUser actualizado con el Supabase ID correcto\n');
      }
    }

    console.log('📋 Credenciales:');
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Contraseña: ${password}`);
    console.log(`\n🔗 Accede al panel: /admin`);

    await prisma.$disconnect();
    return;
  }

  // 2. Crear usuario en Supabase Auth
  console.log('📝 Creando usuario en Supabase Auth...');

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Confirmar email automáticamente
  });

  if (authError) {
    // Si el usuario ya existe en Supabase, obtener su ID
    if (authError.message.includes('already been registered')) {
      console.log('⚠️  Usuario ya existe en Supabase Auth, buscando ID...');

      const { data: users } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = users.users.find(u => u.email === email);

      if (existingUser) {
        console.log(`   Supabase ID encontrado: ${existingUser.id}`);

        // Crear en AdminUser con el ID existente
        const admin = await prisma.adminUser.create({
          data: {
            email,
            name,
            role: 'super_admin',
            isActive: true,
            supabaseId: existingUser.id,
          },
        });

        console.log(`✅ AdminUser creado con ID: ${admin.id}\n`);
      }
    } else {
      console.error('❌ Error creando usuario en Supabase:', authError.message);
      await prisma.$disconnect();
      return;
    }
  } else if (authData.user) {
    console.log(`   Supabase ID: ${authData.user.id}`);

    // 3. Crear registro en AdminUser
    console.log('📝 Creando registro en AdminUser...');

    const admin = await prisma.adminUser.create({
      data: {
        email,
        name,
        role: 'super_admin',
        isActive: true,
        supabaseId: authData.user.id,
      },
    });

    console.log(`   Admin ID: ${admin.id}`);
    console.log('\n✅ Superadmin creado correctamente!\n');
  }

  console.log('📋 Credenciales:');
  console.log(`   📧 Email: ${email}`);
  console.log(`   🔑 Contraseña: ${password}`);
  console.log(`\n🔗 Accede al panel: /admin`);
}

createSuperAdmin()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
