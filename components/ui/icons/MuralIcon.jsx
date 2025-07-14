import * as React from "react";

export function MuralIcon({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={32}
      height={32}
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      {/* Lienzo más grande y centrado */}
      <rect
        x="3"
        y="5"
        width="26"
        height="22"
        rx="3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Montaña más grande */}
      <polyline
        points="7,23 14,12 19,20 24,9 28,20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Sol más grande */}
      <circle cx="22.5" cy="9.5" r="2.7" fill="currentColor" />
    </svg>
  );
}

export default MuralIcon;
