import * as React from "react";

const ARIcon = ({ size = 24, color = "currentColor", ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="5"
      y="8"
      width="14"
      height="8"
      rx="2"
      stroke={color}
      strokeWidth="2"
    />
    <path
      d="M12 8V4M12 20v-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M5 16l-2 2M19 16l2 2M5 8L3 6M19 8l2-2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

export default ARIcon;
