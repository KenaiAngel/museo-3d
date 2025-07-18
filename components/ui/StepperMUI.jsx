import * as React from "react";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepButton from "@mui/material/StepButton";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import { Box, Typography } from "@mui/material";

/**
 * StepperMUI: Stepper profesional con Material UI
 * Props:
 * - steps: array de { label, subtitle, icon, status }
 * - activeStep: índice del paso activo
 * - onStepClick: función (índice) => void
 * - orientation: 'horizontal' | 'vertical'
 */
export default function StepperMUI({
  steps = [],
  activeStep = 0,
  onStepClick,
  orientation = "horizontal",
}) {
  // Mapea status a iconos
  const getIcon = (step) => {
    if (step.icon) return step.icon;
    if (step.status === "success") return <CheckCircleIcon color="success" />;
    if (step.status === "error") return <ErrorIcon color="error" />;
    if (step.status === "info") return <InfoIcon color="info" />;
    return undefined;
  };
  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel={orientation === "horizontal"} orientation={orientation}>
        {steps.map((step, i) => (
          <Step key={i} completed={step.status === "success" || i < activeStep}>
            <StepButton onClick={onStepClick ? () => onStepClick(i) : undefined} disabled={!onStepClick}>
              <StepLabel
                StepIconComponent={() => getIcon(step) || <span>{i + 1}</span>}
                error={step.status === "error"}
                optional={step.subtitle ? (
                  <Typography variant="caption" color="text.secondary">{step.subtitle}</Typography>
                ) : undefined}
              >
                {step.label}
              </StepLabel>
            </StepButton>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

// Ejemplo de uso real como componente demo
export function StepperMUIDemo() {
  const [activeStep, setActiveStep] = React.useState(1);
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <StepperMUI
        steps={[
          { label: "Datos", subtitle: "Básicos" },
          { label: "Imagen", status: "error", subtitle: "Sube tu imagen" },
          { label: "Confirmar", icon: <CheckCircleIcon />, subtitle: "Finaliza" },
        ]}
        activeStep={activeStep}
        onStepClick={setActiveStep}
      />
      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <button onClick={() => setActiveStep((s) => Math.max(0, s - 1))} disabled={activeStep === 0} style={{ marginRight: 8 }}>
          Anterior
        </button>
        <button onClick={() => setActiveStep((s) => Math.min(2, s + 1))} disabled={activeStep === 2}>
          Siguiente
        </button>
      </div>
    </div>
  );
} 