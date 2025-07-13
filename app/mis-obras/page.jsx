"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useMurales } from "./hooks/useMurales";
import { useUIState } from "./hooks/useUIState";
import CanvasEditor from "./components/CanvasEditor";
import CrearObraModal from "./components/CrearObraModal";
import {
  AnimatedBackground,
  LoadingScreen,
  UnauthorizedScreen,
} from "../../components/shared";
import FilterControls from "./components/FilterControls";
import UploadModal from "./components/UploadModal";
import PageHeader from "./components/PageHeader";
import EmptyState from "./components/EmptyState";
import MuralGrid from "./components/MuralGrid";
import { Badge } from "../components/ui/badge";
import { useCollection } from "../../providers/CollectionProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function MuralesEliminadosAdmin() {
  const { data: session } = useSession();
  const [eliminados, setEliminados] = useState({});

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetch("/api/murales/eliminados")
        .then((res) => res.json())
        .then(setEliminados);
    }
  }, [session]);

  // Agrupa todos los murales sin usuario bajo una sola clave
  const agrupados = {};
  Object.entries(eliminados).forEach(([userId, { user, murales }]) => {
    const key = userId && userId !== "sin_usuario" ? userId : "sin_usuario";
    if (!agrupados[key]) agrupados[key] = { user, murales: [] };
    agrupados[key].murales = agrupados[key].murales.concat(murales || []);
  });

  // Si no hay ningún mural restaurable, no mostrar la sección
  const hayMuralesEliminados = Object.values(agrupados).some(
    ({ murales }) => (murales || []).length > 0
  );
  if (!hayMuralesEliminados) return null;

  if (session?.user?.role !== "ADMIN") return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-4">
        Usuarios con murales eliminados
      </h2>
      {Object.entries(agrupados).map(([userId, { user, murales }]) =>
        (murales || []).length === 0 ? null : (
          <div key={userId} className="mb-8">
            <h3 className="font-semibold text-lg mb-2">
              {userId === "sin_usuario"
                ? "Sin usuario"
                : user?.name || "Sin usuario"}{" "}
              ({user?.email || "N/A"})
            </h3>
            <span className="text-sm text-gray-500">
              {murales.length} mural(es) eliminados
            </span>
          </div>
        )
      )}
    </section>
  );
}

function MisMuralesEliminados() {
  const { data: session } = useSession();
  const [murales, setMurales] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/murales?deleted=1&userId=${session.user.id}`)
        .then((res) => res.json())
        .then((data) => setMurales(data.murales || []));
    }
  }, [session]);
  if (!session?.user?.id) return null;
  if (murales.length === 0) return null;
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-4">Tus murales eliminados</h2>
      <ul>
        {murales.map((mural) => (
          <li key={mural.id} className="flex items-center gap-4 mb-2">
            <span>{mural.titulo}</span>
            <span className="text-xs text-gray-500">
              Eliminado: {new Date(mural.deletedAt).toLocaleString()}
            </span>
            <button
              className="px-2 py-1 bg-green-600 text-white rounded disabled:opacity-50"
              disabled={loadingId === mural.id}
              onClick={async () => {
                setLoadingId(mural.id);
                const res = await fetch(`/api/murales/${mural.id}/restore`, {
                  method: "POST",
                });
                if (res.ok) {
                  toast.success("Mural restaurado");
                  setMurales(murales.filter((m) => m.id !== mural.id));
                } else {
                  toast.error("Error al restaurar mural");
                }
                setLoadingId(null);
              }}
            >
              {loadingId === mural.id ? "Restaurando..." : "Restaurar"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function MisObras() {
  const { data: session, status } = useSession();
  const { user, isAuthenticated } = useAuth();
  const { collection = [] } = useCollection();
  const router = useRouter();

  // Hook personalizado para manejo de murales
  const {
    murales,
    filteredMurales,
    loading,
    filters,
    setFilters,
    resetFilters,
    handleCanvasSave,
    handleDeleteMural,
    addMural,
    getFilterOptions,
  } = useMurales();

  // Hook para manejar el estado de la UI
  const {
    view,
    showCanvasEditor,
    editingMural,
    showFilters,
    showUploadModal,
    setView,
    setShowFilters,
    openCanvasEditor,
    closeCanvasEditor,
    closeUploadModal,
  } = useUIState();

  // Manejar guardado desde canvas con el hook
  const handleCanvasSaveWrapper = (savedMural) => {
    handleCanvasSave(savedMural, editingMural);
    closeCanvasEditor();
  };

  // Manejar edición de mural
  const handleEditMural = (mural) => {
    openCanvasEditor(mural);
  };

  // Estrategia: 'Mis obras' = murales donde userId === session.user.id
  const propios = murales
    .filter((m) => session?.user?.id && m.userId === session.user.id)
    .map((m) => ({ ...m, editable: true, fromCollection: false }));

  // Colección: favoritos (no editables)
  const favoritos = (collection || [])
    .filter((fav) => !propios.some((m) => m.id === fav.id))
    .map((fav) => ({ ...fav, editable: false, fromCollection: true }));

  // Filtros por separado
  const propiosFiltrados = propios.filter((mural) => {
    if (
      filters.search &&
      !mural.titulo?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !mural.autor?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !mural.tecnica?.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.tecnica && mural.tecnica !== filters.tecnica) return false;
    if (filters.year && mural.year !== filters.year) return false;
    return true;
  });
  const favoritosFiltrados = favoritos.filter((mural) => {
    if (
      filters.search &&
      !mural.titulo?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !mural.autor?.toLowerCase().includes(filters.search.toLowerCase()) &&
      !mural.tecnica?.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }
    if (filters.tecnica && mural.tecnica !== filters.tecnica) return false;
    if (filters.year && mural.year !== filters.year) return false;
    return true;
  });

  if (status === "loading" || loading) {
    return <LoadingScreen message="Cargando tus obras..." />;
  }

  if (!session) {
    return (
      <UnauthorizedScreen
        title="Inicia sesión para ver tus obras"
        message="Necesitas estar autenticado para crear y gestionar tus obras de arte"
      />
    );
  }

  // Redirigir a la página de creación de obra
  const goToCrearObra = () => router.push("/mis-obras/crear");

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fondo animado */}
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-24 md:pt-28 pb-2 md:pb-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header */}
          <PageHeader onCreateNew={goToCrearObra} />

          {/* Controles de vista y filtros */}
          <div className="mb-16 md:mb-20">
            <FilterControls
              filters={filters}
              setFilters={setFilters}
              resetFilters={resetFilters}
              getFilterOptions={getFilterOptions}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              view={view}
              setView={setView}
              resultsCount={propiosFiltrados.length + favoritosFiltrados.length}
            />
          </div>

          {/* Contenido principal */}
          {/* Sección: Mis obras */}
          {propiosFiltrados.length > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-foreground">Mis obras</h2>
                <Badge variant="default">Editables</Badge>
              </div>
              <MuralGrid
                murales={propiosFiltrados}
                view={view}
                onEditMural={handleEditMural}
                onDeleteMural={handleDeleteMural}
              />
            </div>
          )}

          {/* Divider visual */}
          {propiosFiltrados.length > 0 && favoritosFiltrados.length > 0 && (
            <div className="w-full flex justify-center my-8">
              <div className="h-1 w-32 bg-gradient-to-r from-pink-400 via-indigo-400 to-blue-400 rounded-full opacity-40" />
            </div>
          )}

          {/* Sección: Mi colección */}
          {favoritosFiltrados.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Mi colección
                </h2>
                <Badge variant="pink">Favoritos</Badge>
              </div>
              <MuralGrid
                murales={favoritosFiltrados}
                view={view}
                onEditMural={() => {}}
                onDeleteMural={() => {}}
              />
            </div>
          )}

          {/* Si no hay nada, mostrar empty state */}
          {propiosFiltrados.length === 0 && favoritosFiltrados.length === 0 && (
            <EmptyState
              hasAnyMurales={propios.length + favoritos.length > 0}
              onCreateNew={goToCrearObra}
            />
          )}
        </motion.div>
        <MisMuralesEliminados />
        <MuralesEliminadosAdmin />
      </div>

      {/* Modal de subida de imágenes */}
      <UploadModal
        isOpen={showUploadModal}
        onClose={closeUploadModal}
        onUploadSuccess={addMural}
      />

      {/* Canvas Editor */}
      <CanvasEditor
        isOpen={showCanvasEditor}
        onClose={closeCanvasEditor}
        onSave={handleCanvasSaveWrapper}
        editingMural={editingMural}
      />
    </div>
  );
}
