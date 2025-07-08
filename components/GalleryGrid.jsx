"use client";
import { useState, useEffect } from "react";
import { useGallery } from "../providers/GalleryProvider";
import { useModal } from "../providers/ModalProvider";
import {
  Search,
  Filter,
  Grid,
  List,
  Image as ImageIcon,
  Heart,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function GalleryGrid({ roomId, showFilters = true }) {
  const {
    artworks,
    loadArtworksForRoom,
    filterArtworks,
    getGalleryStats,
    openImageModal,
    galleryView,
    setGalleryView,
  } = useGallery();

  const { openModal } = useModal();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [favorites, setFavorites] = useState({});

  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [filters, setFilters] = useState({
    artist: "",
    technique: "",
    year: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Cargar obras de arte cuando cambie el roomId
  useEffect(() => {
    if (roomId) {
      setIsLoading(true);
      loadArtworksForRoom(roomId).finally(() => setIsLoading(false));
    }
  }, [roomId, loadArtworksForRoom]);

  // Filtrar obras cuando cambien los filtros o artworks
  useEffect(() => {
    let filtered = filterArtworks(filters);

    // Aplicar búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(
        (artwork) =>
          artwork.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          artwork.artista?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          artwork.tecnica?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          artwork.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredArtworks(filtered);
  }, [artworks, filters, searchTerm, filterArtworks]);

  // Cargar favoritos del usuario al cargar artworks
  useEffect(() => {
    if (!userId || !filteredArtworks.length) return;
    // Aquí podrías hacer un fetch a un endpoint de favoritos, pero para demo, asumimos que artwork.favoritedBy existe
    const favs = {};
    filteredArtworks.forEach((a) => {
      if (a.favoritedBy?.some((f) => f.userId === userId)) favs[a.id] = true;
    });
    setFavorites(favs);
  }, [userId, filteredArtworks]);

  const toggleFavorite = async (artworkId, isFav) => {
    if (!userId) return;
    setFavorites((favs) => ({ ...favs, [artworkId]: !isFav }));
    const method = isFav ? "DELETE" : "POST";
    await fetch(`/api/usuarios/${userId}/collection`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ muralId: artworkId }),
    });
  };

  // Manejar click en imagen
  const handleImageClick = (artwork, index) => {
    openImageModal(artwork, index);
  };

  // Mostrar estadísticas
  const showStats = () => {
    const stats = getGalleryStats();
    openModal("info", {
      title: "Estadísticas de la Galería",
      content: (
        <div className="space-y-2">
          <p>
            <strong>Total de obras:</strong> {stats.totalArtworks}
          </p>
          <p>
            <strong>Artistas únicos:</strong> {stats.uniqueArtists}
          </p>
          <p>
            <strong>Técnicas únicas:</strong> {stats.uniqueTechniques}
          </p>
          {stats.oldestYear && (
            <p>
              <strong>Rango de años:</strong> {stats.oldestYear} -{" "}
              {stats.newestYear}
            </p>
          )}
        </div>
      ),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (artworks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <ImageIcon size={64} className="text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          No hay obras de arte
        </h3>
        <p className="text-gray-500">
          No se encontraron obras de arte en esta sala.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            Galería ({filteredArtworks.length} obras)
          </h2>
          <button
            onClick={showStats}
            className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors"
          >
            Ver estadísticas
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Vista */}
          <div className="flex border rounded-md overflow-hidden">
            <button
              onClick={() => setGalleryView("grid")}
              className={`p-2 ${
                galleryView === "grid"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setGalleryView("list")}
              className={`p-2 ${
                galleryView === "list"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      {showFilters && (
        <div className="space-y-4">
          {/* Búsqueda */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar obras de arte..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Filtrar por artista..."
              value={filters.artist}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, artist: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Filtrar por técnica..."
              value={filters.technique}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, technique: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Filtrar por año..."
              value={filters.year}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, year: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Grid de obras */}
      {galleryView === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredArtworks.map((artwork, index) => (
            <div
              key={artwork.id}
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer relative"
            >
              {/* Botón corazón superpuesto, fuera del área clickable */}
              <button
                className={`absolute top-3 right-3 z-30 w-9 h-9 flex items-center justify-center rounded-full bg-black/70 border-2 border-white shadow-xl transition-colors duration-200 ${
                  favorites[artwork.id] ? "text-pink-400" : "text-white"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!userId) {
                    toast("Inicia sesión para guardar en tu colección", {
                      icon: "🔒",
                    });
                    return;
                  }
                  toggleFavorite(artwork.id, favorites[artwork.id]);
                }}
                aria-label={
                  favorites[artwork.id]
                    ? "Quitar de colección"
                    : "Guardar en colección"
                }
              >
                <Heart
                  fill={favorites[artwork.id] ? "#ec4899" : "none"}
                  strokeWidth={2.5}
                  className="w-6 h-6"
                />
              </button>
              {/* Imagen y área clickable */}
              <div
                className="aspect-square overflow-hidden relative"
                onClick={() => handleImageClick(artwork, index)}
              >
                <img
                  src={
                    artwork.imagen || artwork.url || "/placeholder-image.jpg"
                  }
                  alt={artwork.titulo || artwork.nombre || "Obra de arte"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {artwork.titulo || artwork.nombre || "Sin título"}
                </h3>
                {artwork.artista && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Artista:</span>{" "}
                    {artwork.artista}
                  </p>
                )}
                {artwork.tecnica && (
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Técnica:</span>{" "}
                    {artwork.tecnica}
                  </p>
                )}
                {artwork.año && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Año:</span> {artwork.año}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Vista de lista */
        <div className="space-y-4">
          {filteredArtworks.map((artwork, index) => (
            <div
              key={artwork.id}
              className="flex bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => handleImageClick(artwork, index)}
            >
              <div className="w-32 h-32 flex-shrink-0">
                <img
                  src={
                    artwork.imagen || artwork.url || "/placeholder-image.jpg"
                  }
                  alt={artwork.titulo || artwork.nombre || "Obra de arte"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="flex-1 p-4">
                <h3 className="font-semibold text-lg mb-2">
                  {artwork.titulo || artwork.nombre || "Sin título"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                  {artwork.artista && (
                    <p>
                      <span className="font-medium">Artista:</span>{" "}
                      {artwork.artista}
                    </p>
                  )}
                  {artwork.tecnica && (
                    <p>
                      <span className="font-medium">Técnica:</span>{" "}
                      {artwork.tecnica}
                    </p>
                  )}
                  {artwork.año && (
                    <p>
                      <span className="font-medium">Año:</span> {artwork.año}
                    </p>
                  )}
                </div>
                {artwork.descripcion && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {artwork.descripcion}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mensaje si no hay resultados */}
      {filteredArtworks.length === 0 && artworks.length > 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No se encontraron obras que coincidan con los filtros.
          </p>
        </div>
      )}
    </div>
  );
}
