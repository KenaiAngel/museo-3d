"use client";
import { SessionProvider as NextAuthSessionProvider, useSession } from "next-auth/react";
import { createContext, useContext, useEffect, useState, useRef } from "react";
import * as Sentry from "@sentry/nextjs";

const SessionContext = createContext();

function SessionDataManager({ children }) {
  const [sessionData, setSessionData] = useState(null);
  const [sessionStatus, setSessionStatus] = useState("loading");
  const [lastActivity, setLastActivity] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const { status, update, data: session } = useSession();
  const hasRefreshed = useRef(false);

  // Actualizar actividad del usuario
  const updateActivity = () => {
    setLastActivity(new Date());
  };

  // Calcular duración de la sesión
  useEffect(() => {
    if (sessionData) {
      const interval = setInterval(() => {
        if (sessionData?.expires) {
          const now = new Date();
          const expires = new Date(sessionData.expires);
          const duration = Math.max(0, expires.getTime() - now.getTime());
          setSessionDuration(duration);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [sessionData]);

  // Escuchar eventos de actividad del usuario
  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    const handleActivity = () => {
      updateActivity();
    };
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, []);

  // Formatear duración de sesión
  const formatSessionDuration = () => {
    if (sessionDuration <= 0) return "Sesión expirada";
    const hours = Math.floor(sessionDuration / (1000 * 60 * 60));
    const minutes = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((sessionDuration % (1000 * 60)) / 1000);
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Verificar si la sesión está por expirar
  const isSessionExpiringSoon = () => {
    return sessionDuration > 0 && sessionDuration < 5 * 60 * 1000; // 5 minutos
  };

  // Verificar si la sesión ha expirado
  const isSessionExpired = () => {
    return sessionDuration <= 0;
  };

  // Obtener tiempo restante en minutos
  const getSessionTimeRemaining = () => {
    return Math.max(0, Math.floor(sessionDuration / (1000 * 60)));
  };

  // Refrescar sesión tras login
  useEffect(() => {
    if (status === "authenticated" && !hasRefreshed.current) {
      update();
      hasRefreshed.current = true;
    }
    if (status === "unauthenticated") {
      hasRefreshed.current = false;
    }
  }, [status, update]);

  // Sincronizar datos de sesión
  useEffect(() => {
    setSessionData(session);
  }, [session]);
  useEffect(() => {
    setSessionStatus(status);
  }, [status]);

  // Setear usuario en Sentry globalmente
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email,
        username: session.user.name,
      });
    } else if (status === "unauthenticated") {
      Sentry.setUser(null);
    }
  }, [status, session]);

  return (
    <SessionContext.Provider
      value={{
        session: sessionData,
        status: sessionStatus,
        lastActivity,
        sessionDuration: formatSessionDuration(),
        sessionTimeRemaining: getSessionTimeRemaining(),
        isSessionExpiringSoon: isSessionExpiringSoon(),
        isSessionExpired: isSessionExpired(),
        updateActivity,
        formatSessionDuration,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function SessionProvider({ children }) {
  return (
    <NextAuthSessionProvider>
      <SessionDataManager>{children}</SessionDataManager>
    </NextAuthSessionProvider>
  );
}

export const useSessionData = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error(
      "useSessionData debe ser usado dentro de un SessionProvider"
    );
  }
  return context;
};
