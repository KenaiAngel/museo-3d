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
import { Badge } from "@/components/ui/badge";
import { useCollection } from "../../providers/CollectionProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function MuralesEliminadosAdmin() {
  const { data: session } = useSession();
  const [eliminados, setEliminados] = useState({});
  const [sendingId, setSendingId] = useState(null);

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

  const handleSendNotification = async (userId, email) => {
    setSendingId(userId);
    try {
      const res = await fetch("/api/push-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          message: "Tienes murales eliminados. Puedes restaurarlos desde tu perfil en el museo 3D.",
        }),
      });
      if (res.ok) {
        toast.success("Notificación enviada a " + (user?.name || email));
      } else {
        toast.error("No se pudo enviar la notificación");
      }
    } catch (err) {
      toast.error("Error al enviar notificación");
    }
    setSendingId(null);
  };

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-4">Usuarios con murales eliminados</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-white dark:bg-neutral-900 shadow mb-8">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Murales eliminados</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-100 dark:divide-neutral-800">
            {Object.entries(agrupados).map(([userId, { user, murales }]) =>
              (murales || []).length === 0 ? null : (
                <tr key={userId}>
                  <td className="px-4 py-2 font-medium text-foreground">
                    {userId === "sin_usuario" ? "Sin usuario" : user?.name || "Sin usuario"}
                  </td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {user?.email || "N/A"}
                  </td>
                  <td className="px-4 py-2 text-center">{murales.length}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold shadow transition disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed`}
                      disabled={
                        sendingId === userId ||
                        !user?.email ||
                        !(
                          user?.settings?.notificaciones === true ||
                          user?.settings?.notificaciones === "true"
                        )
                      }
                      onClick={() => handleSendNotification(userId, user.email)}
                    >
                      {sendingId === userId ? "Enviando..." : "Notificar"}
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MisMuralesEliminados({ fetchUserMurales }) {
  const { data: session } = useSession();
  const [murales, setMurales] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [permanentDeleteId, setPermanentDeleteId] = useState(null);
  const router = useRouter();
  const { fetchUserMurales: fetchMurales } = useMurales(); // Renombrado para evitar conflicto
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
      <div className="overflow-x-auto rounded-xl border border-border bg-white dark:bg-neutral-900 shadow">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-800">
          <thead className="bg-gray-50 dark:bg-neutral-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Imagen</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Título</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Eliminado</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-100 dark:divide-neutral-800">
            {murales.map((mural) => (
              <tr key={mural.id}>
                <td className="px-4 py-2">
                  <img src={mural.url_imagen} alt={mural.titulo} className="w-16 h-16 object-cover rounded shadow border" />
                </td>
                <td className="px-4 py-2 font-medium text-foreground">{mural.titulo}</td>
                <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(mural.deletedAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-center flex gap-2 justify-center items-center">
                  <button
                    className="px-3 py-1 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                    disabled={loadingId === mural.id}
                    onClick={async () => {
                      setLoadingId(mural.id);
                      const res = await fetch(`/api/murales/${mural.id}/restore`, {
                        method: "POST",
                      });
                      if (res.ok) {
                        toast.success("Mural restaurado");
                        setMurales(murales.filter((m) => m.id !== mural.id));
                        await fetchUserMurales();
                      } else {
                        toast.error("Error al restaurar mural");
                      }
                      setLoadingId(null);
                    }}
                  >
                    {loadingId === mural.id ? "Restaurando..." : "Restaurar"}
                  </button>
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                    onClick={() => setPermanentDeleteId(mural.id)}
                  >
                    Eliminar permanente
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal de confirmación para eliminar permanente */}
      {permanentDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl p-8 flex flex-col items-center">
            <h3 className="font-semibold mb-4 text-lg text-red-700 dark:text-red-300">
              ¿Eliminar mural permanentemente?
            </h3>
            <p className="mb-6 text-gray-700 dark:text-gray-200">
              Esta acción no se puede deshacer. ¿Seguro que quieres eliminar este mural de forma permanente?
            </p>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
                onClick={() => setPermanentDeleteId(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition"
                onClick={async () => {
                  setLoadingId(permanentDeleteId);
                  const res = await fetch(`/api/murales/${permanentDeleteId}`, {
                    method: "DELETE",
                  });
                  if (res.ok) {
                    toast.success("Mural eliminado permanentemente");
                    setMurales(murales.filter((m) => m.id !== permanentDeleteId));
                  } else {
                    toast.error("Error al eliminar permanentemente");
                  }
                  setLoadingId(null);
                  setPermanentDeleteId(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
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
    fetchUserMurales,
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
    .filter((m) => session?.user?.id && m.userId === session.user.id && !m.deletedAt)
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
        <MisMuralesEliminados fetchUserMurales={fetchUserMurales} />
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
