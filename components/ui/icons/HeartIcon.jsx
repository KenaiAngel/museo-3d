import * as React from "react";

export function HeartIcon({ filled = false, className = "", ...props }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill={filled ? "currentColor" : "none"}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={32}
      height={32}
      stroke="currentColor"
      strokeWidth={2}
      {...props}
    >
      <path
        d="M23.5 6.5c-2.5 0-4.5 1.7-5.5 3.2C16 8.2 14 6.5 11.5 6.5 8.4 6.5 6 9.1 6 12.1c0 5.2 7.2 10.1 10.2 12.1.5.3 1.1.3 1.6 0C24.8 22.2 32 17.3 32 12.1c0-3-2.4-5.6-5.5-5.6z"
        stroke="currentColor"
        strokeWidth="2"
        fill={filled ? "currentColor" : "none"}
      />
    </svg>
  );
}

export default HeartIcon;
