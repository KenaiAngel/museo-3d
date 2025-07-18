import { useRef, useState, useEffect } from "react";
import AutoresTooltip from "./AutoresTooltip";
import { parseAutores, parseColaboradores } from "./utils";
import { MdViewInAr } from "react-icons/md";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PlusCircle, UploadCloud } from "lucide-react";
import ReactDOM from "react-dom";
import { generateMuralGLB } from "../../utils/generateMuralGLB";
import { uploadModelToCloudinary } from "../../utils/uploadToCloudinary";

export default function MuralCard({
  mural,
  onClick,
  onLike,
  isLiked,
  view = "grid",
  onARClick,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const autores = parseAutores(mural.autor);
  const colaboradores = parseColaboradores(mural.colaboradores);
  const [showAutoresTooltip, setShowAutoresTooltip] = useState(false);
  const [showColabsTooltip, setShowColabsTooltip] = useState(false);
  const [animating, setAnimating] = useState(false);
  const autoresAnchorRef = useRef(null);
  const colabsAnchorRef = useRef(null);
  const imagenSrc =
    mural.imagenUrl || mural.url_imagen || "/assets/artworks/cuadro1.webp";
  const [showPopover, setShowPopover] = useState(false);
  const popoverRef = useRef();
  const buttonRef = useRef();
  const fileInputRef = useRef();
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [localMuralData, setLocalMuralData] = useState(mural);

  // Estado para detectar si el mural tiene modelo 3D
  const hasModel3D = Boolean(localMuralData.modelo3dUrl);

  // Actualizar datos locales cuando cambie el prop mural
  useEffect(() => {
    setLocalMuralData(mural);
  }, [mural]);

  // Cerrar popover al hacer click fuera
  useEffect(() => {
    if (!showPopover) return;
    function handleClick(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showPopover]);

  const handlePopoverClick = (e) => {
    e.stopPropagation();
    if (!showPopover && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopoverPos({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
    setShowPopover((v) => !v);
  };
  const handleClosePopover = (e) => {
    e.stopPropagation();
    setShowPopover(false);
  };
  const handleFileOption = (e) => {
    e.stopPropagation();
    setShowPopover(false);
    if (fileInputRef.current) fileInputRef.current.value = null;
    fileInputRef.current?.click();
  };
  const handleCreateOption = async (e) => {
    e.stopPropagation();
    setShowPopover(false);
    setUploading(true);
    toast.loading("Generando modelo 3D en el navegador...", {
      id: "create-modelo3d",
    });
    try {
      // 1. Generar modelo 3D en el frontend
      const glbBlob = await generateMuralGLB(mural.url_imagen);
      if (!glbBlob) throw new Error("No se pudo generar el modelo 3D");
      // 2. Subir a Cloudinary
      toast.loading("Subiendo modelo 3D a la nube...", {
        id: "create-modelo3d",
      });
      const fileName = `modelo_mural_${mural.id}_${Date.now()}.glb`;
      const modelo3dUrl = await uploadModelToCloudinary(glbBlob, fileName);
      if (!modelo3dUrl) throw new Error("No se pudo subir el modelo 3D");
      // 3. Guardar la URL en la base de datos
      const res = await fetch(`/api/murales/${mural.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelo3dUrl }),
      });
      if (!res.ok) throw new Error("No se pudo guardar la URL del modelo 3D");
      setLocalMuralData((prev) => ({ ...prev, modelo3dUrl }));
      toast.success(
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <div>
            <div className="font-semibold">
              Modelo 3D generado correctamente
            </div>
            <div className="text-sm opacity-75">¡AR disponible ahora!</div>
          </div>
        </div>,
        {
          id: "create-modelo3d",
          duration: 5000,
          style: { minWidth: "300px" },
        }
      );
      setTimeout(() => {
        setSuccess("");
        router.refresh();
      }, 1200);
    } catch (err) {
      const errorMsg = err.message || "Error al generar modelo 3D";
      setError(errorMsg);
      toast.error(errorMsg, { id: "create-modelo3d" });
    } finally {
      setUploading(false);
    }
  };
  const handleFileChange = async (e) => {
    setError("");
    setSuccess("");
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith(".glb")) {
      const errorMsg = "Solo se permiten archivos .glb";
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }
    setUploading(true);
    toast.loading("Subiendo modelo 3D...", { id: "upload-modelo3d" });

    try {
      const formData = new FormData();
      formData.append("modelo3d", file);
      const res = await fetch(`/api/murales/${mural.id}/modelo3d`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        const successMsg = data.message || "Modelo 3D subido correctamente";
        setSuccess(successMsg);

        // Actualizar el estado local del mural con la nueva URL del modelo
        setLocalMuralData((prev) => ({
          ...prev,
          modelo3dUrl: data.modelo3dUrl,
        }));

        // Toast de éxito más prominente
        toast.success(
          <div className="flex items-center gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <div className="font-semibold">{successMsg}</div>
              <div className="text-sm opacity-75">¡AR disponible ahora!</div>
            </div>
          </div>,
          {
            id: "upload-modelo3d",
            duration: 5000,
            style: {
              minWidth: "300px",
            },
          }
        );

        setTimeout(() => {
          setSuccess("");
          router.refresh();
        }, 1200);
      } else {
        const errorMsg = data.error || "Error al subir modelo 3D";
        setError(errorMsg);
        toast.error(errorMsg, { id: "upload-modelo3d" });
      }
    } catch (err) {
      const errorMsg = "Error de red al subir modelo 3D";
      setError(errorMsg);
      toast.error(errorMsg, { id: "upload-modelo3d" });
    } finally {
      setUploading(false);
    }
  };

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

  const handleARClick = (e) => {
    e.stopPropagation();
    if (localMuralData.modelo3dUrl) {
      router.push(`/galeria/${localMuralData.id}/ar`);
    } else {
      toast("Este mural no tiene modelo 3D para AR");
    }
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
          {/* Icono de AR en la esquina superior derecha - Solo si tiene modelo 3D */}
          {hasModel3D && (
            <button
              type="button"
              onClick={handleARClick}
              className="absolute top-2 right-2 bg-white/80 dark:bg-neutral-900/80 rounded-full p-1 shadow-md z-10 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 focus:outline-none transition-all duration-200 animate-pulse-subtle"
              title="Ver en Realidad Aumentada"
            >
              <MdViewInAr size={24} color="#6366f1" />
            </button>
          )}
        </div>
        {/* Info detallada */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <h3 className="font-semibold text-xl text-foreground mb-1 truncate">
            {mural.titulo}
          </h3>
          <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground mb-1">
            <span>{mural.tecnica}</span>
            {mural.anio || mural.year ? (
              <span>• {mural.anio || mural.year}</span>
            ) : null}
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
            className={`w-9 h-9 flex items-center justify-center text-pink-500 transition-all duration-200 rounded-full focus:outline-none bg-white dark:bg-neutral-900 border hover:bg-pink-100 dark:hover:bg-pink-900/30 ${isLiked ? "font-bold ring-2 ring-pink-400 bg-pink-100 dark:bg-pink-900/40 border-pink-400 focus:ring-2 focus:ring-pink-400/60" : "border-transparent focus:ring-0"} ${animating ? "scale-125" : ""}`}
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
      <div className="relative">
        <img
          src={imagenSrc}
          alt={mural.titulo}
          className="w-full h-48 object-cover rounded mb-2"
          onError={(e) => {
            e.target.src = "/assets/artworks/cuadro1.webp";
          }}
        />
        {/* Icono de AR en la esquina superior derecha - Solo si tiene modelo 3D */}
        {hasModel3D && (
          <button
            type="button"
            onClick={handleARClick}
            className="absolute top-2 right-2 bg-white/80 dark:bg-neutral-900/80 rounded-full p-1 shadow-md z-10 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 focus:outline-none transition-all duration-200 animate-pulse-subtle"
            title="Ver en Realidad Aumentada"
          >
            <MdViewInAr size={24} color="#6366f1" />
          </button>
        )}
      </div>
      <div className="font-bold text-lg mb-1">{mural.titulo}</div>
      {/* Elimina el toggle debajo del título, regresa a la posición original */}
      <div className="flex items-center gap-2 mt-2">
        <div className="relative group">
          <button
            onClick={handleLikeClick}
            aria-label={tooltipText}
            className={`w-9 h-9 flex items-center justify-center text-pink-500 transition-all duration-200 rounded-full focus:outline-none bg-white dark:bg-neutral-900 border hover:bg-pink-100 dark:hover:bg-pink-900/30 ${isLiked ? "font-bold ring-2 ring-pink-400 bg-pink-100 dark:bg-pink-900/40 border-pink-400 focus:ring-2 focus:ring-pink-400/60" : "border-transparent focus:ring-0"} ${animating ? "scale-125" : ""}`}
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
        {/* Toggle de crear modelo 3D vuelve aquí */}
        {isAdmin && (
          <div className="relative inline-block ml-auto">
            <button
              ref={buttonRef}
              onClick={handlePopoverClick}
              className="flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 dark:bg-neutral-800 text-indigo-700 dark:text-indigo-200 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-neutral-700 border border-indigo-100 dark:border-neutral-700 transition"
              title="Opciones modelo 3D"
              disabled={uploading}
            >
              <PlusCircle className="h-4 w-4" /> Modelo 3D
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb"
              style={{ display: "none" }}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                handleFileChange(e);
              }}
            />
            {showPopover &&
              typeof window !== "undefined" &&
              ReactDOM.createPortal(
                <div
                  ref={popoverRef}
                  className="fixed z-[9999] min-w-[180px] bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-2xl py-2 flex flex-col items-stretch animate-fade-in"
                  style={{
                    top: popoverPos.top,
                    left: popoverPos.left,
                    transform: "translateX(-50%)",
                    boxShadow: "0 8px 32px 0 rgba(0,0,0,0.18)",
                  }}
                >
                  <button
                    onClick={handleFileOption}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-neutral-800 hover:text-indigo-900 dark:hover:text-indigo-100 transition-all rounded-t-xl focus:outline-none"
                  >
                    <UploadCloud className="h-5 w-5 opacity-80" /> Subir modelo
                    3D
                  </button>
                  <button
                    onClick={handleCreateOption}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-neutral-800 hover:text-indigo-900 dark:hover:text-indigo-100 transition-all rounded-b-xl focus:outline-none border-t border-gray-100 dark:border-neutral-700"
                  >
                    <PlusCircle className="h-5 w-5 opacity-80" /> Crear modelo
                    3D
                  </button>
                </div>,
                document.body
              )}
          </div>
        )}
      </div>
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
    </div>
  );
}
