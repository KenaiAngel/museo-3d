import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

/**
 * Hook para la gestión de usuarios en la página de administración.
 * Maneja búsqueda, filtrado por rol, fetch, cambio de rol y eliminación.
 */
export function useAdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch de usuarios con filtros
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (role) params.append("role", role);
      const res = await fetch(`/api/usuarios?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(
          (data.usuarios || []).map((user) => ({
            ...user,
            muralesCount: (user.salasPropias || []).reduce(
              (acc, sala) => acc + (sala._count?.murales || 0),
              0
            ),
          }))
        );
      }
    } catch (e) {
      toast.error("Error al buscar usuarios");
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  // Refetch al cambiar filtros
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Cambiar rol de usuario
  const handleRoleChange = useCallback(
    async (userId, newRole) => {
      try {
        const res = await fetch(`/api/usuarios/${userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        });
        if (res.ok) {
          toast.success("Rol actualizado");
          fetchUsers();
        } else {
          toast.error("No se pudo actualizar el rol");
        }
      } catch (e) {
        toast.error("Error al actualizar rol");
      }
    },
    [fetchUsers]
  );

  // Estado para análisis de eliminación
  const [deleteAnalysis, setDeleteAnalysis] = useState(null);
  const [deleteOptions, setDeleteOptions] = useState({
    preserveContent: true,
    reassignToAdmin: false,
    forceDelete: false,
  });

  // Análisis previo de eliminación
  const analyzeDeleteUser = useCallback(async (user) => {
    try {
      const res = await fetch(`/api/usuarios/${user.id}/delete`);
      if (res.ok) {
        const analysis = await res.json();
        setDeleteAnalysis(analysis);
        setUserToDelete(user);
      } else {
        toast.error("Error al analizar eliminación");
      }
    } catch (e) {
      toast.error("Error al analizar usuario");
    }
  }, []);

  // Eliminar usuario con opciones de seguridad
  const handleDeleteUser = useCallback(
    (user) => analyzeDeleteUser(user),
    [analyzeDeleteUser]
  );

  const confirmDeleteUser = useCallback(async () => {
    if (!userToDelete) return;

    try {
      // Mapear opciones del frontend al formato del backend
      const apiOptions = {
        forceDelete: deleteOptions.forceDelete || false,
        preserveContent:
          deleteOptions.preserveContent && !deleteOptions.deleteContent,
        reassignToAdmin: deleteOptions.reassignToAdmin || false,
        adminUserId: deleteOptions.adminUserId || undefined,
      };

      const res = await fetch(`/api/usuarios/${userToDelete.id}/delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiOptions),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Usuario eliminado exitosamente");
        setUserToDelete(null);
        setDeleteAnalysis(null);
        fetchUsers();
      } else {
        if (res.status === 409) {
          // Conflicto - mostrar advertencias
          toast.error("Eliminación bloqueada por seguridad");
          // El análisis ya está disponible en deleteAnalysis
        } else {
          toast.error(data.error || "No se pudo eliminar el usuario");
        }
      }
    } catch (e) {
      toast.error("Error al eliminar usuario");
    }
  }, [userToDelete, deleteOptions, fetchUsers]);

  // Cancelar eliminación
  const cancelDeleteUser = useCallback(() => {
    setUserToDelete(null);
    setDeleteAnalysis(null);
    setDeleteOptions({
      preserveContent: true,
      reassignToAdmin: false,
      forceDelete: false,
    });
  }, []);

  // Invalidar email de usuario
  const handleInvalidateEmail = useCallback(
    async (userId) => {
      try {
        const res = await fetch(`/api/usuarios/${userId}/invalidate-email`, {
          method: "POST",
        });
        if (res.ok) {
          toast.success("Email invalidado");
          fetchUsers();
        } else {
          toast.error("No se pudo invalidar el email");
        }
      } catch (e) {
        toast.error("Error al invalidar email");
      }
    },
    [fetchUsers]
  );

  return {
    users,
    loading,
    search,
    setSearch,
    role,
    setRole,
    handleRoleChange,
    handleDeleteUser,
    userToDelete,
    setUserToDelete,
    confirmDeleteUser,
    cancelDeleteUser,
    deleteAnalysis,
    deleteOptions,
    setDeleteOptions,
    handleInvalidateEmail, // <-- exporta la función
  };
}
