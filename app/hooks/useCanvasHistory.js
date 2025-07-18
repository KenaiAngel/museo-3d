import { useState, useCallback, useEffect } from "react";

// Utilidades IndexedDB (simple, sin dependencias externas)
const DB_NAME = "museo3d-canvas-history";
const STORE_NAME = "snapshots";
const META_KEY = "canvas-history-meta";

function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject("IndexedDB not supported");
    const req = window.indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbSet(key, value) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}
function idbGet(key) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      })
  );
}
function idbDelete(key) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}
function idbClear() {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

// Fallback localStorage
function lsSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}
function lsGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function lsDelete(key) {
  try {
    localStorage.removeItem(key);
  } catch {}
}
function lsClear(prefix) {
  try {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith(prefix)) localStorage.removeItem(k);
    });
  } catch {}
}

// Helpers para snapshots
const SNAPSHOT_KEY = (i) => `canvas-history-${i}`;

export function useCanvasHistory() {
  const [history, setHistory] = useState([]); // array de claves
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [persistType, setPersistType] = useState("idb"); // "idb" o "ls"

  // Restaurar historial al montar
  useEffect(() => {
    (async () => {
      let meta = lsGet(META_KEY);
      if (meta) {
        try {
          meta = JSON.parse(meta);
          const { length, index } = meta;
          const arr = [];
          for (let i = 0; i < length; ++i) arr.push(SNAPSHOT_KEY(i));
          setHistory(arr);
          setHistoryIndex(index);
        } catch {}
      }
    })();
  }, []);

  // Guardar meta en localStorage
  const saveMeta = (length, index) => {
    lsSet(META_KEY, JSON.stringify({ length, index }));
  };

  // Guarda el estado actual del canvas en el historial
  const save = useCallback(
    async (canvas) => {
      try {
        const dataUrl = canvas.toDataURL("image/png", 0.8);
        let newHistory = history.slice(0, historyIndex + 1);
        const newIndex = newHistory.length;
        const key = SNAPSHOT_KEY(newIndex);
        // Guardar en IndexedDB o localStorage
        try {
          await idbSet(key, dataUrl);
          setPersistType("idb");
        } catch {
          lsSet(key, dataUrl);
          setPersistType("ls");
        }
        newHistory.push(key);
        // Limitar tamaño del historial (opcional, aquí 50)
        if (newHistory.length > 50) {
          // Borrar los más antiguos
          const toDelete = newHistory.slice(0, newHistory.length - 50);
          for (const k of toDelete) {
            try {
              await idbDelete(k);
            } catch {
              lsDelete(k);
            }
          }
          newHistory = newHistory.slice(newHistory.length - 50);
        }
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        saveMeta(newHistory.length, newHistory.length - 1);
      } catch (e) {
        console.error("Error saving canvas to history:", e);
      }
    },
    [history, historyIndex]
  );

  // Deshace el último cambio
  const undo = useCallback(
    async (canvas) => {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        const key = history[newIndex];
        let dataUrl = null;
        try {
          dataUrl = await idbGet(key);
        } catch {
          dataUrl = lsGet(key);
        }
        if (dataUrl) {
          const img = new window.Image();
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = dataUrl;
          setHistoryIndex(newIndex);
          saveMeta(history.length, newIndex);
        }
      }
    },
    [history, historyIndex]
  );

  // Rehace el cambio deshecho
  const redo = useCallback(
    async (canvas) => {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        const key = history[newIndex];
        let dataUrl = null;
        try {
          dataUrl = await idbGet(key);
        } catch {
          dataUrl = lsGet(key);
        }
        if (dataUrl) {
          const img = new window.Image();
          img.onload = () => {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
          };
          img.src = dataUrl;
          setHistoryIndex(newIndex);
          saveMeta(history.length, newIndex);
        }
      }
    },
    [history, historyIndex]
  );

  // Limpia el historial
  const clear = useCallback(async () => {
    try {
      await idbClear();
    } catch {
      lsClear("canvas-history-");
    }
    setHistory([]);
    setHistoryIndex(-1);
    saveMeta(0, -1);
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
    persistType,
  };
}
