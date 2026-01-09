# Documentación - Deportes y Juguetes Eva

Bienvenido a la documentación del proyecto. Aquí encontrarás toda la información necesaria para desarrollar, mantener y desplegar la tienda online.

## 📚 Índice de Documentos

### 🚀 Para Empezar
1. **[Inicio Rápido](../README.md)** - Vista general y comandos básicos
2. **[Guía de Instalación](INSTALL.md)** - Setup paso a paso desde cero

### 📊 Estado del Proyecto
3. **[Progreso Actual](PROGRESS.md)** - Qué está hecho y qué falta
4. **[Referencia Rápida](QUICK-REFERENCE.md)** - Comandos, URLs y tips útiles

### 🏗️ Arquitectura y Diseño
5. **[Arquitectura del Sistema](ARCHITECTURE.md)** - Flujos, modelos y diagramas
6. **[Especificaciones Originales](README-ORIGINAL.md)** - Requerimientos completos

---

## 🎯 ¿Qué Documento Necesito?

### "Quiero empezar a trabajar en el proyecto"
→ Lee [INSTALL.md](INSTALL.md) para configurar tu entorno

### "¿Cómo funciona el sistema de emails?"
→ Ve a [ARCHITECTURE.md](ARCHITECTURE.md) sección "Flujo de Emails"

### "Necesito probar las APIs"
→ Consulta [QUICK-REFERENCE.md](QUICK-REFERENCE.md) sección "Endpoints API"

### "¿Qué falta por hacer?"
→ Revisa [PROGRESS.md](PROGRESS.md) sección "Pendiente"

### "¿Cómo están estructurados los datos?"
→ Mira [ARCHITECTURE.md](ARCHITECTURE.md) sección "Modelos de Datos"

### "Necesito los comandos de Prisma"
→ Ve a [QUICK-REFERENCE.md](QUICK-REFERENCE.md) sección "Comandos Más Usados"

---

## 📋 Resumen Ejecutivo

**Estado actual:** Backend completado al 80%, Frontend por desarrollar

### ✅ Completado
- ✅ Base de datos (Prisma + Supabase)
- ✅ APIs REST (productos, categorías, checkout)
- ✅ Sistema de emails (Resend + plantillas)
- ✅ 20+ productos mock en 13 categorías
- ✅ Documentación completa

### 🚧 En Desarrollo
- Frontend Astro (páginas públicas)
- Panel Admin Next.js (gestión completa)
- Autenticación Supabase
- Integración Stripe real

### 📅 Próximamente
- Subida de imágenes a Supabase Storage
- Tests automatizados
- Deploy a producción (Vercel)

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología | Estado |
|------------|------------|--------|
| Frontend | Astro + Tailwind | 🚧 Pendiente |
| Backend | Next.js 15 | ✅ Funcional |
| Base de datos | PostgreSQL (Supabase) | ✅ Configurada |
| ORM | Prisma | ✅ Configurado |
| Emails | Resend | ✅ Integrado |
| Pagos | Stripe | 🚧 Parcial |
| Auth | Supabase Auth | 🚧 Pendiente |
| Storage | Supabase Storage | 🚧 Pendiente |

---

## 🎨 Guías de Estilo

### Paleta de Colores
- **Amarillo Neón**: `#CCFF00` → CTAs, hover, acentos
- **Negro**: `#000000` → Fondos, header, footer
- **Blanco**: `#FFFFFF` → Fondos claros
- **Grises**: 50-900 → Textos secundarios

### Tipografía
- **Font**: Inter (sistema por defecto)
- **Títulos**: Bold, escala de 2xl a 6xl
- **Cuerpo**: Regular, base (16px)

### Componentes
Ver [globals.css](../backend/src/app/globals.css) para clases Tailwind personalizadas.

---

## 🔍 Buscar Información

### Por Palabra Clave

- **APIs** → [QUICK-REFERENCE.md](QUICK-REFERENCE.md) + [ARCHITECTURE.md](ARCHITECTURE.md)
- **Emails** → [ARCHITECTURE.md](ARCHITECTURE.md) sección "Flujo de Emails"
- **Prisma** → [ARCHITECTURE.md](ARCHITECTURE.md) + [QUICK-REFERENCE.md](QUICK-REFERENCE.md)
- **Supabase** → [INSTALL.md](INSTALL.md) paso 2
- **Categorías** → [PROGRESS.md](PROGRESS.md) + [README-ORIGINAL.md](README-ORIGINAL.md)
- **Métodos de pago** → [ARCHITECTURE.md](ARCHITECTURE.md) modelo `PaymentMethodConfig`
- **Deploy** → [README-ORIGINAL.md](README-ORIGINAL.md) sección "Deploy"

### Por Tipo de Tarea

| Tarea | Documento |
|-------|-----------|
| Instalar proyecto | [INSTALL.md](INSTALL.md) |
| Entender arquitectura | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Comandos rápidos | [QUICK-REFERENCE.md](QUICK-REFERENCE.md) |
| Ver progreso | [PROGRESS.md](PROGRESS.md) |
| Leer specs originales | [README-ORIGINAL.md](README-ORIGINAL.md) |

---

## 📞 Recursos Externos

- [Documentación Prisma](https://www.prisma.io/docs)
- [Documentación Next.js](https://nextjs.org/docs)
- [Documentación Astro](https://docs.astro.build)
- [Documentación Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación Supabase](https://supabase.com/docs)
- [Documentación Resend](https://resend.com/docs)
- [Documentación Stripe](https://stripe.com/docs)

---

## 📝 Contribuir a la Documentación

Si encuentras algo incorrecto o desactualizado:

1. Edita el archivo correspondiente
2. Asegúrate de actualizar los enlaces relacionados
3. Mantén el formato consistente (Markdown)
4. Commit con mensaje descriptivo: `docs: actualizar X en Y.md`

---

## 🎯 Roadmap de Documentación

- [x] Guía de instalación completa
- [x] Arquitectura del sistema
- [x] Referencia rápida
- [x] Estado del proyecto
- [ ] Guía de desarrollo frontend
- [ ] Guía de desarrollo admin
- [ ] Guía de deploy
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Guía de testing

---

**Última actualización:** 2026-01-09
