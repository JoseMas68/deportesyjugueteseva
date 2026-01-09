# Análisis de Diseños HTML Originales

## 🎨 Diferencias Entre Páginas

### **Página de Inicio** vs **Página de Categoría**

| Aspecto | Inicio | Categoría |
|---------|--------|-----------|
| **Fuentes display** | Montserrat | Anton |
| **Fuentes body** | Open Sans | Roboto |
| **Color primary** | #FFED00 | #FFED00 ✅ |
| **Iconos** | Material Icons | Material Icons Outlined |
| **Header** | Top bar + logo horizontal | Solo logo horizontal + búsqueda |
| **Navegación** | Horizontal debajo | No visible en este HTML |

---

## 📋 Página de Inicio (index.html)

### Características:
- ✅ Top bar negro con contacto + "Envío gratis >50€"
- ✅ Header negro con logo + búsqueda + carrito
- ✅ Navegación horizontal: Deportes | Juguetes | Muñecas | Aire Libre | Juegos de Mesa | Ofertas
- ✅ Hero con imagen inclinada (`transform rotate-2`)
- ✅ Categorías populares (grid 4 cols)
- ✅ Banner amarillo de ofertas
- ✅ Grid de productos (4 cols)
- ✅ Sección de beneficios (3 cols)
- ✅ Footer negro con 4 columnas

### Fuentes:
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"/>
```

### Colores:
- primary: #FFED00
- secondary: #111111
- accent: #e63946

---

## 📋 Página de Categoría (category.html)

### Características:
- ✅ Header sticky negro con logo + búsqueda centrada + toggle dark mode + carrito
- ✅ Breadcrumb: Inicio / Fútbol y Accesorios
- ✅ Título: "Equipamiento de FÚTBOL" (con gradiente amarillo-naranja)
- ✅ **Sidebar de filtros** (sticky, izquierda):
  - Categoría (checkboxes)
  - Precio (inputs min-max)
  - Marca (checkboxes)
  - Scroll custom
- ✅ **Barra de ordenamiento**:
  - "Mostrando 12 de 450 productos"
  - Select "Ordenar por"
  - Toggle vista grid/list
- ✅ **Grid de productos** (3 cols):
  - Badge absoluto: OFERTA / NUEVO / AGOTADO
  - Botón favorito (corazón)
  - Imagen con hover scale
  - Marca pequeña arriba
  - Título con hover amarillo
  - Precio (tachado si hay oferta)
  - Botón carrito negro → hover amarillo
- ✅ **Paginación** con flechas + números
- ✅ **Banner amarillo beneficios** (3 cols): Envío | Garantía | Soporte
- ✅ Footer igual que inicio

### Fuentes:
```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
```

### Colores:
- primary: #FFED00
- primary-hover: #E6D600
- background-light: #F8F9FA
- background-dark: #121212
- surface-light: #FFFFFF
- surface-dark: #1E1E1E
- text-main-light: #111111
- text-main-dark: #F3F3F3
- text-muted-light: #6B7280
- text-muted-dark: #9CA3AF
- border-light: #E5E7EB
- border-dark: #374151

### Funcionalidades JS:
- ✅ Toggle dark mode (localStorage)
- ✅ Filtros colapsables

---

## 🎯 Elementos Únicos de Categoría

### 1. Sidebar de Filtros
```html
<aside class="w-full lg:w-1/4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
  <div class="bg-surface-light rounded-lg shadow-sm border p-5">
    <!-- Cabecera -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="font-display uppercase">Filtros</h2>
      <button class="text-xs hover:text-primary underline">Limpiar todo</button>
    </div>

    <!-- Categoría -->
    <div class="mb-6 border-b pb-6">
      <h3 class="font-bold mb-3">Categoría ▼</h3>
      <ul class="space-y-2 text-sm">
        <li>
          <label class="flex items-center gap-2">
            <input type="checkbox" class="rounded text-primary"/>
            Balones (120)
          </label>
        </li>
      </ul>
    </div>

    <!-- Precio -->
    <div class="mb-6 border-b pb-6">
      <h3 class="font-bold mb-3">Precio</h3>
      <div class="flex items-center gap-2">
        <input type="number" placeholder="Min" class="w-full"/>
        <span>-</span>
        <input type="number" placeholder="Max" class="w-full"/>
      </div>
      <button class="w-full bg-black text-white text-xs py-2 rounded uppercase">Aplicar</button>
    </div>

    <!-- Marca -->
    <div>
      <h3 class="font-bold mb-3">Marca</h3>
      <ul class="space-y-2 text-sm">
        <li><label><input type="checkbox"/> Nike</label></li>
        <li><label><input type="checkbox"/> Adidas</label></li>
      </ul>
    </div>
  </div>
</aside>
```

### 2. ProductCard Completo
```html
<div class="group bg-surface-light rounded-xl border hover:shadow-xl hover:border-primary transition-all duration-300">
  <!-- Badges absolutos -->
  <div class="absolute top-3 left-3 bg-primary text-black text-xs font-bold px-2 py-1 rounded z-10">
    OFERTA
  </div>
  <div class="absolute top-3 right-3 z-10">
    <button class="bg-white p-1.5 rounded-full shadow hover:text-red-500">
      <span class="material-icons-outlined text-lg">favorite_border</span>
    </button>
  </div>

  <!-- Imagen -->
  <a class="block h-64 bg-white p-4 flex items-center justify-center relative" href="#">
    <img class="object-contain h-full w-full transform group-hover:scale-110 transition-transform duration-500" src="..."/>
  </a>

  <!-- Info -->
  <div class="p-4 flex flex-col flex-1">
    <span class="text-xs font-bold text-text-muted-light uppercase mb-1">Adidas</span>
    <h3 class="text-lg font-bold leading-tight mb-2 group-hover:text-primary">
      <a href="#">Balón Pro League 2024</a>
    </h3>

    <!-- Footer -->
    <div class="mt-auto pt-3 border-t flex items-center justify-between">
      <div>
        <span class="text-xs text-red-500 line-through mr-1">$120.00</span>
        <span class="text-xl font-bold font-display">$89.99</span>
      </div>
      <button class="bg-black hover:bg-primary hover:text-black text-white p-2 rounded-full">
        <span class="material-icons-outlined">add_shopping_cart</span>
      </button>
    </div>
  </div>
</div>
```

### 3. Barra de Ordenamiento
```html
<div class="flex justify-between items-center mb-6 bg-surface-light p-4 rounded-lg border shadow-sm">
  <span class="text-sm text-text-muted-light">
    Mostrando <span class="font-bold">12</span> de <span class="font-bold">450</span> productos
  </span>

  <div class="flex items-center gap-4">
    <div class="flex items-center gap-2">
      <label class="text-sm font-medium" for="sort">Ordenar por:</label>
      <select id="sort" class="text-sm border-gray-300 bg-background-light rounded">
        <option>Relevancia</option>
        <option>Precio: Menor a Mayor</option>
        <option>Precio: Mayor a Menor</option>
        <option>Lo más nuevo</option>
      </select>
    </div>

    <div class="flex gap-1 border-l pl-4">
      <button class="p-1"><span class="material-icons-outlined">grid_view</span></button>
      <button class="p-1 text-gray-400"><span class="material-icons-outlined">view_list</span></button>
    </div>
  </div>
</div>
```

### 4. Paginación
```html
<nav class="flex items-center gap-2">
  <button class="h-10 w-10 flex items-center justify-center rounded border hover:bg-gray-100">
    <span class="material-icons-outlined text-sm">chevron_left</span>
  </button>
  <button class="h-10 w-10 rounded bg-primary text-black font-bold">1</button>
  <button class="h-10 w-10 rounded border hover:bg-gray-100">2</button>
  <button class="h-10 w-10 rounded border hover:bg-gray-100">3</button>
  <span class="px-2 text-gray-400">...</span>
  <button class="h-10 w-10 flex items-center justify-center rounded border hover:bg-gray-100">
    <span class="material-icons-outlined text-sm">chevron_right</span>
  </button>
</nav>
```

---

## ⚠️ Inconsistencias Detectadas

1. **Fuentes diferentes** entre páginas
2. **Header diferente** (inicio tiene top bar, categoría no)
3. **Iconos diferentes** (Material Icons vs Outlined)
4. **Toggle dark mode** solo en página de categoría

---

---

## 📋 Página de Producto (product.html)

### Características:
- ✅ Header igual que categoría (sticky negro + dark mode toggle)
- ✅ Breadcrumb: Inicio / Deportes / Baloncesto / Balón Pro Grip Elite 7
- ✅ **Galería de imágenes** (layout especial):
  - Thumbnails verticales a la izquierda (4 imágenes)
  - Imagen principal grande a la derecha
  - Primera thumbnail tiene borde primary (seleccionada)
  - Hover scale en imagen principal
  - Badge absoluto "NUEVO" arriba izquierda
- ✅ **Información del producto**:
  - Marca pequeña arriba (Wilson, texto primary)
  - Título H1 con font-display, uppercase, italic (3xl-5xl)
  - Estrellas de valoración (4.5/5) + "(42 reseñas)"
  - Precio grande (34,99€) + precio tachado (45,99€) + badge descuento (-24%)
  - Descripción en prosa pequeña
- ✅ **Selector de talla**:
  - Grid de 3x2 (responsive a 6 cols en desktop)
  - Radio buttons estilizados como botones
  - Talla seleccionada: border-2 border-primary
  - Badge "Popular" en talla 7
  - Link "Guía de tallas" arriba derecha
- ✅ **Selector de cantidad**:
  - Input numérico centrado
  - Botones "-" y "+" con iconos Material
  - Width fixed (w-32)
- ✅ **Botones de acción**:
  - Botón principal: bg-primary, uppercase, con icono shopping_bag, shadow-lg, hover shadow-primary/50 + transform -translate-y-1
  - Botón favorito: border, icono corazón, hover text-red-500
- ✅ **Acordeón "Características Técnicas"**:
  - Header con bg-gray-50, botón expand_more
  - Contenido: tabla de specs (Material, Uso, Peso)
  - Cada fila con border-b
- ✅ **Iconos de beneficios** (3 items):
  - Material Icons Outlined: local_shipping, verified_user, sync
  - Texto pequeño con icono primary
- ✅ **Sección "Productos Relacionados"**:
  - Título con font-display, uppercase, italic
  - Grid 4 cols
  - ProductCard con hover overlay gradient from-black/80
  - Botón "Añadir" aparece desde abajo (translate-y)
  - Algunos cards con badge de descuento (-15%) top-right
- ✅ Footer igual que otras páginas

### Fuentes:
```html
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Roboto:wght@300;400;500;700;900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
```

### Colores:
- primary: #FFED00
- primary-dark: #DBC900 (hover en botón principal)
- background-light: #F7F7F7
- background-dark: #121212
- surface-light: #FFFFFF
- surface-dark: #1E1E1E
- text-light: #1A1A1A
- text-dark: #E5E5E5

### Funcionalidades JS:
- ✅ Toggle dark mode
- ✅ Cambio de imagen principal al hacer click en thumbnail
- ✅ Contador de cantidad con botones +/-
- ✅ Acordeón colapsable

---

## 🎯 Elementos Únicos de Producto

### 1. Galería de Imágenes
```html
<div class="product-gallery flex flex-col-reverse lg:flex-row gap-4">
  <!-- Thumbnails verticales -->
  <div class="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-y-auto lg:h-[600px] no-scrollbar py-2 lg:py-0">
    <button class="w-20 h-20 flex-shrink-0 border-2 border-primary rounded-lg overflow-hidden">
      <img class="w-full h-full object-cover" src="..."/>
    </button>
    <button class="w-20 h-20 flex-shrink-0 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-primary">
      <img class="w-full h-full object-cover" src="..."/>
    </button>
    <!-- más thumbnails -->
  </div>

  <!-- Imagen principal -->
  <div class="flex-1 aspect-square lg:aspect-auto lg:h-[600px] bg-white rounded-xl overflow-hidden shadow-sm relative group">
    <img class="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" src="..."/>
    <span class="absolute top-4 left-4 bg-black text-primary text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-sm">Nuevo</span>
  </div>
</div>
```

### 2. Selector de Talla
```html
<div class="mb-8 border-t border-b border-gray-200 dark:border-gray-700 py-6">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-sm font-medium text-gray-900 dark:text-white">Talla</h3>
    <a class="text-sm text-primary hover:underline" href="#">Guía de tallas</a>
  </div>
  <div class="grid grid-cols-3 gap-4 sm:grid-cols-6">
    <label class="group relative border rounded-md py-3 px-4 flex items-center justify-center text-sm font-medium uppercase hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
      <input class="sr-only" name="size-choice" type="radio" value="5"/>
      <span>5</span>
    </label>

    <!-- Talla seleccionada -->
    <label class="group relative border-2 border-primary rounded-md py-3 px-4 flex items-center justify-center text-sm font-bold uppercase cursor-pointer">
      <input class="sr-only" checked name="size-choice" type="radio" value="7"/>
      <span>7</span>
      <div class="absolute top-0 right-0 -mt-2 -mr-2 bg-primary text-black text-[10px] px-1 font-bold rounded">Popular</div>
    </label>
  </div>
</div>
```

### 3. Botón Principal con Hover Especial
```html
<button class="flex-1 bg-primary border border-transparent py-3 px-8 flex items-center justify-center text-base font-bold text-black hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary uppercase tracking-wider rounded-lg shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:-translate-y-1">
  <span class="material-icons-outlined mr-2">shopping_bag</span>
  Añadir al Carrito
</button>
```

### 4. ProductCard con Overlay Animado
```html
<div class="group relative bg-background-light dark:bg-background-dark rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
  <div class="aspect-[4/5] bg-white overflow-hidden relative">
    <img class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500" src="..."/>

    <!-- Badge descuento (opcional) -->
    <div class="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-15%</div>

    <!-- Overlay con botón que sube desde abajo -->
    <div class="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/80 to-transparent">
      <button class="w-full bg-primary text-black font-bold py-2 rounded text-sm uppercase">Añadir</button>
    </div>
  </div>
  <div class="p-4">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Nike Air Zoom GT</h3>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Zapatillas Basket</p>
    <div class="flex justify-between items-center">
      <p class="text-lg font-bold text-gray-900 dark:text-white">129,99 €</p>
      <div class="flex text-yellow-400 text-xs">
        <span class="material-icons-outlined" style="font-size: 16px;">star</span>
        <span class="material-icons-outlined" style="font-size: 16px;">star</span>
        <span class="material-icons-outlined" style="font-size: 16px;">star</span>
      </div>
    </div>
  </div>
</div>
```

### 5. Acordeón de Características
```html
<div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
  <button class="w-full flex justify-between items-center p-4 bg-gray-50 dark:bg-surface-dark text-left focus:outline-none">
    <span class="font-bold text-gray-900 dark:text-white uppercase text-sm">Características Técnicas</span>
    <span class="material-icons-outlined">expand_more</span>
  </button>
  <div class="p-4 bg-white dark:bg-surface-dark/50 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 space-y-2">
    <div class="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
      <span>Material:</span>
      <span class="font-medium text-gray-900 dark:text-white">Cuero sintético compuesto</span>
    </div>
    <div class="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
      <span>Uso:</span>
      <span class="font-medium text-gray-900 dark:text-white">Indoor / Outdoor</span>
    </div>
    <div class="flex justify-between pb-2">
      <span>Peso:</span>
      <span class="font-medium text-gray-900 dark:text-white">600g (Oficial)</span>
    </div>
  </div>
</div>
```

---

## ⚠️ Inconsistencias Detectadas

1. **Fuentes diferentes** entre páginas (Inicio usa Montserrat/Open Sans, Categoría y Producto usan Anton/Roboto)
2. **Header diferente** (inicio tiene top bar con contacto, categoría/producto no)
3. **Iconos diferentes** (Material Icons vs Material Icons Outlined)
4. **Toggle dark mode** solo en páginas de categoría y producto
5. **Colores ligeramente diferentes** en nombres de variables (text-light vs text-main-light)

---

---

## 📋 Página de Carrito (cart.html)

### Características:
- ✅ **Header diferente de otras páginas**:
  - Fondo blanco (no negro)
  - Border bottom
  - Logo con texto completo visible en desktop
  - Nav horizontal simple (sin megamenu)
  - Dark mode toggle con iconos intercambiables (dark_mode/light_mode)
- ✅ Breadcrumb: Inicio / Carrito de Compras
- ✅ **Título página**: Font-display, uppercase, italic con "Eva" en amarillo
- ✅ **Layout grid 12 cols**: 8 cols para items, 4 cols para resumen
- ✅ **Tabla de productos**:
  - Header en desktop (hidden en mobile): Producto | Precio | Cantidad | Total
  - Cada fila con hover bg-gray-50
  - Imagen 24x24 (w-24 h-24) con hover scale en group
  - Título con font-display, uppercase, italic
  - Info adicional: Talla, estado stock (texto verde)
  - Selector de cantidad inline con botones +/-
  - Botón eliminar (desktop: solo icono arriba derecha, mobile: con texto abajo)
- ✅ **Footer de tabla**:
  - Input cupón + botón "Aplicar"
  - Botón "Vaciar Carrito" (text-primary con underline)
- ✅ **Link "Continuar Comprando"** con flecha izquierda
- ✅ **Resumen del Pedido** (sticky top-24):
  - Border-top amarillo (border-t-4 border-primary)
  - Shadow-lg
  - Desglose: Subtotal, Envío (con icono help), Impuestos, Total
  - Total con font-display, italic, text-primary
  - Botón "Finalizar Compra": bg-primary, uppercase, tracking-widest, con flecha que se mueve en hover
  - Iconos de métodos de pago (grayscale, opacity-60)
  - Texto de seguridad SSL
- ✅ **Sección "Podría interesarte"**:
  - Grid 4 cols
  - ProductCard simplificado con aspect ratio fijo (h-48)
  - Badge descuento absoluto top-right
  - Botón "Agregar" negro → hover amarillo
- ✅ Footer con border-top amarillo (border-t-4)

### Fuentes:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;700&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
```

**¡NUEVA COMBINACIÓN DE FUENTES!**
- display: **Oswald** (diferente de Montserrat y Anton)
- body: **Inter** (diferente de Open Sans y Roboto)

### Colores:
- primary: #FFED00
- secondary: #000000
- primary-hover: #E6D600
- background-light: #F9FAFB
- background-dark: #111827
- card-light: #FFFFFF
- card-dark: #1F2937
- text-light: #1F2937
- text-dark: #F3F4F6
- border-light: #E5E7EB
- border-dark: #374151

### Funcionalidades JS:
- ✅ Toggle dark mode con cambio de icono
- ✅ Incrementar/decrementar cantidad
- ✅ Eliminar producto del carrito
- ✅ Aplicar cupón de descuento
- ✅ Vaciar carrito completo

---

## 🎯 Elementos Únicos de Carrito

### 1. Item del Carrito (Desktop + Mobile Responsive)
```html
<div class="p-4 sm:p-6 border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
  <div class="flex flex-col sm:grid sm:grid-cols-6 gap-6 items-center">
    <!-- Producto (col-span-3) -->
    <div class="col-span-3 flex items-center w-full">
      <div class="flex-shrink-0 w-24 h-24 bg-white rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden relative">
        <img class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" src="..."/>
      </div>
      <div class="ml-4 flex-1">
        <h3 class="text-lg font-bold font-display uppercase italic text-gray-900 dark:text-white">
          <a href="#">Balón de Fútbol Pro</a>
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Talla: 5</p>
        <p class="mt-1 text-sm text-green-600 dark:text-green-400 font-medium">En Stock</p>
        <!-- Botón eliminar mobile -->
        <button class="sm:hidden mt-2 text-red-500 text-sm flex items-center gap-1 hover:text-red-700">
          <span class="material-icons-outlined text-sm">delete</span> Eliminar
        </button>
      </div>
    </div>

    <!-- Precio -->
    <div class="text-center w-full sm:w-auto">
      <span class="sm:hidden text-gray-500 text-xs uppercase mr-2">Precio:</span>
      <span class="font-medium text-gray-900 dark:text-gray-200">$29.990</span>
    </div>

    <!-- Cantidad -->
    <div class="flex justify-center w-full sm:w-auto">
      <div class="flex items-center border border-border-light dark:border-border-dark rounded bg-white dark:bg-gray-900">
        <button class="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">-</button>
        <input class="w-10 text-center text-sm border-0 focus:ring-0 bg-transparent p-1 text-gray-900 dark:text-white" type="text" value="1"/>
        <button class="px-2 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">+</button>
      </div>
    </div>

    <!-- Total + Eliminar (desktop) -->
    <div class="text-right flex flex-col items-end justify-between h-full w-full sm:w-auto">
      <span class="font-bold text-gray-900 dark:text-white text-lg">$29.990</span>
      <button class="hidden sm:flex text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors mt-2" title="Eliminar producto">
        <span class="material-icons-outlined">delete_outline</span>
      </button>
    </div>
  </div>
</div>
```

### 2. Resumen del Pedido (Sticky)
```html
<div class="bg-card-light dark:bg-card-dark shadow-lg rounded-lg border-t-4 border-primary p-6 sticky top-24">
  <h2 class="text-xl font-bold font-display uppercase italic text-gray-900 dark:text-white mb-6">Resumen del Pedido</h2>

  <dl class="space-y-4 text-sm text-gray-600 dark:text-gray-300">
    <div class="flex justify-between">
      <dt>Subtotal</dt>
      <dd class="font-medium text-gray-900 dark:text-white">$74.990</dd>
    </div>
    <div class="flex justify-between">
      <dt class="flex items-center">
        Envío
        <span class="ml-1.5 material-icons-outlined text-xs text-gray-400 cursor-help" title="Calculado en el siguiente paso">help_outline</span>
      </dt>
      <dd class="font-medium text-gray-900 dark:text-white">Por calcular</dd>
    </div>
    <div class="flex justify-between">
      <dt>Impuestos (19%)</dt>
      <dd class="font-medium text-gray-900 dark:text-white">$14.248</dd>
    </div>
    <div class="border-t border-border-light dark:border-border-dark pt-4 flex justify-between items-center">
      <dt class="text-base font-bold text-gray-900 dark:text-white uppercase">Total</dt>
      <dd class="text-2xl font-bold text-primary font-display italic">$89.238</dd>
    </div>
  </dl>

  <!-- Botón Finalizar -->
  <div class="mt-8">
    <button class="w-full bg-primary hover:bg-primary-hover text-black font-bold py-4 px-6 rounded shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 uppercase tracking-widest flex justify-center items-center gap-2 group">
      Finalizar Compra
      <span class="material-icons-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
    </button>
  </div>

  <!-- Métodos de pago -->
  <div class="mt-6 flex justify-center gap-2 grayscale opacity-60">
    <div class="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-[10px] font-bold">VISA</div>
    <div class="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-[10px] font-bold">MC</div>
    <div class="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-[10px] font-bold">AMEX</div>
    <div class="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-[10px] font-bold">PAY</div>
  </div>

  <!-- Texto seguridad -->
  <div class="mt-6 text-center">
    <p class="text-xs text-gray-500 dark:text-gray-400">
      Compra segura. Tus datos están protegidos con encriptación SSL de 256 bits.
    </p>
  </div>
</div>
```

### 3. Cupón de Descuento (Footer de Tabla)
```html
<div class="p-4 bg-gray-50 dark:bg-gray-800/30 flex flex-col sm:flex-row justify-between items-center gap-4">
  <div class="flex w-full sm:w-auto gap-2">
    <input class="w-full sm:w-48 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:border-primary focus:ring-primary dark:text-white" placeholder="Código de cupón" type="text"/>
    <button class="bg-gray-900 dark:bg-gray-700 text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors uppercase tracking-wide">
      Aplicar
    </button>
  </div>
  <button class="text-sm text-primary hover:text-primary-hover dark:text-primary dark:hover:text-yellow-300 font-medium underline uppercase tracking-wide">
    Vaciar Carrito
  </button>
</div>
```

### 4. Dark Mode Toggle con Iconos Intercambiables
```html
<button class="p-2 text-gray-500 hover:text-primary transition-colors" onclick="document.documentElement.classList.toggle('dark')">
  <span class="material-icons-outlined dark:hidden">dark_mode</span>
  <span class="material-icons-outlined hidden dark:inline">light_mode</span>
</button>
```

---

## ⚠️ Inconsistencias Detectadas (ACTUALIZADO)

1. **CUATRO combinaciones de fuentes diferentes**:
   - Inicio: Montserrat + Open Sans
   - Categoría/Producto: Anton + Roboto
   - **Carrito: Oswald + Inter** (nueva combinación)
2. **Header completamente diferente en carrito** (fondo blanco, sin top bar, navegación simple)
3. **Iconos**: Material Icons Outlined en todas
4. **Toggle dark mode**: Solo en categoría, producto y carrito (no en inicio)
5. **Border-top amarillo en footer**: Solo en carrito
6. **Colores con nombres de variables diferentes** entre páginas

---

---

## 📋 Página de Checkout (checkout.html)

### Características:
- ✅ **Header simplificado**:
  - Fondo blanco con border-bottom
  - Logo + nombre visible en desktop
  - Solo link "Volver a la tienda" (sin navegación completa)
  - Sticky top-0
- ✅ **Indicador de progreso** (3 pasos):
  - Paso 1 activo: círculo con bg-primary, texto negro, borde amarillo
  - Pasos siguientes: círculo con border gris, hover border-primary
  - Separadores con chevron_right
  - Labels: Envío | Pago | Confirmación
- ✅ **Layout grid 12 cols**: 7 cols para formulario, 5 cols para resumen
- ✅ **Sección "Información de Contacto"**:
  - Input email grande (py-3)
  - Checkbox newsletter con label largo
  - Link "Inicia Sesión" en esquina superior derecha
- ✅ **Sección "Dirección de Envío"**:
  - Grid 2 cols: Nombre | Apellidos
  - Campos: Dirección, Apartamento (opcional), Ciudad, Código Postal, Teléfono
  - Todos los inputs con py-3 (más grandes)
- ✅ **Sección "Método de Envío"**:
  - Radio buttons personalizados con cards grandes
  - Opción seleccionada: border-primary, bg-primary/5, ring-1 ring-primary, badge "Recomendado"
  - Radio custom: círculo amarillo con dot negro dentro
  - Precio alineado a la derecha
  - Hover effect en opciones no seleccionadas
- ✅ **Botón "Continuar al Pago"**:
  - bg-primary, uppercase, font-black, tracking-wide
  - Shadow-lg, hover -translate-y-0.5
  - Full width en mobile, auto en desktop
- ✅ **Resumen del Pedido** (sticky, sidebar):
  - Header con bg-gray-50 (diferente del body)
  - Lista de productos con imagen 20x20 (h-20 w-20)
  - Input código descuento con botón negro
  - Desglose: Subtotal, Envío, Impuestos (21% IVA), Total
  - Total: text-2xl font-black text-primary
  - Footer con 3 iconos: Pago Seguro | Envío Rápido | Garantía Oficial
- ✅ Footer negro con border-t-4 amarillo

### Fuentes:
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;900&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
```

**¡CUARTA COMBINACIÓN DE FUENTES!**
- display: **Montserrat** (igual que inicio)
- body: **Inter** (igual que carrito)
- **Mix de las anteriores**

### Colores:
- primary: #FFED00
- primary-hover: #E6D500
- background-light: #F3F4F6
- background-dark: #121212
- surface-light: #FFFFFF
- surface-dark: #1E1E1E
- text-main-light: #111827
- text-main-dark: #F9FAFB
- text-sub-light: #6B7280
- text-sub-dark: #9CA3AF
- border-light: #E5E7EB
- border-dark: #374151

### CSS Especial:
```css
/* Radio button personalizado con imagen de check */
input[type="radio"]:checked {
    background-image: url(...); /* Imagen de checkmark */
    background-color: #FFED00;
    border-color: #FFED00;
}

.transition-all-custom {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 300ms;
}
```

### Funcionalidades JS:
- ✅ Selección de método de envío (radio buttons)
- ✅ Aplicar código de descuento
- ✅ Validación de formulario
- ✅ Toggle dark mode (opcional, estructura preparada)

---

## 🎯 Elementos Únicos de Checkout

### 1. Indicador de Progreso (Stepper)
```html
<nav aria-label="Progress">
  <ol class="flex items-center justify-center space-x-2 sm:space-x-8 lg:space-x-12" role="list">
    <!-- Paso activo -->
    <li class="flex items-center text-primary">
      <span class="flex items-center justify-center w-8 h-8 border-2 border-primary rounded-full bg-primary text-black font-bold">1</span>
      <span class="ml-3 font-display font-bold text-black dark:text-white hidden sm:block">Envío</span>
    </li>

    <!-- Separador -->
    <li class="flex items-center text-text-sub-light dark:text-text-sub-dark">
      <span class="material-icons-outlined text-xl mx-2">chevron_right</span>
    </li>

    <!-- Paso siguiente -->
    <li class="flex items-center text-text-sub-light dark:text-text-sub-dark group">
      <span class="flex items-center justify-center w-8 h-8 border-2 border-border-light dark:border-border-dark rounded-full group-hover:border-primary transition-colors font-medium">2</span>
      <span class="ml-3 font-display font-medium group-hover:text-primary transition-colors hidden sm:block">Pago</span>
    </li>
  </ol>
</nav>
```

### 2. Método de Envío con Radio Card Personalizado
```html
<!-- Opción seleccionada -->
<label class="relative flex cursor-pointer rounded-lg border border-primary bg-primary/5 p-4 shadow-sm focus:outline-none ring-1 ring-primary">
  <input checked class="sr-only" name="shipping-method" type="radio" value="express"/>
  <span class="flex flex-1">
    <span class="flex flex-col">
      <span class="block text-sm font-bold text-gray-900 dark:text-white">Envío Express (24h)</span>
      <span class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">Recíbelo mañana</span>
      <span class="mt-2 text-xs font-semibold text-green-600">Recomendado</span>
    </span>
  </span>
  <span class="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">5,90 €</span>

  <!-- Border decorativo -->
  <span aria-hidden="true" class="pointer-events-none absolute -inset-px rounded-lg border-2 border-primary"></span>

  <!-- Radio custom -->
  <span class="absolute top-4 right-4 h-4 w-4 rounded-full border border-primary bg-primary">
    <span class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-black"></span>
  </span>
</label>

<!-- Opción no seleccionada -->
<label class="relative flex cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm focus:outline-none hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
  <input class="sr-only" name="shipping-method" type="radio" value="standard"/>
  <span class="flex flex-1">
    <span class="flex flex-col">
      <span class="block text-sm font-medium text-gray-900 dark:text-white">Envío Estándar (3-5 días)</span>
      <span class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">Entrega estimada: Lunes, 24 Oct</span>
    </span>
  </span>
  <span class="mt-0.5 text-sm font-bold text-gray-900 dark:text-white">Gratis</span>
  <span class="absolute top-4 right-4 h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"></span>
</label>
```

### 3. Resumen con Header Diferenciado
```html
<div class="bg-surface-light dark:bg-surface-dark rounded-lg shadow-lg border border-border-light dark:border-border-dark overflow-hidden sticky top-24">
  <!-- Header con fondo diferente -->
  <div class="p-6 bg-gray-50 dark:bg-zinc-800 border-b border-border-light dark:border-border-dark">
    <h2 class="text-lg font-display font-bold text-black dark:text-white">Resumen del Pedido</h2>
    <p class="text-sm text-text-sub-light dark:text-text-sub-dark mt-1">2 artículos en tu carrito</p>
  </div>

  <!-- Lista de productos -->
  <div class="p-6 space-y-6">
    <div class="flex items-start space-x-4">
      <div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-border-light dark:border-border-dark bg-white">
        <img class="h-full w-full object-cover object-center" src="..."/>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-sm font-medium text-black dark:text-white font-display">Balón de Baloncesto Pro</h3>
        <p class="text-sm text-text-sub-light dark:text-text-sub-dark mt-1">Talla 7 - Naranja</p>
        <div class="mt-2 flex items-center justify-between">
          <p class="text-sm font-medium text-black dark:text-white">29,99 €</p>
          <div class="flex items-center text-text-sub-light dark:text-text-sub-dark text-xs">Cant: 1</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Cupón de descuento -->
  <div class="px-6 py-4 bg-gray-50 dark:bg-zinc-800 border-t border-b border-border-light dark:border-border-dark">
    <form class="flex space-x-2">
      <input class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm py-2 px-3" placeholder="Código de descuento" type="text"/>
      <button class="bg-black dark:bg-white text-white dark:text-black font-medium text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity whitespace-nowrap" type="submit">
        Aplicar
      </button>
    </form>
  </div>

  <!-- Totales -->
  <div class="p-6 bg-surface-light dark:bg-surface-dark space-y-4">
    <div class="flex items-center justify-between text-sm text-text-sub-light dark:text-text-sub-dark">
      <p>Subtotal</p>
      <p class="font-medium text-black dark:text-white">75,49 €</p>
    </div>
    <div class="flex items-center justify-between text-sm text-text-sub-light dark:text-text-sub-dark">
      <p>Envío</p>
      <p class="font-medium text-black dark:text-white">5,90 €</p>
    </div>
    <div class="flex items-center justify-between text-sm text-text-sub-light dark:text-text-sub-dark">
      <p>Impuestos (21% IVA)</p>
      <p class="font-medium text-black dark:text-white">15,85 €</p>
    </div>
    <div class="border-t border-border-light dark:border-border-dark pt-4 flex items-center justify-between">
      <p class="text-base font-bold text-black dark:text-white font-display uppercase">Total</p>
      <p class="text-2xl font-black text-primary font-display">81,39 €</p>
    </div>
  </div>

  <!-- Footer con iconos -->
  <div class="bg-gray-50 dark:bg-zinc-800 p-4 border-t border-border-light dark:border-border-dark grid grid-cols-3 gap-2 text-center text-xs text-text-sub-light dark:text-text-sub-dark">
    <div class="flex flex-col items-center gap-1">
      <span class="material-icons-outlined text-lg">lock</span>
      <span>Pago Seguro</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <span class="material-icons-outlined text-lg">local_shipping</span>
      <span>Envío Rápido</span>
    </div>
    <div class="flex flex-col items-center gap-1">
      <span class="material-icons-outlined text-lg">verified</span>
      <span>Garantía Oficial</span>
    </div>
  </div>
</div>
```

### 4. Formulario de Dirección (Grid Responsive)
```html
<div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
  <div>
    <label class="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1" for="first-name">Nombre</label>
    <input class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm py-3" id="first-name" type="text"/>
  </div>
  <div>
    <label class="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1" for="last-name">Apellidos</label>
    <input class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm py-3" id="last-name" type="text"/>
  </div>
  <div class="sm:col-span-2">
    <label class="block text-sm font-medium text-text-main-light dark:text-text-main-dark mb-1" for="address">Dirección</label>
    <input class="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary dark:bg-gray-800 dark:text-white sm:text-sm py-3" id="address" placeholder="Calle, número, piso..." type="text"/>
  </div>
</div>
```

---

## ⚠️ Inconsistencias Detectadas (ACTUALIZADO)

1. **CUATRO combinaciones de fuentes diferentes**:
   - Inicio: Montserrat + Open Sans
   - Categoría/Producto: Anton + Roboto
   - Carrito: Oswald + Inter
   - **Checkout: Montserrat + Inter** (mix de inicio y carrito)
2. **Headers diferentes** en cada tipo de página:
   - Inicio: Negro con top bar + megamenu
   - Categoría/Producto: Negro sticky sin top bar
   - Carrito: Blanco con navegación simple
   - **Checkout: Blanco minimalista** (solo logo + "Volver")
3. **Iconos**: Material Icons Outlined en todas
4. **Toggle dark mode**: Solo en categoría, producto y carrito (no en inicio ni checkout)
5. **Border-top amarillo en footer**: Solo en carrito y checkout
6. **Radio buttons personalizados**: Solo en checkout (con CSS especial)
7. **Colores con nombres de variables diferentes** entre páginas

---

---

## 📋 Página de Confirmación (confirmation.html)

### Características:
- ✅ **Header igual que inicio**:
  - Fondo blanco con border-bottom
  - Logo + nombre completo en desktop
  - Navegación horizontal: Inicio | Catálogo | Contacto
  - Iconos: search, person, shopping_cart (badge con 0)
  - Sin dark mode toggle
- ✅ **Hero de confirmación** (centrado):
  - Icono check_circle grande (text-5xl) en círculo bg-primary/20
  - Título H1: "¡Gracias por tu pedido!" con font-display font-extrabold
  - Número de pedido: "#EVA-8492" en negrita
  - Email de confirmación destacado
- ✅ **Layout grid 12 cols**: 8 cols contenido principal, 4 cols sidebar
- ✅ **Card "Estado del Envío"**:
  - Título con icono local_shipping
  - Barra de progreso visual (width: 25%)
  - 4 estados: Confirmado (activo) | Procesando | Enviado | Entregado
  - Card con fecha estimada de entrega
  - Botón "Rastrear pedido"
- ✅ **Card "Resumen de Artículos"**:
  - Header con bg separado
  - Lista dividida con divide-y
  - Items con imagen 24x24 (h-24 w-24)
  - Info: nombre, talla, color, cantidad
  - Sin opción de eliminar
- ✅ **Sidebar derecha** (3 cards):
  1. **Resumen del Pedido**: Subtotal, Envío, Impuestos, Total (border-t-2 border-primary en total)
  2. **Dirección de Envío**: address con not-italic, incluye icono phone
  3. **Método de Pago**: Icono credit_card + "Terminada en **** 4242"
- ✅ **Botones de acción**:
  - "Descargar Factura": bg-secondary, con icono print
  - "Seguir Comprando": bg-primary
- ✅ **Sección "También te podría interesar"**:
  - Border-top + pt-12 como separador
  - Grid 4 cols
  - ProductCard simplificado con h-48 fixed
- ✅ Footer negro con border-t-4 amarillo

### Fuentes:
```html
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet"/>
```

**¡VUELTA A LA COMBINACIÓN DE INICIO!**
- display: **Montserrat** (igual que inicio y checkout)
- body: **Open Sans** (igual que inicio)

### Colores:
- primary: #FFED00
- primary-hover: #E6D600
- secondary: #000000
- background-light: #F9FAFB
- background-dark: #111827
- card-light: #FFFFFF
- card-dark: #1F2937
- text-light: #1F2937
- text-dark: #F3F4F6
- muted-light: #6B7280
- muted-dark: #9CA3AF
- border-light: #E5E7EB
- border-dark: #374151

### Funcionalidades JS:
- ✅ Ninguna funcionalidad JS especial (página estática de confirmación)
- ✅ Enlaces a "Rastrear pedido" y "Descargar Factura"

---

## 🎯 Elementos Únicos de Confirmación

### 1. Hero de Confirmación con Icono Circular
```html
<div class="text-center mb-12">
  <!-- Icono en círculo grande -->
  <div class="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 mb-6">
    <span class="material-icons-outlined text-5xl text-yellow-600 dark:text-yellow-400">check_circle</span>
  </div>

  <!-- Título y mensaje -->
  <h1 class="text-4xl font-display font-extrabold text-secondary dark:text-white tracking-tight mb-2">¡Gracias por tu pedido!</h1>
  <p class="text-lg text-muted-light dark:text-muted-dark max-w-2xl mx-auto">
    Tu pedido <span class="font-bold text-secondary dark:text-white">#EVA-8492</span> ha sido confirmado y pronto estará en camino.
  </p>
  <p class="text-sm text-muted-light dark:text-muted-dark mt-2">
    Hemos enviado un correo de confirmación a <span class="font-medium">cliente@email.com</span>
  </p>
</div>
```

### 2. Barra de Progreso del Envío
```html
<div class="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border p-6 sm:p-8">
  <h2 class="text-xl font-display font-bold text-secondary dark:text-white mb-6 flex items-center gap-2">
    <span class="material-icons-outlined text-primary">local_shipping</span>
    Estado del Envío
  </h2>

  <!-- Barra de progreso -->
  <div class="relative">
    <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
      <div class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary" style="width: 25%"></div>
    </div>

    <!-- Labels de estados -->
    <div class="flex justify-between text-xs sm:text-sm font-medium text-muted-light dark:text-muted-dark">
      <div class="text-secondary dark:text-primary font-bold">Confirmado</div>
      <div>Procesando</div>
      <div>Enviado</div>
      <div>Entregado</div>
    </div>
  </div>

  <!-- Card fecha estimada -->
  <div class="mt-8 bg-background-light dark:bg-background-dark rounded-lg p-4 border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      <p class="text-sm text-muted-light dark:text-muted-dark">Fecha estimada de entrega</p>
      <p class="text-lg font-bold text-secondary dark:text-white">Martes, 24 de Octubre</p>
    </div>
    <button class="text-sm font-semibold text-primary-hover dark:text-primary hover:underline">Rastrear pedido</button>
  </div>
</div>
```

### 3. Lista de Artículos (Sin Editar)
```html
<div class="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border overflow-hidden">
  <div class="px-6 py-4 border-b">
    <h2 class="text-lg font-display font-bold text-secondary dark:text-white">Resumen de Artículos</h2>
  </div>

  <ul class="divide-y divide-border-light dark:divide-border-dark" role="list">
    <li class="p-6 flex flex-col sm:flex-row gap-6">
      <div class="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border bg-white">
        <img class="h-full w-full object-cover object-center" src="..."/>
      </div>
      <div class="flex flex-1 flex-col">
        <div>
          <div class="flex justify-between text-base font-medium text-secondary dark:text-white">
            <h3><a href="#">Balón de Fútbol Pro League 2023</a></h3>
            <p class="ml-4">29.99€</p>
          </div>
          <p class="mt-1 text-sm text-muted-light dark:text-muted-dark">Talla: 5</p>
          <p class="mt-1 text-sm text-muted-light dark:text-muted-dark">Color: Blanco/Negro</p>
        </div>
        <div class="flex flex-1 items-end justify-between text-sm">
          <p class="text-muted-light dark:text-muted-dark">Cant: 1</p>
        </div>
      </div>
    </li>
  </ul>
</div>
```

### 4. Cards del Sidebar
```html
<!-- Resumen del Pedido -->
<div class="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border p-6 sm:p-8">
  <h2 class="text-lg font-display font-bold text-secondary dark:text-white mb-6">Resumen del Pedido</h2>
  <div class="flow-root">
    <dl class="-my-4 text-sm divide-y divide-border-light dark:divide-border-dark">
      <div class="py-4 flex items-center justify-between">
        <dt class="text-muted-light dark:text-muted-dark">Subtotal</dt>
        <dd class="font-medium text-secondary dark:text-white">75.49€</dd>
      </div>
      <!-- ... más items ... -->
      <div class="py-4 flex items-center justify-between border-t-2 border-primary">
        <dt class="text-base font-bold text-secondary dark:text-white">Total</dt>
        <dd class="text-xl font-display font-bold text-secondary dark:text-white">97.33€</dd>
      </div>
    </dl>
  </div>
</div>

<!-- Dirección de Envío -->
<div class="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border p-6 sm:p-8">
  <h3 class="text-lg font-display font-bold text-secondary dark:text-white mb-4">Dirección de Envío</h3>
  <address class="not-italic text-sm text-muted-light dark:text-muted-dark space-y-2">
    <p class="font-bold text-secondary dark:text-white">Juan Pérez</p>
    <p>Calle Mayor 123, 4º B</p>
    <p>28001, Madrid</p>
    <p>España</p>
    <p class="mt-4 flex items-center gap-2">
      <span class="material-icons-outlined text-base">phone</span> +34 600 000 000
    </p>
  </address>
</div>

<!-- Método de Pago -->
<div class="bg-card-light dark:bg-card-dark rounded-xl shadow-sm border p-6 sm:p-8">
  <h3 class="text-lg font-display font-bold text-secondary dark:text-white mb-4">Método de Pago</h3>
  <div class="flex items-center gap-3 text-sm text-muted-light dark:text-muted-dark">
    <span class="material-icons-outlined text-3xl text-secondary dark:text-white">credit_card</span>
    <div class="flex flex-col">
      <span class="font-medium text-secondary dark:text-white">Tarjeta de Crédito</span>
      <span>Terminada en **** 4242</span>
    </div>
  </div>
</div>
```

### 5. Botones de Acción (Grid 2 Cols)
```html
<div class="grid grid-cols-1 gap-4">
  <button class="w-full bg-secondary dark:bg-white text-white dark:text-secondary hover:bg-gray-800 dark:hover:bg-gray-200 font-bold py-3 px-4 rounded-lg shadow transition-colors flex justify-center items-center gap-2">
    <span class="material-icons-outlined">print</span> Descargar Factura
  </button>
  <button class="w-full bg-primary text-black hover:bg-primary-hover font-bold py-3 px-4 rounded-lg shadow transition-colors">
    Seguir Comprando
  </button>
</div>
```

---

## ⚠️ Inconsistencias Detectadas (ACTUALIZADO FINAL)

1. **CUATRO combinaciones de fuentes diferentes**:
   - Inicio + Confirmación: Montserrat + Open Sans
   - Categoría/Producto: Anton + Roboto
   - Carrito: Oswald + Inter
   - Checkout: Montserrat + Inter
2. **Headers diferentes** en cada tipo de página:
   - Inicio + Confirmación: Blanco con navegación completa + iconos
   - Categoría/Producto: Negro sticky sin top bar
   - Carrito: Blanco con navegación simple
   - Checkout: Blanco minimalista (solo logo + "Volver")
3. **Iconos**: Material Icons Outlined en todas las páginas
4. **Toggle dark mode**: Solo en categoría, producto y carrito (NO en inicio, checkout ni confirmación)
5. **Border-top amarillo en footer**: Solo en carrito, checkout y confirmación
6. **Badge en carrito**: Inicio/Confirmación muestran badge incluso con 0 items, otras páginas con cantidad actual
7. **Colores con nombres de variables diferentes** entre páginas (muted-light vs text-sub-light)

---

---

## 📋 Página de Usuario/Cuenta (account.html)

### Características:
- ✅ **Header diferente**:
  - Fondo light con border-bottom
  - Logo con icono sports_soccer + nombre "Eva Deportes"
  - Buscador central (oculto en mobile)
  - Nav simple: Juguetes | Deportes | Ofertas
  - Iconos: shopping_cart (con badge "3"), favorite, avatar de usuario
  - Sin dark mode toggle visible (pero estructura dark preparada)
- ✅ **Layout sidebar + contenido**:
  - Sidebar fijo a la izquierda (w-72, shrink-0)
  - Contenido principal flex-1
  - Responsive: sidebar arriba en mobile, izquierda en desktop
- ✅ **Sidebar de Navegación**:
  - Header con nombre "Juan Pérez" + badge "Cliente VIP desde 2023"
  - Nav vertical con iconos Material Symbols
  - Item activo: bg-primary, text negro, font-bold
  - Items: Panel de Control | Mis Pedidos | Detalles de Cuenta | Direcciones | Lista de Deseos
  - Botón "Cerrar Sesión" en footer con border-top
- ✅ **Breadcrumb**: Inicio / Mi Cuenta
- ✅ **Page Header**:
  - Título "Panel de Control" (text-4xl, font-black)
  - Descripción pequeña
  - Botón "Editar Perfil" (bg-primary/20, border primary/30)
- ✅ **Stats Grid** (3 cards):
  - Pedidos Totales: 12
  - En Camino: 01 (text-green-600)
  - Puntos Eva: 450
  - Cada card con icono Material Symbols en esquina
- ✅ **Tabla "Pedidos Recientes"**:
  - Header con "Ver todos" link
  - Columns: ID Pedido | Fecha | Estado | Total | Acciones
  - Estados con badges coloreados: Enviado (green), Completado (neutral), Cancelado (red)
  - Responsive con overflow-x-auto
- ✅ **Grid 2 cols** (Información + Dirección):
  - Card "Información de Perfil": Nombre, Email, Teléfono
  - Card "Dirección de Envío Principal": Dirección completa + botón "Cambiar Dirección"
- ✅ **Sección "Tu Lista de Deseos"**:
  - Grid 2 cols mobile, 4 cols desktop
  - ProductCard simplificado con aspect-square
  - Botón favorito absoluto top-right (fill-red-500)
  - Marca, nombre, precio
- ✅ **Footer simplificado**:
  - Border-top
  - Logo en grayscale opacity-70
  - Copyright
  - 3 iconos sociales

### Fuentes:
```html
<link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
```

**¡QUINTA COMBINACIÓN DE FUENTES!**
- display + body: **Lexend** (solo una fuente para todo)
- **Material Symbols Outlined** (diferente de Material Icons Outlined)

### Colores:
- primary: #f2cc0d (¡DIFERENTE! Más oscuro que #FFED00)
- background-light: #f8f8f5
- background-dark: #221f10
- text-light: #1c190d
- text-dark: white
- borders: #e8e4ce (light) / #3a351a (dark)
- cards: white (light) / #2d2915 (dark)
- muted: #9c8e49

### Funcionalidades JS:
- ✅ Ninguna JS visible (navegación estática)
- ✅ Dark mode preparado en clases pero no toggle

---

## 🎯 Elementos Únicos de Cuenta

### 1. Sidebar de Navegación de Usuario
```html
<aside class="w-full lg:w-72 shrink-0">
  <div class="bg-white dark:bg-[#2d2915] rounded-xl p-6 shadow-sm border border-[#e8e4ce] dark:border-[#3a351a]">
    <div class="mb-8">
      <h1 class="text-xl font-bold">Juan Pérez</h1>
      <p class="text-[#9c8e49] text-sm">Cliente VIP desde 2023</p>
    </div>
    <nav class="flex flex-col gap-1">
      <!-- Item activo -->
      <a class="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary text-[#1c190d] font-bold transition-all" href="#">
        <span class="material-symbols-outlined">dashboard</span>
        <span>Panel de Control</span>
      </a>

      <!-- Item normal -->
      <a class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#f4f1e7] dark:hover:bg-[#3a351a] transition-all" href="#">
        <span class="material-symbols-outlined">package</span>
        <span>Mis Pedidos</span>
      </a>

      <!-- Botón logout -->
      <div class="mt-8 pt-6 border-t border-[#e8e4ce] dark:border-[#3a351a]">
        <button class="w-full flex items-center justify-center gap-2 bg-[#1c190d] text-white py-3 rounded-lg font-bold hover:bg-black transition-all">
          <span class="material-symbols-outlined text-sm">logout</span>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  </div>
</aside>
```

### 2. Stats Cards
```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div class="bg-white dark:bg-[#2d2915] p-6 rounded-xl border border-[#e8e4ce] dark:border-[#3a351a] flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-[#9c8e49]">Pedidos Totales</p>
      <span class="material-symbols-outlined text-primary">shopping_bag</span>
    </div>
    <p class="text-3xl font-bold">12</p>
  </div>

  <!-- Card con valor verde -->
  <div class="bg-white dark:bg-[#2d2915] p-6 rounded-xl border border-[#e8e4ce] dark:border-[#3a351a] flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <p class="text-sm font-medium text-[#9c8e49]">En Camino</p>
      <span class="material-symbols-outlined text-primary">local_shipping</span>
    </div>
    <p class="text-3xl font-bold text-green-600">01</p>
  </div>
</div>
```

### 3. Tabla de Pedidos Recientes
```html
<section class="bg-white dark:bg-[#2d2915] rounded-xl border border-[#e8e4ce] dark:border-[#3a351a] overflow-hidden">
  <div class="p-6 border-b border-[#e8e4ce] dark:border-[#3a351a] flex justify-between items-center">
    <h3 class="font-bold text-lg">Pedidos Recientes</h3>
    <a class="text-sm font-bold text-primary hover:underline" href="#">Ver todos</a>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full text-left">
      <thead>
        <tr class="bg-[#fcfbf8] dark:bg-[#3a351a] text-[#9c8e49] text-xs uppercase tracking-wider">
          <th class="px-6 py-4">ID Pedido</th>
          <th class="px-6 py-4">Fecha</th>
          <th class="px-6 py-4">Estado</th>
          <th class="px-6 py-4 text-right">Total</th>
          <th class="px-6 py-4">Acciones</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-[#e8e4ce] dark:divide-[#3a351a]">
        <tr>
          <td class="px-6 py-4 font-bold text-sm">#EVA-9834</td>
          <td class="px-6 py-4 text-sm">12 Oct, 2023</td>
          <td class="px-6 py-4">
            <span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded">Enviado</span>
          </td>
          <td class="px-6 py-4 text-sm font-bold text-right">45.00€</td>
          <td class="px-6 py-4">
            <button class="text-primary hover:text-[#1c190d] dark:hover:text-white font-bold text-sm">Detalles</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
```

### 4. Cards de Información (Perfil + Dirección)
```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
  <!-- Información de Perfil -->
  <div class="bg-white dark:bg-[#2d2915] p-6 rounded-xl border border-[#e8e4ce] dark:border-[#3a351a] relative">
    <h3 class="font-bold mb-6 flex items-center gap-2">
      <span class="material-symbols-outlined">account_circle</span>
      Información de Perfil
    </h3>
    <div class="space-y-4">
      <div class="flex flex-col">
        <span class="text-xs text-[#9c8e49] uppercase">Nombre Completo</span>
        <span class="font-medium">Juan Pérez Sánchez</span>
      </div>
      <div class="flex flex-col">
        <span class="text-xs text-[#9c8e49] uppercase">Correo Electrónico</span>
        <span class="font-medium">juan.perez@ejemplo.com</span>
      </div>
    </div>
  </div>

  <!-- Dirección de Envío -->
  <div class="bg-white dark:bg-[#2d2915] p-6 rounded-xl border border-[#e8e4ce] dark:border-[#3a351a]">
    <h3 class="font-bold mb-6 flex items-center gap-2">
      <span class="material-symbols-outlined">home_pin</span>
      Dirección de Envío Principal
    </h3>
    <div class="space-y-2 mb-6">
      <p class="font-bold">Juan Pérez</p>
      <p class="text-sm text-[#9c8e49]">Calle de los Juguetes 123, 2ºB</p>
      <p class="text-sm text-[#9c8e49]">28001 Madrid, España</p>
    </div>
    <button class="w-full py-2 bg-[#f4f1e7] dark:bg-[#3a351a] hover:bg-primary/20 hover:text-primary transition-all rounded-lg text-sm font-bold">
      Cambiar Dirección
    </button>
  </div>
</div>
```

### 5. Lista de Deseos (Wishlist)
```html
<section>
  <div class="flex justify-between items-center mb-6">
    <h3 class="text-2xl font-black">Tu Lista de Deseos</h3>
    <button class="text-primary font-bold hover:underline">Ver todos</button>
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white dark:bg-[#2d2915] rounded-xl border border-[#e8e4ce] dark:border-[#3a351a] overflow-hidden group">
      <div class="aspect-square bg-[#f4f1e7] dark:bg-[#3a351a] relative">
        <img class="w-full h-full object-cover" src="..."/>
        <button class="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-500 shadow-sm">
          <span class="material-symbols-outlined text-sm fill-red-500">favorite</span>
        </button>
      </div>
      <div class="p-4">
        <p class="text-xs text-[#9c8e49] font-bold">HASBRO</p>
        <h4 class="font-bold text-sm mb-2 line-clamp-1">Figura de Acción Legend</h4>
        <p class="font-black text-primary">24.99€</p>
      </div>
    </div>
  </div>
</section>
```

---

## ⚠️ Inconsistencias Detectadas (ACTUALIZADO FINAL)

1. **CINCO combinaciones de fuentes diferentes**:
   - Inicio + Confirmación: Montserrat + Open Sans
   - Categoría/Producto: Anton + Roboto
   - Carrito: Oswald + Inter
   - Checkout: Montserrat + Inter
   - **Cuenta: Lexend (solo una fuente)**
2. **Headers diferentes** en cada tipo de página:
   - Inicio + Confirmación: Blanco con navegación completa + iconos
   - Categoría/Producto: Negro sticky sin top bar
   - Carrito: Blanco con navegación simple
   - Checkout: Blanco minimalista (solo logo + "Volver")
   - **Cuenta: Blanco con buscador central + avatar usuario**
3. **Iconos**:
   - Material Icons Outlined en páginas 1-6
   - **Material Symbols Outlined en página de cuenta** (diferente librería)
4. **Toggle dark mode**: Solo en categoría, producto y carrito (NO en inicio, checkout, confirmación ni cuenta)
5. **Border-top en footer**: Solo en carrito, checkout, confirmación y cuenta
6. **Color primary diferente**:
   - Páginas 1-6: #FFED00
   - **Cuenta: #f2cc0d** (más oscuro/dorado)
7. **Avatar de usuario**: Solo visible en página de cuenta

---

## 📝 Resumen de Páginas Recibidas

- [x] **Página de inicio** (index.html) - Montserrat + Open Sans
- [x] **Página de categoría/filtros** (category.html) - Anton + Roboto
- [x] **Página de detalle de producto** (product.html) - Anton + Roboto
- [x] **Página de carrito** (cart.html) - Oswald + Inter
- [x] **Página de checkout** (checkout.html) - Montserrat + Inter
- [x] **Página de confirmación** (confirmation.html) - Montserrat + Open Sans
- [x] **Página de cuenta/usuario** (account.html) - Lexend
- [ ] Otras páginas opcionales (búsqueda, contacto, etc.)

---

## 🎯 Patrones Comunes Identificados

### Colores Consistentes:
- **primary**: #FFED00 (amarillo brillante) - TODAS las páginas ✅
- **secondary/black**: #000000 o #111111 - Consistente ✅

### Iconos:
- **Material Icons Outlined** en TODAS las páginas ✅

### Footer:
- Todas tienen footer negro
- Carrito, Checkout y Confirmación tienen **border-t-4 border-primary** ✅
- Inicio, Categoría y Producto **NO** tienen border-top

### Responsive:
- Todas usan Tailwind con breakpoints: sm, md, lg
- Grid layouts comunes: 4 cols (productos), 8+4 cols (contenido+sidebar), 12 cols (checkout)

---

**Última actualización:** 2026-01-09
**Estado:** ✅ DOCUMENTACIÓN COMPLETA DE 7 PÁGINAS PRINCIPALES

---

## 💡 Observaciones para el Panel Admin

La página de cuenta de usuario usa:
- **Layout sidebar + contenido** (perfecto para panel admin)
- **Tabla responsive** con estados coloreados (ideal para gestión)
- **Stats cards** con iconos (métricas del negocio)
- **Navigation vertical** (Dashboard, Productos, Pedidos, Usuarios, etc.)
- **Material Symbols Outlined** (más moderna que Material Icons)
- **Color primary más oscuro** (#f2cc0d vs #FFED00)
- **Fuente Lexend** (única fuente, más limpia para admin)

Estos patrones se pueden reutilizar para:
- Panel admin de productos
- Gestión de pedidos
- Lista de usuarios
- Analytics/estadísticas
