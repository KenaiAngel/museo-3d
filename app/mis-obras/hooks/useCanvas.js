import { useState, useRef, useCallback } from "react";

export function useCanvas({
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
  const [drawCompleteCallback, setDrawCompleteCallback] = useState(null);

  const getScaledCoords = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    return { x, y };
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      if (!canvasRef.current) return;

      console.log("🎨 Mouse down:", { brushColor, brushSize, currentTool });
      setIsDrawing(true);
      const canvas = canvasRef.current;
      const coords = getScaledCoords(e, canvas);
      const ctx = canvas.getContext("2d");

      // Configurar el contexto
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (currentTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      // Iniciar el trazo
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);

      setLastPoint(coords);
    },
    [getScaledCoords, brushColor, brushSize, currentTool]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      setCursorPos({ x: cssX, y: cssY });

      if (!isDrawing) return;

      console.log("🎨 Drawing at:", coords);

      const coords = getScaledCoords(e, canvas);
      const ctx = canvas.getContext("2d");

      // Continuar el trazo
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();

      setLastPoint(coords);
    },
    [isDrawing, getScaledCoords]
  );

  const handlePointerUp = useCallback(() => {
    setIsDrawing(false);
    setLastPoint(null);
    if (drawCompleteCallback) {
      drawCompleteCallback();
    }
  }, [drawCompleteCallback]);

  const handlePointerLeave = useCallback(() => {
    setCursorPos(null);
    setIsDrawing(false);
    setLastPoint(null);
    if (drawCompleteCallback) {
      drawCompleteCallback();
    }
  }, [drawCompleteCallback]);

  // Aliases para compatibilidad con eventos de mouse
  const handleMouseDown = handlePointerDown;
  const handleMouseMove = handlePointerMove;
  const handleMouseUp = handlePointerUp;
  const handleMouseLeave = handlePointerLeave;

  const clearCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Restaurar fondo blanco
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (drawCompleteCallback) {
      drawCompleteCallback();
    }
  }, [drawCompleteCallback]);

  const exportImage = useCallback(() => {
    if (!canvasRef.current) return null;
    return canvasRef.current.toDataURL("image/png");
  }, []);

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
    // Aliases para compatibilidad con eventos de mouse
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    clearCanvas,
    exportImage,
    cursorPos,
    setDrawCompleteCallback,
  };
}
