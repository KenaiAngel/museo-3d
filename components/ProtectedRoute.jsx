"use client";
import { useUser } from "../providers/UserProvider";
import { useModal } from "../providers/ModalProvider";
import { ModalWrapper } from "./ui/Modal";
import { PageLoader } from "./LoadingSpinner";

export default function ProtectedRoute({
  children,
  requiredRole = null,
  fallback = null,
  showLoginModal = true,
}) {
  const { isAuthenticated, isAdmin, isModerator, hasRole, isLoading } =
    useUser();
  const { openModal } = useModal();

  // Si está cargando, mostrar loading mejorado
  if (isLoading) {
    return <PageLoader text="Verificando acceso..." />;
  }

  // Si no está autenticado
  if (!isAuthenticated) {
    if (showLoginModal) {
      // Abrir modal de login automáticamente
      setTimeout(() => {
        openModal("auth-modal", { mode: "login" });
      }, 100);
    }

    return (
      fallback || (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md mx-auto">
            <div className="text-6xl mb-6 opacity-20">🔒</div>
            <h2 className="text-2xl font-light text-foreground mb-4">
              Acceso Requerido
            </h2>
            <p className="text-muted-foreground mb-8">
              Necesitas iniciar sesión para acceder a esta página.
            </p>
            <button
              onClick={() => openModal("auth-modal", { mode: "login" })}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              🔑 Iniciar Sesión
            </button>
          </div>
        </div>
      )
    );
  }

  // Si requiere un rol específico
  if (requiredRole) {
    const hasRequiredRole = hasRole(requiredRole);

    if (!hasRequiredRole) {
      return (
        fallback || (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center max-w-md mx-auto">
              <div className="text-6xl mb-6 opacity-20">🚫</div>
              <h2 className="text-2xl font-light text-foreground mb-4">
                Acceso Denegado
              </h2>
              <p className="text-muted-foreground mb-8">
                No tienes los permisos necesarios para acceder a esta página.
                <br />
                <span className="font-medium text-foreground">
                  Rol requerido: {requiredRole}
                </span>
              </p>
              <button
                onClick={() =>
                  openModal("user-info-modal", {
                    showRequiredRole: requiredRole,
                  })
                }
                className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-medium hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                👤 Ver Mi Perfil
              </button>
            </div>
          </div>
        )
      );
    }
  }

  // Si todo está bien, mostrar el contenido
  return children;
}
