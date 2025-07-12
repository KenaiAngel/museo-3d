# Mensajes de Sentry Implementados en Museo 3D

## 📊 **Resumen de Eventos Monitoreados**

Esta documentación describe todos los mensajes informativos importantes implementados en Sentry para monitorear eventos clave de la aplicación.

## 🔐 **Autenticación y Usuarios**

### ✅ Implementado:

- **Login exitoso**: Captura cuando un usuario inicia sesión
- **Logout**: Captura cuando un usuario cierra sesión
- **Registro de usuarios**: Tanto por admin como registro público
- **Navegación entre páginas**: Tracking de rutas importantes

**Ubicaciones**:

- `lib/auth.js` - Sesiones
- `app/api/usuarios/route.js` - Registro
- `components/SentryTracker.jsx` - Navegación

## 🎨 **Colecciones y Favoritos**

### ✅ Implementado:

- **Agregar mural a colección**: Con título del mural
- **Remover mural de colección**: Con ID del mural

**Ubicación**: `app/api/collection/route.js`

## 🏛️ **Salas**

### ✅ Implementado:

- **Creación de salas**: Con información completa (nombre, privacidad, creador)
- **Acceso a salas**: Tracking de navegación (breadcrumbs)

**Ubicaciones**:

- `app/api/salas/route.js` - Creación
- `components/SentryTracker.jsx` - Acceso

## 🔧 **Administración**

### ✅ Implementado:

- **Acceso a logs de Sentry**: Tracking de acceso administrativo
- **Navegación admin**: Tracking especial para rutas de administración

**Ubicaciones**:

- `app/api/admin/sentry-logs/route.js`
- `components/SentryTracker.jsx`

## 📤 **Uploads y Contenido**

### ✅ Implementado:

- **Subida de archivos**: Con información de tipo, tamaño y nombre

**Ubicación**: `app/api/upload/route.js`

## 🏥 **Salud del Sistema**

### ✅ Implementado:

- **Consultas lentas**: Detección automática >1000ms
- **Uso excesivo de memoria**: Alertas >100MB
- **Métricas del sistema**: Conteo de usuarios

**Ubicación**: `app/api/healthcheck/route.js`

## 🎭 **Galería y Navegación**

### ✅ Implementado:

- **Carga exitosa de galerías**: Con conteo de obras
- **Errores de carga**: Captura completa de excepciones
- **Navegación por secciones**: Breadcrumbs para galería, salas, colecciones

**Ubicaciones**:

- `providers/GalleryProvider.jsx`
- `components/SentryTracker.jsx`

---

## 📋 **Tipos de Eventos por Categoría**

### 🟢 **Info Level (Eventos Normales)**

- Inicios de sesión exitosos
- Registro de usuarios
- Creación de salas
- Subida de contenido
- Métricas del sistema normales
- Navegación entre páginas

### 🟡 **Warning Level (Alertas)**

- Consultas lentas (>1000ms)
- Uso excesivo de memoria (>100MB)
- Intentos de acceso no autorizados

### 🔴 **Error Level (Errores)**

- Fallos en carga de galerías
- Errores de API
- Excepciones no controladas

---

## 🏷️ **Tags Utilizados**

- `action`: Tipo de acción realizada
- `method`: Método utilizado (credentials, oauth, etc.)
- `visibility`: Público/privado para salas
- `admin_action`: Acciones específicas de administración
- `content_type`: Tipo de contenido subido
- `endpoint`: Endpoint específico de API

---

## 📊 **Métricas Monitoreadas**

1. **Conteo de usuarios activos**
2. **Tiempo de respuesta de base de datos**
3. **Uso de memoria del servidor**
4. **Tiempo de actividad del sistema**
5. **Frecuencia de subida de contenido**
6. **Patrones de navegación de usuarios**

---

## 🔍 **Beneficios para el Monitoreo**

### **Observabilidad**

- Visibilidad completa del flujo de usuarios
- Detección temprana de problemas de rendimiento
- Métricas de uso en tiempo real

### **Debugging**

- Contexto completo en errores
- Breadcrumbs para rastrear acciones previas
- Información de usuario y sesión

### **Analytics de Negocio**

- Patrones de uso de la aplicación
- Métricas de engagement
- Análisis de funcionalidades más utilizadas

### **Alertas Proactivas**

- Detección de consultas lentas
- Alertas de memoria
- Monitoreo de salud del sistema

---

## 📈 **Dashboard Recomendado en Sentry**

1. **Panel de Usuarios**: Login/logout rates, registros
2. **Panel de Contenido**: Uploads, creación de salas
3. **Panel de Performance**: Consultas lentas, métricas del sistema
4. **Panel de Navegación**: Rutas más visitadas, engagement
5. **Panel de Administración**: Acciones administrativas

Este sistema de logging proporciona una visibilidad completa del comportamiento de la aplicación y permite identificar tanto problemas técnicos como oportunidades de mejora en la experiencia del usuario.
