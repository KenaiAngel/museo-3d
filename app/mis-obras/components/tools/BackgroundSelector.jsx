import React from "react";
import { PaintBucket } from "lucide-react";

export default function BackgroundSelector({
  canvasBgColor,
  applyBgColor,
  showBgColorPicker,
  setShowBgColorPicker,
  bgDropzone,
  bgImageError,
}) {
  return (
    <div className="flex w-full gap-2 mb-2">
      <button
        type="button"
        className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white text-base font-bold shadow-lg hover:bg-blue-700 transition border-2 border-blue-700 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        title="Selecciona una imagen para el fondo del mural"
        {...bgDropzone.getRootProps()}
      >
        <input {...bgDropzone.getInputProps()} />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4-4a3 3 0 014 0l4 4M4 8h16M4 8v8a2 2 0 002 2h12a2 2 0 002-2V8"
          />
        </svg>
        Fondo personalizado
      </button>
      <div className="relative group">
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-green-400 bg-white dark:bg-neutral-800 shadow-sm hover:bg-green-50 dark:hover:bg-green-900 transition"
          style={{ padding: 0 }}
          onClick={() => setShowBgColorPicker((v) => !v)}
          aria-label="Aplicar color de fondo"
        >
          <PaintBucket
            className="h-6 w-6"
            style={{
              color: canvasBgColor,
              filter: "drop-shadow(0 0 2px #222) drop-shadow(0 0 1px #fff)",
              background: "transparent",
              margin: 0,
              display: "block",
            }}
          />
        </button>
        {showBgColorPicker && (
          <div
            className="absolute left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-neutral-900 p-2 rounded shadow border flex flex-col items-center"
            style={{ minWidth: 180 }}
          >
            <input
              type="color"
              value={canvasBgColor}
              onChange={(e) => applyBgColor(e.target.value)}
              className="w-24 h-12 rounded-xl border-2 border-green-300 shadow-sm bg-white dark:bg-neutral-700"
              style={{ cursor: "pointer" }}
            />
            <span className="text-xs text-gray-700 dark:text-gray-200 mt-1">
              Color de fondo
            </span>
          </div>
        )}
      </div>
      {bgImageError && (
        <span className="text-xs text-red-600 mt-1">{bgImageError}</span>
      )}
    </div>
  );
}
