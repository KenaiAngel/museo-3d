import { useState } from "react";

/**
 * Hook para manejar eventos de dibujo en canvas (mouse, pointer).
 * @param {Object} params
 * @param {React.RefObject} params.canvasRef
 * @param {function} params.onDraw - callback (x, y, lastPoint)
 * @param {function} params.onDrawEnd - callback cuando termina el trazo
 */
export function useCanvasEvents({ canvasRef, onDraw, onDrawEnd }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);

  // Calcula coordenadas relativas al canvas
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) * canvas.width) / rect.width;
    const y = ((e.clientY - rect.top) * canvas.height) / rect.height;
    return { x, y };
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    setLastPoint({ x, y });
    if (onDraw) onDraw(x, y, null);
  };

  const handlePointerMove = (e) => {
    setCursorPos({ x: e.clientX, y: e.clientY });
    if (!isDrawing) return;
    const { x, y } = getCoords(e);
    if (onDraw) onDraw(x, y, lastPoint);
    setLastPoint({ x, y });
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
    if (onDrawEnd) onDrawEnd();
  };

  const handlePointerLeave = () => {
    setCursorPos(null);
    setIsDrawing(false);
    setLastPoint(null);
    if (onDrawEnd) onDrawEnd();
  };

  return {
    isDrawing,
    lastPoint,
    cursorPos,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
  };
}
