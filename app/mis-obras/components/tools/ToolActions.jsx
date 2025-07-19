import React from "react";
import { Undo2, Redo2, Trash2, Download, Save } from "lucide-react";

export default function ToolActions({
  undo,
  redo,
  clear,
  download,
  save,
  historyIndex,
  canvasHistory,
}) {
  return (
    <div className="flex flex-row gap-2 mt-4 w-full justify-center items-center">
      <button
        onClick={undo}
        disabled={historyIndex <= 0}
        className="group p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Deshacer"
        aria-label="Deshacer"
        style={{ cursor: "pointer" }}
      >
        <Undo2 className="h-6 w-6" />
        <span className="sr-only">Deshacer</span>
      </button>
      <button
        onClick={redo}
        disabled={historyIndex >= canvasHistory.length - 1}
        className="group p-2 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="Rehacer"
        aria-label="Rehacer"
        style={{ cursor: "pointer" }}
      >
        <Redo2 className="h-6 w-6" />
        <span className="sr-only">Rehacer</span>
      </button>
      <button
        onClick={clear}
        className="group p-2 rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition"
        title="Limpiar lienzo"
        aria-label="Limpiar lienzo"
        style={{ cursor: "pointer" }}
      >
        <Trash2 className="h-6 w-6" />
        <span className="sr-only">Limpiar</span>
      </button>
      <button
        onClick={download}
        className="group p-2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition"
        title="Descargar imagen"
        aria-label="Descargar imagen"
        style={{ cursor: "pointer" }}
      >
        <Download className="h-6 w-6" />
        <span className="sr-only">Descargar</span>
      </button>
      <button
        onClick={save}
        className="group p-2 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition"
        title="Guardar obra"
        aria-label="Guardar obra"
        style={{ cursor: "pointer" }}
      >
        <Save className="h-6 w-6" />
        <span className="sr-only">Guardar</span>
      </button>
    </div>
  );
}
