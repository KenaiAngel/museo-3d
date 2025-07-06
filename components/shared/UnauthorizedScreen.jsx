"use client";

import Link from "next/link";
import AnimatedBackground from "./AnimatedBackground";

const UnauthorizedScreen = ({ 
  title = "Inicia sesión para continuar",
  message,
  linkText = "Volver al inicio",
  linkHref = "/",
  withBackground = true
}) => {
  return (
    <div className="relative min-h-screen">
      {withBackground && <AnimatedBackground />}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {title}
          </h1>
          {message && (
            <p className="text-lg text-muted-foreground mb-6">
              {message}
            </p>
          )}
          <Link
            href={linkHref}
            className="text-indigo-600 hover:text-indigo-500 underline"
          >
            {linkText}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedScreen;
