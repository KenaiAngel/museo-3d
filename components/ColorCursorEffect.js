"use client";
import { useEffect } from "react";

export default function ColorCursorEffect() {
  useEffect(() => {
    let timeout;
    // Inicializa en blanco y negro ANTES de cualquier evento
    document.body.style.cursor =
      "url('/assets/cursor-museum-bw.webp') 8 8, auto";
    document.documentElement.style.cursor =
      "url('/assets/cursor-museum-bw.webp') 8 8, auto";

    const setColorCursor = () => {
      // Si ya está en color, no hagas nada
      if (document.body.style.cursor.includes("cursor-museum-color.webp"))
        return;
      document.body.style.cursor =
        "url('/assets/cursor-museum-color.webp') 8 8, auto";
      document.documentElement.style.cursor =
        "url('/assets/cursor-museum-color.webp') 8 8, auto";
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        document.body.style.cursor =
          "url('/assets/cursor-museum-bw.webp') 8 8, auto";
        document.documentElement.style.cursor =
          "url('/assets/cursor-museum-bw.webp') 8 8, auto";
      }, 1500);
    };

    window.addEventListener("mousemove", setColorCursor);

    return () => {
      window.removeEventListener("mousemove", setColorCursor);
      clearTimeout(timeout);
      document.body.style.cursor = "";
      document.documentElement.style.cursor = "";
    };
  }, []);
  return null;
}
