# Deportes y Juguetes Eva - Tienda Online

Tienda online completa con frontend en Astro y backend/admin en Next.js.

## Stack Tecnológico

- **Frontend**: Astro + Tailwind CSS
- **Backend/Admin**: Next.js 14 (App Router)
- **Base de datos**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Autenticación**: Supabase Auth
- **Storage**: Supabase Storage
- **Emails**: Resend
- **Pagos**: Stripe + Transferencia/Efectivo
- **Deploy**: Vercel

## Estructura del Proyecto

```
deportesyjugueteseva/
├── frontend/          # Astro (sitio público)
├── backend/           # Next.js (API + Admin)
├── shared/            # Tipos compartidos
└── package.json       # Workspace root
```

## Setup Local

### 1. Instalar dependencias

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configurar variables de entorno

Crea `.env` en `/backend`:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
RESEND_API_KEY="..."
STRIPE_SECRET_KEY="..."
STRIPE_PUBLISHABLE_KEY="..."
ADMIN_EMAIL="admin@eva.com"
NEXT_PUBLIC_URL="http://localhost:3000"
```

### 3. Configurar base de datos

```bash
npm run prisma:migrate
npm run prisma:seed
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

- Frontend: http://localhost:4321
- Backend/Admin: http://localhost:3000
- Prisma Studio: `npm run prisma:studio`

## Categorías Fijas

### Deportes
- Running (prioritaria)
- Trail Running (prioritaria)
- Fitness
- Natación
- Outdoor
- Casual / Lifestyle

### Juguetes
- Infantiles
- Educativos
- Aire libre

### Hobbies/Coleccionismo
- Scalextric
- Trenes eléctricos
- Maquetas
- Otros

## Panel Admin

Acceso: `/admin` (requiere autenticación)

Funcionalidades:
- Dashboard con estadísticas
- Gestión de productos (CRUD)
- Gestión de pedidos
- Configuración de métodos de pago
- Gestión de plantillas de email
- Gestión de categorías

## Deploy

### Vercel (Recomendado)

1. Conecta el repositorio a Vercel
2. Configura dos proyectos:
   - `frontend/` → dominio principal
   - `backend/` → subdomain o /api
3. Configura variables de entorno en cada proyecto

## Licencia

Privado - Deportes y Juguetes Eva © 2026
