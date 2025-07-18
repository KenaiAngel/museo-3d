import { useRef, useState, useEffect } from "react";
import {
  clearCanvas as clearCanvasUtil,
  BrushEngine,
} from "@/utils/drawingFunctions";

/**
 * Hook para manejar la lógica principal de un canvas de dibujo.
 * Usa una sola instancia de BrushEngine para todos los trazos.
 */
export function useCanvas({
  initialColor = "#000",
  initialSize = 5,
  initialTool = "brush",
} = {}) {
  const canvasRef = useRef(null);
  const brushEngineRef = useRef(null);
  const drawCompleteCallbackRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(initialSize);
  const [currentTool, setCurrentTool] = useState(initialTool);
  const [lastPoint, setLastPoint] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);

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
        type: currentTool,
        color: brushColor,
        size: brushSize,
      });
    }
  }, [currentTool, brushColor, brushSize]);

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    setLastPoint({ x, y });
    drawAt(x, y);
  };

  const handlePointerMove = (e) => {
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

  const handlePointerUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
    // Llamar callback si existe
    if (drawCompleteCallbackRef.current) {
      drawCompleteCallbackRef.current();
    }
  };

  const handlePointerLeave = () => {
    setCursorPos(null);
    setIsDrawing(false);
    setLastPoint(null);
    // Llamar callback si existe
    if (drawCompleteCallbackRef.current) {
      drawCompleteCallbackRef.current();
    }
  };

  // Usar BrushEngine para dibujar
  const drawAt = (x, y) => {
    if (brushEngineRef.current) {
      brushEngineRef.current.draw({ x, y }, lastPoint);
      setLastPoint({ x, y });
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      clearCanvasUtil(canvas);
    }
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      return canvas.toDataURL("image/png");
    }
    return null;
  };

  const setDrawCompleteCallback = (callback) => {
    drawCompleteCallbackRef.current = callback;
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
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    clearCanvas,
    exportImage,
    cursorPos,
    setDrawCompleteCallback,
  };
}
