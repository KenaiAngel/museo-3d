import { useState, useCallback } from "react";

export function useCanvasHistory(maxSize = 50) {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const save = useCallback(
    (canvas) => {
      if (!canvas) return;

      const imageData = canvas.toDataURL("image/png");

      setHistory((prev) => {
        // Eliminar elementos después del índice actual si estamos en medio del historial
        const newHistory = prev.slice(0, historyIndex + 1);

        // Agregar nueva imagen
        const updatedHistory = [...newHistory, imageData];

        // Limitar el tamaño del historial
        if (updatedHistory.length > maxSize) {
          return updatedHistory.slice(-maxSize);
        }

        return updatedHistory;
      });

      setHistoryIndex((prev) => Math.min(prev + 1, maxSize - 1));
    },
    [historyIndex, maxSize]
  );

  const undo = useCallback(
    (canvas) => {
      if (!canvas || historyIndex <= 0) return;

      const newIndex = historyIndex - 1;
      const imageData = history[newIndex];

      if (imageData) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
        setHistoryIndex(newIndex);
      }
    },
    [history, historyIndex]
  );

  const redo = useCallback(
    (canvas) => {
      if (!canvas || historyIndex >= history.length - 1) return;

      const newIndex = historyIndex + 1;
      const imageData = history[newIndex];

      if (imageData) {
        const img = new Image();
        img.onload = () => {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = imageData;
        setHistoryIndex(newIndex);
      }
    },
    [history, historyIndex]
  );

  const clear = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    history,
    historyIndex,
    canUndo,
    canRedo,
    save,
    undo,
    redo,
    clear,
  };
}
