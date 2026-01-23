# Auditoría de Seguridad - Deportes y Juguetes Eva

## Resumen Ejecutivo

**Fecha de Auditoría:** Enero 2026
**Estado General:** REQUIERE ATENCIÓN INMEDIATA
**Vulnerabilidades Críticas:** 12
**Vulnerabilidades Altas:** 18
**Vulnerabilidades Medias:** 8

---

## Índice de Hallazgos

1. [Dependencias y Versiones](#1-dependencias-y-versiones)
2. [Autenticación y Sesiones](#2-autenticación-y-sesiones)
3. [Secretos y Variables de Entorno](#3-secretos-y-variables-de-entorno)
4. [Inyección SQL y XSS](#4-inyección-sql-y-xss)
5. [Rate Limiting y DoS](#5-rate-limiting-y-dos)
6. [Plan de Remediación por Sprints](#6-plan-de-remediación)

---

## 1. Dependencias y Versiones

### Backend (1 vulnerabilidad)

| Severidad | Paquete | Versión | CVE/GHSA | Descripción |
|-----------|---------|---------|----------|-------------|
| Moderada | lodash | 4.0.0-4.17.21 | GHSA-xxjr-mmjv-4gpg | Prototype Pollution en `_.unset` y `_.omit` |

### Frontend (11 vulnerabilidades)

| Severidad | Paquete | Versión | CVE/GHSA | Descripción |
|-----------|---------|---------|----------|-------------|
| **ALTA** | astro | ≤5.15.8 | GHSA-5ff5-9fcw-vg88 | X-Forwarded-Host reflected sin validación |
| **ALTA** | astro | ≤5.15.8 | GHSA-hr2q-hp5q-x767 | URL manipulation, middleware bypass |
| **ALTA** | astro | ≤5.15.8 | GHSA-wrwg-2hg8-v723 | Reflected XSS via server islands |
| **ALTA** | astro | ≤5.15.8 | GHSA-x3h8-62x9-952g | Dev Server Arbitrary File Read |
| **ALTA** | astro | ≤5.15.8 | GHSA-fvmw-cj7j-j39q | Stored XSS en /_image endpoint |
| **ALTA** | astro | ≤5.15.8 | GHSA-ggxq-hp9w-j794 | Middleware auth bypass via URL encoding |
| **ALTA** | astro | ≤5.15.8 | GHSA-whqg-ppgf-wp8c | Auth Bypass via Double URL Encoding |
| **ALTA** | devalue | 5.1.0-5.6.1 | GHSA-g2pg-6438-jwpf | DoS via memory exhaustion |
| **ALTA** | devalue | 5.1.0-5.6.1 | GHSA-vw5p-8cq8-m7mv | DoS via memory exhaustion |
| Moderada | @astrojs/node | ≤9.4.0 | GHSA-9x9c-ghc5-jhw9 | Open redirect |
| Moderada | @astrojs/node | ≤9.4.0 | GHSA-xf8x-j4p2-f749 | Unauthorized images |

### Dependencias Legacy

| Paquete | Versión | Última Actualización | Recomendación |
|---------|---------|---------------------|---------------|
| soap | 1.6.3 | 2021 | Considerar alternativa moderna |
| xml2js | 0.6.2 | 2023 | Monitorear |

---

## 2. Autenticación y Sesiones

### Vulnerabilidades Críticas

| ID | Descripción | Ubicación | Impacto |
|----|-------------|-----------|---------|
| AUTH-01 | Datos de sesión cliente en localStorage | `frontend/src/lib/auth.ts:34-41` | XSS puede robar sesión |
| AUTH-02 | Sin flags de seguridad en cookies Supabase | `backend/src/lib/supabase-server.ts` | Session hijacking |
| AUTH-03 | Sin protección CSRF | Todos los endpoints POST | Ataques CSRF |
| AUTH-04 | Sin rate limiting en login | `api/customers/auth/login` | Brute force |
| AUTH-05 | Hash almacenado en campo `notes` | `api/customers/auth/login:53` | Exposición de credenciales |

### Vulnerabilidades Altas

| ID | Descripción | Ubicación | Impacto |
|----|-------------|-----------|---------|
| AUTH-06 | Salt rounds bajo (10 vs 12+) | `bcrypt.hash(password, 10)` | Hashes más fáciles de romper |
| AUTH-07 | Sin validación de complejidad de contraseña | `api/customers/auth/register` | Contraseñas débiles |
| AUTH-08 | Sin expiración de sesión cliente | `frontend/src/lib/auth.ts` | Sesiones eternas |
| AUTH-09 | Logout solo cliente, no servidor | `frontend/src/lib/auth.ts:46-53` | Token válido post-logout |
| AUTH-10 | Sin verificación de email | `api/customers/auth/register` | Cuentas falsas |
| AUTH-11 | Sin auditoría de intentos de login | Todo el sistema | Sin detección de ataques |

---

## 3. Secretos y Variables de Entorno

### Estado de .gitignore
✅ Archivos `.env` correctamente excluidos

### Credenciales Expuestas (CRÍTICO)

| Ubicación | Secreto | Acción Requerida |
|-----------|---------|------------------|
| `backend/.env` | Database password | **ROTAR INMEDIATAMENTE** |
| `backend/.env` | Supabase Anon Key | **ROTAR INMEDIATAMENTE** |
| `backend/.env` | Supabase Service Role Key | **ROTAR INMEDIATAMENTE** |
| `backend/.next/` | Credenciales en build | Limpiar y reconstruir |

### Código Hardcodeado

| Archivo | Línea | Problema |
|---------|-------|----------|
| `scripts/create-test-customer.ts` | 13 | Contraseña hardcodeada: `demo1234` |
| `scripts/create-test-customer.ts` | 52 | Contraseña impresa en logs |
| `api/pos/verifactu/config` | - | Contraseña certificado en BD sin cifrar |

---

## 4. Inyección SQL y XSS

### Estado General
✅ **SQL Injection:** SEGURO - Uso consistente de Prisma ORM
✅ **XSS:** SEGURO - No hay `dangerouslySetInnerHTML` ni `eval()`

### Vulnerabilidades de Validación

| Severidad | Endpoint | Problema | Archivo |
|-----------|----------|----------|---------|
| **CRÍTICA** | PATCH `/api/reviews/[id]` | Mass Assignment sin Zod | `reviews/[id]/route.ts:48-80` |
| **MEDIA** | POST `/api/reviews` | Validación manual sin Zod | `reviews/route.ts:112-124` |
| **MEDIA** | PUT `/api/admin/orders/[id]` | Sin validación de tipos | `orders/[id]/route.ts:95-103` |

### Endpoints Seguros (con Zod)
- ✅ `/api/admin/products`
- ✅ `/api/admin/products/[id]`
- ✅ `/api/checkout`
- ✅ `/api/admin/pages/[id]/blocks/[blockId]`
- ✅ `/api/admin/campaigns/[id]`
- ✅ `/api/admin/customers/[id]`
- ✅ `/api/admin/categories/[id]`

---

## 5. Rate Limiting y DoS

### Estado: NO IMPLEMENTADO

| Componente | Estado | Riesgo |
|------------|--------|--------|
| Rate Limiting Middleware | ❌ Ausente | DoS, Brute Force |
| Brute Force Protection | ❌ Ausente | Ataques de diccionario |
| Payload Size Limits | ⚠️ Parcial | DoS por archivos grandes |
| Request Timeouts | ❌ Ausente | Slowloris attacks |
| Security Headers | ❌ Ausente | Clickjacking, XSS |

### Configuración CORS (CRÍTICA)

```typescript
// ACTUAL - INSEGURO
{
  'Access-Control-Allow-Origin': '*',           // ❌ Permite CUALQUIER origen
  'Access-Control-Allow-Credentials': 'true',   // ❌ Combinación inválida con *
}
```

### Headers de Seguridad Faltantes

| Header | Protege Contra |
|--------|----------------|
| `X-Frame-Options` | Clickjacking |
| `X-Content-Type-Options` | MIME-sniffing |
| `Content-Security-Policy` | XSS |
| `Strict-Transport-Security` | Downgrade attacks |
| `X-XSS-Protection` | XSS (legacy browsers) |
| `Referrer-Policy` | Information leakage |

### Endpoints Críticos Sin Protección

1. `POST /api/customers/auth/login` - Brute force
2. `POST /api/customers/auth/register` - Spam masivo
3. `POST /api/checkout` - Procesamiento pagos
4. `POST /api/subscribe` - Spam newsletter
5. `POST /api/admin/campaigns/[id]/send` - Envío emails masivo
6. `POST /api/admin/upload` - Carga archivos

---

## 6. Plan de Remediación

### Sprint 1: Dependencias (Crítico) - Estimado: 1-2 horas

| Tarea | Prioridad | Archivo |
|-------|-----------|---------|
| Actualizar Astro a ≥5.16 | P0 | `frontend/package.json` |
| Actualizar @astrojs/node | P0 | `frontend/package.json` |
| Resolver lodash prototype pollution | P1 | `backend/package.json` |
| Ejecutar npm audit fix | P1 | Ambos |

### Sprint 2: Autenticación (Crítico) - Estimado: 4-6 horas

| Tarea | Prioridad | Archivo |
|-------|-----------|---------|
| Migrar localStorage a httpOnly cookies | P0 | `frontend/src/lib/auth.ts` |
| Configurar cookies seguras en Supabase | P0 | `backend/src/lib/supabase-*.ts` |
| Implementar CSRF tokens | P0 | `backend/src/middleware.ts` |
| Aumentar bcrypt salt rounds a 12 | P1 | APIs de auth |
| Agregar validación de contraseña | P1 | `api/customers/auth/register` |
| Implementar expiración de sesión | P1 | `frontend/src/lib/auth.ts` |
| Crear endpoint logout servidor | P2 | Nueva API |
| Agregar verificación de email | P2 | `api/customers/auth/register` |

### Sprint 3: Secretos (Crítico) - Estimado: 1-2 horas

| Tarea | Prioridad | Archivo |
|-------|-----------|---------|
| Rotar credenciales Supabase | P0 | Supabase Dashboard |
| Rotar contraseña de BD | P0 | Supabase Dashboard |
| Limpiar carpeta .next | P0 | `backend/.next/` |
| Eliminar logs de contraseñas | P1 | `scripts/create-test-customer.ts` |
| Cifrar contraseña certificado en BD | P2 | `api/pos/verifactu/config` |

### Sprint 4: Validación (Alto) - Estimado: 2-3 horas

| Tarea | Prioridad | Archivo |
|-------|-----------|---------|
| Agregar Zod a PATCH `/api/reviews/[id]` | P0 | `reviews/[id]/route.ts` |
| Agregar Zod a POST `/api/reviews` | P1 | `reviews/route.ts` |
| Agregar Zod a PUT `/api/admin/orders/[id]` | P1 | `orders/[id]/route.ts` |
| Establecer límites de tamaño en strings | P2 | Todos los endpoints |

### Sprint 5: Rate Limiting y Headers (Alto) - Estimado: 3-4 horas

| Tarea | Prioridad | Archivo |
|-------|-----------|---------|
| Corregir configuración CORS | P0 | `backend/next.config.ts` |
| Agregar security headers | P0 | `backend/next.config.ts` |
| Implementar rate limiting middleware | P1 | `backend/src/middleware.ts` |
| Rate limit en login (5 intentos/15min) | P1 | `api/customers/auth/login` |
| Rate limit en register (3/hora) | P1 | `api/customers/auth/register` |
| Rate limit en checkout (10/min) | P2 | `api/checkout` |
| Configurar timeouts | P2 | `backend/next.config.ts` |

---

## Checklist de Verificación Post-Remediación

### Sprint 1
- [ ] `npm audit` sin vulnerabilidades HIGH
- [ ] Astro versión ≥5.16
- [ ] Build exitoso sin warnings de seguridad

### Sprint 2
- [ ] Sesión NO en localStorage
- [ ] Cookies con httpOnly, Secure, SameSite
- [ ] Login falla después de 5 intentos
- [ ] Contraseña requiere mínimo 8 caracteres, mayúscula, número

### Sprint 3
- [ ] Credenciales antiguas invalidadas
- [ ] Nuevas credenciales funcionando
- [ ] Sin secretos en código fuente
- [ ] `.next/` limpio y reconstruido

### Sprint 4
- [ ] Todos los POST/PATCH/PUT con validación Zod
- [ ] Tests de inyección fallan correctamente
- [ ] Límites de tamaño funcionando

### Sprint 5
- [ ] CORS solo permite dominios específicos
- [ ] Headers de seguridad presentes (verificar con securityheaders.com)
- [ ] Rate limiting funcionando (verificar con pruebas manuales)
- [ ] Login bloqueado después de intentos excesivos

---

## Herramientas de Verificación

```bash
# Verificar dependencias
npm audit

# Verificar headers de seguridad
curl -I https://tudominio.com

# Test de rate limiting
for i in {1..10}; do curl -X POST https://tudominio.com/api/customers/auth/login; done

# Verificar CORS
curl -H "Origin: https://malicioso.com" -I https://tudominio.com/api/products
```

---

**Documento generado automáticamente por auditoría de seguridad**
**Próxima revisión recomendada:** 3 meses
