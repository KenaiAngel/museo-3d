"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { PageLoader, SectionLoader } from "../../components/LoadingSpinner";
import GalleryCarousel from "../../components/GalleryCarousel";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCollection } from "../../providers/CollectionProvider";
import { Heart } from "lucide-react";
import ReactDOM from "react-dom";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../components/ui/tooltip";
import AnimatedBackground from "../../components/shared/AnimatedBackground";

// Componentes de fondo animado (copiados de acerca-de)

// Agrega la función utilitaria al inicio del archivo:
function parseAutores(autorString) {
  return autorString
    ? autorString
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];
}

// Agrega la función utilitaria para colaboradores al inicio del archivo:
function parseColaboradores(colabString) {
  return colabString
    ? colabString
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];
}

// Agrega el componente AutoresTooltip al inicio del archivo:
function AutoresTooltip({ anchorRef, autores, show }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  }, [show, anchorRef]);
  if (!show) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        transform: "translateX(-50%)",
        zIndex: 99999,
      }}
      className="bg-white dark:bg-neutral-900 border-2 border-pink-400 dark:border-pink-700 rounded-xl shadow-xl p-2 text-xs min-w-[140px] max-w-xs whitespace-pre-line pointer-events-auto backdrop-blur-md"
    >
      {autores.join("\n")}
    </div>,
    typeof window !== "undefined" ? document.body : null
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
  const [showTooltipIdx, setShowTooltipIdx] = useState(null);
  const [tooltipAnchor, setTooltipAnchor] = useState(null);

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
                      {murales.map((mural, idx) => {
                        const autores = parseAutores(mural.autor);
                        const extraAutores =
                          autores.length > 3 ? autores.slice(3) : [];
                        const colaboradores = parseColaboradores(
                          mural.colaboradores
                        );
                        const extraColabs =
                          colaboradores.length > 3
                            ? colaboradores.slice(3)
                            : [];
                        return (
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
                              className="absolute top-3 right-3 z-20 bg-white/80 dark:bg-black/60 rounded-full p-2 shadow-md transition-transform duration-200 hover:scale-125 group"
                              disabled={!mural.id}
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!mural.id) {
                                  toast.error(
                                    "No se puede guardar: el mural no tiene ID válido"
                                  );
                                  return;
                                }
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
                              <Heart
                                fill={
                                  isInCollection(mural.id)
                                    ? `url(#heart-gradient-${mural.id})`
                                    : "none"
                                }
                                stroke="currentColor"
                                strokeWidth={2.5}
                                className={`w-7 h-7 transition-all duration-200 ${
                                  isInCollection(mural.id)
                                    ? "text-pink-500 animate-pulse drop-shadow-[0_0_6px_#ec4899cc]"
                                    : "text-gray-400 group-hover:text-pink-400"
                                } group-hover:scale-125`}
                              />
                            </button>
                            <svg width="0" height="0">
                              <defs>
                                <linearGradient
                                  id={`heart-gradient-${mural.id}`}
                                  x1="0"
                                  y1="0"
                                  x2="1"
                                  y2="1"
                                >
                                  <stop offset="0%" stopColor="#ec4899" />
                                  <stop offset="100%" stopColor="#f472b6" />
                                </linearGradient>
                              </defs>
                            </svg>
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
                                  e.target.src =
                                    "/assets/artworks/cuadro1.webp";
                                }}
                              />
                            </div>
                            <div className="p-6">
                              <h3 className="text-xl font-bold text-foreground mb-2">
                                {mural.titulo}
                              </h3>
                              <div className="flex flex-wrap gap-1 mb-2 items-center">
                                {autores.slice(0, 3).map((autor, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                                  >
                                    {autor}
                                  </span>
                                ))}
                                {extraAutores.length > 0 && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span
                                        ref={(el) => {
                                          if (showTooltipIdx === mural.id)
                                            setTooltipAnchor(el);
                                        }}
                                        className="inline-block bg-pink-200 dark:bg-pink-800/60 text-pink-900 dark:text-pink-100 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer relative"
                                        tabIndex={0}
                                        aria-label="Ver todos los autores"
                                        onMouseEnter={() =>
                                          setShowTooltipIdx(mural.id)
                                        }
                                        onMouseLeave={() =>
                                          setShowTooltipIdx(null)
                                        }
                                      >
                                        ...
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent
                                      anchorRef={{ current: tooltipAnchor }}
                                      side="top"
                                      open={showTooltipIdx === mural.id}
                                    >
                                      {extraAutores.join("\n")}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              {colaboradores.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2 items-center">
                                  {colaboradores
                                    .slice(0, 3)
                                    .map((colab, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                                      >
                                        {colab}
                                      </span>
                                    ))}
                                  {extraColabs.length > 0 && (
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <span
                                          ref={(el) => {
                                            if (
                                              showTooltipIdx ===
                                              mural.id + "-colab"
                                            )
                                              setTooltipAnchor(el);
                                          }}
                                          className="inline-block bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer relative"
                                          tabIndex={0}
                                          aria-label="Ver todos los colaboradores"
                                          onMouseEnter={() =>
                                            setShowTooltipIdx(
                                              mural.id + "-colab"
                                            )
                                          }
                                          onMouseLeave={() =>
                                            setShowTooltipIdx(null)
                                          }
                                        >
                                          ...
                                        </span>
                                      </TooltipTrigger>
                                      <TooltipContent
                                        anchorRef={{ current: tooltipAnchor }}
                                        side="top"
                                        open={
                                          showTooltipIdx === mural.id + "-colab"
                                        }
                                      >
                                        {extraColabs.join("\n")}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              )}
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
                        );
                      })}
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
                {filteredMurales.map((mural) => {
                  const autores = parseAutores(mural.autor);
                  const extraAutores =
                    autores.length > 3 ? autores.slice(3) : [];
                  const colaboradores = parseColaboradores(mural.colaboradores);
                  const extraColabs =
                    colaboradores.length > 3 ? colaboradores.slice(3) : [];
                  return (
                    <div
                      key={mural.id}
                      className="gallery-card-glow bg-card rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border relative"
                      onClick={() => router.push(`/galeria/${mural.id}`)} // Abrir modal al hacer clic
                    >
                      {/* Botón de corazón (favoritos) */}
                      <button
                        className="absolute top-3 right-3 z-20 bg-white/80 dark:bg-black/60 rounded-full p-2 shadow-md transition-transform duration-200 hover:scale-125 group"
                        disabled={!mural.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!mural.id) {
                            toast.error(
                              "No se puede guardar: el mural no tiene ID válido"
                            );
                            return;
                          }
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
                        <Heart
                          fill={
                            isInCollection(mural.id)
                              ? `url(#heart-gradient-${mural.id})`
                              : "none"
                          }
                          stroke="currentColor"
                          strokeWidth={2.5}
                          className={`w-6 h-6 transition-all duration-200 ${
                            isInCollection(mural.id)
                              ? "text-pink-500 animate-pulse drop-shadow-[0_0_6px_#ec4899cc]"
                              : "text-gray-400 group-hover:text-pink-400"
                          } group-hover:scale-125`}
                        />
                      </button>
                      <svg width="0" height="0">
                        <defs>
                          <linearGradient
                            id={`heart-gradient-${mural.id}`}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="1"
                          >
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#f472b6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Año en la esquina superior izquierda */}
                      {mural.anio && (
                        <div className="absolute top-3 left-3 bg-background/90 rounded-full px-2 py-1 text-xs font-bold text-foreground shadow">
                          {mural.anio}
                        </div>
                      )}
                      <div className="relative h-48">
                        {/* Badge del año en la esquina superior izquierda */}
                        {mural.anio && (
                          <div className="absolute top-3 left-3 bg-background/90 rounded-full px-2 py-1 text-xs font-bold text-foreground shadow z-20">
                            {mural.anio}
                          </div>
                        )}
                        <img
                          src={mural.url_imagen}
                          alt={mural.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = "/assets/artworks/cuadro1.webp";
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                          {mural.titulo}
                        </h3>
                        <div className="flex flex-wrap gap-1 mb-2 items-center">
                          {autores.slice(0, 3).map((autor, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                            >
                              {autor}
                            </span>
                          ))}
                          {extraAutores.length > 0 && (
                            <Tooltip>
                              <TooltipTrigger>
                                <span
                                  ref={(el) => {
                                    if (showTooltipIdx === mural.id)
                                      setTooltipAnchor(el);
                                  }}
                                  className="inline-block bg-pink-200 dark:bg-pink-800/60 text-pink-900 dark:text-pink-100 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer relative"
                                  tabIndex={0}
                                  aria-label="Ver todos los autores"
                                  onMouseEnter={() =>
                                    setShowTooltipIdx(mural.id)
                                  }
                                  onMouseLeave={() => setShowTooltipIdx(null)}
                                >
                                  ...
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                anchorRef={{ current: tooltipAnchor }}
                                side="top"
                                open={showTooltipIdx === mural.id}
                              >
                                {extraAutores.join("\n")}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {colaboradores.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2 items-center">
                            {colaboradores.slice(0, 3).map((colab, idx) => (
                              <span
                                key={idx}
                                className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                              >
                                {colab}
                              </span>
                            ))}
                            {extraColabs.length > 0 && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <span
                                    ref={(el) => {
                                      if (
                                        showTooltipIdx ===
                                        mural.id + "-colab"
                                      )
                                        setTooltipAnchor(el);
                                    }}
                                    className="inline-block bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer relative"
                                    tabIndex={0}
                                    aria-label="Ver todos los colaboradores"
                                    onMouseEnter={() =>
                                      setShowTooltipIdx(mural.id + "-colab")
                                    }
                                    onMouseLeave={() => setShowTooltipIdx(null)}
                                  >
                                    ...
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  anchorRef={{ current: tooltipAnchor }}
                                  side="top"
                                  open={showTooltipIdx === mural.id + "-colab"}
                                >
                                  {extraColabs.join("\n")}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        )}
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
                  );
                })}
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
        <div className="flex flex-wrap gap-1 mb-2 items-center">
          {parseAutores(mural.autor).length > 0 ? (
            parseAutores(mural.autor)
              .slice(0, 3)
              .map((autor, idx) => (
                <span
                  key={idx}
                  className="inline-block bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200 px-2 py-0.5 rounded-full text-xs font-semibold"
                >
                  {autor}
                </span>
              ))
          ) : (
            <span className="text-muted-foreground">Artista desconocido</span>
          )}
          {parseAutores(mural.autor).length > 3 && (
            <Tooltip>
              <TooltipTrigger>
                <span
                  className="inline-block bg-pink-200 dark:bg-pink-800/60 text-pink-900 dark:text-pink-100 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer relative"
                  tabIndex={0}
                  aria-label="Ver todos los autores"
                  ref={cardRefs.current[mural.id]}
                >
                  ...
                </span>
              </TooltipTrigger>
              <TooltipContent
                anchorRef={cardRefs.current[mural.id]}
                side="top"
                open={showTooltipIdx === mural.id}
              >
                {parseAutores(mural.autor).slice(3).join("\n")}
              </TooltipContent>
            </Tooltip>
          )}
          {parseAutores(mural.autor).length === 0 && (
            <span className="text-muted-foreground">Artista desconocido</span>
          )}
        </div>
        {colaboradores.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2 items-center">
            {colaboradores.slice(0, 3).map((colab, idx) => (
              <span
                key={idx}
                className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold"
              >
                {colab}
              </span>
            ))}
            {extraColabs.length > 0 && (
              <Tooltip>
                <TooltipTrigger>
                  <span
                    ref={(el) => {
                      if (showTooltipIdx === mural.id + "-colab")
                        setTooltipAnchor(el);
                    }}
                    className="inline-block bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer relative"
                    tabIndex={0}
                    aria-label="Ver todos los colaboradores"
                    onMouseEnter={() => setShowTooltipIdx(mural.id + "-colab")}
                    onMouseLeave={() => setShowTooltipIdx(null)}
                  >
                    ...
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  anchorRef={{ current: tooltipAnchor }}
                  side="top"
                  open={showTooltipIdx === mural.id + "-colab"}
                >
                  {extraColabs.join("\n")}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
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
