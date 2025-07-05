import React from "react";

/**
 * Stepper visual minimalista, inspirado en el de 'mis obras'.
 * Props:
 * - steps: array de strings o {label}
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
  // Permitir steps como array de strings o de objetos {label}
  const getLabel = (step) => (typeof step === "string" ? step : step.label);
  // Colores tailwind
  const colorBg = `bg-${color}-600`;
  const colorText = `text-white`;
  const colorBorder = `border-${color}-700`;
  const colorShadow = `shadow-lg`;
  const colorInactiveBg = `bg-muted`;
  const colorInactiveText = `text-foreground`;
  const colorInactiveBorder = `border-border`;
  return (
    <div className={`flex items-center justify-center gap-4 mb-6 ${className}`}>
      {steps.map((step, i) => {
        const isCompleted = i < activeStep;
        const isActive = i === activeStep;
        const isClickable = typeof onStepClick === "function" && isCompleted;
        return (
          <div key={i} className="flex flex-col items-center">
            <button
              type="button"
              disabled={!isClickable}
              onClick={isClickable ? () => onStepClick(i) : undefined}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 text-sm transition-all duration-200 focus:outline-none
                ${isActive
                  ? `${colorBg} ${colorText} ${colorBorder} ${colorShadow}`
                  : isCompleted
                    ? `bg-green-500 text-white border-green-700 shadow-md`
                    : `${colorInactiveBg} ${colorInactiveText} ${colorInactiveBorder}`
                }
                ${isClickable ? "cursor-pointer hover:scale-110" : "cursor-default"}
              `}
              aria-current={isActive ? "step" : undefined}
              tabIndex={isClickable ? 0 : -1}
            >
              {i + 1}
            </button>
            <span className="mt-1 text-xs text-center min-w-[60px] text-muted-foreground">
              {getLabel(step)}
            </span>
          </div>
        );
      })}
    </div>
  );
} 