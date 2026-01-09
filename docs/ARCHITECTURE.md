# Arquitectura del Sistema - Deportes y Juguetes Eva

## 🏗️ Visión General

```
┌─────────────────────────────────────────────────────────────┐
│                         USUARIO                              │
└─────────────────────────────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────┐   ┌───────────────────────┐
│   FRONTEND (Astro)    │   │   ADMIN (Next.js)     │
│   localhost:4321      │   │   localhost:3000      │
│                       │   │                       │
│  • Home               │   │  • Dashboard          │
│  • Catálogo           │   │  • CRUD Productos     │
│  • Producto           │   │  • Gestión Pedidos    │
│  • Carrito            │   │  • Config Pagos       │
│  • Checkout           │   │  • Email Templates    │
│  • Confirmación       │   │  • Configuración      │
└───────────┬───────────┘   └───────────┬───────────┘
            │                           │
            │         ┌─────────────────┘
            │         │
            ▼         ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API (Next.js)                       │
│                   localhost:3000/api                         │
│                                                              │
│  GET  /api/products             → Lista productos           │
│  GET  /api/products/[slug]      → Detalle producto          │
│  GET  /api/categories           → Categorías agrupadas      │
│  POST /api/checkout             → Crear pedido              │
│  GET  /api/orders/[id]          → Detalle pedido            │
│  PATCH /api/admin/orders/[id]   → Actualizar estado        │
└─────────────────────────────────────────────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────┐   ┌───────────────────────┐
│   PRISMA ORM          │   │   RESEND (Emails)     │
│                       │   │                       │
│  • Products           │   │  • Cliente            │
│  • Orders             │   │  • Admin              │
│  • Categories         │   │  • Tracking           │
│  • EmailTemplates     │   │                       │
└───────────┬───────────┘   └───────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE (Base de Datos + Storage)              │
│                                                              │
│  • PostgreSQL          → Datos                               │
│  • Auth                → Autenticación admin                 │
│  • Storage             → Imágenes productos                  │
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                     STRIPE (Pagos)                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Modelos de Datos (Prisma Schema)

### **Category** (Categorías)
```prisma
id, name, slug, description, imageUrl
parentId → Category (self-relation)
menuSection → 'deportes' | 'juguetes' | 'hobbies'
displayOrder, isActive
```

**Jerarquía:**
```
Deportes (menuSection: 'deportes')
  ├── Running
  ├── Trail Running
  ├── Fitness
  ├── Natación
  ├── Outdoor
  └── Casual

Juguetes (menuSection: 'juguetes')
  ├── Infantiles
  ├── Educativos
  └── Aire Libre

Hobbies (menuSection: 'hobbies')
  ├── Scalextric
  ├── Trenes Eléctricos
  └── Maquetas
```

---

### **Product** (Productos)
```prisma
id, name, slug, description, shortDescription
price, compareAtPrice, stock, sku
images[], thumbnailUrl
categoryId → Category
sportType → ENUM (RUNNING, TRAIL_RUNNING, etc.)
isCollectible, collectionType → ENUM (SCALEXTRIC, etc.)
brand, color, size, weight, specifications (JSON)
metaTitle, metaDescription (SEO)
isFeatured, isNew, isBestSeller (flags)
isActive, publishedAt
```

---

### **Order** (Pedidos)
```prisma
id, orderNumber (EVA-20260109-0001)
userEmail, userName, userPhone
shippingAddress, shippingCity, shippingPostalCode, etc.
items → OrderItem[]
subtotal, shippingCost, discount, total
status → PENDING | PAID | PROCESSING | SHIPPED | DELIVERED | CANCELLED
paymentMethod → STRIPE | TRANSFER | CASH
emailSentConfirmed, emailSentPaid, emailSentShipped, etc.
stripePaymentIntentId, paidAt
trackingNumber, shippedAt, deliveredAt
cancellationReason, cancelledAt
adminNotes, customerNotes
```

---

### **OrderItem** (Ítems del Pedido)
```prisma
id, orderId, productId
quantity, unitPrice, totalPrice
productName, productImage, productSku (snapshot)
```

---

### **EmailTemplate** (Plantillas Email)
```prisma
id, type → ENUM (CONFIRMATION, PAID, SHIPPED, etc.)
subject, body (HTML con placeholders)
isActive
```

**Placeholders disponibles:**
- `{order_number}`, `{order_id}`
- `{user_name}`, `{user_email}`
- `{products}` → HTML de lista de productos
- `{subtotal}`, `{shipping_cost}`, `{total}`
- `{address}` → Dirección formateada
- `{tracking_number}`
- `{cancellation_reason}`
- `{admin_link}` → Link al pedido en admin

---

### **PaymentMethodConfig** (Config Métodos de Pago)
```prisma
id, method → STRIPE | TRANSFER | CASH
isEnabled (boolean)
displayName, description, instructions
displayOrder
config (JSON) → datos específicos (ej: IBAN)
```

---

### **EmailLog** (Auditoría Emails)
```prisma
id, type, recipient, subject
orderId
status → 'sent' | 'failed' | 'pending'
errorMessage
sentAt
```

---

### **AdminUser** (Usuarios Admin)
```prisma
id, email, supabaseId
name, role → 'admin' | 'super_admin'
isActive, lastLoginAt
```

---

### **SiteConfig** (Configuración General)
```prisma
id, key, value
description, group, type
```

**Configuraciones iniciales:**
- `site_name`, `admin_email`, `contact_email`, `contact_phone`
- `shipping_cost_standard` (4.99€)
- `free_shipping_threshold` (50€)
- `currency`, `currency_symbol`

---

## 🔄 Flujos del Sistema

### **1. Flujo de Compra (Cliente)**

```
1. Cliente navega catálogo
   ↓
2. Añade productos al carrito (localStorage)
   ↓
3. Va a checkout y rellena formulario
   ↓
4. POST /api/checkout
   - Valida datos (Zod)
   - Verifica stock
   - Calcula totales
   - Crea Order + OrderItems
   - Reduce stock
   - Envía emails (async)
   ↓
5. Si método = STRIPE
   - Crea Payment Intent
   - Redirige a Stripe Checkout
   ↓
6. Webhook de Stripe confirma pago
   - Actualiza order.status = PAID
   - Envía email "Pedido pagado"
   ↓
7. Cliente recibe confirmación
```

---

### **2. Flujo de Emails (Automático)**

#### **Al crear pedido (POST /api/checkout)**
```javascript
Promise.all([
  sendEmail('CONFIRMATION', order, order.userEmail),
  sendEmail('ADMIN_NEW_ORDER', order, ADMIN_EMAIL)
])

// Actualiza order.emailSentConfirmed = true
```

#### **Al cambiar estado en admin (PATCH /api/admin/orders/[id])**
```javascript
if (status === 'PAID' && !order.emailSentPaid) {
  sendEmail('PAID', order, order.userEmail)
  sendEmail('ADMIN_PAID', order, ADMIN_EMAIL)
  order.emailSentPaid = true
}

if (status === 'SHIPPED' && !order.emailSentShipped) {
  sendEmail('SHIPPED', order, order.userEmail)
  order.emailSentShipped = true
}

if (status === 'CANCELLED' && !order.emailSentCancelled) {
  sendEmail('CANCELLED', order, order.userEmail)
  sendEmail('ADMIN_CANCELLED', order, ADMIN_EMAIL)
  order.emailSentCancelled = true
}
```

#### **Función sendEmail (con reintentos)**
```javascript
async function sendEmail(type, order, recipient, retries = 3) {
  try {
    // 1. Cargar template de DB
    const template = await prisma.emailTemplate.findUnique({ where: { type } })

    // 2. Reemplazar placeholders
    const subject = replacePlaceholders(template.subject, order)
    const html = replacePlaceholders(template.body, order)

    // 3. Enviar con Resend
    await resend.emails.send({
      from: 'Deportes y Juguetes Eva <noreply@deportesyjugueteseva.com>',
      to: recipient,
      subject,
      html
    })

    // 4. Log exitoso
    await prisma.emailLog.create({ type, recipient, status: 'sent', ... })

  } catch (error) {
    // Log error
    await prisma.emailLog.create({ type, recipient, status: 'failed', ... })

    // Retry
    if (retries > 0) {
      await sleep(2000)
      return sendEmail(type, order, recipient, retries - 1)
    }
  }
}
```

---

### **3. Flujo del Admin**

```
1. Admin accede a /admin
   ↓
2. Middleware verifica auth (Supabase)
   - Si no autenticado → /admin/login
   - Si no es AdminUser → /unauthorized
   ↓
3. Dashboard: stats, gráficas, pedidos recientes
   ↓
4. Gestión de pedidos:
   - Ver lista filtrable
   - Abrir detalle
   - Cambiar estado (PENDING → PAID → SHIPPED)
   - Añadir tracking number
   - Añadir notas admin
   ↓
5. Al cambiar estado → dispara emails automáticos
   ↓
6. Gestión de productos:
   - CRUD completo
   - Subir imágenes a Supabase Storage
   - Actualizar stock/precio
   ↓
7. Config métodos de pago:
   - Habilitar/deshabilitar
   - Editar instrucciones (ej: IBAN para transferencias)
   ↓
8. Gestión plantillas email:
   - Editar subject/body
   - Insertar placeholders
   - Vista previa con datos mock
```

---

## 🔐 Autenticación y Autorización

### **Supabase Auth**
```typescript
// Middleware en Next.js
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect('/admin/login')
    }

    // Verificar rol admin
    const adminUser = await prisma.adminUser.findUnique({
      where: { supabaseId: session.user.id }
    })

    if (!adminUser || !adminUser.isActive) {
      return NextResponse.redirect('/unauthorized')
    }
  }

  return NextResponse.next()
}
```

### **Crear Admin**
```sql
-- 1. Crear usuario en Supabase Auth (UI)
-- 2. Añadir a tabla AdminUser
INSERT INTO "AdminUser" (id, email, "supabaseId", role)
VALUES ('clxxx...', 'admin@eva.com', '[UUID_SUPABASE]', 'super_admin');
```

---

## 🎨 Frontend (Astro) - Arquitectura

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.astro          → Megamenu
│   │   ├── Footer.astro
│   │   ├── ProductCard.astro
│   │   ├── CartIcon.astro
│   │   └── Button.astro
│   ├── layouts/
│   │   └── Layout.astro          → Layout base
│   ├── pages/
│   │   ├── index.astro           → Home
│   │   ├── [category]/
│   │   │   └── index.astro       → Catálogo
│   │   ├── productos/
│   │   │   └── [slug].astro      → Detalle
│   │   ├── carrito.astro
│   │   ├── checkout.astro
│   │   └── confirmacion.astro
│   ├── lib/
│   │   ├── api.ts                → Cliente API
│   │   └── cart.ts               → Lógica carrito
│   └── styles/
│       └── global.css
└── tailwind.config.ts
```

---

## 🔌 Integraciones Externas

### **Supabase**
- **PostgreSQL**: Base de datos principal
- **Auth**: Autenticación admin
- **Storage**: Imágenes de productos (bucket: `products`)

### **Resend**
- **Email transaccional**: Confirmaciones, notificaciones
- **Templates HTML**: Almacenadas en DB, renderizadas dinámicamente

### **Stripe**
- **Payment Intent**: Procesamiento de pagos con tarjeta
- **Webhooks**: Confirmación de pago automática
- **Checkout Session**: Experiencia de pago hosted

---

## 🚀 Deploy (Vercel)

### **Backend (Next.js)**
```bash
vercel --prod
# URL: https://backend-eva.vercel.app
```

**Variables de entorno en Vercel:**
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`
- `ADMIN_EMAIL`

### **Frontend (Astro)**
```bash
vercel --prod
# URL: https://deportesyjugueteseva.com
```

**Variables de entorno en Vercel:**
- `PUBLIC_API_URL=https://backend-eva.vercel.app`

---

## 📊 Rendimiento y Optimizaciones

### **Frontend (Astro)**
- ✅ SSG para páginas estáticas (home, categorías)
- ✅ SSR para páginas dinámicas (detalle producto)
- ✅ Lazy loading de imágenes
- ✅ Code splitting automático
- ✅ Tailwind purge en build

### **Backend (Next.js)**
- ✅ API Routes con caché (Next.js cache)
- ✅ Prisma connection pooling
- ✅ Imágenes optimizadas con Supabase Storage
- ✅ Email sending async (no bloquea respuesta)

### **Base de Datos**
- ✅ Índices en campos frecuentes (slug, categoryId, status)
- ✅ Eager loading con `include` (evita N+1)
- ✅ Paginación en listados

---

## 🔧 Mantenimiento

### **Backups (Supabase)**
- Automáticos cada 24h (plan gratuito)
- Exportar manualmente: Prisma Studio → Export CSV

### **Logs**
- **EmailLog**: Auditoría de emails enviados/fallados
- **OrderItems**: Snapshot de productos (histórico)

### **Actualizaciones**
- Dependencias: `npm outdated` + `npm update`
- Migraciones: `npx prisma migrate dev`
- Seeds: `npx prisma db seed` (idempotente con upsert)

---

## 📝 Notas Técnicas

1. **Categorías fijas**: No se pueden eliminar (constraint en UI, no en DB)
2. **Stock**: Se reduce al crear pedido, no al añadir al carrito
3. **Números de pedido**: Únicos generados server-side
4. **Emails**: Async para no bloquear checkout
5. **Flags de email**: Evitan reenvíos duplicados
6. **Placeholders**: Regex replace en HTML (no template engine)
7. **Métodos de pago**: Configurables sin tocar código
