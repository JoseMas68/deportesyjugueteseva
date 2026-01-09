# Deportes y Juguetes Eva - Tienda Online

> Tienda online completa con frontend en Astro, backend/admin en Next.js, y sistema de emails automatizado.

![Logo EVA](logo%20deportes%20eva.png)

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install
cd backend && npm install

# 2. Configurar variables de entorno
cd backend
cp .env.example .env
# Edita .env con tus credenciales (Supabase, Resend, Stripe)

# 3. Setup base de datos
npx prisma migrate dev
npx prisma db seed

# 4. Iniciar backend
npm run dev
# Backend: http://localhost:3000
```

📖 **[Guía de Instalación Completa](docs/INSTALL.md)**

## 📁 Estructura del Proyecto

```
deportesyjugueteseva/
├── backend/          # Next.js (API + Admin)
├── frontend/         # Astro (Sitio público) [pendiente]
├── docs/             # Documentación
└── logo deportes eva.png
```

## ✨ Características

- ✅ **Backend API REST** completo (productos, categorías, checkout)
- ✅ **Sistema de emails** con Resend (7 plantillas HTML)
- ✅ **Base de datos** Prisma + Supabase (12 modelos)
- ✅ **20+ productos mock** en 13 categorías
- ✅ **Métodos de pago** configurables (Stripe, Transferencia, Efectivo)
- ✅ **Números de pedido** únicos (EVA-20260109-0001)
- 🚧 **Panel Admin** (en desarrollo)
- 🚧 **Frontend Astro** (en desarrollo)

## 🎨 Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Astro + Tailwind CSS |
| Backend | Next.js 15 (App Router) |
| Base de datos | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Emails | Resend |
| Pagos | Stripe |
| Deploy | Vercel |

## 📊 Estado del Proyecto

- ✅ **Backend**: Estructura completa con APIs funcionando
- 🚧 **Frontend**: Por desarrollar
- 🚧 **Admin**: Por desarrollar

Ver [PROGRESS.md](docs/PROGRESS.md) para el estado detallado.

## 📚 Documentación

- [📖 Guía de Instalación](docs/INSTALL.md) - Setup paso a paso
- [📊 Estado del Proyecto](docs/PROGRESS.md) - Progreso detallado
- [📄 README Original](docs/README-ORIGINAL.md) - Especificaciones completas

## 🎯 Categorías de Productos

### Deportes
- Running, Trail Running, Fitness, Natación, Outdoor, Casual

### Juguetes
- Infantiles, Educativos, Aire Libre

### Hobbies y Coleccionismo
- Scalextric, Trenes Eléctricos, Maquetas

## 🔑 Variables de Entorno

Crea `backend/.env` con:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."
RESEND_API_KEY="re_..."
STRIPE_SECRET_KEY="sk_test_..."
ADMIN_EMAIL="admin@deportesyjugueteseva.com"
```

Ver `.env.example` para el listado completo.

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar frontend + backend
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend

# Prisma
npm run prisma:migrate   # Crear migración
npm run prisma:seed      # Poblar datos iniciales
npm run prisma:studio    # Abrir Prisma Studio

# Build
npm run build            # Build todo
npm run build:frontend   # Build frontend
npm run build:backend    # Build backend
```

## 📧 Sistema de Emails

El sistema envía emails automáticamente:

**Para el cliente:**
- ✉️ Confirmación de pedido
- ✉️ Pedido pagado
- ✉️ Pedido enviado
- ✉️ Pedido cancelado

**Para el admin:**
- ✉️ Nuevo pedido
- ✉️ Pedido pagado
- ✉️ Pedido cancelado

Todas las plantillas son editables desde el panel admin (próximamente).

## 🎨 Paleta de Colores

- **Amarillo Neón**: `#CCFF00` (CTAs, hover)
- **Negro**: `#000000` (fondos, header, footer)
- **Blanco**: `#FFFFFF` (fondos claros)
- **Grises**: Escala 50-900 (textos, borders)

## 📝 Licencia

Privado - Deportes y Juguetes Eva © 2026
