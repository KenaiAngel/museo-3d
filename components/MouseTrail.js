"use client";
import { useEffect } from "react";

const vibrantColors = [
  "#ff6b6b", // Rojo vibrante
  "#feca57", // Amarillo
  "#48dbfb", // Azul claro
  "#1dd1a1", // Verde aqua
  "#5f27cd", // Morado
  "#ff9ff3", // Rosa
  "#00d2d3", // Turquesa
  "#54a0ff", // Azul
  "#ffb8b8", // Rosa claro
  "#f368e0", // Magenta
];

function randomBetween(a, b) {
  return Math.random() * (b - a) + a;
}

export default function MouseTrail() {
  useEffect(() => {
    const handleMove = (e) => {
      const dot = document.createElement("div");
      dot.className = "mouse-trail-dot";
      // Tamaño aleatorio de elipse
      const w = randomBetween(16, 32);
      const h = randomBetween(8, 12);
      dot.style.width = `${w}px`;
      dot.style.height = `${h}px`;
      dot.style.left = `${e.clientX - w / 2}px`;
      dot.style.top = `${e.clientY - h / 2}px`;
      // Color aleatorio
      const color =
        vibrantColors[Math.floor(Math.random() * vibrantColors.length)];
      dot.style.background = `radial-gradient(ellipse at center, ${color} 0%, transparent 80%)`;
      document.body.appendChild(dot);
      setTimeout(() => {
        dot.style.opacity = "0";
        dot.style.transform = "scale(1.7)";
      }, 10);
      setTimeout(() => {
        dot.remove();
      }, 900);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);
  return null;
}
