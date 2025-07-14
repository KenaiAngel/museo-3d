import * as React from "react";

export function TecnicaIcon({ className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={32}
      height={32}
      stroke="currentColor"
      strokeWidth={1.5}
      {...props}
    >
      <path
        d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 20.4183 7.58172 24 12 24C13.1046 24 14 24.8954 14 26C14 27.1046 14.8954 28 16 28Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
      <circle cx="22" cy="14" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default TecnicaIcon;
