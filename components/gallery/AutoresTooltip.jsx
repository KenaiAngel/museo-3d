import { useState, useEffect } from "react";
import ReactDOM from "react-dom";

export default function AutoresTooltip({ anchorRef, autores, show }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + rect.width / 2 + window.scrollX,
      });
    }
  }, [show, anchorRef]);
  if (!show) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        transform: "translateX(-50%)",
        zIndex: 99999,
      }}
      className="bg-white dark:bg-neutral-900 border-2 border-pink-400 dark:border-pink-700 rounded-xl shadow-xl p-2 text-xs min-w-[140px] max-w-xs whitespace-pre-line pointer-events-auto backdrop-blur-md"
    >
      {autores.join("\n")}
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
}
