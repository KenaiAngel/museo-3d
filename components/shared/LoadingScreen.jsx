"use client";

import { RefreshCw } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";

const LoadingScreen = ({ 
  message = "Cargando...", 
  withBackground = true,
  fullScreen = true,
  className = ""
}) => {
  const containerClasses = fullScreen 
    ? "relative min-h-screen" 
    : `relative ${className}`;
    
  const contentClasses = fullScreen 
    ? "relative z-10 min-h-screen flex items-center justify-center"
    : "relative z-10 flex items-center justify-center p-8";

  return (
    <div className={containerClasses}>
      {withBackground && <AnimatedBackground />}
      <div className={contentClasses}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-lg text-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
