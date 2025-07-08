import React from "react";
import { Brush } from "lucide-react";

export default function BrushSelector({
  brushes,
  currentBrush,
  onSelectBrush,
  onOpenModal,
}) {
  const CurrentIcon =
    brushes.find((b) => b.key === currentBrush)?.icon || Brush;
  const label = brushes.find((b) => b.key === currentBrush)?.label || "Pincel";
  return (
    <div className="flex flex-row items-center justify-center w-full my-2">
      <button
        type="button"
        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow border-2 transition my-2"
        style={{
          borderColor: "#888",
          background: "#222",
          color: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
        onClick={onOpenModal}
        aria-label="Seleccionar pincel"
      >
        <CurrentIcon className="h-6 w-6 mr-1" style={{ color: "#fff" }} />
        <span className="truncate font-semibold">{label}</span>
        <span className="ml-2 text-sm font-normal opacity-80">
          Seleccionar pincel
        </span>
      </button>
    </div>
  );
}
