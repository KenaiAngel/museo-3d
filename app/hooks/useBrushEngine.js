import { useRef, useEffect, useCallback, useState } from "react";
import { BrushEngine } from "@/utils/drawingFunctions";

/**
 * Hook para manejar la instancia y configuración del BrushEngine.
 * @param {React.RefObject} canvasRef
 * @param {Object} initialBrush - Configuración inicial del brush
 */
export function useBrushEngine(canvasRef, initialBrush) {
  const engineRef = useRef(null);
  const [brush, setBrush] = useState(
    initialBrush || {
      type: "brush",
      color: "#000000",
      size: 15,
      opacity: 1,
    }
  );

  // Inicializar engine una sola vez
  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new BrushEngine(canvasRef.current);
      engineRef.current.configure(brush);
    }
    // Solo depende de canvasRef
    // eslint-disable-next-line
  }, [canvasRef]);

  // Actualizar configuración cuando cambian los parámetros
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.configure(brush);
    }
  }, [brush]);

  // Métodos para cambiar configuración
  const setBrushType = (type) => setBrush((b) => ({ ...b, type }));
  const setBrushColor = (color) => setBrush((b) => ({ ...b, color }));
  const setBrushSize = (size) => setBrush((b) => ({ ...b, size }));
  const setBrushOpacity = (opacity) => setBrush((b) => ({ ...b, opacity }));

  // Método para dibujar
  const draw = useCallback((point, lastPoint) => {
    if (engineRef.current) {
      engineRef.current.draw(point, lastPoint);
    }
  }, []);

  return {
    engineRef,
    brush,
    setBrushType,
    setBrushColor,
    setBrushSize,
    setBrushOpacity,
    draw,
  };
}
