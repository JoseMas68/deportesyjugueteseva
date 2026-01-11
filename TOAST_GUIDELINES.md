# Guías de Toast Notifications

## Regla General del Proyecto

**SIEMPRE usar toasts en lugar de `alert()` o `confirm()` nativos.**

## Librería de Toasts

Ubicación: `frontend/src/lib/toast.ts`

## Funciones Disponibles

### Toasts Informativos

```typescript
import { toastSuccess, toastError, toastWarning, toastInfo } from '@/lib/toast';

// Éxito (verde)
toastSuccess('Operación completada correctamente');

// Error (rojo)
toastError('Ocurrió un error');

// Advertencia (amarillo)
toastWarning('Ten cuidado con esto');

// Información (azul)
toastInfo('Información importante');
```

### Duración Personalizada

```typescript
// Toast que dura 5 segundos
toastSuccess('Mensaje', 5000);
```

## Casos de Uso Comunes

### 1. Cerrar Sesión

```typescript
// ❌ MAL - No usar confirm
if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
  logout();
  window.location.href = '/';
}

// ✅ BIEN - Usar toast
logout();
toastInfo('Sesión cerrada correctamente');
setTimeout(() => {
  window.location.href = '/';
}, 500);
```

### 2. Eliminar Items

```typescript
// ❌ MAL - No usar confirm
if (confirm('¿Eliminar de la lista de deseos?')) {
  removeFromWishlist(productId);
  toastSuccess('Eliminado de favoritos');
}

// ✅ BIEN - Eliminar directamente con toast de confirmación
removeFromWishlist(productId);
toastSuccess('Eliminado de favoritos');
```

### 3. Operaciones CRUD

```typescript
// Crear
toastSuccess('Dirección agregada');

// Actualizar
toastSuccess('Dirección actualizada');

// Eliminar
toastSuccess('Dirección eliminada');

// Errores
toastError('Error al guardar la dirección');
```

### 4. Validaciones y Feedback

```typescript
// Validación exitosa
toastSuccess('Formulario guardado correctamente');

// Validación fallida
toastError('Por favor completa todos los campos');

// Información general
toastInfo('Los cambios se guardarán automáticamente');

// Advertencia
toastWarning('Esta acción no se puede deshacer');
```

## Archivos Actualizados

Los siguientes archivos ya implementan correctamente los toasts:

- ✅ `frontend/src/pages/cuenta.astro`
- ✅ `frontend/src/pages/cuenta/detalles.astro`
- ✅ `frontend/src/pages/cuenta/pedidos.astro`
- ✅ `frontend/src/pages/cuenta/direcciones.astro`

## Checklist para Nuevas Páginas

Cuando crees una nueva página o componente:

1. [ ] Importar funciones de toast necesarias
2. [ ] Reemplazar todos los `alert()` por toasts
3. [ ] Reemplazar todos los `confirm()` por toasts o acciones directas
4. [ ] Usar `toastInfo()` para cerrar sesión
5. [ ] Usar `toastSuccess()` para operaciones exitosas
6. [ ] Usar `toastError()` para errores
7. [ ] Agregar `setTimeout()` de 500ms antes de redirecciones

## Ejemplo Completo

```typescript
import { toastSuccess, toastError, toastInfo } from '@/lib/toast';

// Ejemplo de operación con API
async function deleteItem(itemId: string) {
  try {
    const response = await fetch(`/api/items/${itemId}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      toastSuccess('Item eliminado correctamente');
      await reloadItems();
    } else {
      const result = await response.json();
      toastError(result.error || 'Error al eliminar');
    }
  } catch (error) {
    console.error('Delete error:', error);
    toastError('Error de conexión');
  }
}

// Ejemplo de logout
function handleLogout() {
  logout();
  toastInfo('Sesión cerrada correctamente');
  setTimeout(() => {
    window.location.href = '/';
  }, 500);
}
```

## Notas Importantes

- **NO** usar `window.alert()` en ningún lugar del proyecto
- **NO** usar `window.confirm()` para confirmaciones (usar acciones directas + toast)
- **SIEMPRE** dar feedback visual con toasts en operaciones importantes
- Para operaciones destructivas, mostrar el toast de éxito DESPUÉS de la acción
- Usar `setTimeout` de ~500ms antes de redirecciones para que el usuario vea el toast
