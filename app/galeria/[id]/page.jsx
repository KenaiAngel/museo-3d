"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

export default function GaleriaDetalle() {
  const router = useRouter();
  const { id } = useParams();
  const [mural, setMural] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // Cargar mural por id
    fetch(`/api/murales/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.mural) {
          setMural(data.mural);
        } else if (data && data.id) {
          setMural(data);
        } else {
          setMural(false); // No encontrado
        }
      })
      .catch(() => setMural(false));
  }, [id]);

  useEffect(() => {
    if (!userId || !mural) return;
    // Consultar si el mural está en favoritos (puedes mejorar esto con un endpoint real)
    fetch(`/api/usuarios/${userId}`)
      .then(res => res.json())
      .then(data => {
        if (data.favoritedBy?.some(f => f.muralId === mural.id)) setIsFavorite(true);
        else setIsFavorite(false);
      });
  }, [userId, mural]);

  // Zoom con rueda
  const handleWheel = (e) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.5, Math.min(5, z + (e.deltaY < 0 ? 0.15 : -0.15))));
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

  if (mural === false) return <div className="p-12 text-center text-red-500">Mural no encontrado</div>;
  if (!mural) return <div className="p-12 text-center">Cargando...</div>;

  // Descargar imagen
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = mural.url_imagen;
    link.download = mural.titulo || `mural-${id}`;
    link.click();
  };

  // Guardar en galería personal (simulado)
  const handleGuardar = () => {
    alert("Obra guardada en tu galería personal (simulado)");
  };

  const handleToggleFavorite = async () => {
    if (!userId || !mural) return;
    setIsFavorite(fav => !fav);
    const method = isFavorite ? "DELETE" : "POST";
    await fetch(`/api/usuarios/${userId}/collection`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ muralId: mural.id }),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <button
        className="absolute top-6 left-6 bg-card rounded-full p-3 shadow border border-border text-2xl hover:bg-primary/10"
        onClick={() => router.back()}
      >
        ←
      </button>
      <div className="w-full max-w-4xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col">
        <div className="relative flex-1 flex items-center justify-center bg-black select-none min-h-[60vh]">
          <img
            ref={imgRef}
            src={mural.url_imagen}
            alt={mural.titulo}
            className="object-contain w-full h-full max-h-[70vh] bg-black cursor-grab"
            style={{
              transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`
            }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onError={e => { e.target.src = '/assets/artworks/cuadro1.webp'; }}
            draggable={false}
          />
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
              onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }}
              title="Reset"
            >
              ⟳
            </button>
            <button
              className="text-white px-3 py-1 rounded hover:bg-white/20"
              onClick={handleDownload}
              title="Descargar imagen"
            >
              ⬇️
            </button>
            <button
              className="text-white px-3 py-1 rounded hover:bg-white/20"
              onClick={handleGuardar}
              title="Guardar en mi galería"
            >
              ⭐
            </button>
            {userId && (
              <button
                className={`text-white px-3 py-1 rounded hover:bg-white/20 flex items-center gap-1 ${isFavorite ? "text-pink-500" : "text-white"}`}
                onClick={handleToggleFavorite}
                title={isFavorite ? "Quitar de colección" : "Guardar en colección"}
              >
                <Heart fill={isFavorite ? "#ec4899" : "none"} strokeWidth={2} className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[30vh]">
          <h2 className="text-2xl font-bold text-foreground mb-2">{mural.titulo}</h2>
          <p className="text-muted-foreground mb-2">{mural.autor || 'Artista desconocido'}</p>
          {mural.tecnica && (
            <p className="text-sm text-muted-foreground mb-2">Técnica: {mural.tecnica}</p>
          )}
          {mural.anio && (
            <p className="text-sm text-muted-foreground mb-2">Año: {mural.anio}</p>
          )}
          {mural.descripcion && (
            <p className="text-base text-muted-foreground mb-2">{mural.descripcion}</p>
          )}
        </div>
      </div>
    </div>
  );
}
