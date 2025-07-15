"use client";

export function AnimatedBlobsBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <div className="absolute top-0 left-0 w-[520px] h-[520px] bg-orange-300/30 dark:bg-orange-700/15 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe" />
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-pink-300/30 dark:bg-pink-700/15 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe-delayed" />
      <div
        className="absolute top-1/2 left-1/2 w-[340px] h-[340px] bg-fuchsia-200/20 dark:bg-fuchsia-800/10 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe"
        style={{ transform: "translate(-50%,-50%) scale(1.2)" }}
      />
    </div>
  );
}

export function DotsPattern() {
  // SVG con gradiente radial de opacidad: centro más claro, bordes más oscuros (como antes)
  return (
    <svg
      className="absolute inset-0 w-full h-full z-10 pointer-events-none hidden dark:block"
      width="100%"
      height="100%"
      style={{}}
    >
      <defs>
        <radialGradient id="dotAlpha" cx="50%" cy="50%" r="80%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.13" />
          <stop offset="70%" stopColor="#fff" stopOpacity="0.13" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.03" />
        </radialGradient>
        <pattern
          id="dots"
          x="0"
          y="0"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="url(#dotAlpha)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

// Componente combinado para facilitar el uso
export default function AnimatedBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Blobs atrás (z-0), puntos adelante (z-10) */}
      <AnimatedBlobsBackground />
      <DotsPattern />
    </div>
  );
}
