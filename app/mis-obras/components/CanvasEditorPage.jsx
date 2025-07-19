"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
import ToolActions from "./tools/ToolActions";
import BrushSelector from "./tools/BrushSelector";
// Importar las funciones de dibujo
import {
  hexToRgb as hexToRgbUtil,
  BRUSH_CONFIGS,
  BRUSH_CATEGORIES,
  DEFAULT_COLORS,
  BrushEngine,
} from "@/utils/drawingFunctions";
// Hook de canvas con BrushEngine para todos los pinceles
function useCanvasSimple({
  initialColor = "#000000",
  initialSize = 15,
  initialTool = "brush",
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(initialSize);
  const [currentTool, setCurrentTool] = useState(initialTool);
  const [cursorPos, setCursorPos] = useState(null);
  const [lastPoint, setLastPoint] = useState(null);
  const brushEngineRef = useRef(null);

  const getScaledCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    return { x, y };
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    const coords = getScaledCoords(e, canvas);

    // Inicializar BrushEngine si no existe
    if (!brushEngineRef.current) {
      brushEngineRef.current = new BrushEngine(canvas);
    }

    // Configurar el motor de pinceles
    brushEngineRef.current.configure({
      type: currentTool,
      color: brushColor,
      size: brushSize,
    });

    // Dibujar el primer punto
    brushEngineRef.current.draw(coords, null);
    setLastPoint(coords);
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    setCursorPos({ x: cssX, y: cssY });

    if (!isDrawing || !brushEngineRef.current) return;

    const coords = getScaledCoords(e, canvas);

    // Dibujar con el motor de pinceles
    brushEngineRef.current.draw(coords, lastPoint);
    setLastPoint(coords);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Restaurar fondo blanco
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const exportImage = () => {
    if (!canvasRef.current) return null;
    return canvasRef.current.toDataURL("image/png");
  };

  return {
    canvasRef,
    isDrawing,
    brushColor,
    brushSize,
    currentTool,
    setBrushColor,
    setBrushSize,
    setCurrentTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    clearCanvas,
    exportImage,
    cursorPos,
  };
}
import { useCanvasHistory } from "../../hooks/useCanvasHistory";

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

export default function CanvasEditorPage({ onSave, editingMural = null }) {
  // Estado para el modal de pinceles
  const [showBrushModal, setShowBrushModal] = useState(false);

  // Historial de canvas con hook especializado
  const {
    history,
    historyIndex,
    canUndo,
    canRedo,
    save: saveHistory,
    undo: undoHistory,
    redo: redoHistory,
    clear: clearHistory,
  } = useCanvasHistory();

  // Mantén los estados y lógica que no son de canvas puro (historial, datos de mural, etc.)

  const [canvasBgColor, setCanvasBgColor] = useState("#ffffff");
  const [recentColors, setRecentColors] = useState(["#000000", "#ffffff"]);
  const [prevColors, setPrevColors] = useState([]);

  // --- useCanvasSimple reemplaza la lógica de dibujo y eventos ---
  const {
    canvasRef,
    isDrawing,
    brushColor,
    brushSize,
    currentTool,
    setBrushColor,
    setBrushSize,
    setCurrentTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    clearCanvas,
    exportImage,
    cursorPos,
  } = useCanvasSimple({
    initialColor: "#000000",
    initialSize: 15,
    initialTool: "brush",
  });

  // Guardar en historial después de cada trazo
  const saveToHistory = () => {
    if (canvasRef?.current) saveHistory(canvasRef.current);
  };

  // Wrappers para los handlers que incluyen guardado en historial
  const handleMouseDownWithHistory = (e) => {
    handleMouseDown(e);
  };

  const handleMouseMoveWithHistory = (e) => {
    handleMouseMove(e);
  };

  const handleMouseUpWithHistory = (e) => {
    handleMouseUp(e);
    saveToHistory();
  };

  const handleMouseLeaveWithHistory = (e) => {
    handleMouseLeave(e);
    saveToHistory();
  };

  // Inicializar canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      // Configurar tamaño
      canvas.width = 800;
      canvas.height = 600;

      // Fondo blanco por defecto
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Guardar estado inicial en historial
      saveToHistory();
    }
  }, [canvasRef]);

  // Funciones de utilidad para manejo de colores
  const hexToRgb = hexToRgbUtil;

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Undo/Redo usando el hook
  const undo = () => {
    if (canvasRef?.current) undoHistory(canvasRef.current);
  };
  const redo = () => {
    if (canvasRef?.current) redoHistory(canvasRef.current);
  };

  // Refs para siempre tener el valor actual de brushType y brushColor
  const brushTypeRef = useRef(currentTool);
  const brushColorRef = useRef(brushColor);
  useEffect(() => {
    brushTypeRef.current = currentTool;
  }, [currentTool]);
  useEffect(() => {
    brushColorRef.current = brushColor;
  }, [brushColor]);

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

  const handleSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error("No se pudo acceder al canvas");
      return;
    }

    const imageDataUrl = canvas.toDataURL("image/png");
    onSave(imageDataUrl);
  };

  const applyBgColor = (color) => {
    setCanvasBgColor(color);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      saveToHistory();
    }
  };

  // Organizar pinceles - incluir todos los pinceles disponibles
  const tools = BRUSH_CONFIGS.map((config) => ({
    id: config.type,
    name: config.name,
    icon:
      config.icon === "Palette" ? PaletteIcon : ICON_MAP[config.icon] || Brush,
    category: config.category,
  }));

  const colors = DEFAULT_COLORS;

  const paletteColors = Array.from(
    new Set(
      [brushColor, ...recentColors, ...prevColors, ...colors].filter(Boolean)
    )
  ).slice(0, 12);

  const handleSetBrushColor = (color) => {
    setBrushColor(color);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      return [color, ...filtered].slice(0, 6);
    });
  };

  // Descargar el canvas como imagen PNG
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "obra.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="w-full h-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Panel de herramientas */}
        <div className="lg:col-span-1">
          {/* Card de herramientas unificado */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md p-4 flex flex-col gap-6 w-full mx-auto mb-6">
            <h3 className="text-lg font-bold mb-2 text-indigo-700 dark:text-indigo-200 text-center">
              Herramientas
            </h3>
            {/* Selector de color de fondo simple */}
            <div className="flex flex-col items-center gap-2">
              <h4 className="font-semibold text-sm mb-1">Color de fondo</h4>
              <input
                type="color"
                value={canvasBgColor}
                onChange={(e) => applyBgColor(e.target.value)}
                className="w-16 h-10 rounded-xl border-2 border-indigo-300 shadow-sm bg-white dark:bg-neutral-700"
                style={{ margin: "0 auto" }}
              />
            </div>
            {/* Selector de pinceles usando el componente del modal */}
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

            {/* Tamaño del pincel */}
            <div className="flex flex-col items-center gap-2 mt-2">
              <h4 className="font-semibold text-sm mb-1">Tamaño del pincel</h4>
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
            {/* Paleta de colores simple */}
            <div className="flex flex-col items-center gap-2 mt-2">
              <h4 className="font-semibold text-sm mb-1">Color</h4>
              <div className="grid grid-cols-4 gap-2">
                {paletteColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded border-2 shadow transition ${
                      brushColor === color
                        ? "border-indigo-500 scale-110"
                        : "border-gray-300 hover:scale-105"
                    }`}
                    style={{
                      backgroundColor: color,
                      cursor: "pointer",
                    }}
                    onClick={() => handleSetBrushColor(color)}
                    aria-label={`Color ${color}`}
                  />
                ))}
              </div>
              <input
                type="color"
                value={brushColor}
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
            canvasHistory={history}
            canUndo={canUndo}
            canRedo={canRedo}
          />

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
                width: 800,
                height: 600,
                background: canvasBgColor,
                borderRadius: 16,
                boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
                cursor: "crosshair",
              }}
              onMouseDown={handleMouseDownWithHistory}
              onMouseMove={handleMouseMoveWithHistory}
              onMouseUp={handleMouseUpWithHistory}
              onMouseLeave={handleMouseLeaveWithHistory}
            />
          </div>
        </div>
      </div>

      {/* Modal de pinceles */}
      {showBrushModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Seleccionar Pincel
              </h2>
              <button
                onClick={() => setShowBrushModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                style={{ cursor: "pointer" }}
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Pinceles organizados por categorías */}
            <div className="space-y-6">
              {/* Pinceles básicos */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Básicos
                </h3>
                <div className="grid grid-cols-8 gap-2">
                  {tools
                    .filter((t) => t.category === "basic")
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setCurrentTool(tool.id);
                            setShowBrushModal(false);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            currentTool === tool.id
                              ? "bg-blue-100 border-blue-400 text-blue-700"
                              : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-blue-50 hover:border-blue-400"
                          }`}
                          style={{ cursor: "pointer" }}
                          title={tool.name}
                        >
                          <Icon className="h-6 w-6 mb-1" />
                          <span className="text-xs text-center">
                            {tool.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Pinceles artísticos */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Artísticos
                </h3>
                <div className="grid grid-cols-8 gap-2">
                  {tools
                    .filter((t) => t.category === "artistic")
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setCurrentTool(tool.id);
                            setShowBrushModal(false);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            currentTool === tool.id
                              ? "bg-green-100 border-green-400 text-green-700"
                              : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-green-50 hover:border-green-400"
                          }`}
                          style={{ cursor: "pointer" }}
                          title={tool.name}
                        >
                          <Icon className="h-6 w-6 mb-1" />
                          <span className="text-xs text-center">
                            {tool.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Pinceles de estampado */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Estampado
                </h3>
                <div className="grid grid-cols-8 gap-2">
                  {tools
                    .filter((t) => t.category === "stamp")
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setCurrentTool(tool.id);
                            setShowBrushModal(false);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            currentTool === tool.id
                              ? "bg-pink-100 border-pink-400 text-pink-700"
                              : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-pink-50 hover:border-pink-400"
                          }`}
                          style={{ cursor: "pointer" }}
                          title={tool.name}
                        >
                          <Icon className="h-6 w-6 mb-1" />
                          <span className="text-xs text-center">
                            {tool.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Pinceles de patrón */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Patrón
                </h3>
                <div className="grid grid-cols-8 gap-2">
                  {tools
                    .filter((t) => t.category === "pattern")
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setCurrentTool(tool.id);
                            setShowBrushModal(false);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            currentTool === tool.id
                              ? "bg-orange-100 border-orange-400 text-orange-700"
                              : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:border-orange-400"
                          }`}
                          style={{ cursor: "pointer" }}
                          title={tool.name}
                        >
                          <Icon className="h-6 w-6 mb-1" />
                          <span className="text-xs text-center">
                            {tool.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Pinceles de spray */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Spray
                </h3>
                <div className="grid grid-cols-8 gap-2">
                  {tools
                    .filter((t) => t.category === "spray")
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setCurrentTool(tool.id);
                            setShowBrushModal(false);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            currentTool === tool.id
                              ? "bg-cyan-100 border-cyan-400 text-cyan-700"
                              : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-cyan-50 hover:border-cyan-400"
                          }`}
                          style={{ cursor: "pointer" }}
                          title={tool.name}
                        >
                          <Icon className="h-6 w-6 mb-1" />
                          <span className="text-xs text-center">
                            {tool.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Pinceles de sketch/harmony */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Sketch/Harmony
                </h3>
                <div className="grid grid-cols-8 gap-2">
                  {tools
                    .filter((t) => t.category === "sketch")
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setCurrentTool(tool.id);
                            setShowBrushModal(false);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            currentTool === tool.id
                              ? "bg-yellow-100 border-yellow-400 text-yellow-700"
                              : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-yellow-50 hover:border-yellow-400"
                          }`}
                          style={{ cursor: "pointer" }}
                          title={tool.name}
                        >
                          <Icon className="h-6 w-6 mb-1" />
                          <span className="text-xs text-center">
                            {tool.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Pinceles especiales */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
                  Especiales
                </h3>
                <div className="grid grid-cols-8 gap-2">
                  {tools
                    .filter((t) => t.category === "special")
                    .map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setCurrentTool(tool.id);
                            setShowBrushModal(false);
                          }}
                          className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all ${
                            currentTool === tool.id
                              ? "bg-purple-100 border-purple-400 text-purple-700"
                              : "bg-white dark:bg-neutral-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-purple-50 hover:border-purple-400"
                          }`}
                          style={{ cursor: "pointer" }}
                          title={tool.name}
                        >
                          <Icon className="h-6 w-6 mb-1" />
                          <span className="text-xs text-center">
                            {tool.name}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
