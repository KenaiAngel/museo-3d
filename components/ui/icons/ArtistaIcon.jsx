import * as React from "react";

export function ArtistaIcon({ className = "", ...props }) {
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
      {/* Cabeza */}
      <circle cx="16" cy="12" r="6" stroke="currentColor" strokeWidth="2" />
      {/* Boina grande, desplazada y rabito */}
      <ellipse cx="13.2" cy="8.2" rx="5" ry="2.5" fill="currentColor" />
      <path
        d="M11 6 Q12.5 7.5 14 7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      {/* Busto */}
      <path
        d="M8 27C8 22.5817 11.5817 19 16 19C20.4183 19 24 22.5817 24 27"
        stroke="currentColor"
        strokeWidth="2"
      />
      {/* Mano */}
      <ellipse cx="23.5" cy="22.5" rx="1.2" ry="1.7" fill="currentColor" />
      {/* Pincel grande y diagonal */}
      <rect
        x="22.5"
        y="18.5"
        width="1.3"
        height="8"
        rx="0.6"
        fill="currentColor"
        transform="rotate(30 22.5 18.5)"
      />
      {/* Punta del pincel */}
      <polygon points="27,29 28,31 25.5,30.5" fill="currentColor" />
    </svg>
  );
}

export default ArtistaIcon;
