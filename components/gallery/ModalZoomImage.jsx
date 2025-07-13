import { useState, useRef } from "react";

export default function ModalZoomImage({ mural, rect, onClose }) {
  // Aquí va la lógica de zoom, drag, etc. (puedes copiarla del archivo original)
  // Por ahora, solo estructura base:
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-neutral-900 rounded-lg shadow-xl p-4 max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={mural?.imagenUrl}
          alt={mural?.titulo}
          className="w-full h-auto rounded"
        />
        {/* Aquí puedes agregar controles de zoom, cerrar, etc. */}
        <button className="absolute top-2 right-2 text-lg" onClick={onClose}>
          ✕
        </button>
      </div>
    </div>
  );
}
