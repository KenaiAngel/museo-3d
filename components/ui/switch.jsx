import React from "react";

export const Switch = React.forwardRef(function Switch(
  { checked, onCheckedChange, disabled, className = "" },
  ref
) {
  return (
    <label
      className={`inline-flex items-center cursor-pointer ${disabled ? "opacity-60 pointer-events-none" : ""} ${className}`}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200
          ${checked ? "bg-primary dark:bg-primary" : "bg-gray-300 dark:bg-gray-700"}`}
      >
        <span
          className={`bg-white w-4 h-4 rounded-full shadow-md border transition-transform duration-200
            ${checked ? "translate-x-4" : ""}
            border-gray-300 dark:border-gray-800`}
        />
      </span>
    </label>
  );
});
