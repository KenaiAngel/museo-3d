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

  // Eliminar usuario
  const handleDeleteUser = useCallback((user) => setUserToDelete(user), []);
  const confirmDeleteUser = useCallback(async () => {
    if (!userToDelete) return;
    try {
      const res = await fetch(`/api/usuarios/${userToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Usuario eliminado");
        setUserToDelete(null);
        fetchUsers();
      } else {
        toast.error("No se pudo eliminar el usuario");
      }
    } catch (e) {
      toast.error("Error al eliminar usuario");
    }
  }, [userToDelete, fetchUsers]);

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
    handleInvalidateEmail, // <-- exporta la función
  };
}
