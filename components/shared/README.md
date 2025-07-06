# Componentes Compartidos

Esta carpeta contiene componentes reutilizables que pueden ser usados en toda la aplicación para mantener consistencia y evitar duplicación de código.

## Componentes Disponibles

### 🎨 AnimatedBackground
Componente de fondo animado con blobs y patrón de puntos.

```jsx
import { AnimatedBackground, AnimatedBlobsBackground, DotsPattern } from '../../components/shared';

// Uso completo (recomendado)
<AnimatedBackground />

// Uso individual
<div className="relative">
  <AnimatedBlobsBackground />
  <DotsPattern />
</div>
```

### ⏳ LoadingScreen
Pantalla de carga personalizable con animación.

```jsx
import { LoadingScreen } from '../../components/shared';

// Uso básico
<LoadingScreen />

// Uso personalizado
<LoadingScreen 
  message="Cargando tus obras..." 
  withBackground={true}
  fullScreen={true}
  className="min-h-[400px]"
/>
```

**Props:**
- `message` (string): Mensaje a mostrar. Default: "Cargando..."
- `withBackground` (boolean): Mostrar fondo animado. Default: true
- `fullScreen` (boolean): Ocupar toda la pantalla. Default: true
- `className` (string): Clases CSS adicionales

### 🔒 UnauthorizedScreen
Pantalla para usuarios no autenticados.

```jsx
import { UnauthorizedScreen } from '../../components/shared';

// Uso básico
<UnauthorizedScreen />

// Uso personalizado
<UnauthorizedScreen 
  title="Inicia sesión para ver tus obras"
  message="Necesitas estar autenticado para crear y gestionar tus obras de arte"
  linkText="Volver al inicio"
  linkHref="/"
  withBackground={true}
/>
```

**Props:**
- `title` (string): Título principal. Default: "Inicia sesión para continuar"
- `message` (string): Mensaje adicional (opcional)
- `linkText` (string): Texto del enlace. Default: "Volver al inicio"
- `linkHref` (string): URL del enlace. Default: "/"
- `withBackground` (boolean): Mostrar fondo animado. Default: true

## Migración de Componentes Existentes

Si encuentras componentes duplicados en la aplicación, sigue estos pasos:

1. **Identifica el componente duplicado** (ej: AnimatedBlobsBackground)
2. **Verifica si ya existe en shared** (consulta este README)
3. **Si no existe, muévelo aquí** y hazlo más genérico
4. **Actualiza todas las importaciones** para usar la versión compartida
5. **Elimina las versiones duplicadas**

### Ejemplo de Migración:

Antes:
```jsx
// En /app/galeria/page.jsx
function AnimatedBlobsBackground() {
  return (
    <>
      <div className="absolute top-0 left-0 w-[520px]..." />
      // ...
    </>
  );
}
```

Después:
```jsx
// En /app/galeria/page.jsx
import { AnimatedBackground } from '../../components/shared';

// En el componente
<AnimatedBackground />
```

## Beneficios

- ✅ **Consistencia**: Misma apariencia en toda la app
- ✅ **Mantenimiento**: Un solo lugar para actualizaciones
- ✅ **Reutilización**: Fácil de usar en cualquier parte
- ✅ **Personalización**: Props para adaptar a cada caso
- ✅ **Menos código**: Evita duplicación

## Guías de Uso

1. **Siempre usa los componentes compartidos** antes de crear uno nuevo
2. **Personaliza con props** en lugar de duplicar
3. **Contribuye** moviendo componentes duplicados aquí
4. **Documenta** nuevos componentes agregados
