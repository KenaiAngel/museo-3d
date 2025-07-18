import { useState, useCallback } from "react";

/**
 * Hook especializado para manejar el historial de un canvas.
 * Permite guardar, deshacer, rehacer y limpiar el historial de imágenes.
 *
 * @returns {
 *   history: string[],
 *   historyIndex: number,
 *   canUndo: boolean,
 *   canRedo: boolean,
 *   save: (canvas: HTMLCanvasElement) => void,
 *   undo: (canvas: HTMLCanvasElement) => void,
 *   redo: (canvas: HTMLCanvasElement) => void,
 *   clear: () => void
 * }
 */
export function useCanvasHistory() {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Guarda el estado actual del canvas en el historial
  const save = useCallback(
    (canvas) => {
      try {
        const dataUrl = canvas.toDataURL("image/png", 0.8);
        let newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(dataUrl);
        // Limitar tamaño del historial (opcional, aquí 50)
        if (newHistory.length > 50) {
          newHistory = newHistory.slice(newHistory.length - 50);
        }
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      } catch (e) {
        console.error("Error saving canvas to history:", e);
      }
    },
    [history, historyIndex]
  );

  // Deshace el último cambio
  const undo = useCallback(
    (canvas) => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const img = new window.Image();
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = history[newIndex];
        setHistoryIndex(newIndex);
      }
    },
    [history, historyIndex]
  );

  // Rehace el cambio deshecho
  const redo = useCallback(
    (canvas) => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const img = new window.Image();
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = history[newIndex];
        setHistoryIndex(newIndex);
      }
    },
    [history, historyIndex]
  );

  // Limpia el historial
  const clear = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    history,
    historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    save,
    undo,
    redo,
    clear,
  };
}
