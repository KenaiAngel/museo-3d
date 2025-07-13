"use client";
import { useState, useEffect } from "react";
import { PageLoader } from "../../components/LoadingSpinner";
import AnimatedBackground from "../../components/shared/AnimatedBackground";
import { useGallery } from "../../providers/GalleryProvider";
import useMuralFilters from "@/app/hooks/useMuralFilters";
import FilterControls from "../mis-obras/components/FilterControls";
import { useUIState } from "../mis-obras/hooks/useUIState";
import MuralesList from "../../components/gallery/MuralesList";
import SalasList from "../../components/gallery/SalasList";
import ModalZoomImage from "../../components/gallery/ModalZoomImage";
import { useCollection } from "../../providers/CollectionProvider";
import { toast } from "react-hot-toast";
import { normalizeTecnica } from "../../components/gallery/utils";
import GalleryCarousel from "../../components/GalleryCarousel";
import useSalas from "@/app/hooks/useSalas";
import dynamic from "next/dynamic";
const ARExperience = dynamic(() => import("../../components/ar/ARExperience"), { ssr: false });

export default function GaleriaPage() {
  const {
    allMurales,
    loadingAllMurales,
    fetchAllMurales,
    artworks: murales,
    loading,
    // Si tienes salas en el provider, agrégalas aquí
  } = useGallery();
  // Si las salas no están en el provider, puedes mantener un estado local o migrar la lógica después.

  // Estado de filtros y UI (adaptado de mis obras)
  const [filters, setFilters] = useState({
    search: "",
    tecnica: "",
    year: "",
    sortBy: "newest",
  });
  const resetFilters = () => setFilters({ search: "", tecnica: "", year: "", sortBy: "newest" });
  const getFilterOptions = () => ({
    tecnicas: [...new Set(allMurales.map((m) => normalizeTecnica(m.tecnica)).filter(Boolean))].sort(),
    years: [...new Set(allMurales.map((m) => m.anio || m.year).filter(Boolean))].sort((a, b) => b - a),
  });
  // UI state para vista y filtros avanzados
  const { view, setView, showFilters, setShowFilters } = useUIState();

  // Hook para obtener salas
  const { salas, loading: loadingSalas } = useSalas();

  // Estado para sala seleccionada
  const [selectedSalaId, setSelectedSalaId] = useState(null);

  // Filtrar murales por sala seleccionada (si hay selección)
  const muralesFiltradosPorSala = selectedSalaId
    ? allMurales.filter(
        (m) =>
          m.SalaMural &&
          m.SalaMural.some((sm) => sm.salaId === selectedSalaId)
      )
    : allMurales;

  // Adaptar lógica de filtrado (usando useMuralFilters o lógica propia)
  const filteredMurales = useMuralFilters({
    allMurales: muralesFiltradosPorSala,
    searchTerm: filters.search,
    filterTecnica: filters.tecnica,
    filterAnio: filters.year ? Number(filters.year) : undefined,
    sortBy: filters.sortBy === "newest" ? "anio" : filters.sortBy === "oldest" ? "anio" : filters.sortBy === "title" ? "titulo" : filters.sortBy === "year" ? "anio" : filters.sortBy,
  });

  const { collection, isInCollection, addToCollection, removeFromCollection } =
    useCollection();

  // Función para manejar like/unlike
  const handleLike = async (mural) => {
    try {
      if (isInCollection(mural.id)) {
        await removeFromCollection(mural.id);
        toast.success("Obra removida de tu colección");
      } else {
        await addToCollection(mural.id, "mural", mural);
        toast.success("Obra guardada en tu colección");
      }
    } catch (err) {
      toast.error(err.message || "Debes iniciar sesión para guardar obras");
    }
  };

  // Lista de IDs de murales favoritos
  const likedMurales = collection.map((item) => item.id);

  // Técnicas y años únicos para los selects
  const tecnicasUnicas = [
    ...new Set(allMurales.map((m) => m.tecnica).filter(Boolean)),
  ].sort();
  const aniosUnicos = [
    ...new Set(allMurales.map((m) => m.anio).filter(Boolean)),
  ].sort((a, b) => b - a);

  // Estado para mostrar el modal AR
  const [arMural, setArMural] = useState(null);

  // Función para manejar click en AR
  const handleARClick = (mural) => {
    setArMural(mural);
  };

  // Cargar todos los murales al montar la galería (para el carrusel)
  useEffect(() => {
    fetchAllMurales();
    // eslint-disable-next-line
  }, []);

  // Cargar todos los murales cuando la vista sea 'list'
  useEffect(() => {
    if (view === "list") {
      fetchAllMurales();
    }
    // eslint-disable-next-line
  }, [view]);

  // Estado para el modal de zoom
  const [zoomMural, setZoomMural] = useState(null);

  if (loading || loadingAllMurales) return <PageLoader text="Cargando galería..." />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <AnimatedBackground />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">
            Galería Virtual
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explora las obras de arte organizadas por salas temáticas o navega
            por el archivo completo
          </p>
        </div>

        {/* Carrusel destacado */}
        {allMurales.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              Obras Destacadas
            </h2>
            <GalleryCarousel
              items={allMurales.slice(0, 10)}
              title="Galería de Obras"
            />
          </div>
        )}

        {/* Sección de selección de salas */}
        {salas && salas.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2 items-center">
            <span className="font-semibold text-muted-foreground">Filtrar por sala:</span>
            <button
              className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${!selectedSalaId ? "bg-indigo-600 text-white" : "bg-white dark:bg-neutral-800 text-foreground border-border hover:bg-indigo-50 dark:hover:bg-neutral-700"}`}
              onClick={() => setSelectedSalaId(null)}
            >
              Todas
            </button>
            {salas.map((sala) => (
              <button
                key={sala.id}
                className={`px-3 py-1 rounded-lg border text-sm font-medium transition ${selectedSalaId === sala.id ? "bg-indigo-600 text-white" : "bg-white dark:bg-neutral-800 text-foreground border-border hover:bg-indigo-50 dark:hover:bg-neutral-700"}`}
                onClick={() => setSelectedSalaId(sala.id)}
              >
                {sala.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Header de filtros y tabs */}
        <div className="mb-4">
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
        </div>

        {/* Vista principal: siempre mostrar murales filtrados */}
        {filteredMurales.length > 0 ? (
          <MuralesList
            murales={filteredMurales}
            onMuralClick={setZoomMural}
            onLike={handleLike}
            likedMurales={likedMurales}
            view={view}
            onARClick={handleARClick}
          />
        ) : (
          <div className="bg-card rounded-2xl shadow-lg p-12 text-center border border-border mt-8">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              No hay resultados
            </h3>
            <p className="text-muted-foreground">
              No se encontraron murales que coincidan con tu búsqueda o filtros.
            </p>
          </div>
        )}

        {/* Modal de zoom */}
        {zoomMural && (
          <ModalZoomImage
            mural={zoomMural}
            onClose={() => setZoomMural(null)}
          />
        )}
        {/* Modal AR */}
        {arMural && (
          <ARExperience onClose={() => setArMural(null)} mural={arMural} />
        )}
      </div>
    </div>
  );
}
