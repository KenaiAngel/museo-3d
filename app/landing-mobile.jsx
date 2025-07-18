"use client";
import { useEffect, useState } from "react";
import { useTheme } from "../providers/ThemeProvider";
import ParallaxClouds from '@/components/ui/ParallaxClouds';

export default function LandingMobile() {
  const { theme } = useTheme();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="relative min-h-screen overflow-y-auto">
      {theme === "light" && <div className="light-bg"></div>}
      {theme === "light" && <div className="light-solar-glow"></div>}
      {theme === "dark" && <div className="dark-lunar-glow"></div>}
      {theme === "light" && <div className="light-solar-flare"></div>}
      {theme === "dark" && <div className="dark-lunar-halo"></div>}
      {theme === "light" && (
        <div className="light-solar-rays">
          <div className="light-solar-ray"></div>
          <div className="light-solar-ray"></div>
          <div className="light-solar-ray"></div>
          <div className="light-solar-ray"></div>
        </div>
      )}
      {theme === "dark" && (
        <div className="dark-lunar-rays">
          <div className="dark-lunar-ray"></div>
          <div className="dark-lunar-ray"></div>
          <div className="dark-lunar-ray"></div>
          <div className="dark-lunar-ray"></div>
        </div>
      )}

      <ParallaxClouds />
      

      <main className="min-h-screen flex flex-col items-center px-4 py-6 pt-20 content-overlay">
        {isClient && (
          <img
            src={
              theme === "dark"
                ? "/assets/nav/logo-white.svg"
                : "/assets/nav/logo.svg"
            }
            alt="Museo 3D Logo"
            className="w-20 h-20 mb-6"
            style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))" }}
          />
        )}
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          Bienvenido a la experiencia del Mural ARPA.
        </h1>
        <p className="text-gray-700 dark:text-gray-300 text-center mb-8 max-w-xs">
          Explora arte y cultura desde tu dispositivo móvil. Una experiencia
          sencilla y ligera.
        </p>
        <a
          href="#login"
          className="inline-block w-full max-w-xs py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-center transition-all duration-200 shadow-lg mb-8"
        >
          Iniciar sesión
        </a>
      
        <section className="w-full max-w-xs mb-8 bg-white/90 dark:bg-gray-800/90 p-4 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 text-center">
            ¿Qué es el Museo 3D?
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-center text-sm">
            Es una aplicación web donde puedes explorar murales, obras y
            artistas de manera interactiva, desde cualquier lugar.
          </p>
        </section>

        <section className="w-full max-w-xs mb-8 bg-white/90 dark:bg-gray-800/90 p-4 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 text-center">
            Explora Murales y Obras
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-center text-sm">
            Descubre galerías virtuales, detalles de cada obra y la historia
            detrás de los murales más emblemáticos.
          </p>
        </section>

        <section className="w-full max-w-xs mb-8 bg-white/90 dark:bg-gray-800/90 p-4 rounded-xl shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 text-center">
            Participa y Comparte
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-center text-sm">
            Regístrate para subir tus propias obras, dejar comentarios y ser parte
            de la comunidad artística.
          </p>
        </section>

        <section className="w-full max-w-xs mb-8 bg-white/90 dark:bg-gray-800/90 p-4 rounded-xl shadow-md">
          <blockquote className="italic text-blue-700 dark:text-blue-300 text-center text-sm border-l-4 border-blue-400 pl-3 py-2">
            "No hay innovación sin sensibilidad: cuando el arte y la tecnología se encuentran, las obras cobran vida, y el futuro, un mural en movimiento que seguimos pintando juntos."
          </blockquote>
        </section>

        <footer className="mt-6 text-xs text-gray-500 dark:text-gray-400 text-center">
          &copy; {new Date().getFullYear()} Mural ARPA
        </footer>
      </main>
    </div>
  );
}