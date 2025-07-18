import React from "react";

/**
 * Stepper visual moderno y accesible.
 * Props:
 * - steps: array de strings o {label, icon, subtitle, status}
 * - activeStep: índice del paso activo
 * - color: tailwind color base (ej: 'indigo'), default 'indigo'
 * - className: clases extra opcionales
 * - onStepClick: función (índice) => void, si se pasa los steps serán clickeables
 */
export default function Stepper({
  steps = [],
  activeStep = 0,
  color = "indigo",
  className = "",
  onStepClick,
}) {
  // Permitir steps como array de strings o de objetos {label, icon, subtitle, status}
  const getStep = (step) =>
    typeof step === "string"
      ? { label: step }
      : step;
  // Colores tailwind
  const colorBg = `bg-${color}-600`;
  const colorText = `text-white`;
  const colorBorder = `border-${color}-700`;
  const colorShadow = `shadow-lg`;
  const colorInactiveBg = `bg-muted`;
  const colorInactiveText = `text-foreground`;
  const colorInactiveBorder = `border-border`;
  // Estados
  const statusColors = {
    error: "bg-red-500 border-red-700 text-white animate-shake",
    success: "bg-green-500 border-green-700 text-white",
    warning: "bg-yellow-400 border-yellow-600 text-black",
  };
  return (
    <div
      className={`flex items-center justify-center gap-4 mb-6 ${className}`}
      role="list"
      aria-label="Progreso"
    >
      {steps.map((step, i) => {
        const { label, icon, subtitle, status } = getStep(step);
        const isCompleted = i < activeStep;
        const isActive = i === activeStep;
        const isClickable = typeof onStepClick === "function" && isCompleted;
        const hasStatus = status && statusColors[status];
        return (
          <div key={i} className="flex flex-col items-center min-w-[72px]">
            <button
              type="button"
              disabled={!isClickable}
              onClick={isClickable ? () => onStepClick(i) : undefined}
              style={{ cursor: isClickable ? "pointer" : "default" }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${color}-400
                ${isActive
                  ? `${colorBg} ${colorText} ${colorBorder} ${colorShadow} scale-110`
                  : isCompleted
                    ? `bg-green-500 text-white border-green-700 shadow-md`
                    : `${colorInactiveBg} ${colorInactiveText} ${colorInactiveBorder}`
                }
                ${isClickable ? "cursor-pointer hover:scale-110" : "cursor-default"}
                ${hasStatus ? statusColors[status] : ""}
              `}
              aria-current={isActive ? "step" : undefined}
              tabIndex={isClickable ? 0 : -1}
              aria-label={label}
              role="listitem"
            >
              {icon ? (
                typeof icon === "string" ? (
                  <span className="text-lg" aria-hidden>{icon}</span>
                ) : (
                  React.cloneElement(icon, { className: "w-5 h-5 mr-1" })
                )
              ) : (
                i + 1
              )}
            </button>
            <span className="mt-1 text-xs text-center min-w-[60px] text-muted-foreground font-medium">
              {label}
            </span>
            {subtitle && (
              <span className="text-[11px] text-center text-gray-400 dark:text-gray-500 mt-0.5">
                {subtitle}
              </span>
            )}
            {status === "error" && (
              <span className="text-xs text-red-500 mt-0.5">¡Corrige este paso!</span>
            )}
          </div>
        );
      })}
    </div>
  );
} 