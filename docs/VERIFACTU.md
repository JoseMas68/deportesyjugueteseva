# Módulo Verifactu - Sistema de Facturación Electrónica

## Índice

1. [Introducción](#introducción)
2. [Marco Legal](#marco-legal)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Funcionalidades](#funcionalidades)
5. [Configuración](#configuración)
6. [Flujo de Operación](#flujo-de-operación)
7. [Tipos de Factura](#tipos-de-factura)
8. [Seguridad y Certificados](#seguridad-y-certificados)
9. [API Reference](#api-reference)
10. [Cumplimiento Normativo](#cumplimiento-normativo)

---

## Introducción

El módulo Verifactu implementa el sistema de facturación electrónica requerido por la Agencia Estatal de Administración Tributaria (AEAT) de España. Este sistema garantiza la integridad y trazabilidad de todas las facturas emitidas mediante:

- **Encadenamiento de hashes SHA-256**: Cada factura incluye el hash de la anterior, creando una cadena inmutable.
- **Códigos QR de verificación**: Permiten validar cualquier factura en la web de la AEAT.
- **Comunicación en tiempo real**: Envío automático o manual de registros a Hacienda.

---

## Marco Legal

### Normativa Aplicable

| Norma | Descripción |
|-------|-------------|
| **Ley 11/2021** | Ley de medidas de prevención y lucha contra el fraude fiscal |
| **Real Decreto 1007/2023** | Reglamento de requisitos de los sistemas informáticos de facturación |
| **Orden HFP/1398/2023** | Especificaciones técnicas del sistema Verifactu |

### Plazos de Obligatoriedad

| Tipo de Contribuyente | Fecha Límite |
|----------------------|--------------|
| Empresas (sociedades) | **1 de enero de 2027** |
| Autónomos y profesionales | **1 de julio de 2027** |

### Sanciones por Incumplimiento

- **Multa por software no certificado**: Hasta 50.000€
- **Multa por registro incorrecto**: Hasta 10.000€ por factura
- **Responsabilidad del desarrollador**: El proveedor del software puede ser sancionado

---

## Arquitectura del Sistema

### Estructura de Archivos

```
backend/src/
├── lib/verifactu/
│   ├── index.ts          # Servicio principal (orquestador)
│   ├── types.ts          # Interfaces y constantes
│   ├── hash.ts           # Generación de hash SHA-256
│   ├── xml.ts            # Generación de XML SOAP
│   ├── qr.ts             # Generación de códigos QR
│   ├── certificate.ts    # Manejo de certificados digitales
│   └── soap-client.ts    # Cliente HTTPS para AEAT
├── app/
│   ├── api/pos/verifactu/
│   │   ├── route.ts      # CRUD de registros
│   │   ├── config/route.ts   # Configuración
│   │   └── [id]/route.ts     # Detalle y acciones
│   └── admin/verifactu/
│       └── page.tsx      # Interfaz de administración
└── prisma/
    └── schema.prisma     # Modelo VerifactuRecord
```

### Modelo de Datos

```prisma
model VerifactuRecord {
  id                String   @id
  invoiceNumber     String   @unique    // Número único de factura
  invoiceDate       DateTime            // Fecha de expedición
  invoiceType       VerifactuInvoiceType // F1, F2, R1-R5

  // Emisor
  issuerNif         String              // NIF del emisor
  issuerName        String              // Razón social

  // Receptor (opcional para simplificadas)
  recipientNif      String?
  recipientName     String?

  // Importes
  baseAmount        Decimal             // Base imponible
  taxRate           Decimal             // Tipo de IVA
  taxAmount         Decimal             // Cuota de IVA
  totalAmount       Decimal             // Total factura

  // Encadenamiento (requisito legal)
  previousHash      String?             // Hash de la factura anterior
  currentHash       String              // Hash de esta factura
  hashInput         String              // Datos usados para el hash

  // Verificación
  qrContent         String              // URL de verificación AEAT

  // Estado de comunicación
  status            VerifactuStatus     // PENDING, SUBMITTED, ACCEPTED, REJECTED, CANCELLED
  aeatResponse      Json?               // Respuesta completa de AEAT
  aeatErrorCode     String?             // Código de error si rechazada
  aeatErrorMessage  String?             // Mensaje de error
  submittedAt       DateTime?           // Fecha de envío

  // XML generado
  xmlContent        String              // Documento SOAP completo

  // Relaciones
  saleId            String?             // Venta TPV asociada
  originalInvoiceId String?             // Para rectificativas
}
```

---

## Funcionalidades

### Panel de Administración

El módulo se gestiona desde `/admin/verifactu` con las siguientes secciones:

#### 1. Toggle de Activación
- Permite activar/desactivar el módulo
- Cuando está desactivado, muestra información sobre Verifactu
- Al activar, despliega automáticamente la configuración

#### 2. Configuración de Entorno
- **Test**: Envía a servidores de prueba de AEAT (no tiene efectos legales)
- **Producción**: Envía a servidores reales (registros válidos fiscalmente)

#### 3. Datos Fiscales
- NIF/CIF de la empresa
- Razón social
- Dirección completa (calle, CP, ciudad, provincia, país)

#### 4. Certificado Digital
- Subida de certificado .pfx o .p12
- Validación automática de fechas y formato
- Visualización de titular y periodo de validez
- Alertas de caducidad próxima

#### 5. Opciones
- **Envío automático**: Si se activa, cada venta se envía inmediatamente a AEAT
- **IVA por defecto**: 21%, 10%, 4% o 0%

#### 6. Test de Conexión
- Verifica que el certificado es válido
- Comprueba conectividad con servidores AEAT

### Gestión de Registros

#### Estadísticas en Tiempo Real
- Pendientes de envío
- Enviados (esperando respuesta)
- Aceptados por AEAT
- Rechazados por AEAT
- Anulados

#### Tabla de Registros
- Listado paginado con filtros por estado
- Columnas: número factura, fecha, tipo, importe, estado
- Click para ver detalle completo

#### Panel de Detalle
- Imagen QR para verificación
- Desglose de importes
- Hash de la factura (últimos 8 caracteres visibles)
- Errores de AEAT si los hay
- Enlace a venta TPV asociada
- XML completo (expandible)

#### Acciones Disponibles
- **Enviar a AEAT**: Para registros pendientes
- **Reintentar**: Para registros rechazados
- **Anular**: Para registros aceptados (requiere motivo)

---

## Configuración

### Variables de Configuración

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `verifactu_enabled` | boolean | Activa/desactiva el módulo |
| `verifactu_environment` | 'test' \| 'production' | Entorno de AEAT |
| `verifactu_auto_submit` | boolean | Envío automático al crear venta |
| `verifactu_default_tax_rate` | number | IVA por defecto (21, 10, 4, 0) |
| `verifactu_certificate_path` | string | Ruta al certificado .pfx |
| `verifactu_certificate_password` | string | Contraseña del certificado |
| `company_nif` | string | NIF/CIF de la empresa |
| `company_legal_name` | string | Razón social |
| `company_address` | string | Dirección fiscal |
| `company_postal_code` | string | Código postal |
| `company_city` | string | Localidad |
| `company_province` | string | Provincia |
| `company_country` | string | País (código ISO: ES) |

### Requisitos Previos

1. **Certificado Digital**: Obtener en [sede.fnmt.gob.es](https://www.sede.fnmt.gob.es/certificados)
2. **Datos Fiscales**: Tener NIF y datos de la empresa correctos
3. **Conexión a Internet**: Necesaria para comunicación con AEAT

---

## Flujo de Operación

### Creación de Registro

```
┌─────────────────┐
│  Venta en TPV   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Calcular Base   │
│ + IVA + Total   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Obtener Hash    │
│ Anterior        │◄── Encadenamiento
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generar Hash    │
│ SHA-256         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generar QR      │
│ Verificación    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generar XML     │
│ SOAP            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Guardar en BD   │
│ Status: PENDING │
└────────┬────────┘
         │
         ▼ (si auto_submit)
┌─────────────────┐
│ Enviar a AEAT   │
└─────────────────┘
```

### Encadenamiento de Hashes

El hash de cada factura se calcula con los siguientes datos:

```
NIF=12345678A
&NumSerieFactura=TPV-2024-000001
&FechaExpedicionFactura=2024-01-15
&TipoFactura=F2
&CuotaTotal=21.00
&ImporteTotal=121.00
&Huella=ABC123...   ← Hash de la factura anterior
&FechaHoraHusoGenRegistro=2024-01-15T10:30:00+01:00
```

Esto crea una **cadena inmutable**: modificar una factura invalidaría todas las posteriores.

### Comunicación con AEAT

```
┌─────────────┐        HTTPS + Cert Cliente        ┌─────────────┐
│   Sistema   │ ─────────────────────────────────► │    AEAT     │
│  Verifactu  │ ◄───────────────────────────────── │  Servidores │
└─────────────┘        Respuesta SOAP              └─────────────┘
```

**Endpoints AEAT:**
- Test: `https://www7.aeat.es/wlpl/TIKE-CONT/ws/SuministroInformacion`
- Producción: `https://www1.agenciatributaria.gob.es/wlpl/TIKE-CONT/ws/SuministroInformacion`

---

## Tipos de Factura

### Facturas Ordinarias

| Tipo | Nombre | Uso |
|------|--------|-----|
| **F1** | Factura completa | Con todos los datos del cliente |
| **F2** | Factura simplificada | Tickets sin datos del cliente (TPV) |

### Facturas Rectificativas

| Tipo | Nombre | Uso |
|------|--------|-----|
| **R1** | Rectificativa por error en derecho | Error en descripción o concepto |
| **R2** | Rectificativa por error en importe | Error en cantidades o precios |
| **R3** | Rectificativa por devolución | Devoluciones de productos |
| **R4** | Rectificativa por otros motivos | Casos no contemplados |
| **R5** | Rectificativa simplificada | Rectificativa de ticket (F2) |

### Uso en el Sistema

El TPV genera automáticamente facturas **F2** (simplificadas). Para facturas completas (F1) o rectificativas, se debe usar la interfaz de administración.

---

## Seguridad y Certificados

### Certificado Digital

El sistema requiere un **certificado digital cualificado** para la autenticación mutua TLS con AEAT.

#### Tipos Aceptados
- Certificado de persona jurídica (empresa)
- Certificado de representante
- Certificado de persona física (autónomos)

#### Obtención
1. Acceder a [sede.fnmt.gob.es](https://www.sede.fnmt.gob.es/certificados)
2. Solicitar certificado según tipo de contribuyente
3. Acudir a oficina de registro para verificación de identidad
4. Descargar certificado en formato .pfx o .p12

#### Almacenamiento en el Sistema
- El certificado se guarda en el servidor en `/certs/`
- La contraseña se almacena en la base de datos
- Nunca se expone al cliente (navegador)

### Validaciones de Seguridad

- **NIF**: Validación de formato (persona física, NIE, CIF)
- **XML**: Validación de estructura antes de envío
- **Certificado**: Verificación de fechas de validez
- **Autenticación**: Solo usuarios admin pueden acceder
- **HTTPS**: Toda comunicación con AEAT es cifrada

---

## API Reference

### GET /api/pos/verifactu
Lista registros con paginación.

**Parámetros:**
- `page`: Número de página (default: 1)
- `limit`: Registros por página (default: 20)
- `status`: Filtrar por estado
- `dateFrom`: Fecha inicio
- `dateTo`: Fecha fin

**Respuesta:**
```json
{
  "enabled": true,
  "records": [...],
  "total": 150,
  "page": 1,
  "totalPages": 8,
  "stats": {
    "pending": 5,
    "submitted": 2,
    "accepted": 140,
    "rejected": 3,
    "cancelled": 0
  }
}
```

### POST /api/pos/verifactu
Crea registro para una venta.

**Body:**
```json
{
  "saleId": "clxxx..."
}
```

### GET /api/pos/verifactu/[id]
Obtiene detalle completo de un registro.

### POST /api/pos/verifactu/[id]
Ejecuta acción sobre un registro.

**Body:**
```json
{
  "action": "submit" | "cancel" | "rectify",
  "reason": "Motivo (para cancel/rectify)",
  "newAmount": 100.00  // Solo para rectify
}
```

### GET /api/pos/verifactu/config
Obtiene configuración actual.

### PUT /api/pos/verifactu/config
Actualiza configuración.

### POST /api/pos/verifactu/config
Subir certificado o ejecutar acciones.

---

## Cumplimiento Normativo

### Requisitos del RD 1007/2023 Implementados

| Requisito | Implementación |
|-----------|----------------|
| **Registro inmediato** | Creación automática al completar venta |
| **Integridad garantizada** | Hash SHA-256 encadenado |
| **Trazabilidad** | Cadena de hashes inmutable |
| **Código QR** | Generado en cada factura con URL de verificación |
| **Comunicación AEAT** | Envío SOAP con certificado cliente |
| **Conservación** | Almacenamiento completo en BD |
| **No modificación** | Los registros aceptados no pueden editarse |
| **Facturas rectificativas** | Sistema completo de R1-R5 |

### Datos Obligatorios en Cada Registro

- NIF del emisor
- Número de factura único
- Fecha de expedición
- Tipo de factura
- Base imponible
- Tipo impositivo
- Cuota tributaria
- Importe total
- Hash de la factura
- Hash de la factura anterior (si existe)
- Código QR de verificación

### Formato de Número de Factura

El sistema genera números de factura con formato:
```
TPV-YYYY-NNNNNN
```
Donde:
- `TPV`: Prefijo de terminal punto de venta
- `YYYY`: Año
- `NNNNNN`: Número secuencial

### Verificación de Facturas

Cualquier cliente puede verificar una factura:
1. Escanear el código QR del ticket
2. El QR lleva a: `https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?...`
3. AEAT muestra si la factura está registrada correctamente

---

## Preguntas Frecuentes

### ¿Puedo usar el módulo en modo test indefinidamente?
Sí, el modo test no tiene límites. Es recomendable usarlo hasta familiarizarse con el sistema antes de pasar a producción.

### ¿Qué pasa si AEAT rechaza una factura?
El registro queda en estado REJECTED con el código y mensaje de error. Puedes corregir el problema y reintentar el envío.

### ¿Puedo eliminar un registro?
Solo los registros en estado PENDING (no enviados) pueden eliminarse. Una vez enviados, solo pueden anularse.

### ¿Qué certificado necesito?
Un certificado digital cualificado de la FNMT o autoridad equivalente, en formato .pfx o .p12.

### ¿Cuánto tiempo tengo para enviar una factura a AEAT?
Según la normativa, el envío debe ser inmediato o en el plazo máximo de 4 días naturales. El sistema permite envío automático o manual.

---

## Soporte

Para incidencias técnicas con el sistema Verifactu de este proyecto, revisar:
1. Logs del servidor
2. Estado del certificado
3. Conectividad con AEAT
4. Formato de los datos fiscales

Para dudas sobre la normativa, consultar:
- [Portal de Verifactu de AEAT](https://www.agenciatributaria.es/AEAT.internet/Inicio/La_Agencia_Tributaria/Campanas/Verifactu.shtml)
- [BOE - RD 1007/2023](https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840)
