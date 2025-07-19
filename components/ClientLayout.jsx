"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ParallaxProvider } from "react-scroll-parallax";
import AuthProvider from "../providers/AuthProvider";
import MainMenu from "./MainMenu";
import Footer from "./Footer";
import useIsMobile from "../app/hooks/useIsMobile";
import { PageLoader } from "./LoadingSpinner";
import { FRASES_MURALISTAS, BANKSY_IMAGES } from "../lib/layoutConstants";
import MouseTrail from "./MouseTrail";

// Para usar el nuevo menú elegante, descomenta la siguiente línea e importa ElegantMenu
// import ElegantMenu from "./ElegantMenu";

// Luego reemplaza <MainMenu /> con <ElegantMenu /> en la línea correspondiente
// <MainMenu
//   onSubirArchivo={(e) => handleRouteTransition(e, "/crear-sala")}
//   onNavigate={handleRouteTransition}
// />

// Componente para el contenido principal del layout
const LayoutContainer = ({ children }) => {
  const [hoveringBottom, setHoveringBottom] = useState(false);
  const [frase, setFrase] = useState("");
  const [currentImage, setCurrentImage] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const needsTopPadding = true;
  const fixedFooterPages = ["/", "/museo"];
  const useFixedFooter = fixedFooterPages.includes(pathname);

  useEffect(() => {
    setFrase(
      FRASES_MURALISTAS[Math.floor(Math.random() * FRASES_MURALISTAS.length)]
    );
    setCurrentImage(
      BANKSY_IMAGES[Math.floor(Math.random() * BANKSY_IMAGES.length)]
    );

    // Simular tiempo de inicialización
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mostrar loading durante la inicialización
  if (isInitializing) {
    return <PageLoader text="Inicializando Museo 3D..." />;
  }

  return (
    <div className="bg-white dark:bg-black text-black dark:text-white flex flex-col min-h-screen transition-colors duration-300">
      <MouseTrail />
      <header className="sticky top-0 z-[60]">
        <MainMenu />
      </header>
      <main className="flex-1 pt-22 md:pt-24">
        {children}
        {useFixedFooter && (
          <div
            className="absolute bottom-0 left-0 w-full h-[100px]"
            onMouseEnter={() => setHoveringBottom(true)}
            onMouseLeave={() => setHoveringBottom(false)}
          />
        )}
      </main>
      {/* Footer eliminado temporalmente para pruebas de espacio */}
    </div>
  );
};

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const usesParallax = pathname === "/";

  const content = (
    <AuthProvider>
      <LayoutContainer>{children}</LayoutContainer>
    </AuthProvider>
  );

  if (usesParallax) {
    return <ParallaxProvider>{content}</ParallaxProvider>;
  }

  return content;
}
