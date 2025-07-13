import { useRef, useState } from "react";
import AutoresTooltip from "./AutoresTooltip";
import { parseAutores, parseColaboradores } from "./utils";

export default function MuralCard({ mural, onClick, onLike, isLiked, view = "grid" }) {
  const autores = parseAutores(mural.autor);
  const colaboradores = parseColaboradores(mural.colaboradores);
  const [showAutoresTooltip, setShowAutoresTooltip] = useState(false);
  const [showColabsTooltip, setShowColabsTooltip] = useState(false);
  const [animating, setAnimating] = useState(false);
  const autoresAnchorRef = useRef(null);
  const colabsAnchorRef = useRef(null);
  const imagenSrc =
    mural.imagenUrl || mural.url_imagen || "/assets/artworks/cuadro1.webp";

  // Contador local de favoritos (solo visual)
  const localLikes = (mural.likes || 0) + (isLiked ? 1 : 0);

  // Tooltip dinámico
  const tooltipText = isLiked ? "Quitar de favoritos" : "Añadir a favoritos";

  const handleLikeClick = (e) => {
    e.stopPropagation();
    setAnimating(true);
    onLike(mural);
    setTimeout(() => setAnimating(false), 350);
  };

  if (view === "list") {
    return (
      <div
        className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border flex items-center gap-6 p-4"
        onClick={onClick}
      >
        {/* Imagen mediana a la izquierda */}
        <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden rounded-lg">
          <img
            src={imagenSrc}
            alt={mural.titulo}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "/assets/artworks/cuadro1.webp";
            }}
          />
        </div>
        {/* Info detallada */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h3 className="font-semibold text-xl text-foreground mb-1 truncate">
            {mural.titulo}
          </h3>
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-1">
            <span>{mural.tecnica}</span>
            {mural.anio || mural.year ? <span>• {mural.anio || mural.year}</span> : null}
            {mural.salaNombre && <span>• Sala: {mural.salaNombre}</span>}
          </div>
          {/* Autores y colaboradores */}
          <div className="flex flex-wrap gap-2 items-center mb-1">
            {autores.length > 0 && (
              <span className="text-xs font-semibold text-pink-700 dark:text-pink-200 bg-pink-100 dark:bg-pink-900/40 px-2 py-0.5 rounded-full">
                Autor: {autores.join(", ")}
              </span>
            )}
            {colaboradores.length > 0 && (
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                Colaboradores: {colaboradores.join(", ")}
              </span>
            )}
          </div>
          {/* Descripción completa */}
          {mural.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {mural.descripcion}
            </p>
          )}
        </div>
        {/* Botón de favorito */}
        <div className="flex flex-col items-center gap-2 min-w-[60px]">
          <button
            onClick={handleLikeClick}
            aria-label={tooltipText}
            className={`w-9 h-9 flex items-center justify-center text-pink-500 transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400/60 bg-white dark:bg-neutral-900 border border-transparent hover:bg-pink-100 dark:hover:bg-pink-900/30 ${isLiked ? "font-bold ring-2 ring-pink-400 bg-pink-100 dark:bg-pink-900/40" : ""} ${animating ? "scale-125" : ""}`}
          >
            ♥
          </button>
          <span className="text-xs font-semibold text-muted-foreground select-none">
            {localLikes}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-lg shadow-md bg-white dark:bg-neutral-900 p-3 cursor-pointer hover:shadow-lg transition"
      onClick={onClick}
    >
      <img
        src={imagenSrc}
        alt={mural.titulo}
        className="w-full h-48 object-cover rounded mb-2"
        onError={(e) => {
          e.target.src = "/assets/artworks/cuadro1.webp";
        }}
      />
      <div className="font-bold text-lg mb-1">{mural.titulo}</div>
      <div className="flex flex-wrap gap-1 mb-1">
        {autores.slice(0, 2).map((autor, idx) => (
          <span
            key={idx}
            className="inline-block bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200 px-2 py-0.5 rounded-full text-xs font-semibold"
          >
            {autor}
          </span>
        ))}
        {autores.length > 2 && (
          <span
            ref={autoresAnchorRef}
            className="inline-block bg-pink-200 dark:bg-pink-800/60 text-pink-900 dark:text-pink-100 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer relative"
            onMouseEnter={() => setShowAutoresTooltip(true)}
            onMouseLeave={() => setShowAutoresTooltip(false)}
            tabIndex={0}
            aria-label="Ver todos los autores"
          >
            ...
            <AutoresTooltip
              anchorRef={autoresAnchorRef}
              autores={autores}
              show={showAutoresTooltip}
            />
          </span>
        )}
      </div>
      {colaboradores.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {colaboradores.slice(0, 2).map((colab, idx) => (
            <span
              key={idx}
              className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs font-semibold"
            >
              {colab}
            </span>
          ))}
          {colaboradores.length > 2 && (
            <span
              ref={colabsAnchorRef}
              className="inline-block bg-blue-200 dark:bg-blue-800/60 text-blue-900 dark:text-blue-100 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer relative"
              onMouseEnter={() => setShowColabsTooltip(true)}
              onMouseLeave={() => setShowColabsTooltip(false)}
              tabIndex={0}
              aria-label="Ver todos los colaboradores"
            >
              ...
              <AutoresTooltip
                anchorRef={colabsAnchorRef}
                autores={colaboradores}
                show={showColabsTooltip}
              />
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <div className="relative group">
          <button
            onClick={handleLikeClick}
            aria-label={tooltipText}
            className={`w-9 h-9 flex items-center justify-center text-pink-500 transition-all duration-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-400/60 bg-white dark:bg-neutral-900 border border-transparent hover:bg-pink-100 dark:hover:bg-pink-900/30 ${isLiked ? "font-bold ring-2 ring-pink-400 bg-pink-100 dark:bg-pink-900/40" : ""} ${animating ? "scale-125" : ""}`}
          >
            ♥
          </button>
          <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 rounded bg-black/80 text-white text-xs opacity-0 group-hover:opacity-100 pointer-events-none z-20 whitespace-nowrap">
            {tooltipText}
          </span>
        </div>
        <span className="text-xs font-semibold text-muted-foreground select-none">
          {localLikes}
        </span>
      </div>
    </div>
  );
}
