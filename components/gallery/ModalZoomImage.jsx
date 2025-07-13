import { useState, useRef, useEffect } from "react";

const MAGNIFIER_SIZE = 160;
const MAGNIFIER_ZOOM = 2.2;

export default function ModalZoomImage({ mural, rect, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef();
  const [showMagnifier, setShowMagnifier] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });

  // Scroll al área de la imagen al abrir el modal
  const imageContainerRef = useRef();
  useEffect(() => {
    if (imageContainerRef.current) {
      imageContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

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
    // Lupa
    if (imgRef.current && showMagnifier) {
      const rect = imgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMagnifierPos({ x, y });
    }
  };
  const handleMouseUp = () => setDragging(false);

  // Descargar imagen
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = mural?.imagenUrl || mural?.url_imagen;
    link.download = mural?.titulo || `mural`;
    link.click();
  };

  // Reset zoom y posición
  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Eventos globales para drag
  if (typeof window !== "undefined") {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
  }

  // Lupa: mouse move y enter/leave
  const handleImgMouseMove = (e) => {
    handleMouseMove(e);
  };
  const handleImgMouseEnter = (e) => {
    setShowMagnifier(true);
    handleMouseMove(e);
  };
  const handleImgMouseLeave = () => {
    setShowMagnifier(false);
  };

  // Imagen fuente
  const imgSrc = mural?.imagenUrl || mural?.url_imagen;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-4 max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={imageContainerRef}
          className="relative flex items-center justify-center bg-black select-none" style={{ minHeight: 400 }}
        >
          <img
            ref={imgRef}
            src={imgSrc}
            alt={mural?.titulo}
            className="object-contain w-full h-full max-h-[70vh] bg-black cursor-zoom-in"
            onMouseMove={e => {
              if (!imgRef.current) return;
              const rect = imgRef.current.getBoundingClientRect();
              // Calcular el tamaño real de la imagen renderizada
              const naturalWidth = imgRef.current.naturalWidth;
              const naturalHeight = imgRef.current.naturalHeight;
              const displayWidth = rect.width;
              const displayHeight = rect.height;
              // Calcular offsets para centrar la imagen si no llena el contenedor
              const offsetX = (displayWidth < rect.width) ? (rect.width - displayWidth) / 2 : 0;
              const offsetY = (displayHeight < rect.height) ? (rect.height - displayHeight) / 2 : 0;
              const x = e.clientX - rect.left - offsetX;
              const y = e.clientY - rect.top - offsetY;
              // Solo mostrar la lupa si el mouse está sobre la imagen visible
              if (x >= 0 && y >= 0 && x <= displayWidth && y <= displayHeight) {
                setMagnifierPos({ x, y, displayWidth, displayHeight });
                setShowMagnifier(true);
              } else {
                setShowMagnifier(false);
              }
            }}
            onMouseLeave={() => setShowMagnifier(false)}
            onError={e => { e.target.src = '/assets/artworks/cuadro1.webp'; }}
            draggable={false}
          />
          {/* Lupa (magnifier) */}
          {showMagnifier && imgRef.current && magnifierPos.displayWidth && (
            <div
              style={{
                position: "absolute",
                pointerEvents: "none",
                left: magnifierPos.x - MAGNIFIER_SIZE / 2,
                top: magnifierPos.y - MAGNIFIER_SIZE / 2,
                width: MAGNIFIER_SIZE,
                height: MAGNIFIER_SIZE,
                borderRadius: "50%",
                boxShadow: "0 2px 8px 0 rgba(0,0,0,0.25)",
                border: "2px solid #fff",
                overflow: "hidden",
                zIndex: 10,
                background: `url('${imgSrc}') no-repeat`,
                backgroundSize: `${magnifierPos.displayWidth * MAGNIFIER_ZOOM}px ${magnifierPos.displayHeight * MAGNIFIER_ZOOM}px`,
                backgroundPosition: `-${
                  (magnifierPos.x * MAGNIFIER_ZOOM - MAGNIFIER_SIZE / 2)
                }px -${
                  (magnifierPos.y * MAGNIFIER_ZOOM - MAGNIFIER_SIZE / 2)
                }px`,
              }}
            />
          )}
          {/* Herramienta: solo descargar imagen */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 rounded-lg p-2">
            <button
              className="text-white px-3 py-1 rounded hover:bg-white/20"
              onClick={handleDownload}
              title="Descargar imagen"
            >
              ⬇️
            </button>
          </div>
        </div>
        <button className="absolute top-2 right-2 text-lg" onClick={onClose}>
          ✕
        </button>
        <div className="p-4">
          <h2 className="text-2xl font-bold text-foreground mb-2">{mural?.titulo}</h2>
          <p className="text-muted-foreground mb-2">{mural?.autor || 'Artista desconocido'}</p>
          {mural?.tecnica && (
            <p className="text-sm text-muted-foreground mb-2">Técnica: {mural.tecnica}</p>
          )}
          {mural?.anio && (
            <p className="text-sm text-muted-foreground mb-2">Año: {mural.anio}</p>
          )}
          {mural?.descripcion && (
            <p className="text-base text-muted-foreground mb-2">{mural.descripcion}</p>
          )}
        </div>
      </div>
    </div>
  );
}
