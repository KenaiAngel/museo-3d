import { useRef } from "react";
import { clearCanvas as clearCanvasUtil } from "@/utils/drawingFunctions";
import { useCanvasEvents } from "./useCanvasEvents";
import { useBrushEngine } from "./useBrushEngine";

export function useCanvas({
  initialColor = "#000",
  initialSize = 5,
  initialTool = "brush",
} = {}) {
  const canvasRef = useRef(null);
  const drawCompleteCallbackRef = useRef(null);

  // Instancia y configuración del engine (pasa configuración inicial)
  const {
    engineRef,
    brush,
    setBrushType,
    setBrushColor,
    setBrushSize,
    setBrushOpacity,
    draw,
  } = useBrushEngine(canvasRef, {
    type: initialTool,
    color: initialColor,
    size: initialSize,
    opacity: 1,
  });

  // Callback para dibujar
  const onDraw = (x, y, lastPoint) => {
    draw({ x, y }, lastPoint);
  };

  // Callback para cuando termina el trazo
  const onDrawEnd = () => {
    if (drawCompleteCallbackRef.current) {
      drawCompleteCallbackRef.current();
    }
  };

  // Hook de eventos de canvas
  const {
    isDrawing,
    lastPoint,
    cursorPos,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
  } = useCanvasEvents({
    canvasRef,
    onDraw,
    onDrawEnd,
  });

  // Limpiar canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      clearCanvasUtil(canvas);
    }
  };

  // Exportar imagen
  const exportImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      return canvas.toDataURL("image/png");
    }
    return null;
  };

  // Permitir configurar el callback de trazo completo
  const setDrawCompleteCallback = (callback) => {
    drawCompleteCallbackRef.current = callback;
  };

  return {
    canvasRef,
    isDrawing,
    lastPoint,
    cursorPos,
    brush,
    setBrushType,
    setBrushColor,
    setBrushSize,
    setBrushOpacity,
    draw,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    clearCanvas,
    exportImage,
    setDrawCompleteCallback,
  };
}
