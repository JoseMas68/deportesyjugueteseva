# Estado del Proyecto - Deportes y Juguetes Eva

## ✅ Completado (Backend)

### 1. Estructura Base
- [x] Workspace monorepo configurado
- [x] Schema Prisma completo con todas las entidades
- [x] Seed con categorías, productos mock y plantillas de email
- [x] Tailwind configurado con paleta de colores EVA (amarillo #CCFF00, negro, grises)
- [x] Variables de entorno documentadas

### 2. Funcionalidades Backend (Next.js)
- [x] Configuración Next.js 15 con App Router
- [x] Conexión Prisma con Supabase
- [x] Cliente Supabase configurado
- [x] Sistema de emails con Resend + placeholders dinámicos
- [x] Generador de números de pedido (EVA-YYYYMMDD-NNNN)

### 3. APIs REST
- [x] GET /api/products (con filtros, búsqueda, paginación)
- [x] GET /api/products/[slug] (detalle + productos relacionados)
- [x] GET /api/categories (con agrupación para megamenu)
- [x] POST /api/checkout (creación de pedidos + emails automáticos)
- [x] GET/POST /api/home-sections (gestión de secciones de home)

### 4. Sistema de Emails
- [x] 7 plantillas HTML predefinidas en seed
- [x] Función sendEmail con reintentos (3 intentos)
- [x] Placeholders: {order_number}, {user_name}, {products}, {total}, etc.
- [x] EmailLog para auditoría
- [x] Emails al cliente: Confirmación, Pagado, Enviado, Cancelado
- [x] Emails al admin: Nuevo pedido, Pagado, Cancelado

## ✅ Completado (Frontend - Astro)

### 1. Configuración Base
- [x] Setup proyecto Astro con TypeScript
- [x] Configurar Tailwind CSS con paleta de colores EVA
- [x] Estructura de carpetas (layouts, components, pages)
- [x] Configuración de path aliases (@/)

### 2. Componentes Compartidos
- [x] Layout.astro (estructura base con SEO)
- [x] Header.astro con megamenu responsive (Deportes/Juguetes/Hobbies)
- [x] Footer.astro con links y redes sociales
- [x] ProductCard.astro (con ratings, badges, stock)
- [x] ProductSlider.astro (slider reutilizable con Swiper.js)

### 3. Páginas Principales
- [x] index.astro (hero + categorías populares + más vendidos)
- [x] [category].astro (grid de productos + filtros laterales)
- [x] buscar.astro (búsqueda con filtros dinámicos)
- [x] ofertas.astro (ofertas destacadas + todas las ofertas)
- [x] producto/[slug].astro (detalle con galería + relacionados)
- [x] carrito.astro (tabla de productos + resumen)
- [x] checkout.astro (formulario + métodos de pago)
- [x] confirmacion.astro (resumen de pedido)
- [x] cuenta.astro (dashboard de usuario)

### 4. Funcionalidades UI
- [x] Megamenu con hover en desktop
- [x] Mobile menu responsive
- [x] Breadcrumbs en todas las páginas
- [x] Paginación con estilos accesibles
- [x] Sistema de filtros (categoría, precio, marca)
- [x] Badges de descuento y "NUEVO"
- [x] Estados de stock (agotado, bajo stock)
- [x] Banners promocionales
- [x] Newsletter signup
- [x] Ratings con estrellas (color amber)
- [x] Sliders de productos con Swiper.js (navegación, paginación, autoplay)

## ✅ Completado (Integración Frontend-Backend)

### Conexión con Backend
- [x] Integrar API de productos (reemplazar mock data)
- [x] Integrar API de categorías
- [x] Implementar carrito funcional con localStorage
- [x] Configurar CORS en backend para permitir peticiones desde frontend
- [x] Crear middleware para hacer APIs públicas (sin autenticación)
- [x] Fix de conversión Prisma Decimal (string a number)
- [x] Contador de carrito dinámico en Header
- [x] Base de datos Supabase conectada con Session Pooler (IPv4)
- [x] Migración de schema y seed de datos (15 productos de muestra)

### Páginas Conectadas a API Real
- [x] index.astro - Mostrar productos más vendidos desde API
- [x] [category].astro - Productos por categoría desde API
- [x] buscar.astro - Búsqueda de productos desde API
- [x] ofertas.astro - Productos en oferta desde API
- [x] producto/[slug].astro - Detalle de producto desde API
- [x] carrito.astro - Carrito funcional con localStorage

## 🚧 Pendiente

### Frontend (Funcionalidades Pendientes)
- [x] Filtros de productos (precio, marca, subcategoría) - COMPLETADO con multiselección
- [x] Paginación funcional en listados de productos - COMPLETADO
- [x] Transiciones suaves entre vista lista/cuadrícula - COMPLETADO
- [x] Sistema de favoritos funcional - COMPLETADO
- [ ] Conectar checkout con API backend
- [ ] Gestión de estados de carga y errores mejorada
- [ ] Implementar búsqueda en tiempo real con debounce

### Panel de Cliente (Frontend) - ✅ COMPLETADO
- [x] Sistema de autenticación de clientes (login/registro)
- [x] Página de cuenta principal (/cuenta) con dashboard
- [x] Gestión de perfil (/cuenta/detalles) - editar datos personales
- [x] Campos de perfil completos: nombre, email, teléfono, DNI/NIE, fecha de nacimiento, género
- [x] Cambio de contraseña funcional
- [x] Gestión de direcciones (/cuenta/direcciones) - CRUD completo
- [x] Página de pedidos (/cuenta/pedidos) - lista de pedidos (mock data)
- [x] Página de favoritos (/favoritos) - gestión de wishlist
- [x] Sidebar de navegación consistente en todas las páginas
- [x] Sistema de toasts para notificaciones (sin alerts nativos)
- [x] Protección de rutas - redirección a login si no autenticado
- [x] Badge de estado VIP y año de registro
- [x] API backend para actualizar datos de cliente (PATCH /api/customers/[id])
- [x] Documentación de sistema de toasts (TOAST_GUIDELINES.md)

### Panel Admin (Next.js) - ✅ COMPLETADO
- [x] Middleware de autenticación con Supabase
- [x] Layout admin con sidebar
- [x] Dashboard (stats, pedidos recientes)
- [x] CRUD de productos (con subida de imágenes a Supabase Storage)
- [x] Gestión de pedidos (lista + detalle + cambio de estado + emails automáticos)
- [x] Configuración de métodos de pago (habilitar/deshabilitar)
- [x] Gestión de categorías (editar descripciones/imágenes)
- [x] Configuración general del sitio
- [ ] Gestión de plantillas de email (editor WYSIWYG básico) - Pendiente

### Integraciones
- [ ] Stripe Payment Intent en checkout
- [ ] Webhook de Stripe para actualizar estado de pago
- [x] Subida de imágenes a Supabase Storage (panel admin)
- [ ] Optimización de imágenes con CDN
- [x] Sistema de notificaciones por email funcional (al cambiar estado pedidos)

### Deploy
- [ ] Configurar para Vercel (frontend + backend)
- [ ] Variables de entorno en producción
- [ ] Dominio personalizado
- [ ] SSL y seguridad
- [ ] Monitoreo y analytics

## 📋 Próximos Pasos Inmediatos

### ✅ COMPLETADO: Opción A - Conectar Frontend con Backend
1. ✅ **Crear módulo de API cliente**
   - ✅ Creado `frontend/src/lib/api.ts` con funciones para llamar al backend
   - ✅ Implementado fetchProducts(), fetchCategories(), createOrder()
   - ✅ Gestión básica de errores

2. ✅ **Implementar carrito funcional**
   - ✅ Sistema de localStorage para persistencia
   - ✅ Añadir/quitar/actualizar cantidad
   - ✅ Calcular totales
   - ✅ Sincronizar con UI en tiempo real

3. ✅ **Conectar páginas con API real**
   - ✅ Reemplazar mock data en index.astro
   - ✅ Conectar página de categoría
   - ✅ Página de detalle con productos relacionados
   - ✅ Búsqueda básica

4. ⚠️ **Checkout funcional - PENDIENTE**
   - [ ] Validación de formulario
   - [ ] Integración con Stripe
   - [ ] Confirmación de pedido
   - [ ] Redirección a página de confirmación

### ✅ COMPLETADO: Opción B - Panel Admin
1. ✅ **Setup de autenticación**
   - ✅ Middleware de Supabase protegiendo /admin/* y /api/admin/*
   - ✅ Página de login con Supabase Auth
   - ✅ Verificación de AdminUser en base de datos
   - ✅ Logout funcional

2. ✅ **Layout admin**
   - ✅ Sidebar con navegación (Dashboard, Productos, Pedidos, Categorías, Configuración)
   - ✅ Header con usuario y menú desplegable
   - ✅ Dashboard principal con estadísticas

3. ✅ **Gestión de productos**
   - ✅ Lista con paginación y búsqueda
   - ✅ Formulario crear/editar
   - ✅ Subida de imágenes a Supabase Storage
   - ✅ Control de stock

4. ✅ **Gestión de pedidos**
   - ✅ Lista de pedidos con filtros
   - ✅ Detalle de pedido
   - ✅ Cambio de estado (pendiente → pagado → enviado → entregado)
   - ✅ Emails automáticos al cambiar estado
   - ✅ Añadir número de seguimiento

5. ✅ **Configuración**
   - ✅ Gestión de categorías
   - ✅ Configuración general del sitio
   - ✅ Habilitar/deshabilitar métodos de pago

### Opción C: Preparar para Deploy (Más adelante)
1. **Variables de entorno**
   - Configurar .env para producción
   - Secrets en Vercel

2. **Optimizaciones**
   - Imágenes optimizadas
   - Caché de API
   - Lazy loading

3. **Deploy**
   - Vercel para frontend y backend
   - Configurar dominio
   - SSL automático

## 🔑 Credenciales Necesarias

Para ejecutar el proyecto, necesitas configurar en `backend/.env`:

```env
# Supabase (crea proyecto en https://supabase.com)
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Resend (crea cuenta en https://resend.com)
RESEND_API_KEY="re_..."

# Stripe (modo test en https://stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Admin
ADMIN_EMAIL="tu-email@ejemplo.com"

# URLs
NEXT_PUBLIC_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_URL="http://localhost:4321"
```

## 🎨 Paleta de Colores

- **Amarillo Neón**: #CCFF00 (CTAs, hover, acentos)
- **Negro**: #000000 (fondos, header, footer)
- **Blanco**: #FFFFFF (fondos claros, textos en negro)
- **Grises**: Escala del 50 al 900 para textos secundarios y borders

## 📁 Estructura de Archivos Actual

```
deportesyjugueteseva/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma ✅ (400 líneas, 12 modelos)
│   │   ├── seed.ts ✅ (600 líneas, datos completos)
│   │   └── seed-products.ts ✅ (50 productos mock)
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/ ✅ (Panel de administración)
│   │   │   │   ├── layout.tsx ✅ (layout con sidebar)
│   │   │   │   ├── page.tsx ✅ (redirect a dashboard)
│   │   │   │   ├── dashboard/page.tsx ✅ (métricas)
│   │   │   │   ├── productos/page.tsx ✅ (lista)
│   │   │   │   ├── productos/nuevo/page.tsx ✅
│   │   │   │   ├── productos/[id]/page.tsx ✅ (editar)
│   │   │   │   ├── pedidos/page.tsx ✅ (lista)
│   │   │   │   ├── pedidos/[id]/page.tsx ✅ (detalle)
│   │   │   │   ├── categorias/page.tsx ✅
│   │   │   │   ├── categorias/[id]/page.tsx ✅
│   │   │   │   └── configuracion/page.tsx ✅
│   │   │   ├── api/
│   │   │   │   ├── admin/ ✅ (APIs protegidas)
│   │   │   │   │   ├── auth/session/route.ts ✅
│   │   │   │   │   ├── dashboard/stats/route.ts ✅
│   │   │   │   │   ├── products/route.ts ✅
│   │   │   │   │   ├── products/[id]/route.ts ✅
│   │   │   │   │   ├── orders/route.ts ✅
│   │   │   │   │   ├── orders/[id]/route.ts ✅
│   │   │   │   │   ├── orders/[id]/status/route.ts ✅
│   │   │   │   │   ├── categories/[id]/route.ts ✅
│   │   │   │   │   ├── settings/route.ts ✅
│   │   │   │   │   └── upload/route.ts ✅
│   │   │   │   ├── products/route.ts ✅
│   │   │   │   ├── products/[slug]/route.ts ✅
│   │   │   │   ├── categories/route.ts ✅
│   │   │   │   ├── checkout/route.ts ✅ (150 líneas)
│   │   │   │   └── home-sections/route.ts ✅
│   │   │   ├── login/page.tsx ✅ (login admin)
│   │   │   ├── layout.tsx ✅
│   │   │   ├── page.tsx ✅ (redirect a admin)
│   │   │   └── globals.css ✅
│   │   ├── components/admin/ ✅
│   │   │   ├── Sidebar.tsx ✅
│   │   │   ├── Header.tsx ✅
│   │   │   ├── ProductForm.tsx ✅
│   │   │   ├── OrderStatusForm.tsx ✅
│   │   │   └── ConfigForm.tsx ✅
│   │   └── lib/
│   │       ├── prisma.ts ✅
│   │       ├── supabase.ts ✅ (cliente browser)
│   │       ├── supabase-server.ts ✅ (cliente server)
│   │       ├── supabase-middleware.ts ✅ (cliente middleware)
│   │       ├── auth.ts ✅ (helpers autenticación)
│   │       └── email.ts ✅ (100 líneas)
│   ├── middleware.ts ✅ (protección rutas admin)
│   ├── package.json ✅
│   ├── tsconfig.json ✅
│   ├── next.config.ts ✅
│   ├── tailwind.config.ts ✅
│   ├── postcss.config.mjs ✅
│   └── .env.example ✅
├── docs/
│   ├── INSTALL.md ✅ (Guía paso a paso)
│   ├── PROGRESS.md ✅ (Este archivo)
│   ├── ARCHITECTURE.md ✅ (Arquitectura completa)
│   └── README-ORIGINAL.md ✅ (Especificaciones)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.astro ✅
│   │   │   ├── Footer.astro ✅
│   │   │   ├── ProductCard.astro ✅
│   │   │   └── ProductSlider.astro ✅ (slider reutilizable)
│   │   ├── layouts/
│   │   │   └── Layout.astro ✅
│   │   ├── lib/
│   │   │   ├── api.ts ✅ (cliente API)
│   │   │   └── cart.ts ✅ (carrito localStorage)
│   │   └── pages/
│   │       ├── index.astro ✅
│   │       ├── [category].astro ✅
│   │       ├── buscar.astro ✅
│   │       ├── ofertas.astro ✅
│   │       ├── carrito.astro ✅
│   │       ├── checkout.astro ✅
│   │       ├── confirmacion.astro ✅
│   │       └── producto/[slug].astro ✅
│   └── package.json ✅
├── logo deportes eva.png ✅
├── package.json ✅
├── README.md ✅
└── .gitignore ✅
```

**Total archivos creados: 45+ archivos**

## 🚀 Comandos para Continuar

```bash
# 1. Instalar dependencias del backend
cd backend
npm install

# 2. Configurar .env con tus credenciales
cp .env.example .env
# Editar .env con tus valores reales

# 3. Ejecutar migraciones y seed
npx prisma migrate dev --name init
npx prisma db seed

# 4. Iniciar backend
npm run dev
# Backend corriendo en http://localhost:3000

# 5. En otra terminal, crear proyecto frontend
cd ../frontend
npm create astro@latest . -- --template minimal --yes
npm install

# 6. Iniciar frontend
npm run dev
# Frontend corriendo en http://localhost:4321
```

## 📝 Notas Importantes

1. **Categorías fijas**: No se pueden eliminar, solo editar
2. **Métodos de pago**: Configurables desde admin (habilitar/deshabilitar)
3. **Emails**: Plantillas editables desde admin con placeholders
4. **Productos mock**: 50 productos de ejemplo en diferentes categorías
5. **Números de pedido**: Formato EVA-YYYYMMDD-NNNN único
6. **Stock**: Se reduce automáticamente al crear pedido
7. **Envío gratis**: A partir de 50€ (configurable)
8. **Panel Admin**: Accesible en /admin (requiere usuario en tabla AdminUser)
9. **Panel Cliente**: Sistema completo de gestión de cuenta, perfil y direcciones
10. **Cliente de prueba**: test@test.com / test123 (creado con seed)
11. **Toasts**: Sistema de notificaciones no intrusivo (sin alerts/confirm nativos)
12. **Turbopack**: Habilitado para desarrollo más rápido (--turbopack)

## ⚠️ Prioridad Alta - Faltan Implementar

### Funcionalidad Crítica
1. ✅ ~~**Conexión Frontend-Backend**~~ - COMPLETADO
2. ✅ ~~**Carrito Funcional**~~ - COMPLETADO
3. ✅ ~~**Panel Admin**~~ - COMPLETADO (gestión de productos, pedidos, categorías, configuración)
4. ✅ ~~**Autenticación Admin**~~ - COMPLETADO (Supabase Auth + middleware)
5. ✅ ~~**Filtros de Productos**~~ - COMPLETADO (multiselección con checkboxes, transiciones suaves)
6. ✅ ~~**Panel de Cliente**~~ - COMPLETADO (cuenta, perfil, direcciones, favoritos)
7. ❌ **Checkout Real**: Integrar con Stripe y API de pedidos
8. ❌ **Pedidos Reales**: Conectar panel de cliente con API de pedidos del backend

### Integraciones Pendientes
- Stripe Payment Intent real (actualmente simulado en API)
- Webhook de Stripe para confirmar pagos automáticamente
- ✅ ~~Subida de imágenes a Supabase Storage~~ - COMPLETADO (en panel admin)
- ✅ ~~Sistema de emails funcional~~ - COMPLETADO (al cambiar estado de pedidos)
- [ ] Gestión de envíos (transportistas, tracking, integración con APIs de envío)

### Mejoras Futuras
- Tests unitarios y de integración
- Optimización de imágenes con CDN
- Analytics y monitoreo

## 📝 Funcionalidades Faltantes (Por Implementar)

Las siguientes funcionalidades tienen sus modelos creados en el schema de Prisma pero aún no están implementadas:

### Sistema de Cupones y Descuentos
- [ ] API para gestión de cupones (CRUD)
- [ ] Validación de cupones en checkout
- [ ] Panel admin para crear/editar cupones
- [ ] Aplicar descuento en carrito
- **Modelos creados**: `Coupon`, `CouponType` (enum)

### Sistema de Reseñas y Valoraciones
- [ ] API para crear/listar reseñas de productos
- [ ] Moderación de reseñas en admin
- [ ] Mostrar reseñas en página de producto
- [ ] Verificación de compra para reseñas
- [ ] Sistema de votos "útil/no útil"
- **Modelo creado**: `Review`

### Wishlist / Lista de Deseos (Frontend)
- [ ] Botón de añadir/quitar de favoritos en productos
- [ ] Página de favoritos funcional
- [ ] Sincronización con API de wishlist
- **Modelos creados**: `WishlistItem` (ya conectado a `Customer`)

### Páginas Legales y de Contenido
- [ ] Página de Política de Privacidad
- [ ] Página de Términos y Condiciones
- [ ] Página de Política de Cookies
- [ ] Página de Devoluciones y Reembolsos
- [ ] Editor de páginas en admin
- **Modelo creado**: `Page`

### Página de Contacto
- [ ] Formulario de contacto funcional
- [ ] Envío de email al admin
- [ ] Gestión de mensajes en admin
- [ ] Responder desde admin
- **Modelo creado**: `ContactMessage`

### Página de FAQ (Preguntas Frecuentes)
- [ ] Página pública de FAQ con categorías
- [ ] Gestión de FAQ en admin
- [ ] Contador de visualizaciones
- [ ] Marcar como "útil"
- **Modelos creados**: `FaqCategory`, `FaqQuestion`

### Notificaciones de Stock
- [ ] Formulario "Avísame cuando haya stock"
- [ ] Sistema de emails automáticos cuando hay stock
- [ ] Gestión de notificaciones pendientes en admin
- **Modelo creado**: `StockNotification`

### Sistema de Puntos de Fidelidad
- [ ] Acumular puntos por compras (ya existe campo `loyaltyPoints` en Customer)
- [ ] Canjear puntos por descuentos
- [ ] Historial de puntos
- [ ] Niveles VIP con beneficios

### Campañas de Email Marketing
- [ ] Crear y programar campañas
- [ ] Segmentación de audiencia
- [ ] Estadísticas de apertura/clicks
- [ ] Gestionar suscriptores
- **Modelos creados**: `EmailCampaign`, `CampaignEmailLog`, `EmailSubscriber`

### Feature Flags
- [ ] Panel de gestión de feature flags
- [ ] Activar/desactivar funcionalidades
- **Modelo creado**: `FeatureFlag`

### Gestión de Marcas
- [ ] CRUD de marcas en admin
- [ ] Página pública de marcas
- [ ] Filtro por marca en búsqueda
- **Modelo creado**: `Brand`

## 🧾 Sistema de Facturación con Verifactu (Por Implementar)

Sistema completo de facturación electrónica integrado con Verifactu (Sistema de Verificación de Facturas de la AEAT), obligatorio en España a partir de 2026.

### Requisitos Legales
- **Verifactu**: Sistema de la Agencia Tributaria para verificación de facturas
- **Obligatoriedad**: Empresas y autónomos deben emitir facturas electrónicas verificables
- **Formato**: Facturae o formato compatible con la AEAT
- **Firma electrónica**: Las facturas deben estar firmadas digitalmente
- **Código QR**: Cada factura debe incluir un código QR de verificación

### Modelos de Base de Datos Necesarios
```prisma
// Factura
model Invoice {
  id                String        @id @default(cuid())
  invoiceNumber     String        @unique // Numeración correlativa: EVA-2026-00001
  orderId           String        @unique
  order             Order         @relation(fields: [orderId], references: [id])

  // Datos del emisor (tienda)
  issuerName        String
  issuerTaxId       String        // NIF de la empresa
  issuerAddress     String

  // Datos del cliente
  customerId        String?
  customerName      String
  customerTaxId     String?       // DNI/NIF del cliente
  customerAddress   String
  customerEmail     String

  // Importes
  subtotal          Decimal       @db.Decimal(10, 2)
  taxBase           Decimal       @db.Decimal(10, 2) // Base imponible
  taxRate           Decimal       @db.Decimal(5, 2)  // Tipo IVA (21%, 10%, 4%, 0%)
  taxAmount         Decimal       @db.Decimal(10, 2) // Cuota IVA
  total             Decimal       @db.Decimal(10, 2)

  // Verifactu
  verifactuId       String?       @unique // ID de registro en Verifactu
  verifactuQR       String?       // Código QR de verificación
  verifactuHash     String?       // Hash de la factura
  verifactuStatus   String        @default("pending") // pending, sent, verified, error
  verifactuSentAt   DateTime?
  verifactuError    String?       @db.Text

  // Firma electrónica
  signatureData     String?       @db.Text // Firma digital en base64
  signedAt          DateTime?

  // PDF generado
  pdfUrl            String?       // URL del PDF en Supabase Storage

  // Tipo de factura
  type              String        @default("standard") // standard, simplified, rectifying
  rectifiesInvoice  String?       // ID de factura rectificada (para facturas rectificativas)

  // Estado
  status            String        @default("draft") // draft, issued, sent, paid, cancelled
  issuedAt          DateTime?
  sentAt            DateTime?
  paidAt            DateTime?
  cancelledAt       DateTime?

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  items             InvoiceItem[]

  @@index([orderId])
  @@index([customerId])
  @@index([status])
  @@index([verifactuStatus])
  @@index([invoiceNumber])
}

// Líneas de factura
model InvoiceItem {
  id            String    @id @default(cuid())
  invoiceId     String
  invoice       Invoice   @relation(fields: [invoiceId], references: [id], onDelete: Cascade)

  description   String
  quantity      Int
  unitPrice     Decimal   @db.Decimal(10, 2)
  taxRate       Decimal   @db.Decimal(5, 2)
  subtotal      Decimal   @db.Decimal(10, 2)
  taxAmount     Decimal   @db.Decimal(10, 2)
  total         Decimal   @db.Decimal(10, 2)

  // Referencia al producto
  productId     String?
  productSku    String?

  @@index([invoiceId])
}

// Configuración de facturación
model InvoiceConfig {
  id                  String    @id @default(cuid())

  // Datos fiscales de la empresa
  companyName         String
  companyTaxId        String    // NIF
  companyAddress      String
  companyCity         String
  companyPostalCode   String
  companyProvince     String
  companyCountry      String    @default("España")
  companyEmail        String
  companyPhone        String?

  // Numeración
  invoicePrefix       String    @default("EVA")
  nextInvoiceNumber   Int       @default(1)
  currentYear         Int

  // Certificado digital para firma
  certificatePath     String?   // Ruta al certificado .p12
  certificatePassword String?   // Contraseña del certificado (encriptada)

  // API Verifactu
  verifactuApiKey     String?
  verifactuEndpoint   String?
  verifactuEnabled    Boolean   @default(false)

  // Opciones
  autoGenerateInvoice Boolean   @default(true)  // Generar factura al pagar pedido
  autoSendToVerifactu Boolean   @default(true)  // Enviar automáticamente a Verifactu
  defaultTaxRate      Decimal   @default(21)    @db.Decimal(5, 2)

  updatedAt           DateTime  @updatedAt
}
```

### Funcionalidades a Implementar

#### Panel de Administración
- [ ] Dashboard de facturación con estadísticas
- [ ] Lista de facturas con filtros (estado, fecha, cliente)
- [ ] Ver/descargar factura en PDF
- [ ] Generar factura manualmente desde pedido
- [ ] Facturas rectificativas (para devoluciones)
- [ ] Configuración de datos fiscales de la empresa
- [ ] Gestión de certificado digital
- [ ] Monitor de estado Verifactu (facturas pendientes/errores)

#### Generación de Facturas
- [ ] Generación automática al confirmar pago
- [ ] Numeración correlativa por año (EVA-2026-00001)
- [ ] Cálculo automático de IVA (21%, 10%, 4%, 0%)
- [ ] Soporte para múltiples tipos de IVA por línea
- [ ] Generación de PDF con formato legal
- [ ] Inclusión de código QR Verifactu

#### Integración Verifactu
- [ ] Conexión con API de la AEAT
- [ ] Firma electrónica de facturas (certificado digital)
- [ ] Envío automático a Verifactu
- [ ] Recepción de confirmación y código de verificación
- [ ] Gestión de errores y reintentos
- [ ] Log de comunicaciones con Verifactu

#### Cliente/Frontend
- [ ] Descarga de factura desde cuenta de usuario
- [ ] Envío de factura por email al cliente
- [ ] Solicitar factura con datos fiscales diferentes

### APIs Necesarias
```
/api/admin/invoices
├── GET     /               # Lista de facturas con filtros
├── POST    /               # Crear factura manualmente
├── GET     /[id]           # Detalle de factura
├── GET     /[id]/pdf       # Descargar PDF
├── POST    /[id]/send      # Reenviar a cliente
├── POST    /[id]/verifactu # Enviar/reenviar a Verifactu
└── POST    /[id]/rectify   # Crear factura rectificativa

/api/admin/invoices/config
├── GET     /               # Obtener configuración
└── PUT     /               # Actualizar configuración

/api/admin/invoices/stats
└── GET     /               # Estadísticas de facturación
```

### Dependencias Necesarias
- `@pdfme/generator` o `puppeteer`: Generación de PDFs
- `node-forge` o similar: Firma digital de facturas
- `qrcode`: Generación de códigos QR
- SDK de Verifactu (cuando esté disponible) o llamadas REST directas

### Notas Importantes
- La integración con Verifactu requiere certificado digital de la empresa
- Las facturas deben cumplir con el formato Facturae 3.2.2
- Es obligatorio conservar las facturas durante 4 años
- Las facturas simplificadas (tickets) también deben reportarse
- Penalizaciones por incumplimiento: hasta 10.000€ por factura no declarada

### Referencias
- [Web oficial Verifactu - AEAT](https://sede.agenciatributaria.gob.es)
- [Especificaciones técnicas Verifactu](https://sede.agenciatributaria.gob.es/Sede/verifactu.html)
- [Formato Facturae](https://www.facturae.gob.es/)
