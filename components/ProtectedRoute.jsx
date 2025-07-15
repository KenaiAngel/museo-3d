"use client";
import { useUser } from "../providers/UserProvider";
import { useModal } from "../providers/ModalProvider";
import { ModalWrapper } from "./ui/Modal";
import { PageLoader } from "./LoadingSpinner";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useEffect, useCallback } from "react";
import { UnauthorizedScreen } from "./shared";

export default function ProtectedRoute({
  children,
  requiredRole = null,
  requiredRoles = null,
  fallback = null,
  showLoginModal = true,
  loginText = "Iniciar Sesión",
  deniedText = "Ver Mi Perfil",
  ...rest
}) {
  const { isAuthenticated, isAdmin, isModerator, hasRole, isLoading } =
    useUser();
  const { openModal } = useModal();
  const pathname = usePathname();
  const buttonRef = useRef(null);

  // Foco automático en el botón principal
  useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  }, [isAuthenticated, requiredRole, requiredRoles]);

  // Si está cargando, mostrar loading mejorado
  if (isLoading) {
    return <PageLoader text="Verificando acceso..." />;
  }

  // Si no está autenticado
  if (!isAuthenticated) {
    useEffect(() => {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("redirectAfterLogin", pathname);
      }
    }, [pathname]);

    useEffect(() => {
      if (showLoginModal) {
        setTimeout(() => {
          openModal("auth-login", { mode: "login", redirectTo: pathname });
        }, 100);
      }
    }, [showLoginModal, openModal, pathname]);

    return (
      fallback || (
        <AnimatePresence>
          <motion.div
            key="login-required"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-background flex items-center justify-center p-4"
          >
            <UnauthorizedScreen
              title="Acceso Requerido"
              message="Necesitas iniciar sesión para acceder a esta página."
              linkText={loginText}
              linkHref="#"
              withBackground={true}
              onLinkClick={() =>
                openModal("auth-login", { mode: "login", redirectTo: pathname })
              }
              buttonRef={buttonRef}
            />
          </motion.div>
        </AnimatePresence>
      )
    );
  }

  // Si requiere un rol específico o múltiples roles
  let hasRequiredRole = true;
  if (requiredRole) {
    hasRequiredRole = hasRole(requiredRole);
  }
  if (requiredRoles && Array.isArray(requiredRoles)) {
    hasRequiredRole = requiredRoles.some((role) => hasRole(role));
  }

  if (!hasRequiredRole) {
    return (
      fallback || (
        <AnimatePresence>
          <motion.div
            key="access-denied"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-background flex items-center justify-center p-4"
          >
            <UnauthorizedScreen
              title="Acceso Denegado"
              message={
                requiredRole || (requiredRoles && requiredRoles.length)
                  ? `No tienes los permisos necesarios para acceder a esta página.\nRol requerido: ${requiredRole || requiredRoles.join(", ")}`
                  : "No tienes los permisos necesarios para acceder a esta página."
              }
              linkText={deniedText}
              linkHref="#"
              withBackground={true}
              onLinkClick={() =>
                openModal("user-info-modal", {
                  showRequiredRole: requiredRole || requiredRoles,
                })
              }
              buttonRef={buttonRef}
            />
          </motion.div>
        </AnimatePresence>
      )
    );
  }

  // Si todo está bien, mostrar el contenido
  return children;
}
