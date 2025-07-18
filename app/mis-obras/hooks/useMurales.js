"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export function useMurales() {
  const { data: session } = useSession();
  const [murales, setMurales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    tecnica: "",
    year: "",
    sortBy: "newest",
  });

  // Cargar murales del usuario
  const fetchUserMurales = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/murales?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMurales(data.murales || []);
      }
    } catch (error) {
      console.error("Error fetching murales:", error);
      toast.error("Error al cargar tus obras");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Cargar murales cuando cambie la sesión
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserMurales();
    }
  }, [session, fetchUserMurales]);

  // Filtrar murales
  const filteredMurales = murales
    .filter((mural) => {
      // Excluir murales eliminados (soft delete)
      if (mural.deletedAt) return false;
      // Solo mostrar obras del usuario actual
      if (session?.user?.id && mural.userId && mural.userId !== session.user.id)
        return false;
      if (
        session?.user?.name &&
        mural.autor &&
        mural.autor !== session.user.name
      )
        return false;

      // Filtros de búsqueda
      if (
        filters.search &&
        !mural.titulo?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !mural.autor?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !mural.tecnica?.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }

      // Filtro por técnica
      if (filters.tecnica && mural.tecnica !== filters.tecnica) return false;

      // Filtro por año
      if (filters.year && mural.year !== filters.year) return false;

      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "title":
          return (a.titulo || "").localeCompare(b.titulo || "");
        case "year":
          return (b.year || 0) - (a.year || 0);
        default:
          return 0;
      }
    });

  // Manejar guardado desde canvas
  const handleCanvasSave = useCallback((savedMural, editingMural) => {
    if (editingMural) {
      setMurales((murales) =>
        murales.map((m) => (m.id === savedMural.id ? savedMural : m))
      );
    } else {
      setMurales((murales) => [savedMural, ...murales]);
    }
  }, []);

  // Eliminar mural
  const handleDeleteMural = useCallback(
    async (muralId) => {
      try {
        const response = await fetch(`/api/murales/${muralId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          toast.success("Obra eliminada exitosamente");
          await fetchUserMurales(); // <-- Recargar lista tras eliminar
        } else {
          toast.error("Error al eliminar la obra");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al eliminar la obra");
      }
    },
    [fetchUserMurales]
  );

  // Agregar nueva obra
  const addMural = useCallback((newMural) => {
    setMurales((murales) => [newMural, ...murales]);
  }, []);

  // Resetear filtros
  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      tecnica: "",
      year: "",
      sortBy: "newest",
    });
  }, []);

  // Obtener opciones únicas para filtros
  const getFilterOptions = useCallback(() => {
    const tecnicas = [
      ...new Set(murales.map((m) => m.tecnica).filter(Boolean)),
    ];
    const years = [...new Set(murales.map((m) => m.year).filter(Boolean))].sort(
      (a, b) => b - a
    );

    return { tecnicas, years };
  }, [murales]);

  return {
    murales,
    filteredMurales,
    loading,
    filters,
    setFilters,
    resetFilters,
    handleCanvasSave,
    handleDeleteMural,
    addMural,
    fetchUserMurales,
    getFilterOptions,
  };
}
