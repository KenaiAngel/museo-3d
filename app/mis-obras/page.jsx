"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { useMurales } from "./hooks/useMurales";
import { useUIState } from "./hooks/useUIState";
import CanvasEditor from "./components/CanvasEditor";
import CrearObraModal from "./components/CrearObraModal";
import { AnimatedBackground, LoadingScreen, UnauthorizedScreen } from "../../components/shared";
import FilterControls from "./components/FilterControls";
import UploadModal from "./components/UploadModal";
import PageHeader from "./components/PageHeader";
import EmptyState from "./components/EmptyState";
import MuralGrid from "./components/MuralGrid";

export default function MisObras() {
  const { data: session, status } = useSession();
  const { user, isAuthenticated } = useAuth();
  
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
    getFilterOptions
  } = useMurales();

  // Hook para manejar el estado de la UI
  const {
    view,
    showCanvasEditor,
    editingMural,
    showFilters,
    showUploadModal,
    showCrearObraModal,
    setView,
    setShowFilters,
    openCreateModal,
    openCanvasEditor,
    closeCanvasEditor,
    closeCreateModal,
    closeUploadModal
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

  if (status === 'loading' || loading) {
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

  return (
    <div className="relative min-h-screen">
      {/* Fondo animado */}
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-24 md:pt-28 pb-8 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header */}
          <PageHeader onCreateNew={openCreateModal} />

          {/* Controles de vista y filtros */}
          <FilterControls
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            getFilterOptions={getFilterOptions}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            view={view}
            setView={setView}
            resultsCount={filteredMurales.length}
          />

          {/* Contenido principal */}
          {filteredMurales.length === 0 ? (
            <EmptyState 
              hasAnyMurales={murales.length > 0}
              onCreateNew={openCreateModal}
            />
          ) : (
            <MuralGrid
              murales={filteredMurales}
              view={view}
              onEditMural={handleEditMural}
              onDeleteMural={handleDeleteMural}
            />
          )}
        </motion.div>
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

      {/* Crear Obra Modal */}
      <CrearObraModal
        isOpen={showCrearObraModal}
        onClose={closeCreateModal}
        onCreate={addMural}
        session={session}
      />
    </div>
  );
}
