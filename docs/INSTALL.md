# Guía de Instalación - Deportes y Juguetes Eva

## Requisitos Previos

- Node.js 18+ instalado
- npm o yarn
- Cuenta en Supabase (gratis)
- Cuenta en Resend (gratis hasta 3k emails/mes)
- Cuenta en Stripe (modo test gratis)
- Git

## Paso 1: Clonar/Descargar el Proyecto

Si aún no lo has hecho:
```bash
cd c:\Users\Jose\Desktop\deportesyjugueteseva
```

## Paso 2: Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com) y crea una cuenta
2. Crea un nuevo proyecto:
   - Name: `deportes-juguetes-eva`
   - Database Password: (guarda esto, lo necesitarás)
   - Region: Selecciona la más cercana (Europe West por ejemplo)

3. Espera 2-3 minutos a que se cree el proyecto

4. Una vez creado, ve a **Settings** > **API**:
   - Copia `Project URL` → Este es tu `NEXT_PUBLIC_SUPABASE_URL`
   - Copia `anon public` key → Este es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copia `service_role` key → Este es tu `SUPABASE_SERVICE_ROLE_KEY`

5. Ve a **Settings** > **Database**:
   - En "Connection string" > "URI", copia la cadena
   - Reemplaza `[YOUR-PASSWORD]` con tu contraseña
   - Este es tu `DATABASE_URL`

## Paso 3: Crear Cuenta en Resend

1. Ve a [https://resend.com](https://resend.com) y regístrate
2. Una vez dentro, ve a **API Keys**
3. Crea una nueva API Key:
   - Name: `deportes-eva-prod`
   - Permission: Full Access
4. Copia la key (empieza con `re_...`)
   - Este es tu `RESEND_API_KEY`

5. **Verificar dominio** (opcional para producción):
   - Ve a **Domains** y añade tu dominio
   - Si no tienes dominio, puedes usar el dominio de prueba de Resend temporalmente
   - Para desarrollo, usa: `onboarding@resend.dev` como remitente

## Paso 4: Crear Cuenta en Stripe

1. Ve a [https://stripe.com](https://stripe.com) y regístrate
2. **NO actives tu cuenta**, usa el modo TEST
3. En el dashboard, verás un toggle "Test mode" (debe estar activado)
4. Ve a **Developers** > **API Keys**:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (empieza con `pk_test_`)
   - Secret key → `STRIPE_SECRET_KEY` (empieza con `sk_test_`)

## Paso 5: Configurar Variables de Entorno

1. En el directorio `backend/`, crea un archivo `.env`:

```bash
cd backend
copy .env.example .env
```

2. Edita `backend/.env` con tus valores reales:

```env
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres:[TU_PASSWORD]@db.[TU_PROJECT].supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[TU_PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[TU_ANON_KEY]"
SUPABASE_SERVICE_ROLE_KEY="[TU_SERVICE_ROLE_KEY]"

# Resend (Email)
RESEND_API_KEY="re_[TU_KEY]"

# Stripe
STRIPE_SECRET_KEY="sk_test_[TU_KEY]"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_[TU_KEY]"

# Admin
ADMIN_EMAIL="tu-email@ejemplo.com"

# Site
NEXT_PUBLIC_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:4321"
```

## Paso 6: Instalar Dependencias

```bash
# Instalar dependencias raíz
npm install

# Instalar dependencias del backend
cd backend
npm install
```

## Paso 7: Configurar Base de Datos

```bash
# Aún en /backend

# 1. Generar cliente Prisma
npx prisma generate

# 2. Crear las tablas en Supabase
npx prisma migrate dev --name init

# 3. Poblar con datos iniciales (categorías, productos, plantillas email)
npx prisma db seed
```

Si todo va bien, deberías ver:
```
🌱 Seeding database...
📁 Creating categories...
✅ Categories created
📦 Creating mock products...
✅ Mock products created
📧 Creating email templates...
✅ Email templates created
💳 Creating payment method configs...
✅ Payment methods configured
⚙️ Creating site config...
✅ Site config created
🎉 Seeding completed successfully!
```

## Paso 8: Verificar Base de Datos

```bash
npx prisma studio
```

Esto abrirá una interfaz web en `http://localhost:5555` donde puedes ver todas tus tablas pobladas con datos.

Verifica que existan:
- **Category**: 13 categorías (Deportes, Running, Trail Running, etc.)
- **Product**: 20+ productos de ejemplo
- **EmailTemplate**: 7 plantillas
- **PaymentMethodConfig**: 3 métodos de pago
- **SiteConfig**: 8 configuraciones

## Paso 9: Iniciar Backend

```bash
# En /backend
npm run dev
```

Deberías ver:
```
▲ Next.js 15.1.0
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

Abre [http://localhost:3000](http://localhost:3000) y verás la página de inicio del backend.

## Paso 10: Probar las APIs

Con el backend corriendo, prueba estas URLs en tu navegador:

- [http://localhost:3000/api/products](http://localhost:3000/api/products) → Lista de productos
- [http://localhost:3000/api/categories](http://localhost:3000/api/categories) → Categorías agrupadas
- [http://localhost:3000/api/products/nike-pegasus-40](http://localhost:3000/api/products/nike-pegasus-40) → Detalle de producto

Deberías ver JSON con los datos.

## Paso 11: Crear Usuario Admin en Supabase

1. Ve a tu proyecto de Supabase
2. En el menú lateral, selecciona **Authentication** > **Users**
3. Click en **Add user** > **Create new user**
   - Email: `admin@deportesyjugueteseva.com` (o el que pusiste en `ADMIN_EMAIL`)
   - Password: Elige una contraseña segura
   - Confirm password
   - Click **Create user**

4. Copia el `id` del usuario (formato UUID)

5. Ve a **SQL Editor** y ejecuta:
```sql
INSERT INTO "AdminUser" (id, email, "supabaseId", name, role)
VALUES (
  'clxxxxxxxxxxxxx',  -- genera un cuid único
  'admin@deportesyjugueteseva.com',
  '[PEGA_AQUI_EL_USER_ID]',  -- el UUID que copiaste
  'Administrador',
  'super_admin'
);
```

## Paso 12: Frontend (Próximamente)

El frontend en Astro aún está por crear. Los próximos pasos serán:

```bash
# En la raíz del proyecto
cd frontend
npm create astro@latest . -- --template minimal --yes
npm install
npm run dev
```

## ✅ Verificación Final

Si todo funciona correctamente:

1. ✅ Backend corriendo en `http://localhost:3000`
2. ✅ APIs REST funcionando y devolviendo JSON
3. ✅ Prisma Studio muestra tablas con datos
4. ✅ Variables de entorno configuradas
5. ✅ Usuario admin creado en Supabase

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- Verifica que `DATABASE_URL` esté correcta
- Asegúrate de que tu proyecto Supabase esté activo
- Comprueba que reemplazaste `[YOUR-PASSWORD]` con tu contraseña real

### Error: "Resend API key not found"
- Verifica que `RESEND_API_KEY` esté en `.env`
- La key debe empezar con `re_`

### Error en Prisma migrate
- Elimina `backend/prisma/migrations/` y vuelve a ejecutar
- Asegúrate de que la base de datos esté vacía

### Puerto 3000 ocupado
- Cambia el puerto en `backend/package.json`:
  ```json
  "dev": "next dev -p 3001"
  ```

## 📞 Soporte

Si encuentras problemas:
1. Revisa `PROGRESS.md` para ver el estado actual
2. Consulta la documentación de:
   - [Supabase Docs](https://supabase.com/docs)
   - [Prisma Docs](https://www.prisma.io/docs)
   - [Next.js Docs](https://nextjs.org/docs)
   - [Resend Docs](https://resend.com/docs)

## 🎉 ¡Listo!

El backend está configurado y funcionando. Ahora puedes continuar con el desarrollo del frontend y el panel admin.
