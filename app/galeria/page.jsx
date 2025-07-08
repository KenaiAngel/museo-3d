"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { PageLoader, SectionLoader } from "../../components/LoadingSpinner";
import GalleryCarousel from "../../components/GalleryCarousel";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCollection } from "../../providers/CollectionProvider";
import { HeartIcon } from "../components/ui/icons/HeartIcon";

// Componentes de fondo animado (copiados de acerca-de)
function AnimatedBlobsBackground() {
  return (
    <>
      <div className="absolute top-0 left-0 w-[520px] h-[520px] bg-orange-300/60 dark:bg-orange-700/30 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe" />
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-pink-300/60 dark:bg-pink-700/30 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe-delayed" />
      <div
        className="absolute top-1/2 left-1/2 w-[340px] h-[340px] bg-fuchsia-200/50 dark:bg-fuchsia-800/20 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe"
        style={{ transform: "translate(-50%,-50%) scale(1.2)" }}
      />
    </>
  );
}

function DotsPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full z-0 pointer-events-none hidden dark:block"
      width="100%"
      height="100%"
      style={{ opacity: 0.13 }}
    >
      <defs>
        <pattern
          id="dots"
          x="0"
          y="0"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="#fff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

export default function GaleriaPage() {
  const { data: session } = useSession();
  const [salas, setSalas] = useState([]);
  const [murales, setMurales] = useState([]);
  const [allMurales, setAllMurales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMurales, setLoadingMurales] = useState(false);
  const [selectedSala, setSelectedSala] = useState(null);
  const [viewMode, setViewMode] = useState("salas");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTecnica, setFilterTecnica] = useState("");
  const [filterAnio, setFilterAnio] = useState("");
  const [sortBy, setSortBy] = useState("titulo");
  const cardRefs = useRef({});
  const router = useRouter();
  const { isInCollection, addToCollection, removeFromCollection } =
    useCollection();

  // Función para normalizar técnicas
  const normalizeTecnica = (tecnica) => {
    if (!tecnica) return tecnica;

    const normalized = tecnica.toLowerCase();

    // Normalizar variaciones de acrílico
    if (
      normalized.includes("acrílico") ||
      normalized.includes("acrilico") ||
      normalized.includes("acrílica") ||
      normalized.includes("acrilica")
    ) {
      return "Acrílico";
    }

    // Normalizar variaciones de vinílica/vinil
    if (
      normalized.includes("vinílica") ||
      normalized.includes("vinilica") ||
      normalized.includes("vinil")
    ) {
      return "Pintura vinílica";
    }

    // Normalizar otras técnicas comunes
    if (normalized.includes("óleo") || normalized.includes("oleo")) {
      return "Óleo";
    }

    if (normalized.includes("acuarela")) {
      return "Acuarela";
    }

    // Capitalizar primera letra para técnicas no normalizadas
    return tecnica.charAt(0).toUpperCase() + tecnica.slice(1).toLowerCase();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Cargar salas y murales en paralelo
        const [salasResponse, muralesResponse] = await Promise.all([
          fetch("/api/salas"),
          fetch("/api/murales"),
        ]);

        if (salasResponse.ok) {
          const salasData = await salasResponse.json();
          setSalas(salasData.salas || []);

          // Seleccionar automáticamente la primera sala si existe
          if (salasData.salas && salasData.salas.length > 0) {
            setSelectedSala(salasData.salas[0].id);

            // Cargar murales de la primera sala
            const response = await fetch(
              `/api/salas/${salasData.salas[0].id}/murales`
            );
            if (response.ok) {
              const data = await response.json();
              setMurales(data.murales || []);
            }
          }
        } else {
          toast.error("Error al cargar las salas");
        }

        if (muralesResponse.ok) {
          const muralesData = await muralesResponse.json();
          setAllMurales(muralesData.murales || []);
        } else {
          toast.error("Error al cargar los murales");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error de conexión");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSalaSelect = async (salaId) => {
    try {
      setSelectedSala(salaId);
      setLoadingMurales(true);
      const response = await fetch(`/api/salas/${salaId}/murales`);
      if (response.ok) {
        const data = await response.json();
        setMurales(data.murales || []);
      } else {
        toast.error("Error al cargar los murales de la sala");
      }
    } catch (error) {
      console.error("Error fetching murales:", error);
      toast.error("Error de conexión");
    } finally {
      setLoadingMurales(false);
    }
  };

  // Filtrar y ordenar murales para el modo archivo
  const filteredMurales = allMurales
    .filter((mural) => {
      const matchesSearch =
        mural.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mural.autor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mural.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTecnica =
        !filterTecnica || normalizeTecnica(mural.tecnica) === filterTecnica;
      const matchesAnio = !filterAnio || mural.anio === parseInt(filterAnio);

      return matchesSearch && matchesTecnica && matchesAnio;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "titulo":
          return (a.titulo || "").localeCompare(b.titulo || "");
        case "artista":
          return (a.autor || "").localeCompare(b.autor || "");
        case "anio":
          return (b.anio || 0) - (a.anio || 0);
        case "tecnica":
          return (a.tecnica || "").localeCompare(b.tecnica || "");
        default:
          return 0;
      }
    });

  // Obtener técnicas y años únicos para los filtros
  const tecnicasUnicas = [
    ...new Set(
      allMurales.map((m) => normalizeTecnica(m.tecnica)).filter(Boolean)
    ),
  ].sort();
  const aniosUnicos = [
    ...new Set(allMurales.map((m) => m.anio).filter(Boolean)),
  ].sort((a, b) => b - a);

  // Efecto de luz de fondo que sigue el cursor
  useEffect(() => {
    const handleMouseMove = (e) => {
      const grid = document.querySelector(".gallery-grid");
      if (!grid) return;

      const card = e.currentTarget;
      const gridRect = grid.getBoundingClientRect();
      const x = e.clientX - gridRect.left;
      const y = e.clientY - gridRect.top;

      // Actualizar variables CSS globales en el grid
      grid.style.setProperty("--global-mouse-x", `${x}px`);
      grid.style.setProperty("--global-mouse-y", `${y}px`);

      // Activar el glow
      grid.classList.add("has-active-glow");
    };

    const handleMouseEnter = (e) => {
      const grid = document.querySelector(".gallery-grid");
      if (grid) {
        grid.classList.add("has-active-glow");
      }
    };

    const handleMouseLeave = (e) => {
      const grid = document.querySelector(".gallery-grid");
      if (grid) {
        grid.classList.remove("has-active-glow");
      }
    };

    // Agregar event listeners a todas las tarjetas
    const observer = new MutationObserver(() => {
      const cards = document.querySelectorAll(".gallery-card-glow");
      cards.forEach((card) => {
        // Remover listeners existentes para evitar duplicados
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseenter", handleMouseEnter);
        card.removeEventListener("mouseleave", handleMouseLeave);

        // Agregar listeners
        card.addEventListener("mousemove", handleMouseMove);
        card.addEventListener("mouseenter", handleMouseEnter);
        card.addEventListener("mouseleave", handleMouseLeave);
      });
    });

    // Configurar observer
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Aplicar inicialmente
    const cards = document.querySelectorAll(".gallery-card-glow");
    cards.forEach((card) => {
      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseenter", handleMouseEnter);
      card.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      observer.disconnect();
      const cards = document.querySelectorAll(".gallery-card-glow");
      cards.forEach((card) => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseenter", handleMouseEnter);
        card.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  if (loading) {
    return <PageLoader text="Cargando galería..." />;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-7xl mx-auto">
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
              items={allMurales.slice(0, 10)} // Mostrar solo las primeras 10 obras
              title="Galería de Obras"
            />
          </div>
        )}

        {/* Selector de modo de vista */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-2xl shadow-lg p-2 border border-border">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("salas")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  viewMode === "salas"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                🏛️ Por Salas
              </button>
              <button
                onClick={() => setViewMode("archivo")}
                className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                  viewMode === "archivo"
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                📚 Archivo Completo
              </button>
            </div>
          </div>
        </div>

        {viewMode === "salas" ? (
          // Vista por salas
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar con salas */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-2xl shadow-lg p-6 sticky top-4 border border-border">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Salas
                </h2>
                <div className="space-y-3">
                  {salas.map((sala) => (
                    <button
                      key={sala.id}
                      onClick={() => handleSalaSelect(sala.id)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 ${
                        selectedSala === sala.id
                          ? "bg-primary/10 border-2 border-primary text-primary"
                          : "bg-muted/50 hover:bg-muted border-2 border-transparent text-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{sala.nombre}</h3>
                          <p className="text-sm text-muted-foreground">
                            {sala._count.murales} obras
                          </p>
                        </div>
                        <span className="text-2xl">🎨</span>
                      </div>
                      {sala.creador && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Por: {sala.creador.name || sala.creador.email}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="lg:col-span-3">
              {selectedSala ? (
                <div>
                  <div className="bg-card rounded-2xl shadow-lg p-6 mb-6 border border-border">
                    <h2 className="text-3xl font-bold text-foreground mb-2">
                      {salas.find((s) => s.id === selectedSala)?.nombre}
                    </h2>
                    <p className="text-muted-foreground">
                      {salas.find((s) => s.id === selectedSala)?.descripcion}
                    </p>
                  </div>

                  {loadingMurales ? (
                    <SectionLoader text="Cargando murales..." />
                  ) : murales.length > 0 ? (
                    <div className="gallery-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {murales.map((mural, idx) => (
                        <motion.div
                          key={mural.id}
                          ref={(el) => (cardRefs.current[mural.id] = el)}
                          className="gallery-card-glow bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border mb-6 cursor-pointer relative"
                          initial={{ opacity: 0, y: 40 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: 0.08 * idx,
                            duration: 0.6,
                            ease: [0.25, 0.46, 0.45, 0.94],
                          }}
                          onClick={() => router.push(`/galeria/${mural.id}`)}
                        >
                          {/* Botón de corazón (favoritos) */}
                          <button
                            className="absolute top-3 right-3 z-20 bg-white/80 dark:bg-black/60 rounded-full p-2 shadow-md hover:scale-110 transition-transform"
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                if (isInCollection(mural.id)) {
                                  await removeFromCollection(mural.id);
                                  toast.success(
                                    "Obra removida de tu colección"
                                  );
                                } else {
                                  await addToCollection(
                                    mural.id,
                                    "mural",
                                    mural
                                  );
                                  toast.success(
                                    "Obra guardada en tu colección"
                                  );
                                }
                              } catch (err) {
                                toast.error(
                                  err.message ||
                                    "Debes iniciar sesión para guardar obras"
                                );
                              }
                            }}
                            aria-label={
                              isInCollection(mural.id)
                                ? "Quitar de colección"
                                : "Agregar a colección"
                            }
                          >
                            <HeartIcon
                              filled={isInCollection(mural.id)}
                              className={`w-7 h-7 ${
                                isInCollection(mural.id)
                                  ? "text-pink-500"
                                  : "text-gray-400"
                              }`}
                            />
                          </button>
                          {/* Glow solo detrás del contenido de la tarjeta */}
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="gallery-glow" />
                          </div>
                          <div className="relative h-48">
                            <img
                              src={mural.url_imagen}
                              alt={mural.titulo}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "/assets/artworks/cuadro1.webp";
                              }}
                            />
                          </div>
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-foreground mb-2">
                              {mural.titulo}
                            </h3>
                            <p className="text-muted-foreground mb-3">
                              {mural.autor || "Artista desconocido"}
                            </p>
                            {mural.tecnica && (
                              <p className="text-sm text-muted-foreground mb-2">
                                Técnica: {mural.tecnica}
                              </p>
                            )}
                            {mural.anio && (
                              <p className="text-sm text-muted-foreground mb-2">
                                Año: {mural.anio}
                              </p>
                            )}
                            {mural.descripcion && (
                              <p className="text-sm text-muted-foreground line-clamp-3">
                                {mural.descripcion}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-2xl shadow-lg p-12 text-center border border-border">
                      <div className="text-6xl mb-4">🎨</div>
                      <h3 className="text-2xl font-bold text-foreground mb-2">
                        Sala vacía
                      </h3>
                      <p className="text-muted-foreground">
                        Esta sala aún no tiene obras de arte.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-card rounded-2xl shadow-lg p-12 text-center border border-border">
                  <div className="text-6xl mb-4">🏛️</div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Selecciona una sala
                  </h3>
                  <p className="text-muted-foreground">
                    Elige una sala del menú lateral para ver sus obras de arte.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Vista de archivo completo
          <div>
            {/* Filtros y búsqueda */}
            <div className="bg-card rounded-2xl shadow-lg p-6 mb-8 border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Búsqueda */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Buscar
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Título, autor, descripción..."
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  />
                </div>

                {/* Filtro por técnica */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Técnica
                  </label>
                  <select
                    value={filterTecnica}
                    onChange={(e) => setFilterTecnica(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  >
                    <option value="">Todas las técnicas</option>
                    {tecnicasUnicas.map((tecnica) => (
                      <option key={tecnica} value={tecnica}>
                        {tecnica}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtro por año */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Año
                  </label>
                  <select
                    value={filterAnio}
                    onChange={(e) => setFilterAnio(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  >
                    <option value="">Todos los años</option>
                    {aniosUnicos.map((anio) => (
                      <option key={anio} value={anio}>
                        {anio}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ordenar por */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Ordenar por
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  >
                    <option value="titulo">Título</option>
                    <option value="artista">Artista</option>
                    <option value="anio">Año (más reciente)</option>
                    <option value="tecnica">Técnica</option>
                  </select>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                  <span>
                    📊 {filteredMurales.length} de {allMurales.length} obras
                  </span>
                  <span>🎨 {tecnicasUnicas.length} técnicas diferentes</span>
                  <span>📅 {aniosUnicos.length} años representados</span>
                </div>{" "}
              </div>
            </div>

            {/* Lista de murales */}
            {filteredMurales.length > 0 ? (
              <div className="gallery-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMurales.map((mural) => (
                  <div
                    key={mural.id}
                    className="gallery-card-glow bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border relative"
                    onClick={() => router.push(`/galeria/${mural.id}`)} // Abrir modal al hacer clic
                  >
                    {/* Botón de corazón (favoritos) */}
                    <button
                      className="absolute top-3 right-3 z-20 bg-white/80 dark:bg-black/60 rounded-full p-2 shadow-md hover:scale-110 transition-transform"
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          if (isInCollection(mural.id)) {
                            await removeFromCollection(mural.id);
                            toast.success("Obra removida de tu colección");
                          } else {
                            await addToCollection(mural.id, "mural", mural);
                            toast.success("Obra guardada en tu colección");
                          }
                        } catch (err) {
                          toast.error(
                            err.message ||
                              "Debes iniciar sesión para guardar obras"
                          );
                        }
                      }}
                      aria-label={
                        isInCollection(mural.id)
                          ? "Quitar de colección"
                          : "Agregar a colección"
                      }
                    >
                      <HeartIcon
                        filled={isInCollection(mural.id)}
                        className={`w-7 h-7 ${
                          isInCollection(mural.id)
                            ? "text-pink-500"
                            : "text-gray-400"
                        }`}
                      />
                    </button>
                    <div className="relative h-48">
                      <img
                        src={mural.url_imagen}
                        alt={mural.titulo}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = "/assets/artworks/cuadro1.webp";
                        }}
                      />
                      {mural.anio && (
                        <div className="absolute top-3 right-3 bg-background/90 rounded-full px-2 py-1 text-xs font-bold text-foreground">
                          {mural.anio}
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                        {mural.titulo}
                      </h3>
                      <p className="text-muted-foreground mb-2">
                        {mural.autor || "Artista desconocido"}
                      </p>
                      {mural.tecnica && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {mural.tecnica}
                        </p>
                      )}
                      {mural.descripcion && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {mural.descripcion}
                        </p>
                      )}
                      {mural.ubicacion && (
                        <p className="text-xs text-muted-foreground mt-2">
                          📍 {mural.ubicacion}
                        </p>
                      )}{" "}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-2xl shadow-lg p-12 text-center border border-border">
                <div className="text-6xl mb-4">📄</div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  No hay resultados
                </h3>
                <p className="text-muted-foreground">
                  No se encontraron murales que coincidan con tu búsqueda.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Al final del archivo ---

function ModalZoomImage({ mural, rect, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef();

  // Animación desde la card
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    setWindowSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  // Zoom con rueda
  const handleWheel = (e) => {
    e.preventDefault();
    setZoom((z) =>
      Math.max(0.5, Math.min(5, z + (e.deltaY < 0 ? 0.15 : -0.15)))
    );
  };

  // Drag para mover la imagen
  const handleMouseDown = (e) => {
    setDragging(true);
    setStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => {
    if (dragging) {
      setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
    }
  };
  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging]);

  // Reset zoom/offset al abrir
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [mural]);

  // Calcular animación inicial/final (ajustar con scroll)
  const initial = {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height,
    position: "absolute",
    zIndex: 2,
  };
  const animate = {
    x: windowSize.width * 0.05 + window.scrollX,
    y: windowSize.height * 0.1 + window.scrollY,
    width: windowSize.width * 0.9,
    height: windowSize.height * 0.8,
    position: "fixed",
    zIndex: 3,
  };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 80, damping: 20 }}
      className="bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col pointer-events-auto"
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: 1200, maxHeight: "90vh" }}
    >
      <div className="relative flex-1 flex items-center justify-center bg-black select-none">
        <img
          ref={imgRef}
          src={mural.url_imagen}
          alt={mural.titulo}
          className="object-contain w-full h-full max-h-[70vh] bg-black cursor-grab"
          style={{
            transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${
              offset.y / zoom
            }px)`,
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onError={(e) => {
            e.target.src = "/assets/artworks/cuadro1.webp";
          }}
          draggable={false}
        />
        <button
          className="absolute top-3 right-3 bg-white/80 dark:bg-black/60 rounded-full p-2 text-xl font-bold shadow hover:bg-white/100 dark:hover:bg-black/80 transition"
          onClick={onClose}
        >
          ×
        </button>
        {/* Herramientas de imagen */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 rounded-lg p-2">
          <button
            className="text-white px-3 py-1 rounded hover:bg-white/20"
            onClick={() => setZoom((z) => Math.min(z + 0.2, 5))}
            title="Acercar"
          >
            +
          </button>
          <button
            className="text-white px-3 py-1 rounded hover:bg-white/20"
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            title="Alejar"
          >
            –
          </button>
          <button
            className="text-white px-3 py-1 rounded hover:bg-white/20"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
            title="Reset"
          >
            ⟳
          </button>
        </div>
      </div>
      <div className="p-6 overflow-y-auto max-h-[30vh]">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {mural.titulo}
        </h2>
        <p className="text-muted-foreground mb-2">
          {mural.autor || "Artista desconocido"}
        </p>
        {mural.tecnica && (
          <p className="text-sm text-muted-foreground mb-2">
            Técnica: {mural.tecnica}
          </p>
        )}
        {mural.anio && (
          <p className="text-sm text-muted-foreground mb-2">
            Año: {mural.anio}
          </p>
        )}
        {mural.descripcion && (
          <p className="text-base text-muted-foreground mb-2">
            {mural.descripcion}
          </p>
        )}
      </div>
    </motion.div>
  );
}
