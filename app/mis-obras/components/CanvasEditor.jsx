"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Brush,
  Save,
  Eraser,
  Droplets,
  Sparkles,
  Square,
  Palette as PaletteIcon,
  Flame,
  Circle,
  Grid3X3,
  Minus,
  PaintBucket,
  Scissors,
  Waves,
  Zap,
  MoreHorizontal,
  Target,
} from "lucide-react";

// Mapeo de iconos para evitar uso de eval()
const ICON_MAP = {
  Brush: Brush,
  Eraser: Eraser,
  Droplets: Droplets,
  Sparkles: Sparkles,
  Square: Square,
  Flame: Flame,
  Circle: Circle,
  Grid3X3: Grid3X3,
  Minus: Minus,
  Waves: Waves,
  Zap: Zap,
  MoreHorizontal: MoreHorizontal,
  Target: Target,
};
import toast from "react-hot-toast";
import { DatePicker } from "@/components/ui/date-picker-new";
import { useDropzone } from "react-dropzone";
import Palette from "./tools/Palette";
import BrushSelector from "./tools/BrushSelector";
import BackgroundSelector from "./tools/BackgroundSelector";
import ToolActions from "./tools/ToolActions";
// Importar las funciones de dibujo
import {
  drawAt as drawAtUtil,
  hexToRgb as hexToRgbUtil,
  BRUSH_TYPES,
  BRUSH_CONFIGS,
  DEFAULT_COLORS,
  saveCanvasToHistory,
  restoreCanvasFromHistory,
  clearCanvas as clearCanvasUtil,
  initializeCanvas,
  loadImageToCanvas,
  getCanvasCoordinates,
} from "@/utils/drawingFunctions";

// Estilos CSS para animaciones del cursor
const cursorAnimationStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  
  @keyframes flicker {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  
  @keyframes sparkle {
    0%, 100% { transform: rotate(0deg) scale(1); }
    25% { transform: rotate(90deg) scale(1.1); }
    50% { transform: rotate(180deg) scale(0.9); }
    75% { transform: rotate(270deg) scale(1.1); }
  }
`;

// Inyectar estilos en el documento
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = cursorAnimationStyles;
  document.head.appendChild(styleSheet);
}

export default function CanvasEditor({
  isOpen,
  onClose,
  onSave,
  editingMural = null,
}) {
  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState("brush");
  const [brushSize, setBrushSize] = useState(15);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);
  const [muralData, setMuralData] = useState({
    titulo: editingMural?.titulo || "",
    descripcion: editingMural?.descripcion || "",
    tecnica: editingMural?.tecnica || "Digital",
    year: editingMural?.year || new Date().getFullYear(),
  });
  const [muralDataError, setMuralDataError] = useState(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasBg, setCanvasBg] = useState(null);
  const [canvasBgColor, setCanvasBgColor] = useState("#ffffff");
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [bgImageError, setBgImageError] = useState(null);
  const [recentColors, setRecentColors] = useState(["#000000", "#ffffff"]);
  const [prevColors, setPrevColors] = useState([]);
  const [showBrushModal, setShowBrushModal] = useState(false);
  const [artistList, setArtistList] = useState([]);

  useEffect(() => {
    fetch("/api/artists?limit=100")
      .then((res) => res.json())
      .then((data) => setArtistList(data.artists || []))
      .catch(() => setArtistList([]));
  }, []);

  // Funciones de utilidad para manejo de colores
  const hexToRgb = hexToRgbUtil;

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const colors = DEFAULT_COLORS;

  const tools = BRUSH_CONFIGS.filter(
    (config) => config.category === "basic" || config.category === "artistic"
  ).map((config) => ({
    id: config.type,
    name: config.name,
    icon:
      config.icon === "Palette" ? PaletteIcon : ICON_MAP[config.icon] || Brush,
  }));

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = 800;
      canvas.height = 600;

      // Fondo blanco por defecto
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Si estamos editando un mural existente, cargar la imagen
      if (editingMural?.url_imagen) {
        const img = new Image();
        img.crossOrigin = "anonymous"; // <-- importante para CORS
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          saveToHistory();
        };
        img.onerror = () => {
          // Si la imagen no tiene CORS, muestra un mensaje o maneja el error
          alert(
            "No se puede cargar la imagen para editar porque el servidor no permite CORS. No podrás exportar el canvas."
          );
          saveToHistory();
        };
        img.src = editingMural.url_imagen;
      } else {
        saveToHistory();
      }
    }
  }, [isOpen, editingMural]);

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const { newHistory, newIndex } = saveCanvasToHistory(
      canvas,
      canvasHistory,
      historyIndex
    );
    setCanvasHistory(newHistory);
    setHistoryIndex(newIndex);
  };

  const undo = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const { newHistory, newIndex } = undoCanvas(
      canvas,
      canvasHistory,
      historyIndex
    );
    setCanvasHistory(newHistory);
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const { newHistory, newIndex } = redoCanvas(
      canvas,
      canvasHistory,
      historyIndex
    );
    setCanvasHistory(newHistory);
    setHistoryIndex(newIndex);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    clearCanvasUtil(canvas);
    saveToHistory();
  };

  // Refs para siempre tener el valor actual de brushType y brushColor
  const brushTypeRef = useRef(currentTool);
  const brushColorRef = useRef(currentColor);
  useEffect(() => {
    brushTypeRef.current = currentTool;
  }, [currentTool]);
  useEffect(() => {
    brushColorRef.current = currentColor;
  }, [currentColor]);

  // Sistema de coordenadas y handlers
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    setCursorPos({ x: cssX, y: cssY });
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    if (isDrawing) {
      drawAt(x, y);
    }
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
    saveToHistory();
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;

    const ctx = canvas.getContext("2d");
    const type = brushTypeRef.current;

    // Inicializar el trazo basado en el tipo de pincel
    if (type === "brush" || type === "marcador" || type === "oleo") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }

    setLastPoint({ x, y });
    drawAt(x, y);
  };

  // Función para resetear completamente el contexto del canvas
  const resetCanvasContext = (ctx) => {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = "transparent";
    ctx.lineCap = "butt";
    ctx.lineJoin = "miter";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#000000";
    ctx.fillStyle = "#000000";
  };

  // Función principal de dibujo con técnicas avanzadas basadas en perfectionkills.com
  const drawAt = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const type = brushTypeRef.current;
    const brushColor = brushColorRef.current;

    drawAtUtil(x, y, canvas, ctx, type, brushColor, brushSize, lastPoint);
    setLastPoint({ x, y });
  };

  const handleSave = async () => {
    if (!muralData.titulo.trim()) {
      toast.error("Por favor ingresa un título para tu obra");
      return;
    }

    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("imagen", blob, `${muralData.titulo}.png`);
      formData.append("titulo", muralData.titulo);
      formData.append("descripcion", muralData.descripcion);
      formData.append("tecnica", muralData.tecnica);
      formData.append("year", muralData.year);
      formData.append("autor", "Usuario"); // Esto debería ser el nombre del usuario logueado

      try {
        const url = editingMural
          ? `/api/murales/${editingMural.id}`
          : "/api/murales";
        const method = editingMural ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          toast.success(
            editingMural
              ? "Obra actualizada exitosamente"
              : "Obra creada exitosamente"
          );
          onSave(result);
          onClose();
        } else {
          toast.error("Error al guardar la obra");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al guardar la obra");
      }
    }, "image/png");
  };

  const applyBgColor = (color) => {
    setCanvasBgColor(color);
    setCanvasBg(null);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToHistory();
    }
  };

  const onDropBg = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCanvasBg(url);
      setBgImageError(null);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        const img = new window.Image();
        img.onload = () => {
          ctx.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          ctx.drawImage(
            img,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          saveToHistory();
        };
        img.onerror = () =>
          setBgImageError("No se pudo cargar la imagen de fondo.");
        img.src = url;
      }
    }
  };

  const bgDropzone = useDropzone({
    onDrop: onDropBg,
    accept: { "image/*": [] },
    multiple: false,
  });

  const paletteColors = Array.from(
    new Set([currentColor, ...recentColors, ...prevColors, ...colors])
  ).slice(0, 12);

  const handleSetBrushColor = (color) => {
    setCurrentColor(color);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      return [color, ...filtered].slice(0, 6);
    });
    setPrevColors((prev) => {
      if (prev.includes(color) || colors.includes(color)) return prev;
      return [color, ...prev].slice(0, 6);
    });
  };

  useEffect(() => {
    if (canvasBg && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new window.Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(
          img,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      };
      img.onerror = () =>
        setBgImageError("No se pudo cargar la imagen de fondo.");
      img.src = canvasBg;
    } else if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = canvasBgColor;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [canvasBg, canvasBgColor]);

  // Descargar el canvas como imagen PNG
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `${muralData.titulo || "obra"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  // Sincronizar muralData con editingMural al abrir o cambiar
  useEffect(() => {
    if (isOpen && editingMural) {
      setMuralData({
        titulo: editingMural.titulo || "",
        descripcion: editingMural.descripcion || "",
        tecnica: editingMural.tecnica || "Digital",
        year: editingMural.year || new Date().getFullYear(),
      });
    }
  }, [isOpen, editingMural]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingMural ? "Editar Obra" : "Crear Nueva Obra"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Panel de herramientas */}
            <div className="lg:col-span-1">
              {/* Card de herramientas unificado */}
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md p-4 flex flex-col gap-6 w-full mx-auto mb-6">
                <h3 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-200 text-center">
                  Herramientas
                </h3>
                <BackgroundSelector
                  canvasBgColor={canvasBgColor}
                  applyBgColor={applyBgColor}
                  showBgColorPicker={showBgColorPicker}
                  setShowBgColorPicker={setShowBgColorPicker}
                  bgDropzone={bgDropzone}
                  bgImageError={bgImageError}
                />
                <BrushSelector
                  brushes={tools.map((t) => ({
                    key: t.id,
                    icon: t.icon,
                    label: t.name,
                  }))}
                  currentBrush={currentTool}
                  onSelectBrush={setCurrentTool}
                  onOpenModal={() => setShowBrushModal(true)}
                />
                {/* Eraser minimalista */}
                <div className="flex flex-row items-center justify-center w-full mb-2">
                  <button
                    type="button"
                    className={`flex items-center justify-center w-10 h-10 rounded-md border-2 shadow transition
                      ${
                        currentTool === "eraser"
                          ? "bg-red-100 border-red-400 text-red-700"
                          : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-red-50 hover:border-red-400"
                      }`}
                    onClick={() => setCurrentTool("eraser")}
                    aria-label="Borrador"
                  >
                    <Eraser className="h-6 w-6" />
                  </button>
                </div>
                {/* Tamaño del pincel */}
                <div className="flex flex-col items-center gap-2 mt-2">
                  <h4 className="font-semibold text-sm mb-1">
                    Tamaño del pincel
                  </h4>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-3/4 sm:w-2/3 h-3 accent-indigo-600"
                    style={{ minWidth: 120, maxWidth: 240 }}
                  />
                  <div className="text-center mt-1 text-lg font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full shadow-sm">
                    {brushSize}px
                  </div>
                </div>
                {/* Paleta de colores y color picker */}
                <div className="flex flex-col items-center gap-2 mt-2">
                  <h4 className="font-semibold text-sm mb-1">Color</h4>
                  <Palette
                    colors={paletteColors}
                    currentColor={currentColor}
                    onSelectColor={handleSetBrushColor}
                  />
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => handleSetBrushColor(e.target.value)}
                    className="w-16 h-10 rounded-xl border-2 border-indigo-300 shadow-sm bg-white dark:bg-neutral-700"
                    style={{ margin: "0 auto" }}
                  />
                </div>
              </div>
            </div>
            {/* Canvas con controles de zoom y acciones */}
            <div className="lg:col-span-3 flex flex-col items-center">
              {/* Botones de acción arriba del canvas */}
              <ToolActions
                undo={undo}
                redo={redo}
                clear={clearCanvas}
                download={downloadCanvas}
                save={handleSave}
                historyIndex={historyIndex}
                canvasHistory={canvasHistory}
              />
              {/* Controles de zoom arriba del canvas */}
              <div className="flex gap-2 mb-2 items-center">
                <button
                  type="button"
                  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold"
                  onClick={() => setCanvasZoom((z) => Math.max(0.5, z - 0.1))}
                  title="Zoom -"
                >
                  -
                </button>
                <span className="px-2 text-xs font-mono bg-white/80 rounded border border-gray-300 text-black">
                  {(canvasZoom * 100).toFixed(0)}%
                </span>
                <button
                  type="button"
                  className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold"
                  onClick={() => setCanvasZoom((z) => Math.min(2, z + 0.1))}
                  title="Zoom +"
                >
                  +
                </button>
              </div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: 900,
                  aspectRatio: "4/3",
                }}
                className="mb-4"
              >
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    background: "#fff",
                    borderRadius: 12,
                    border: "2px solid #d1d5db",
                    cursor: "crosshair",
                    transform: `scale(${canvasZoom})`,
                    transformOrigin: "center center",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                />
                {/* Cursor personalizado avanzado con previsualización de cada pincel */}
                {cursorPos && (
                  <div
                    style={{
                      position: "absolute",
                      left: `calc(${cursorPos.x}px - ${brushSize / 2}px)`,
                      top: `calc(${cursorPos.y}px - ${brushSize / 2}px)`,
                      width: brushSize,
                      height: brushSize,
                      borderRadius: (() => {
                        switch (currentTool) {
                          case "pixel":
                            return "0";
                          case "marcador":
                            return "15%";
                          case "tiza":
                            return "40%";
                          case "carboncillo":
                            return "20%";
                          case "oleo":
                            return "30%";
                          default:
                            return "50%";
                        }
                      })(),
                      background: (() => {
                        const rgb = hexToRgb(currentColor);
                        switch (currentTool) {
                          case "eraser":
                            return "repeating-conic-gradient(rgba(200,200,200,0.6) 0deg 45deg, rgba(150,150,150,0.3) 45deg 90deg)";
                          case "neon":
                            return `radial-gradient(circle, ${currentColor}80, ${currentColor}40, ${currentColor}10)`;
                          case "acuarela":
                            return `radial-gradient(circle, ${currentColor}30 0%, ${currentColor}15 40%, ${currentColor}05 70%, transparent 100%)`;
                          case "fuego":
                            return "radial-gradient(circle, #FF450060 0%, #FF8C0040 30%, #FFD70020 60%, transparent 100%)";
                          case "carboncillo":
                            return `radial-gradient(circle, rgba(${Math.min(
                              rgb.r + 30,
                              255
                            )}, ${Math.min(rgb.g + 30, 255)}, ${Math.min(
                              rgb.b + 30,
                              255
                            )}, 0.4) 0%, rgba(50,50,50,0.2) 100%)`;
                          case "tiza":
                            return `radial-gradient(circle, ${currentColor}50 0%, ${currentColor}20 60%, transparent 100%)`;
                          case "marcador":
                            return `linear-gradient(45deg, ${currentColor}70, ${currentColor}50)`;
                          case "oleo":
                            return `conic-gradient(${currentColor}60, ${currentColor}40, ${currentColor}60)`;
                          case "pixel":
                            const pixelSize = Math.max(2, brushSize / 6);
                            return `repeating-linear-gradient(0deg, ${currentColor}60 0px, ${currentColor}60 ${pixelSize}px, transparent ${pixelSize}px, transparent ${
                              pixelSize * 2
                            }px), repeating-linear-gradient(90deg, ${currentColor}60 0px, ${currentColor}60 ${pixelSize}px, transparent ${pixelSize}px, transparent ${
                              pixelSize * 2
                            }px)`;
                          case "puntos":
                            return "transparent";
                          case "lineas":
                            return "transparent";
                          default:
                            return `${currentColor}40`;
                        }
                      })(),
                      border: (() => {
                        switch (currentTool) {
                          case "eraser":
                            return "2px dashed #888";
                          case "neon":
                            return `2px solid ${currentColor}`;
                          case "pixel":
                            return `2px solid ${currentColor}`;
                          case "marcador":
                            return `3px solid ${currentColor}80`;
                          case "carboncillo":
                            return `1px solid ${currentColor}60`;
                          case "tiza":
                            return `1px dotted ${currentColor}`;
                          case "oleo":
                            return `2px ridge ${currentColor}80`;
                          default:
                            return `1px solid ${currentColor}60`;
                        }
                      })(),
                      pointerEvents: "none",
                      zIndex: 20,
                      transform: (() => {
                        switch (currentTool) {
                          case "neon":
                            return "scale(1.3)";
                          case "fuego":
                            return "scale(1.2)";
                          case "acuarela":
                            return "scale(1.1)";
                          default:
                            return "scale(1)";
                        }
                      })(),
                      boxShadow: (() => {
                        switch (currentTool) {
                          case "neon":
                            return `0 0 ${
                              brushSize * 1.5
                            }px ${currentColor}40, 0 0 ${
                              brushSize * 0.5
                            }px ${currentColor}80`;
                          case "fuego":
                            return `0 0 ${brushSize}px #FF450040, 0 0 ${
                              brushSize * 2
                            }px #FF8C0020`;
                          case "oleo":
                            return `inset 0 0 ${
                              brushSize / 3
                            }px ${currentColor}30`;
                          case "acuarela":
                            return `0 0 ${brushSize}px ${currentColor}20`;
                          case "carboncillo":
                            return `0 0 ${brushSize / 2}px rgba(50,50,50,0.3)`;
                          default:
                            return "none";
                        }
                      })(),
                      opacity: (() => {
                        switch (currentTool) {
                          case "acuarela":
                            return "0.8";
                          case "tiza":
                            return "0.9";
                          case "carboncillo":
                            return "0.7";
                          default:
                            return "1";
                        }
                      })(),
                      animation: (() => {
                        switch (currentTool) {
                          case "neon":
                            return "pulse 1.5s ease-in-out infinite alternate";
                          case "fuego":
                            return "flicker 0.5s ease-in-out infinite alternate";
                          default:
                            return "none";
                        }
                      })(),
                    }}
                  >
                    {/* Indicadores internos específicos para cada pincel */}
                    {currentTool === "puntos" && (
                      <>
                        {[...Array(Math.min(8, Math.floor(brushSize / 8)))].map(
                          (_, i) => {
                            const angle =
                              (i / Math.min(8, Math.floor(brushSize / 8))) *
                              Math.PI *
                              2;
                            const radius = brushSize * 0.3;
                            return (
                              <div
                                key={i}
                                style={{
                                  position: "absolute",
                                  top: `calc(50% + ${
                                    Math.sin(angle) * radius
                                  }px)`,
                                  left: `calc(50% + ${
                                    Math.cos(angle) * radius
                                  }px)`,
                                  transform: "translate(-50%, -50%)",
                                  width: "3px",
                                  height: "3px",
                                  borderRadius: "50%",
                                  background: currentColor,
                                  opacity: 0.6,
                                }}
                              />
                            );
                          }
                        )}
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: "4px",
                            height: "4px",
                            borderRadius: "50%",
                            background: currentColor,
                          }}
                        />
                      </>
                    )}

                    {currentTool === "lineas" && (
                      <>
                        {[0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4].map(
                          (angle, i) => (
                            <div
                              key={i}
                              style={{
                                position: "absolute",
                                top: "50%",
                                left: "50%",
                                width: `${brushSize * 0.8}px`,
                                height: "1px",
                                background: currentColor,
                                transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                                opacity: 0.5 - i * 0.1,
                              }}
                            />
                          )
                        )}
                      </>
                    )}

                    {currentTool === "pixel" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: "2px",
                          right: "2px",
                          bottom: "2px",
                          background: `repeating-conic-gradient(${currentColor}60 0deg 90deg, transparent 90deg 180deg)`,
                          imageRendering: "pixelated",
                        }}
                      />
                    )}

                    {currentTool === "carboncillo" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "20%",
                          left: "20%",
                          right: "20%",
                          bottom: "20%",
                          background: `radial-gradient(circle, ${currentColor}40, transparent)`,
                          borderRadius: "30%",
                        }}
                      />
                    )}

                    {currentTool === "oleo" && (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            top: "25%",
                            left: "25%",
                            width: "50%",
                            height: "50%",
                            background: currentColor,
                            borderRadius: "20%",
                            opacity: 0.6,
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "35%",
                            left: "15%",
                            width: "30%",
                            height: "30%",
                            background: currentColor,
                            borderRadius: "50%",
                            opacity: 0.4,
                          }}
                        />
                      </>
                    )}

                    {currentTool === "marcador" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "10%",
                          left: "10%",
                          right: "10%",
                          bottom: "10%",
                          background: `linear-gradient(135deg, ${currentColor}80, ${currentColor}40)`,
                          borderRadius: "10%",
                        }}
                      />
                    )}

                    {currentTool === "tiza" && (
                      <>
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            style={{
                              position: "absolute",
                              top: `${20 + Math.random() * 60}%`,
                              left: `${20 + Math.random() * 60}%`,
                              width: "2px",
                              height: "2px",
                              borderRadius: "50%",
                              background: currentColor,
                              opacity: 0.4 + Math.random() * 0.4,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {currentTool === "fuego" && (
                      <div
                        style={{
                          position: "absolute",
                          top: "30%",
                          left: "30%",
                          right: "30%",
                          bottom: "30%",
                          background:
                            "radial-gradient(ellipse 40% 60% at 50% 70%, #FFD700 0%, #FF8C00 40%, #FF4500 100%)",
                          borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                          transform: "rotate(-5deg)",
                        }}
                      />
                    )}

                    {currentTool === "acuarela" && (
                      <>
                        <div
                          style={{
                            position: "absolute",
                            top: "25%",
                            left: "25%",
                            width: "50%",
                            height: "50%",
                            background: `radial-gradient(circle, ${currentColor}30, transparent)`,
                            borderRadius: "50%",
                          }}
                        />
                        <div
                          style={{
                            position: "absolute",
                            top: "15%",
                            left: "35%",
                            width: "30%",
                            height: "30%",
                            background: `radial-gradient(circle, ${currentColor}20, transparent)`,
                            borderRadius: "50%",
                          }}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* Info del mural debajo del canvas solo en edición */}
              {editingMural && (
                <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 mb-4 w-full max-w-[900px] mx-auto">
                  <h3 className="font-semibold mb-3">Información de la Obra</h3>
                  <div className="space-y-3">
                    <motion.input
                      type="text"
                      placeholder="Título de la obra"
                      value={muralData.titulo}
                      onChange={(e) =>
                        setMuralData({ ...muralData, titulo: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                    />
                    <motion.textarea
                      placeholder="Descripción (opcional)"
                      value={muralData.descripcion}
                      onChange={(e) =>
                        setMuralData({
                          ...muralData,
                          descripcion: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                      rows={3}
                    />
                    <motion.input
                      type="text"
                      placeholder="Técnica"
                      value={muralData.tecnica}
                      onChange={(e) =>
                        setMuralData({ ...muralData, tecnica: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                    />
                    <DatePicker
                      value={muralData.year ? `${muralData.year}-01-01` : null}
                      onChange={(dateString) => {
                        if (dateString) {
                          const d = new Date(dateString);
                          setMuralData({ ...muralData, year: d.getFullYear() });
                        } else {
                          setMuralData({ ...muralData, year: null });
                        }
                      }}
                      placeholder="Selecciona el año..."
                    />
                    <motion.input
                      type="text"
                      placeholder="Autor (opcional)"
                      value={muralData.autor || ""}
                      onChange={(e) =>
                        setMuralData({ ...muralData, autor: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                    />
                    <motion.input
                      type="text"
                      placeholder="Ubicación (opcional)"
                      value={muralData.ubicacion || ""}
                      onChange={(e) =>
                        setMuralData({
                          ...muralData,
                          ubicacion: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                    />
                    <div className="flex gap-2">
                      <motion.input
                        type="number"
                        step="any"
                        placeholder="Latitud (opcional)"
                        value={muralData.latitud || ""}
                        onChange={(e) =>
                          setMuralData({
                            ...muralData,
                            latitud: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                      />
                      <motion.input
                        type="number"
                        step="any"
                        placeholder="Longitud (opcional)"
                        value={muralData.longitud || ""}
                        onChange={(e) =>
                          setMuralData({
                            ...muralData,
                            longitud: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    {/* Selector de artista */}
                    <select
                      value={muralData.artistId || ""}
                      onChange={(e) =>
                        setMuralData({ ...muralData, artistId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Selecciona un artista (opcional)</option>
                      {artistList &&
                        artistList.map((artist) => (
                          <option key={artist.id} value={artist.id}>
                            {artist.user?.name || artist.id}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {editingMural ? "Actualizar Obra" : "Guardar Obra"}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
