import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

// Lógica robusta de posicionamiento
function calculateTooltipPosition(
  anchorRect,
  tooltipWidth,
  tooltipHeight,
  preferredPosition = "bottom"
) {
  const padding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calcular la mejor posición 'left' relativa al viewport
  let left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
  if (left < padding) left = padding;
  if (left + tooltipWidth > viewportWidth - padding) {
    left = viewportWidth - tooltipWidth - padding;
  }

  // Calcular posiciones 'top' relativas al viewport (arriba y abajo del ancla)
  const posAbove = anchorRect.top - tooltipHeight - padding;
  const posBelow = anchorRect.bottom + padding;

  let top;
  // Decidir si se coloca arriba o abajo
  if (preferredPosition === "top") {
    if (posAbove > padding) {
      top = posAbove;
    } else {
      top = posBelow;
    }
  } else {
    if (posBelow + tooltipHeight < viewportHeight - padding) {
      top = posBelow;
    } else {
      top = posAbove;
    }
  }

  return {
    top: top + window.scrollY,
    left: left + window.scrollX,
  };
}

export default function AvatarTooltip({
  src,
  alt,
  anchorRef,
  show,
  preferredPosition = "bottom",
}) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipWidth = 260;
  const tooltipHeight = 260;

  useEffect(() => {
    if (show && anchorRef.current) {
      // Esperar al siguiente ciclo de render/layout
      const timeout = setTimeout(() => {
        if (anchorRef.current) {
          const rect = anchorRef.current.getBoundingClientRect();
          const newPos = calculateTooltipPosition(
            rect,
            tooltipWidth,
            tooltipHeight,
            preferredPosition
          );
          setPos(newPos);
        }
      }, 0);
      return () => clearTimeout(timeout);
    } else if (show && !anchorRef.current) {
      // DEBUG: log missing ref
      console.warn("[AvatarTooltip] anchorRef.current is null");
    }
  }, [show, anchorRef, preferredPosition]);

  if (!show) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 1000,
        width: tooltipWidth,
        height: tooltipHeight,
        maxWidth: "90vw",
        maxHeight: "90vw",
      }}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2 flex items-center justify-center"
    >
      <img
        src={src}
        alt={alt}
        className="w-56 h-56 object-contain rounded-lg"
      />
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
}
