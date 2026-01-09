# Referencia Rápida - Deportes y Juguetes Eva

## 📂 Navegación de Documentos

| Documento | Descripción |
|-----------|-------------|
| [README.md](../README.md) | Inicio rápido y overview |
| [INSTALL.md](INSTALL.md) | Guía de instalación paso a paso |
| [PROGRESS.md](PROGRESS.md) | Estado actual del proyecto |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Arquitectura técnica completa |
| [README-ORIGINAL.md](README-ORIGINAL.md) | Especificaciones originales |

---

## 🚀 Comandos Más Usados

```bash
# Iniciar desarrollo
cd backend && npm run dev          # Backend en :3000
cd frontend && npm run dev         # Frontend en :4321 (cuando esté creado)

# Base de datos
cd backend
npx prisma studio                  # UI visual de DB
npx prisma migrate dev             # Crear migración
npx prisma db seed                 # Poblar datos
npx prisma generate                # Regenerar cliente

# Testing APIs
curl http://localhost:3000/api/products
curl http://localhost:3000/api/categories
curl http://localhost:3000/api/products/nike-pegasus-40

# Git
git add .
git commit -m "feat: descripción"
git push
```

---

## 🔑 URLs Importantes

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| **Backend Local** | http://localhost:3000 | - |
| **Frontend Local** | http://localhost:4321 | - |
| **Prisma Studio** | http://localhost:5555 | `npx prisma studio` |
| **Supabase Dashboard** | https://supabase.com/dashboard | Login con tu cuenta |
| **Resend Dashboard** | https://resend.com/emails | Login con tu cuenta |
| **Stripe Dashboard** | https://dashboard.stripe.com/test | Login con tu cuenta |

---

## 📊 Modelos de Datos Principales

### Category
```typescript
{
  id: string
  name: string              // "Running"
  slug: string              // "running"
  parentId?: string         // Para jerarquía
  menuSection?: string      // 'deportes' | 'juguetes' | 'hobbies'
}
```

### Product
```typescript
{
  id: string
  name: string              // "Nike Pegasus 40"
  slug: string              // "nike-pegasus-40"
  price: number             // 129.99
  stock: number             // 25
  images: string[]          // URLs de Supabase
  categoryId: string
  sportType?: SportType
  isCollectible: boolean
  isFeatured: boolean
}
```

### Order
```typescript
{
  id: string
  orderNumber: string       // "EVA-20260109-0001"
  userEmail: string
  userName: string
  status: OrderStatus       // PENDING | PAID | SHIPPED | CANCELLED
  paymentMethod: PaymentMethod
  items: OrderItem[]
  total: number
  emailSentConfirmed: boolean
}
```

---

## 🎨 Clases Tailwind Personalizadas

```html
<!-- Colores -->
<div class="bg-eva-yellow">      Amarillo neón #CCFF00
<div class="bg-eva-black">       Negro #000000
<div class="text-eva-gray-700">  Gris oscuro

<!-- Botones -->
<button class="btn btn-primary">    Amarillo con negro
<button class="btn btn-secondary">  Negro con blanco
<button class="btn btn-outline">    Outline negro
<button class="btn btn-sm">         Pequeño
<button class="btn btn-lg">         Grande

<!-- Cards -->
<div class="card">                  Card básico
<div class="card card-hover">       Card con hover effect

<!-- Badges -->
<span class="badge badge-success">  Verde (pagado)
<span class="badge badge-warning">  Amarillo (pendiente)
<span class="badge badge-danger">   Rojo (cancelado)

<!-- Admin -->
<div class="admin-card">            Card para panel admin
<table class="admin-table">         Tabla con estilos admin
```

---

## 🔌 Endpoints API

### Productos
```
GET  /api/products
     ?category=running
     &featured=true
     &minPrice=50&maxPrice=200
     &search=nike
     &limit=20&offset=0

GET  /api/products/[slug]
     → Detalle + productos relacionados
```

### Categorías
```
GET  /api/categories
     → Todas las categorías agrupadas por menuSection
```

### Checkout
```
POST /api/checkout
Body: {
  userEmail: string
  userName: string
  userPhone: string
  shippingAddress: string
  shippingCity: string
  shippingPostalCode: string
  items: [{ productId, quantity }]
  paymentMethod: 'STRIPE' | 'TRANSFER' | 'CASH'
}
→ Crea pedido, reduce stock, envía emails
```

### Admin (próximamente)
```
GET    /api/admin/orders          → Lista pedidos
GET    /api/admin/orders/[id]     → Detalle pedido
PATCH  /api/admin/orders/[id]     → Actualizar estado
POST   /api/admin/products        → Crear producto
PUT    /api/admin/products/[id]   → Actualizar producto
DELETE /api/admin/products/[id]   → Eliminar producto
```

---

## 📧 Placeholders de Email

Usa estos en las plantillas de email:

```
{order_number}        → EVA-20260109-0001
{order_id}            → clxxxxxxxxxx
{user_name}           → José García
{user_email}          → cliente@ejemplo.com
{products}            → Lista HTML de productos
{subtotal}            → 125.98€
{shipping_cost}       → 4.99€
{total}               → 130.97€
{address}             → Dirección completa formateada
{tracking_number}     → XYZ123456789
{cancellation_reason} → Motivo de cancelación
{admin_link}          → Link al pedido en admin
```

---

## 🔒 Variables de Entorno (.env)

### Obligatorias
```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
RESEND_API_KEY="re_..."
```

### Opcionales
```env
STRIPE_SECRET_KEY="sk_test_..."
SUPABASE_SERVICE_ROLE_KEY="..."
ADMIN_EMAIL="admin@eva.com"
NEXT_PUBLIC_URL="http://localhost:3000"
```

Ver [backend/.env.example](../backend/.env.example) para la lista completa.

---

## 🐛 Troubleshooting Común

### "Can't reach database server"
```bash
# Verifica DATABASE_URL en .env
# Asegúrate de que Supabase esté activo
cd backend && npx prisma studio
```

### "Resend API key not found"
```bash
# Verifica RESEND_API_KEY en .env
# Debe empezar con 're_'
echo $RESEND_API_KEY
```

### Puerto ocupado
```bash
# Cambiar puerto en package.json
"dev": "next dev -p 3001"  # en lugar de 3000
```

### Prisma Client desincronizado
```bash
cd backend
npx prisma generate
npm run dev
```

### Reset completo de DB
```bash
cd backend
npx prisma migrate reset   # ⚠️ Elimina todos los datos
npx prisma db seed
```

---

## 📝 Convenciones de Código

### Nombres de archivos
- Componentes: `PascalCase.tsx` o `kebab-case.astro`
- Utils/libs: `camelCase.ts`
- API routes: `route.ts` o `[param]/route.ts`

### Commits
```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato, punto y coma, etc.
refactor: refactorización
test: tests
chore: actualizar dependencias
```

### Comentarios
```typescript
// ============ SECCIÓN ============
// Comentario simple
/**
 * Comentario JSDoc
 * @param param Descripción
 * @returns Descripción
 */
```

---

## 🎯 Próximos Pasos Sugeridos

1. ✅ **Setup inicial** → Completado
2. ⏳ **Crear frontend Astro** → En progreso
3. ⏳ **Panel admin Next.js**
4. ⏳ **Integración Stripe real**
5. ⏳ **Subida de imágenes**
6. ⏳ **Tests**
7. ⏳ **Deploy a producción**

Ver [PROGRESS.md](PROGRESS.md) para detalles.

---

## 📞 Recursos Útiles

- [Documentación Prisma](https://www.prisma.io/docs)
- [Documentación Next.js 15](https://nextjs.org/docs)
- [Documentación Astro](https://docs.astro.build)
- [Documentación Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación Supabase](https://supabase.com/docs)
- [Documentación Resend](https://resend.com/docs)
- [Documentación Stripe](https://stripe.com/docs)

---

## 🔍 Buscar en el Código

```bash
# Buscar en todo el proyecto
grep -r "textoBuscado" backend/src

# Buscar solo en tipos TypeScript
find backend/src -name "*.ts" -exec grep -l "Product" {} \;

# Ver estructura de carpetas
tree backend/src -L 3
```

---

## 💡 Tips

1. **Prisma Studio** es tu amigo para ver/editar datos visualmente
2. **Usa Thunder Client o Postman** para probar APIs
3. **Lee ARCHITECTURE.md** para entender el flujo completo
4. **Backup regular**: exporta DB desde Prisma Studio
5. **Test en modo Stripe test** antes de ir a producción
