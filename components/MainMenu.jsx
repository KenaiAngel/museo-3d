"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import ThemeSwitch from "./ThemeSwitch";
import { useModal } from "../providers/ModalProvider";
import { useUser } from "../providers/UserProvider";
import { useSessionData } from "../providers/SessionProvider";
import { ButtonLoader } from "./LoadingSpinner";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

// Componente de efecto máquina de escribir
function TypewriterText({
  text,
  speed = 100,
  delay = 0,
  repeat = false,
  repeatDelay = 3000,
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setDisplayedText("");
    setIsComplete(false);

    const timer = setTimeout(() => {
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayedText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          setIsComplete(true);
          clearInterval(interval);

          // Si repeat está habilitado, reiniciar después del delay
          if (repeat) {
            setTimeout(() => {
              setCycle((prev) => prev + 1);
            }, repeatDelay);
          }
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, speed, delay, repeat, repeatDelay, cycle]);

  return (
    <span className="text-xl font-semibold tracking-wide text-primary inline-block min-w-[120px]">
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-0.5 h-5 bg-primary ml-1"
        />
      )}
    </span>
  );
}

export default function MainMenu({ onSubirArchivo }) {
  const { openModal } = useModal();
  const {
    user,
    userProfile,
    status,
    isAuthenticated,
    isAdmin,
    isModerator,
    isLoading,
  } = useUser();
  const {
    session,
    sessionDuration,
    sessionTimeRemaining,
    isSessionExpiringSoon,
    isSessionExpired,
  } = useSessionData();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Estado para menú móvil
  const [mobileArchivoOpen, setMobileArchivoOpen] = useState(false); // Estado para dropdown de Archivo
  const router = useRouter();
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const lastHideY = useRef(0);
  const threshold = 30;
  const [isScrolled, setIsScrolled] = useState(false);

  // Cerrar menú móvil al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuOpen &&
        !event.target.closest("nav") &&
        !event.target.closest("[data-mobile-menu]")
      ) {
        setMobileMenuOpen(false);
        setMobileArchivoOpen(false); // Cerrar también el dropdown
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      document.body.style.overflow = "hidden"; // Prevenir scroll
    } else {
      document.body.style.overflow = "unset";
      setMobileArchivoOpen(false); // Cerrar dropdown cuando se cierra el menú
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [mobileMenuOpen]);

  // Control de visibilidad del navbar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      if (currentScrollY < 10) {
        setIsVisible(true);
        lastHideY.current = 0;
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
        lastHideY.current = currentScrollY;
      } else if (
        currentScrollY < lastScrollY.current &&
        lastHideY.current - currentScrollY > threshold
      ) {
        setIsVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cerrar menú móvil automáticamente al cambiar de página
  useEffect(() => {
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
      setMobileArchivoOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleAuthClick = (mode) => {
    openModal(mode === "register" ? "auth-register" : "auth-login");
  };

  return (
    <>
      {/* Navigation Menu with auto-hide on scroll */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`fixed top-0 z-50 w-full navbar-main navbar-enter ${
          mobileMenuOpen ? "" : "border-b border-gray-200 dark:border-gray-700"
        } ${
          isScrolled
            ? "scrolled"
            : "bg-transparent md:bg-white/95 md:dark:bg-gray-900/95 md:backdrop-blur-md"
        } text-gray-900 dark:text-white shadow-sm transition-colors duration-300`}
      >
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-3 md:py-4">
          {" "}
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 min-w-fit navbar-link"
          >
            <img
              src="/assets/nav/logo.svg"
              alt="Logo"
              className="h-8 w-auto flex-shrink-0 dark:hidden"
            />
            <img
              src="/assets/nav/logo-white.svg"
              alt="Logo"
              className="h-8 w-auto flex-shrink-0 hidden dark:block"
            />
            {/* Hide title on mobile */}
            <div className="hidden md:block">
              <TypewriterText
                text="Mural ARPA"
                speed={120}
                delay={300}
                repeat={true}
                repeatDelay={5000}
              />
            </div>
          </Link>
          {/* Título a la izquierda en mobile, junto al logo */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-lg font-bold tracking-wide text-gray-900 dark:text-white">
              Museo 3D
            </span>
          </div>
          {/* Navigation Menu */}
          <NavigationMenu className="hidden md:block">
            <NavigationMenuList className="text-sm font-medium">
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={
                    "navbar-link hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all " +
                    (pathname.startsWith("/crear-sala") ||
                    pathname.startsWith("/galeria") ||
                    pathname.startsWith("/museo")
                      ? "elegant-active-menu"
                      : "")
                  }
                >
                  Galería
                </NavigationMenuTrigger>
                <NavigationMenuContent className="navbar-dropdown bg-card p-6 rounded-lg shadow-lg border min-w-[200px]">
                  <div className="flex flex-col gap-2">
                    <NavigationMenuLink asChild>
                      <Link
                        href="/crear-sala"
                        onClick={onSubirArchivo}
                        className={`navbar-dropdown-item block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all ${
                          pathname.startsWith("/crear-sala")
                            ? "elegant-active-menu"
                            : ""
                        }`}
                      >
                        Crear Sala
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/galeria"
                        className={`navbar-dropdown-item block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all ${
                          pathname.startsWith("/galeria")
                            ? "elegant-active-menu"
                            : ""
                        }`}
                      >
                        Ver Galería
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link
                        href="/museo"
                        className={`navbar-dropdown-item block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all ${
                          pathname.startsWith("/museo")
                            ? "elegant-active-menu"
                            : ""
                        }`}
                      >
                        Explorar mural
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/acerca-de"
                    className={`navbar-link hover:text-primary transition-all px-3 py-2 rounded-lg ${
                      pathname.startsWith("/acerca-de")
                        ? "elegant-active-menu"
                        : ""
                    }`}
                  >
                    Acerca de
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    href="/museo"
                    className={`navbar-link hover:text-primary transition-all px-3 py-2 rounded-lg ${
                      pathname.startsWith("/museo") ? "elegant-active-menu" : ""
                    }`}
                  >
                    Museo Virtual
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          {/* Usuario autenticado o botón de login */}
          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                <span className="hidden md:inline text-sm text-muted-foreground">
                  Cargando...
                </span>
              </div>
            ) : isAuthenticated ? (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="flex items-center gap-2 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all">
                      <img
                        src={
                          userProfile?.image ||
                          user?.image ||
                          "/assets/default-avatar.svg"
                        }
                        alt={userProfile?.name || user?.name || "Usuario"}
                        className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                        onError={(e) => {
                          e.target.src = "/assets/default-avatar.svg";
                        }}
                      />
                      <span className="hidden md:inline text-sm font-medium">
                        {userProfile?.name ||
                          user?.name ||
                          user?.email?.split("@")[0]}
                      </span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="bg-card p-4 rounded-lg shadow-lg border min-w-[180px]">
                      <div className="flex flex-col gap-2">
                        <div className="px-3 py-2 border-b border-border">
                          <p className="text-sm font-medium text-foreground">
                            {userProfile?.name || user?.name || "Usuario"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {user?.email}
                          </p>
                          {userProfile?.roles && (
                            <div className="flex gap-1 mt-1">
                              {userProfile.roles.map((role, index) => (
                                <span
                                  key={index}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    role === "admin"
                                      ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                      : role === "moderator"
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                  }`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          )}
                          {/* Información de la sesión */}
                          {session && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">
                                  Sesión:
                                </span>
                                <span
                                  className={`font-medium ${
                                    isSessionExpiringSoon
                                      ? "text-yellow-600 dark:text-yellow-400"
                                      : isSessionExpired
                                      ? "text-red-600 dark:text-red-400"
                                      : "text-green-600 dark:text-green-400"
                                  }`}
                                >
                                  {sessionDuration}
                                </span>
                              </div>
                              {isSessionExpiringSoon && (
                                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                                  ⚠️ Sesión por expirar
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/perfil"
                            className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                          >
                            Mi perfil
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/mis-obras"
                            className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                          >
                            Mis Obras
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link
                            href="/mis-salas"
                            className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                          >
                            Mis Salas
                          </Link>
                        </NavigationMenuLink>

                        {/* Opciones para moderadores y administradores */}
                        {(isModerator || isAdmin) && (
                          <>
                            <div className="px-3 py-1 border-t border-border">
                              <p className="text-xs text-muted-foreground font-medium">
                                Panel de Moderación
                              </p>
                            </div>
                            <NavigationMenuLink asChild>
                              <Link
                                href="/admin/usuarios"
                                className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                              >
                                Gestionar Usuarios
                              </Link>
                            </NavigationMenuLink>
                          </>
                        )}

                        {/* Opciones solo para administradores */}
                        {isAdmin && (
                          <>
                            <div className="px-3 py-1 border-t border-border">
                              <p className="text-xs text-muted-foreground font-medium">
                                Panel de Administración
                              </p>
                            </div>
                            <NavigationMenuLink asChild>
                              <Link
                                href="/admin/logs"
                                className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                              >
                                Ver Logs
                              </Link>
                            </NavigationMenuLink>
                            <NavigationMenuLink asChild>
                              <Link
                                href="/admin/healthcheck"
                                className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                              >
                                Estado del sistema
                              </Link>
                            </NavigationMenuLink>
                          </>
                        )}

                        <button
                          onClick={() => signOut()}
                          className="block w-full text-left px-3 py-2 rounded-md transition-all text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            ) : (
              <button
                onClick={() => handleAuthClick("login")}
                className="hidden md:inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                Iniciar sesión
              </button>
            )}

            {/* Theme Switch */}
            <ThemeSwitch />

            {/* Botón hamburguesa con animación especial */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-3 rounded-lg transition-all duration-300 relative overflow-hidden hamburger-button ${
                mobileMenuOpen ? "hamburger-special-open" : ""
              }`}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            >
              <div className="w-6 h-6 relative flex flex-col justify-center items-center">
                {/* Línea superior */}{" "}
                <div
                  className={`hamburger-line-top absolute w-6 h-px bg-current transition-all duration-500 ease-out ${
                    mobileMenuOpen
                      ? "rotate-45 translate-y-0"
                      : "-translate-y-1.5"
                  }`}
                />
                {/* Línea media con efecto especial de desplazamiento a la derecha */}{" "}
                <div
                  className={`hamburger-line-middle absolute h-px bg-current ${
                    mobileMenuOpen ? "w-0 opacity-0" : "w-6 opacity-100"
                  }`}
                  style={{
                    transformOrigin: "left center",
                    transition: mobileMenuOpen
                      ? "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), width 0.4s ease-out 0.1s, opacity 0.3s ease-out 0.2s"
                      : "transform 0.3s ease-out, width 0.3s ease-out, opacity 0.2s ease-out",
                    transform: mobileMenuOpen
                      ? "translateX(12px) scaleX(0.2)"
                      : "translateX(0) scaleX(1)",
                  }}
                />
                {/* Línea inferior */}{" "}
                <div
                  className={`hamburger-line-bottom absolute w-6 h-px bg-current transition-all duration-500 ease-out ${
                    mobileMenuOpen
                      ? "-rotate-45 translate-y-0"
                      : "translate-y-1.5"
                  }`}
                />
              </div>

              {/* SVG para el efecto de borde que se completa alrededor del margen */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 48 48"
              >
                <rect
                  x="2"
                  y="2"
                  width="44"
                  height="44"
                  rx="8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="transition-all duration-1000 ease-out"
                  style={{
                    strokeDasharray: "176",
                    strokeDashoffset: mobileMenuOpen ? "0" : "176",
                    opacity: mobileMenuOpen ? "0.7" : "0",
                    transitionDelay: mobileMenuOpen ? "0.4s" : "0s",
                  }}
                />
              </svg>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Menú móvil con backdrop tipo modal */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 flex items-center justify-center min-h-screen md:hidden bg-black/50 backdrop-blur-sm pt-[56px]"
            aria-hidden="true"
            onClick={(e) => {
              if (e.target === e.currentTarget) setMobileMenuOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="w-[95vw] max-w-xs rounded-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-2xl p-2 z-50 mt-[40px]"
              data-mobile-menu
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-1 py-1 space-y-1 overflow-y-auto max-h-[80vh]">
                {/* Enlaces principales */}
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`navbar-link block py-1 text-sm font-medium hover:text-primary transition-colors ${
                    pathname === "/" ? "elegant-active-menu" : ""
                  }`}
                >
                  Inicio
                </Link>

                <Link
                  href="/museo"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`navbar-link block py-1 text-sm font-medium hover:text-primary transition-colors ${
                    pathname.startsWith("/museo") ? "elegant-active-menu" : ""
                  }`}
                >
                  Museo Virtual
                </Link>

                <Link
                  href="/mis-salas"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`navbar-link block py-1 text-sm font-medium hover:text-primary transition-colors ${
                    pathname.startsWith("/mis-salas") ? "elegant-active-menu" : ""
                  }`}
                >
                  Mis Salas
                </Link>

                {/* Dropdown de Archivo */}
                <div className="space-y-1">
                  <button
                    onClick={() => setMobileArchivoOpen(!mobileArchivoOpen)}
                    className={`navbar-link flex items-center justify-between w-full py-1 text-sm font-medium hover:text-primary transition-colors ${
                      ["/crear-sala", "/galeria", "/museo"].some((p) =>
                        pathname.startsWith(p)
                      )
                        ? "elegant-active-menu"
                        : ""
                    }`}
                  >
                    <span>Galería</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        mobileArchivoOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {mobileArchivoOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="pl-3 space-y-1 border-l-2 border-gray-200 dark:border-gray-700"
                      >
                        <Link
                          href="/crear-sala"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileArchivoOpen(false);
                            if (onSubirArchivo) onSubirArchivo();
                          }}
                          className={`navbar-dropdown-item block py-1 text-sm hover:text-primary transition-colors ${
                            pathname.startsWith("/crear-sala")
                              ? "elegant-active-menu"
                              : ""
                          }`}
                        >
                          Crear Sala
                        </Link>
                        <Link
                          href="/galeria"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileArchivoOpen(false);
                          }}
                          className={`navbar-dropdown-item block py-1 text-sm hover:text-primary transition-colors ${
                            pathname.startsWith("/galeria")
                              ? "elegant-active-menu"
                              : ""
                          }`}
                        >
                          Ver Galería
                        </Link>
                        <Link
                          href="/museo"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            setMobileArchivoOpen(false);
                          }}
                          className={`navbar-dropdown-item block py-1 text-sm hover:text-primary transition-colors ${
                            pathname.startsWith("/museo")
                              ? "elegant-active-menu"
                              : ""
                          }`}
                        >
                          Explorar mural
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/acerca-de"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`navbar-link block py-1 text-sm font-medium hover:text-primary transition-colors ${
                    pathname.startsWith("/acerca-de")
                      ? "elegant-active-menu"
                      : ""
                  }`}
                >
                  Acerca de
                </Link>

                {/* Separador */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                {/* Área de usuario */}
                {isAuthenticated ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 py-1">
                      <img
                        src={
                          userProfile?.image ||
                          user?.image ||
                          "/assets/default-avatar.svg"
                        }
                        alt={userProfile?.name || user?.name || "Usuario"}
                        className="w-8 h-8 rounded-full object-cover border-2 border-primary/20"
                        onError={(e) => {
                          e.target.src = "/assets/default-avatar.svg";
                        }}
                      />
                      <div>
                        <p className="text-xs font-medium">
                          {userProfile?.name || user?.name || "Usuario"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {user?.email}
                        </p>
                        {userProfile?.roles && (
                          <div className="flex gap-1 mt-0.5">
                            {userProfile.roles.map((role, index) => (
                              <span
                                key={index}
                                className={`text-[10px] px-1 py-0.5 rounded-full ${
                                  role === "admin"
                                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                    : role === "moderator"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                    : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                }`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Información de la sesión */}
                        {session && (
                          <div className="mt-1 pt-1 border-t border-border">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-muted-foreground">
                                Sesión:
                              </span>
                              <span
                                className={`font-medium ${
                                  isSessionExpiringSoon
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : isSessionExpired
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {sessionDuration}
                              </span>
                            </div>
                            {isSessionExpiringSoon && (
                              <p className="text-[10px] text-yellow-600 dark:text-yellow-400 mt-0.5">
                                ⚠️ Sesión por expirar
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Link
                      href="/perfil"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 text-sm hover:text-primary transition-colors"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      href="/mis-obras"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 text-sm hover:text-primary transition-colors"
                    >
                      Mis Obras
                    </Link>
                    <Link
                      href="/mis-salas"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block py-1 text-sm hover:text-primary transition-colors"
                    >
                      Mis Salas
                    </Link>
                    {/* Opciones para moderadores y administradores */}
                    {(isModerator || isAdmin) && (
                      <>
                        <div className="px-2 py-0.5 border-t border-border">
                          <p className="text-xs text-muted-foreground font-medium">
                            Panel de Moderación
                          </p>
                        </div>
                        <Link
                          href="/admin/usuarios"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-sm hover:text-primary transition-colors"
                        >
                          Gestionar Usuarios
                        </Link>
                      </>
                    )}
                    {/* Opciones solo para administradores */}
                    {isAdmin && (
                      <>
                        <div className="px-2 py-0.5 border-t border-border">
                          <p className="text-xs text-muted-foreground font-medium">
                            Panel de Administración
                          </p>
                        </div>
                        <Link
                          href="/admin/logs"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-sm hover:text-primary transition-colors"
                        >
                          Ver Logs
                        </Link>
                        <Link
                          href="/admin/healthcheck"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block py-1 text-sm hover:text-primary transition-colors"
                        >
                          Estado del sistema
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-1 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                    >
                      Cerrar sesión
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        handleAuthClick("login");
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Iniciar sesión
                    </button>
                    <button
                      onClick={() => {
                        handleAuthClick("register");
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left py-1 text-sm font-medium hover:text-primary transition-colors"
                    >
                      Registrarse
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
