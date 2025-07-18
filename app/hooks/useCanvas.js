import { useRef, useEffect } from "react";
import {
  BrushEngine,
  clearCanvas as clearCanvasUtil,
} from "@/utils/drawingFunctions";
import { useCanvasEvents } from "./useCanvasEvents";

export function useCanvas({
  initialColor = "#000",
  initialSize = 5,
  initialTool = "brush",
} = {}) {
  const canvasRef = useRef(null);
  const brushEngineRef = useRef(null);
  const drawCompleteCallbackRef = useRef(null);

  // Inicializar BrushEngine una sola vez
  useEffect(() => {
    if (canvasRef.current && !brushEngineRef.current) {
      brushEngineRef.current = new BrushEngine(canvasRef.current);
    }
  }, [canvasRef]);

  // Configurar BrushEngine cuando cambian los parámetros
  useEffect(() => {
    if (brushEngineRef.current) {
      brushEngineRef.current.configure({
        type: initialTool,
        color: initialColor,
        size: initialSize,
      });
    }
  }, [initialTool, initialColor, initialSize]);

  // Callback para dibujar
  const onDraw = (x, y, lastPoint) => {
    if (brushEngineRef.current) {
      brushEngineRef.current.draw({ x, y }, lastPoint);
    }
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

  // Métodos para cambiar configuración del pincel
  const setBrushColor = (color) => {
    if (brushEngineRef.current) brushEngineRef.current.configure({ color });
  };
  const setBrushSize = (size) => {
    if (brushEngineRef.current) brushEngineRef.current.configure({ size });
  };
  const setCurrentTool = (tool) => {
    if (brushEngineRef.current)
      brushEngineRef.current.configure({ type: tool });
  };

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
    setBrushColor,
    setBrushSize,
    setCurrentTool,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    clearCanvas,
    exportImage,
    setDrawCompleteCallback,
  };
}
