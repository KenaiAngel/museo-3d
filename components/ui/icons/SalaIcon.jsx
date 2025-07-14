import * as React from "react";

export function SalaIcon({ className = "", ...props }) {
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
      {/* Techo tipo Partenón */}
      <polygon
        points="6,13 16,6 26,13"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* Base */}
      <rect
        x="6"
        y="25"
        width="20"
        height="2"
        rx="1"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      {/* 3 Columnas */}
      <rect
        x="9"
        y="14"
        width="3"
        height="10"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="14.5"
        y="14"
        width="3"
        height="10"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
      <rect
        x="20"
        y="14"
        width="3"
        height="10"
        rx="1.2"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

export default SalaIcon;
