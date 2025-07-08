import React from "react";

export default function Palette({ colors, currentColor, onSelectColor }) {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-2">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onSelectColor(color)}
          className={`w-8 h-8 rounded-full border-2 transition-all ${
            currentColor === color
              ? "border-indigo-600 scale-110 shadow-md"
              : "border-gray-300 hover:scale-105"
          }`}
          style={{ backgroundColor: color }}
          aria-label={`Color ${color}`}
          title={color}
        />
      ))}
    </div>
  );
}
