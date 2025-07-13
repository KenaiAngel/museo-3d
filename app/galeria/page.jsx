"use client";
import { useState, useEffect } from "react";
import { PageLoader } from "../../components/LoadingSpinner";
import GalleryCarousel from "../../components/GalleryCarousel";
import AnimatedBackground from "../../components/shared/AnimatedBackground";
import useGaleriaData from "@/app/hooks/useGaleriaData";
import useMuralFilters from "@/app/hooks/useMuralFilters";
import GalleryHeader from "../../components/gallery/GalleryHeader";
import MuralesList from "../../components/gallery/MuralesList";
import SalasList from "../../components/gallery/SalasList";
import ModalZoomImage from "../../components/gallery/ModalZoomImage";
import { useCollection } from "../../providers/CollectionProvider";
import { toast } from "react-hot-toast";

export default function GaleriaPage() {
  const {
    salas,
    murales,
    allMurales,
    loading,
    loadingMurales,
    selectedSala,
    setSelectedSala,
    handleSalaSelect,
    fetchAllMurales,
  } = useGaleriaData();

  // Estado de UI
  const [viewMode, setViewMode] = useState("salas");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTecnica, setFilterTecnica] = useState("");
  const [filterAnio, setFilterAnio] = useState("");
  const [sortBy, setSortBy] = useState("titulo");
  const [zoomMural, setZoomMural] = useState(null);

  // Filtros
  const filteredMurales = useMuralFilters({
    allMurales,
    searchTerm,
    filterTecnica,
    filterAnio,
    sortBy,
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

  useEffect(() => {
    if (viewMode === "archivo") {
      fetchAllMurales();
    }
    // eslint-disable-next-line
  }, [viewMode]);

  if (loading) return <PageLoader text="Cargando galería..." />;

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
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
              Obras Destacadas
            </h2>
            <GalleryCarousel
              items={allMurales.slice(0, 10)}
              title="Galería de Obras"
            />
          </div>
        )}

        {/* Header de filtros y tabs */}
        <GalleryHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterTecnica={filterTecnica}
          setFilterTecnica={setFilterTecnica}
          filterAnio={filterAnio}
          setFilterAnio={setFilterAnio}
          sortBy={sortBy}
          setSortBy={setSortBy}
          viewMode={viewMode}
          setViewMode={setViewMode}
          tecnicasUnicas={tecnicasUnicas}
          aniosUnicos={aniosUnicos}
        />

        {/* Vista por salas o archivo */}
        {viewMode === "salas" ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <SalasList
                salas={salas}
                selectedSala={selectedSala}
                onSelectSala={handleSalaSelect}
              />
            </div>
            <div className="lg:col-span-3">
              {loadingMurales ? (
                <PageLoader text="Cargando murales..." />
              ) : (
                <MuralesList
                  murales={murales}
                  onMuralClick={setZoomMural}
                  onLike={handleLike}
                  likedMurales={likedMurales}
                />
              )}
            </div>
          </div>
        ) : filteredMurales.length > 0 ? (
          <MuralesList
            murales={filteredMurales}
            onMuralClick={setZoomMural}
            onLike={handleLike}
            likedMurales={likedMurales}
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
      </div>
    </div>
  );
}
