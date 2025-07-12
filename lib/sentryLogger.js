import * as Sentry from "@sentry/nextjs";

/**
 * Utilidad para capturar mensajes informativos importantes en Sentry
 * Estos mensajes ayudan a monitorear eventos clave del sistema
 */

export const SentryLogger = {
  // Autenticación y usuarios
  userLogin: (userId, email, method = "credentials") => {
    Sentry.addBreadcrumb({
      message: `Usuario iniciando sesión: ${email}`,
      category: "auth",
      level: "info",
      data: { userId, email, method },
    });

    Sentry.captureMessage(`Usuario autenticado exitosamente: ${email}`, {
      level: "info",
      tags: {
        action: "user_login",
        method: method,
      },
      user: { id: userId, email },
      extra: { loginMethod: method, timestamp: new Date().toISOString() },
    });
  },

  userLogout: (userId, email) => {
    Sentry.captureMessage(`Usuario cerró sesión: ${email}`, {
      level: "info",
      tags: { action: "user_logout" },
      user: { id: userId, email },
    });
  },

  userRegistration: (userId, email, method = "email") => {
    Sentry.captureMessage(`Nuevo usuario registrado: ${email}`, {
      level: "info",
      tags: {
        action: "user_registration",
        method: method,
      },
      user: { id: userId, email },
      extra: {
        registrationMethod: method,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Colecciones y favoritos
  collectionAdd: (userId, muralId, muralTitle) => {
    Sentry.captureMessage(`Mural agregado a colección personal`, {
      level: "info",
      tags: { action: "collection_add" },
      user: { id: userId },
      extra: {
        muralId,
        muralTitle,
        timestamp: new Date().toISOString(),
      },
    });
  },

  collectionRemove: (userId, muralId) => {
    Sentry.captureMessage(`Mural removido de colección personal`, {
      level: "info",
      tags: { action: "collection_remove" },
      user: { id: userId },
      extra: { muralId, timestamp: new Date().toISOString() },
    });
  },

  // Salas
  roomCreated: (userId, roomId, roomName, isPublic) => {
    Sentry.captureMessage(`Nueva sala creada: ${roomName}`, {
      level: "info",
      tags: {
        action: "room_created",
        visibility: isPublic ? "public" : "private",
      },
      user: { id: userId },
      extra: {
        roomId,
        roomName,
        isPublic,
        timestamp: new Date().toISOString(),
      },
    });
  },

  roomAccess: (userId, roomId, roomName, accessType = "view") => {
    Sentry.addBreadcrumb({
      message: `Usuario accedió a sala: ${roomName}`,
      category: "navigation",
      level: "info",
      data: { userId, roomId, accessType },
    });
  },

  // Administración
  adminAction: (adminId, action, targetResource, details = {}) => {
    Sentry.captureMessage(`Acción de administrador: ${action}`, {
      level: "info",
      tags: {
        action: "admin_action",
        admin_action: action,
        resource: targetResource,
      },
      user: { id: adminId },
      extra: {
        targetResource,
        details,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // API y sistema
  apiUsage: (endpoint, method, userId = null, responseTime = null) => {
    Sentry.addBreadcrumb({
      message: `API llamada: ${method} ${endpoint}`,
      category: "api",
      level: "info",
      data: { endpoint, method, userId, responseTime },
    });
  },

  systemHealth: (metric, value, status = "ok") => {
    Sentry.captureMessage(`Métrica del sistema: ${metric}`, {
      level: status === "ok" ? "info" : "warning",
      tags: {
        action: "system_health",
        metric: metric,
        status: status,
      },
      extra: {
        metric,
        value,
        status,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Errores de negocio (no técnicos)
  businessEvent: (eventType, description, userId = null, metadata = {}) => {
    Sentry.captureMessage(`Evento de negocio: ${eventType}`, {
      level: "info",
      tags: {
        action: "business_event",
        event_type: eventType,
      },
      user: userId ? { id: userId } : undefined,
      extra: {
        description,
        metadata,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Uploads y contenido
  contentUpload: (userId, contentType, fileSize, fileName) => {
    Sentry.captureMessage(`Contenido subido: ${fileName}`, {
      level: "info",
      tags: {
        action: "content_upload",
        content_type: contentType,
      },
      user: { id: userId },
      extra: {
        fileName,
        fileSize,
        contentType,
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Performance crítico
  slowQuery: (query, duration, endpoint) => {
    Sentry.captureMessage(`Consulta lenta detectada: ${duration}ms`, {
      level: "warning",
      tags: {
        action: "slow_query",
        endpoint: endpoint,
      },
      extra: {
        query,
        duration,
        endpoint,
        threshold: "1000ms",
        timestamp: new Date().toISOString(),
      },
    });
  },

  // Configuración de usuario
  userPreferences: (userId, action, setting, value) => {
    Sentry.captureMessage(`Configuración de usuario actualizada: ${setting}`, {
      level: "info",
      tags: {
        action: "user_preferences",
        setting_action: action,
      },
      user: { id: userId },
      extra: {
        setting,
        value,
        action,
        timestamp: new Date().toISOString(),
      },
    });
  },
};

export default SentryLogger;
