"use client";
import { useState, useEffect } from "react";
import GalleryRoom from "../../components/GalleryRoom.jsx";
import { PageLoader, SectionLoader } from "../../components/LoadingSpinner";
import AnimatedBackground from "../../components/shared/AnimatedBackground";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import SalaCard from "../../components/ui/SalaCard";
import { useRouter } from "next/navigation";

/**
 * La prueba más simple posible. Si esto no se ve, el problema está
 * en un nivel superior (ClientLayout.jsx o globals.css).
 */
export default function MuseoPage() {
  const [salaSeleccionada, setSalaSeleccionada] = useState(null);
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const router = useRouter();

  useEffect(() => {
    const cargarSalas = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/salas");
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();
        const salasFormateadas = data.salas.map((sala) => ({
          id: sala.id,
          nombre: sala.nombre,
          descripcion: `Sala con ${sala._count.murales} murales`,
          imagen:
            sala.imagenPortada ||
            sala.murales[0]?.mural?.url_imagen ||
            "/assets/artworks/cuadro1.webp",
          color: getColorBySalaId(sala.id),
          cantidadMurales: sala._count.murales,
          propietario: sala.creador?.name || sala.creador?.id || "Museo",
          murales:
            sala.murales.map((salaMural) => salaMural.mural).filter(Boolean) ||
            [],
        }));
        setSalas(salasFormateadas);
        setError(null);
      } catch (err) {
        console.error("Error al cargar salas:", err);
        setError(err.message);
        setSalas(getSalasFallback());
      } finally {
        setLoading(false);
      }
    };
    cargarSalas();
  }, []);

  const getColorBySalaId = (id) =>
    ({ 1: "#e3f2fd", 2: "#f3e5f5", 3: "#e8f5e8", 4: "#fff3e0" })[id] ||
    "#f5f5f5";
  const getIconBySalaId = (id) =>
    ({ 1: "🎨", 2: "🖼️", 3: "💻", 4: "🎭" })[id] || "🏛️";

  const getSalasFallback = () => [
    {
      id: 1,
      nombre: "Sala Principal",
      descripcion: "Exposición permanente",
      imagen: "/assets/artworks/cuadro1.webp",
      color: "#e3f2fd",
      cantidadMurales: 0,
      propietario: "Sistema",
      murales: [],
    },
    {
      id: 2,
      nombre: "Sala ARPA",
      descripcion: "Murales del programa ARPA",
      imagen: "/assets/artworks/cuadro2.webp",
      color: "#fff3e0",
      cantidadMurales: 0,
      propietario: "ARPA",
      murales: [],
    },
  ];

  const salasFiltradas = salas.filter((sala) =>
    sala.nombre.toLowerCase().includes(search.toLowerCase())
  );

  if (salaSeleccionada) {
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100]">
        <button
          onClick={() => setSalaSeleccionada(null)}
          className="absolute top-5 left-5 z-[1000] bg-background/90 border-2 border-border rounded-lg px-4 py-2 cursor-pointer font-bold text-sm hover:bg-background transition-colors shadow-lg"
        >
          ← Volver a salas
        </button>
        <GalleryRoom
          salaId={salaSeleccionada}
          murales={salas.find((s) => s.id === salaSeleccionada)?.murales || []}
          onRoomChange={setSalaSeleccionada}
          availableRooms={salas.map((s) => ({
            id: s.id,
            name: s.nombre,
            icon: getIconBySalaId(s.id),
          }))}
        />
      </div>
    );
  }

  if (loading) {
    return <PageLoader text="Cargando salas del museo..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="text-6xl mb-6 opacity-20">⚠️</div>
          <h2 className="text-2xl font-light text-foreground mb-4">
            Error al cargar las salas
          </h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-24 md:pt-28 pb-2 md:pb-4">
        {/* Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
              Museo Virtual 3D
            </h1>
            <p className="text-lg text-muted-foreground">
              Explora las salas y descubre obras en un entorno inmersivo
            </p>
          </div>
          {isAdmin && (
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow hover:bg-indigo-700 transition"
              onClick={() => router.push("/mis-salas")}
            >
              <Plus className="h-5 w-5" /> Crear sala
            </button>
          )}
        </div>
        {/* Filtros */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar salas..."
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground w-full sm:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {/* Grid de salas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {salasFiltradas.map((sala) => (
            <SalaCard
              key={sala.id}
              sala={sala}
              isAdmin={isAdmin}
              onEnter={() => setSalaSeleccionada(sala.id)}
            />
          ))}
        </div>
        {/* Estado vacío */}
        {salasFiltradas.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No hay salas disponibles.
            </p>
            {isAdmin && (
              <button
                className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                onClick={() => router.push("/mis-salas")}
              >
                <Plus className="h-5 w-5" /> Crear sala
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
