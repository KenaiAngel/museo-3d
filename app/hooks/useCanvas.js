import { useRef, useState, useEffect } from "react";
import {
  clearCanvas as clearCanvasUtil,
  drawAt as drawAtUtil,
} from "@/utils/drawingFunctions";

/**
 * Hook para manejar la lógica principal de un canvas de dibujo.
 * Extrae la lógica de eventos, contexto y herramientas del componente principal.
 * Puedes expandirlo según las necesidades de tu editor.
 */
export function useCanvas({
  initialColor = "#000",
  initialSize = 5,
  initialTool = "brush",
} = {}) {
  // Ref para el elemento <canvas>
  const canvasRef = useRef(null);
  // Estado para saber si se está dibujando
  const [isDrawing, setIsDrawing] = useState(false);
  // Estado para color y tamaño del pincel
  const [brushColor, setBrushColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(initialSize);
  const [currentTool, setCurrentTool] = useState(initialTool);
  const [lastPoint, setLastPoint] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);

  // Refs para valores actuales de tool y color
  const brushTypeRef = useRef(currentTool);
  const brushColorRef = useRef(brushColor);
  useEffect(() => {
    brushTypeRef.current = currentTool;
  }, [currentTool]);
  useEffect(() => {
    brushColorRef.current = brushColor;
  }, [brushColor]);

  // Handler para mouse/touch down
  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    const ctx = canvas.getContext("2d");
    const type = brushTypeRef.current;
    if (type === "brush" || type === "marcador" || type === "oleo") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    setLastPoint({ x, y });
    drawAt(x, y);
  };

  // Handler para mouse/touch move
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

  // Handler para mouse/touch up
  const handlePointerUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
    // Aquí puedes llamar a saveToHistory si lo implementas en el hook
  };

  // Handler para mouse leave
  const handlePointerLeave = () => {
    setCursorPos(null);
    setIsDrawing(false);
    setLastPoint(null);
  };

  // Función principal de dibujo
  const drawAt = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const type = brushTypeRef.current;
    const color = brushColorRef.current;
    drawAtUtil(x, y, canvas, ctx, type, color, brushSize, lastPoint);
    setLastPoint({ x, y });
  };

  // Limpiar el canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      clearCanvasUtil(canvas);
    }
  };

  // Exportar imagen (ejemplo básico)
  const exportImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      return canvas.toDataURL("image/png");
    }
    return null;
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
    // ...otros métodos
  };
}
