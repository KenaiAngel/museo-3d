"use client";

import { RefreshCw } from "lucide-react";
import AnimatedBackground from "../../../components/shared/AnimatedBackground";

const LoadingScreen = ({ message = "Cargando tus obras..." }) => {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
          <p className="text-lg text-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
