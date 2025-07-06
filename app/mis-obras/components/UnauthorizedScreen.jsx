"use client";

import Link from "next/link";
import AnimatedBackground from "./AnimatedBackground";

const UnauthorizedScreen = () => {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Inicia sesión para ver tus obras
          </h1>
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-500 underline"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedScreen;
