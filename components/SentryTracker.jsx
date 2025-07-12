"use client";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

/**
 * Componente para capturar eventos de navegación y uso de la aplicación
 */
export default function SentryTracker() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  // Capturar navegación entre páginas
  useEffect(() => {
    if (status === "loading") return;

    // Configurar usuario en Sentry si está autenticado
    if (session?.user) {
      Sentry.setUser({
        id: session.user.id,
        email: session.user.email,
        username: session.user.name,
        role: session.user.role,
      });
    } else {
      Sentry.setUser(null);
    }

    // Capturar navegación
    const isAdminRoute = pathname.startsWith("/admin");
    const isGalleryRoute = pathname.startsWith("/galeria");
    const isRoomRoute =
      pathname.startsWith("/salas") || pathname.startsWith("/mis-salas");
    const isCollectionRoute = pathname.startsWith("/mis-obras");

    if (isAdminRoute && session?.user?.role === "ADMIN") {
      Sentry.captureMessage(`Acceso a panel de administración: ${pathname}`, {
        level: "info",
        tags: {
          action: "admin_navigation",
          route: pathname,
        },
        user: { id: session.user.id, email: session.user.email },
      });
    }

    if (isGalleryRoute) {
      Sentry.addBreadcrumb({
        message: `Usuario navegando galería: ${pathname}`,
        category: "navigation",
        level: "info",
        data: {
          userId: session?.user?.id,
          route: pathname,
        },
      });
    }

    if (isRoomRoute) {
      Sentry.addBreadcrumb({
        message: `Usuario accediendo a salas: ${pathname}`,
        category: "navigation",
        level: "info",
        data: {
          userId: session?.user?.id,
          route: pathname,
        },
      });
    }

    if (isCollectionRoute && session?.user) {
      Sentry.addBreadcrumb({
        message: `Usuario viendo colección personal: ${pathname}`,
        category: "navigation",
        level: "info",
        data: {
          userId: session.user.id,
          route: pathname,
        },
      });
    }
  }, [pathname, session, status]);

  // Capturar logout
  useEffect(() => {
    if (status === "unauthenticated" && pathname !== "/") {
      // Usuario cerró sesión
      Sentry.captureMessage("Usuario cerró sesión", {
        level: "info",
        tags: { action: "user_logout" },
      });
    }
  }, [status, pathname]);

  return null; // Este componente no renderiza nada
}
