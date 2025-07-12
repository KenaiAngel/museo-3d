"use client";
import { useSession } from "next-auth/react";
import Unauthorized from "../../../components/Unauthorized";

export default function AdminSesiones() {
  const { data: session, status } = useSession();

  // Verificación de autorización
  if (status === "loading") return <div>Cargando...</div>;
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <Unauthorized
        title="Acceso denegado"
        message="Esta sección es solo para administradores."
        error="403"
        showLogin={true}
        redirectPath="/"
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Página de sesiones no implementada
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta sección será implementada próximamente.
        </p>
      </div>
    </div>
  );
}
