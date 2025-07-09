"use client";
import { useEffect, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";

export default function ImageModalSimple({
  isOpen,
  onClose,
  artwork,
  onNavigate,
  currentIndex,
  totalImages,
}) {
  const modalRef = useRef(null);
  const imageRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Manejar teclas
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onNavigate("prev");
          break;
        case "ArrowRight":
          onNavigate("next");
          break;
        case "+":
        case "=":
          e.preventDefault();
          setScale((prev) => Math.min(prev + 0.25, 3));
          break;
        case "-":
          e.preventDefault();
          setScale((prev) => Math.max(prev - 0.25, 0.25));
          break;
        case "r":
          setRotation((prev) => prev + 90);
          break;
        case "0":
          setScale(1);
          setRotation(0);
          setDragOffset({ x: 0, y: 0 });
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onNavigate]);

  // Resetear transformaciones al cambiar imagen
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setDragOffset({ x: 0, y: 0 });
    setImageLoaded(false);
  }, [artwork?.id]);

  // Prevenir scroll del body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Manejar click fuera del modal
  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  // Manejar zoom
  const handleZoom = (direction) => {
    if (direction === "in") {
      setScale((prev) => Math.min(prev + 0.25, 3));
    } else {
      setScale((prev) => Math.max(prev - 0.25, 0.25));
    }
  };

  // Manejar rotación
  const handleRotate = () => {
    setRotation((prev) => prev + 90);
  };

  // Resetear transformaciones
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setDragOffset({ x: 0, y: 0 });
  };

  // Manejar drag
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setDragOffset({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Manejar carga de imagen
  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  if (!isOpen || !artwork) return null;



  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md image-modal-overlay"
      onClick={handleBackdropClick}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        overflow: "visible !important",
      }}
    >
      {/* Botón cerrar */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-10 p-3 text-white hover:text-gray-300 transition-all duration-200 hover:bg-white/10 rounded-full backdrop-blur-sm"
        aria-label="Cerrar modal"
      >
        <X size={24} />
      </button>

      {/* Controles de navegación */}
      {totalImages > 1 && (
        <>
          <button
            onClick={() => onNavigate("prev")}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-3 text-white hover:text-gray-300 transition-all duration-200 hover:bg-white/10 rounded-full backdrop-blur-sm"
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            onClick={() => onNavigate("next")}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-3 text-white hover:text-gray-300 transition-all duration-200 hover:bg-white/10 rounded-full backdrop-blur-sm"
            aria-label="Siguiente imagen"
          >
            <ChevronRight size={32} />
          </button>
        </>
      )}

      {/* Controles de imagen */}
      <div className="absolute top-6 left-6 z-10 flex gap-2">
        <button
          onClick={() => handleZoom("in")}
          className="p-3 text-white hover:text-gray-300 transition-all duration-200 hover:bg-white/10 rounded-full backdrop-blur-sm"
          aria-label="Zoom in"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => handleZoom("out")}
          className="p-3 text-white hover:text-gray-300 transition-all duration-200 hover:bg-white/10 rounded-full backdrop-blur-sm"
          aria-label="Zoom out"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={handleRotate}
          className="p-3 text-white hover:text-gray-300 transition-all duration-200 hover:bg-white/10 rounded-full backdrop-blur-sm"
          aria-label="Rotar"
        >
          <RotateCcw size={20} />
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-3 text-white hover:text-gray-300 transition-all duration-200 hover:bg-white/10 rounded-full backdrop-blur-sm text-sm font-medium"
          aria-label="Resetear"
        >
          Reset
        </button>
      </div>

      {/* Contador de imágenes */}
      {totalImages > 1 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 text-white text-sm bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full">
          {currentIndex + 1} / {totalImages}
        </div>
      )}

      {/* Imagen */}
      <div className="relative max-w-[90vw] max-h-[90vh] overflow-hidden flex items-center justify-center p-8">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        )}
        <img
          ref={imageRef}
          src={artwork.imagen || artwork.url}
          alt={artwork.titulo || artwork.nombre || "Obra de arte"}
          className={`max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${dragOffset.x}px, ${dragOffset.y}px)`,
            transformOrigin: "center",
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          onMouseDown={handleMouseDown}
          onLoad={handleImageLoad}
          draggable={false}
        />
      </div>

      {/* Información de la obra */}
      <div className="absolute bottom-6 left-6 right-6 z-10 text-white">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-semibold mb-3">
            {artwork.titulo || artwork.nombre}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {artwork.artista && (
              <div>
                <span className="font-medium text-gray-300">Artista:</span>
                <p className="text-white">{artwork.artista}</p>
              </div>
            )}
            {artwork.tecnica && (
              <div>
                <span className="font-medium text-gray-300">Técnica:</span>
                <p className="text-white">{artwork.tecnica}</p>
              </div>
            )}
            {artwork.año && (
              <div>
                <span className="font-medium text-gray-300">Año:</span>
                <p className="text-white">{artwork.año}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 text-white/70 text-xs text-center bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
        <p>Flechas: navegar • +/-: zoom • R: rotar • 0: reset • ESC: cerrar</p>
      </div>
    </div>
  );
}
