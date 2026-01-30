# Plan de Trabajo - Funcionalidades Pendientes

## 🔴 Prioridad Alta (Funcionalidad Core)

### 1. ✅ Pedidos Reales en Panel de Cliente - COMPLETADO
- [x] Conectar `/cuenta/pedidos` con API `/api/customers/orders`
- [x] API segura con autenticación JWT (cookie de sesión)
- [x] Mostrar pedidos reales del cliente autenticado
- [x] Detalle de pedido con productos, estados, precios
- [ ] Filtros por estado (pendiente, pagado, enviado, entregado) - Mejora futura

### 2. Checkout con Stripe (Cuando tengas credenciales)
- [ ] Integrar Stripe Payment Intent en checkout
- [ ] Crear webhook `/api/webhooks/stripe` para confirmar pagos
- [ ] Actualizar estado de pedido automáticamente al pagar
- [ ] Manejar errores de pago y reintentos
- [ ] Emails automáticos post-pago

### 3. Editor de Plantillas de Email
- [ ] Editor WYSIWYG básico en admin
- [ ] Preview de plantillas con datos de ejemplo
- [ ] Gestión de placeholders disponibles

---

## 🟡 Prioridad Media (Funcionalidades Comerciales)

### 4. Sistema de Cupones y Descuentos
- [ ] API CRUD `/api/admin/coupons`
- [ ] Tipos: porcentaje, cantidad fija, envío gratis
- [ ] Validación en checkout (código, fecha, uso máximo)
- [ ] Aplicar descuento en carrito
- [ ] Panel admin para gestionar cupones

### 5. Sistema de Reseñas
- [ ] API `/api/products/[slug]/reviews` (GET, POST)
- [ ] Verificar que el cliente compró el producto
- [ ] Sistema de valoración 1-5 estrellas
- [ ] Moderación en admin (aprobar/rechazar)
- [ ] Mostrar reseñas en página de producto
- [ ] Media de valoraciones en ProductCard

### 6. Gestión de Marcas
- [ ] API CRUD `/api/admin/brands`
- [ ] Página pública `/marcas` y `/marcas/[slug]`
- [ ] Filtro por marca en búsqueda y categorías
- [ ] Logo de marca en productos

### 7. Notificaciones de Stock
- [ ] Formulario "Avísame cuando haya stock" en producto agotado
- [ ] API `/api/stock-notifications`
- [ ] Job/cron para enviar emails cuando hay stock
- [ ] Gestión en admin de notificaciones pendientes

---

## 🟠 Prioridad Media-Baja (Contenido y Legal)

### 8. Páginas Legales (Obligatorias RGPD)
- [ ] `/politica-privacidad` - Política de Privacidad
- [ ] `/terminos-condiciones` - Términos y Condiciones
- [ ] `/politica-cookies` - Política de Cookies + Banner
- [ ] `/devoluciones` - Política de Devoluciones
- [ ] Editor de páginas en admin

### 9. Página de Contacto
- [ ] Formulario de contacto funcional
- [ ] API `/api/contact` para enviar mensaje
- [ ] Email al admin con el mensaje
- [ ] Gestión de mensajes en admin
- [ ] Responder desde admin

### 10. FAQ (Preguntas Frecuentes)
- [ ] Página `/faq` con categorías y preguntas
- [ ] API para obtener FAQs públicas
- [ ] CRUD en admin para gestionar FAQs
- [ ] Buscador en página de FAQ

---

## 🔵 Prioridad Baja (Mejoras y Fidelización)

### 11. Sistema de Puntos de Fidelidad
- [ ] Acumular puntos por compras (1€ = 1 punto)
- [ ] Mostrar puntos en cuenta de cliente
- [ ] Canjear puntos por descuentos
- [ ] Historial de movimientos de puntos
- [ ] Niveles VIP con beneficios

### 12. Campañas de Email Marketing
- [ ] Crear campañas con editor
- [ ] Segmentación de audiencia (todos, VIP, inactivos)
- [ ] Programar envíos
- [ ] Estadísticas (aperturas, clicks)
- [ ] Gestión de suscriptores/bajas

### 13. Feature Flags
- [ ] Panel en admin para activar/desactivar features
- [ ] Usar flags en código para mostrar/ocultar funcionalidades
- [ ] Útil para lanzamientos graduales

---

## 🟣 Integraciones Externas

### 14. Gestión de Envíos
- [ ] Integración con transportistas (SEUR, MRW, Correos)
- [ ] Cálculo de costes de envío por peso/zona
- [ ] Generación de etiquetas
- [ ] Tracking automático
- [ ] Puntos de recogida

### 15. Optimización de Imágenes
- [ ] CDN para imágenes (Cloudinary o similar)
- [ ] Redimensionamiento automático
- [ ] Formatos modernos (WebP, AVIF)
- [ ] Lazy loading optimizado

### 16. Analytics y Monitoreo
- [ ] Google Analytics 4
- [ ] Eventos de ecommerce (add_to_cart, purchase)
- [ ] Monitoreo de errores (Sentry)
- [ ] Métricas de rendimiento

---

## 🚀 Deploy a Producción

### 17. Preparación para Deploy
- [ ] Variables de entorno en Vercel
- [ ] Configurar dominio personalizado
- [ ] SSL automático
- [ ] Configurar Supabase en producción
- [ ] Migrar base de datos

### 18. Testing
- [ ] Tests unitarios críticos
- [ ] Tests de integración de APIs
- [ ] Tests E2E del flujo de compra
- [ ] Pruebas de carga

---

## 📊 Resumen por Estado

| Prioridad | Cantidad | Estado |
|-----------|----------|--------|
| 🔴 Alta | 3 | Pendiente |
| 🟡 Media | 4 | Pendiente |
| 🟠 Media-Baja | 3 | Pendiente |
| 🔵 Baja | 3 | Pendiente |
| 🟣 Integraciones | 3 | Pendiente |
| 🚀 Deploy | 2 | Pendiente |

---

## 📝 Notas

- Los modelos de Prisma ya existen para la mayoría de funcionalidades
- Stripe requiere credenciales de test/producción
- Las páginas legales son obligatorias antes de lanzar
- El sistema de Verifactu (facturación AEAT) ya está implementado en backend

---

*Última actualización: 2026-01-30*
