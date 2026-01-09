# Prueba Rápida del Frontend

## ⚡ Pasos para Probar Solo el Diseño

### 1. Instalar dependencias (si no lo hiciste ya)
```bash
cd frontend
npm install
```

### 2. Iniciar el servidor de desarrollo
```bash
npm run dev
```

### 3. Abrir en el navegador
```
http://localhost:4321
```

---

## ⚠️ Qué Esperar

### ✅ Lo que FUNCIONARÁ:
- ✅ Verás el **Header completo** con logo EVA en amarillo neón
- ✅ El **megamenu** se desplegará al pasar el ratón
- ✅ La **página de inicio** con hero section negro + amarillo
- ✅ Las **secciones de categorías** con cards visuales
- ✅ El **Footer completo** con links y redes sociales
- ✅ El diseño **responsive** (prueba en mobile)

### ⚠️ Lo que NO funcionará (normal, sin backend):
- ❌ Los productos no se cargarán (verás un error en consola)
- ❌ Las categorías del megamenu estarán vacías
- ❌ El buscador no funcionará

**Esto es NORMAL** porque el backend no está corriendo. Solo estamos viendo el diseño.

---

## 🎨 Qué Revisar

1. **Header:**
   - Logo EVA en amarillo neón sobre fondo negro
   - Megamenu con 3 secciones (Deportes, Juguetes, Hobbies)
   - Icono de carrito con badge
   - Buscador en desktop

2. **Hero Section:**
   - Fondo negro
   - Título grande con texto en amarillo
   - Botones amarillo neón y outline
   - Stats (500+ productos, 24/48h, 100%)

3. **Categorías:**
   - 3 cards grandes con degradados de color
   - Hover effect (se elevan al pasar ratón)
   - Iconos decorativos

4. **Footer:**
   - Fondo negro
   - Logo EVA
   - Links organizados en 4 columnas
   - Redes sociales
   - Iconos de métodos de pago

5. **Responsive:**
   - En mobile: menú hamburguesa
   - Todo debe verse bien en cualquier tamaño

---

## 🐛 Si ves errores en la consola del navegador

Es **NORMAL** que veas estos errores:
```
Failed to fetch http://localhost:3000/api/products
Failed to fetch http://localhost:3000/api/categories
```

**Motivo:** El backend no está corriendo, así que las APIs no responden.

**Solución:** Ignóralos por ahora. Solo estamos viendo el diseño visual.

---

## 📸 Capturas Mentales

Deberías ver algo así:

**Header:**
```
┌────────────────────────────────────────────────┐
│ [EVA]  DEPORTES▼  JUGUETES▼  HOBBIES▼  [🔍] [🛒] │
└────────────────────────────────────────────────┘
```

**Hero:**
```
┌────────────────────────────────────────────────┐
│                                                │
│  Diversión sin límites para                   │
│  TODAS LAS EDADES                             │
│  (en amarillo neón)                           │
│                                                │
│  [Ver Deportes] [Ofertas]                     │
│                                                │
└────────────────────────────────────────────────┘
```

**Categorías:**
```
┌───────────┐ ┌───────────┐ ┌───────────┐
│ DEPORTES  │ │ JUGUETES  │ │  HOBBIES  │
│ (azul)    │ │  (rosa)   │ │ (naranja) │
└───────────┘ └───────────┘ └───────────┘
```

---

## ✅ Si Todo Se Ve Bien

¡Perfecto! El frontend está funcionando. El siguiente paso sería:

1. Configurar Supabase
2. Iniciar el backend
3. Ver los productos reales cargándose

---

## 🆘 Si Algo No Funciona

1. **Verifica que el puerto 4321 esté libre:**
   ```bash
   # Si da error, cambia el puerto en astro.config.mjs
   ```

2. **Reinstala dependencias si hay errores:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Verifica que Node.js esté actualizado:**
   ```bash
   node -v  # Debería ser v18 o superior
   ```

---

## 🎉 Siguiente Paso

Una vez veas que el diseño se ve bien, podemos:
- Configurar el backend completo
- O continuar desarrollando las páginas que faltan

¡Disfruta la prueba! 🚀
