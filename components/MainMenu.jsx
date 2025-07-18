"use client";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { User } from "lucide-react";
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

import useIsMobile from "../app/hooks/useIsMobile";

// Componente de efecto máquina de escribir
function TypewriterText({
  text,
  speed = 100,
  delay = 0,
  repeat = false,
  repeatDelay = 3000,
  className = "",
  style = {},
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
    <span
      className={`text-3xl font-normal tracking-tight text-primary drop-shadow-sm ${className}`}
      style={{
        fontFamily: "var(--font-monoton), cursive",
        letterSpacing: "0.04em",
        ...style,
      }}
    >
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="inline-block w-0.5 h-7 bg-primary ml-1 align-middle"
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
  const isMobile = useIsMobile();

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

  const menuLinks = [
    { href: "/", label: "Inicio" },
    { href: "/galeria", label: "Galería" },
    { href: "/acerca-de", label: "Acerca de" },
    { href: "/museo", label: "Museo Virtual" },
  ];

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
            ? "bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg"
            : "bg-transparent md:bg-white/95 md:dark:bg-gray-900/95 md:backdrop-blur-md"
        } text-gray-900 dark:text-white transition-all duration-300`}
      >
        <div className="max-w-screen-xl mx-auto flex items-center justify-between px-4 py-2 md:py-4 min-h-[64px]">
          {/* Logo a la izquierda siempre */}
          <div
            className="flex items-center flex-shrink-0"
            style={{ minWidth: 80 }}
          >
            <Link
              href="/"
              className="flex flex-col items-center lg:items-start justify-center navbar-link"
              style={{
                width: 80,
                minWidth: 80,
                maxWidth: 80,
                overflow: "visible",
              }}
            >
              <img
                src="/assets/nav/logo.svg"
                alt="Logo"
                className="h-14 w-auto flex-shrink-0 dark:hidden mx-auto"
              />
              <img
                src="/assets/nav/logo-white.svg"
                alt="Logo"
                className="h-14 w-auto flex-shrink-0 hidden dark:block mx-auto"
              />
              {/* Título solo visible en lg+ */}
              <span
                aria-hidden="true"
                className="hidden lg:block"
                style={{
                  opacity: 0,
                  display: "block",
                  fontFamily: "var(--font-monoton), cursive",
                  fontSize: "1.875rem",
                  fontWeight: 400,
                  letterSpacing: "0.04em",
                  whiteSpace: "nowrap",
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  height: "auto",
                }}
              >
                Mural ARPA
              </span>
              <TypewriterText
                text="Mural ARPA"
                speed={120}
                delay={300}
                repeat={true}
                repeatDelay={5000}
                className="block w-full hidden lg:block"
                style={{
                  width: "100%",
                  minWidth: 0,
                  maxWidth: "100%",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  marginTop: "-48px",
                }}
              />
            </Link>
          </div>
          {/* Links centrados en md+ */}
          <div className="flex-1 flex justify-center items-center hidden md:flex">
            <NavigationMenu className="align-middle">
              <NavigationMenuList className="text-sm font-medium relative items-center flex h-full">
                {menuLinks.map((link) => {
                  let isActive;
                  if (link.href === "/") {
                    isActive = pathname === "/";
                  } else {
                    isActive = pathname.startsWith(link.href);
                  }
                  return (
                    <NavigationMenuItem key={link.href} className="relative">
                      <NavigationMenuLink asChild>
                        <Link
                          href={link.href}
                          className={`navbar-link hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all px-3 py-2 rounded-lg flex flex-col items-center ${isActive ? "text-primary font-bold" : ""}`}
                          style={{ position: "relative", zIndex: 1 }}
                          aria-current={isActive ? "page" : undefined}
                          onClick={
                            isActive ? (e) => e.preventDefault() : undefined
                          }
                        >
                          <span className="block h-3 mb-1 w-full flex items-center justify-center">
                            <motion.span
                              layoutId="menu-dot-global"
                              className={
                                isActive
                                  ? "inline-block w-2 h-2 rounded-full bg-primary"
                                  : "inline-block w-2 h-2 rounded-full bg-gray-400/70"
                              }
                              initial={false}
                              animate={
                                isActive
                                  ? { scale: 1, opacity: 1 }
                                  : { scale: 0.7, opacity: 0.5 }
                              }
                              transition={{
                                type: "spring",
                                stiffness: 120,
                                damping: 18,
                                mass: 0.7,
                                duration: 0.45,
                              }}
                              style={{ display: "inline-block" }}
                            />
                          </span>
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          {/* ThemeSwitch siempre visible a la derecha */}
          <div className="flex items-center flex-shrink-0 ml-auto">
            <ThemeSwitch />
            {/* Usuario solo en md+ */}
            {!isMobile &&
              (status === "loading" ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div>
                  <span className="hidden md:inline text-sm text-muted-foreground">
                    Cargando...
                  </span>
                </div>
              ) : isAuthenticated ? (
                <div>
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
                            {/* En el dropdown del usuario: */}
                            <div className="flex flex-col gap-2">
                              {/* Links principales del usuario */}
                              {[
                                { href: "/perfil", label: "Mi perfil" },
                                { href: "/mis-obras", label: "Mis Obras" },
                                { href: "/mis-salas", label: "Mis Salas" },
                                {
                                  href: "/admin/usuarios",
                                  label: "Gestionar Usuarios",
                                  admin: true,
                                },
                                {
                                  href: "/admin/logs",
                                  label: "Ver Logs",
                                  admin: true,
                                },
                                {
                                  href: "/admin/healthcheck",
                                  label: "Estado del sistema",
                                  admin: true,
                                },
                              ]
                                .filter(
                                  (link) =>
                                    !link.admin || isModerator || isAdmin
                                )
                                .map((link) => {
                                  const isActive = pathname.startsWith(
                                    link.href
                                  );
                                  return (
                                    <Link
                                      key={link.href}
                                      href={link.href}
                                      className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm relative pl-6"
                                      aria-current={
                                        isActive ? "page" : undefined
                                      }
                                      onClick={
                                        isActive
                                          ? (e) => e.preventDefault()
                                          : undefined
                                      }
                                    >
                                      <span className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
                                        <motion.span
                                          layoutId="menu-dot-global"
                                          className={
                                            isActive
                                              ? "inline-block w-2 h-2 rounded-full bg-primary"
                                              : "inline-block w-2 h-2 rounded-full bg-gray-400/70"
                                          }
                                          initial={false}
                                          animate={
                                            isActive
                                              ? { scale: 1, opacity: 1 }
                                              : { scale: 0.7, opacity: 0.5 }
                                          }
                                          transition={{
                                            type: "spring",
                                            stiffness: 120,
                                            damping: 18,
                                            mass: 0.7,
                                            duration: 0.45,
                                          }}
                                          style={{ display: "inline-block" }}
                                        />
                                      </span>
                                      {link.label}
                                    </Link>
                                  );
                                })}
                              {/* Panel de Gestión solo como título, sin punto ni indicador */}
                              {(isModerator || isAdmin) && (
                                <div className="px-3 py-1 border-t border-border">
                                  <p className="text-xs text-muted-foreground font-medium">
                                    Panel de Gestión
                                  </p>
                                </div>
                              )}
                            </div>
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
                </div>
              ) : (
                <button
                  onClick={() => handleAuthClick("login")}
                  className="hidden md:inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md w-10 h-10 p-0"
                  title="Iniciar sesión"
                >
                  <User className="w-6 h-6" />
                </button>
              ))}
          </div>
          {/* Botón hamburguesa solo en mobile */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-3 rounded-lg transition-all duration-300 relative overflow-hidden hamburger-button ${
                mobileMenuOpen ? "hamburger-special-open" : ""
              } ${isAuthenticated ? "max-[1100px]:order-2" : ""}`}
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
          )}
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
              {/* Logo centrado arriba en el menú móvil */}
              <div className="flex flex-col items-center justify-center mt-2 mb-2">
                <img
                  src="/assets/nav/logo.svg"
                  alt="Logo"
                  className="h-16 w-auto flex-shrink-0 dark:hidden"
                />
                <img
                  src="/assets/nav/logo-white.svg"
                  alt="Logo"
                  className="h-16 w-auto flex-shrink-0 hidden dark:block"
                />
              </div>
              {/* ThemeSwitch debajo del logo */}
              <div className="flex justify-center mb-4">
                <ThemeSwitch />
              </div>
              <div className="px-1 py-1 space-y-1 overflow-y-auto max-h-[60vh]">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="navbar-link block py-1 text-sm font-medium hover:text-primary transition-colors"
                >
                  Inicio
                </Link>
                <Link
                  href="/galeria"
                  onClick={() => setMobileMenuOpen(false)}
                  className="navbar-link block py-1 text-sm font-medium hover:text-primary transition-colors"
                >
                  Galería
                </Link>
                <Link
                  href="/acerca-de"
                  onClick={() => setMobileMenuOpen(false)}
                  className="navbar-link block py-1 text-sm font-medium hover:text-primary transition-colors"
                >
                  Acerca de
                </Link>
                <Link
                  href="/museo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="navbar-link block py-1 text-sm font-medium hover:text-primary transition-colors"
                >
                  Museo Virtual
                </Link>

                {/* Si el usuario está autenticado, mostrar opciones de perfil */}
                {isAuthenticated && (
                  <>
                    <div className="px-3 py-1 border-t border-border">
                      <p className="text-xs text-muted-foreground font-medium">
                        Mi Cuenta
                      </p>
                    </div>
                    <Link
                      href="/perfil"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                    >
                      Mi perfil
                    </Link>
                    <Link
                      href="/mis-obras"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                    >
                      Mis Obras
                    </Link>
                    <Link
                      href="/mis-salas"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                    >
                      Mis Salas
                    </Link>
                  </>
                )}

                {/* Si el usuario es moderador o administrador, mostrar opciones de gestión */}
                {(isModerator || isAdmin) && (
                  <>
                    <div className="px-3 py-1 border-t border-border">
                      <p className="text-xs text-muted-foreground font-medium">
                        Panel de Gestión
                      </p>
                    </div>
                    <Link
                      href="/admin/usuarios"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                    >
                      Gestionar Usuarios
                    </Link>
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin/logs"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                        >
                          Ver Logs
                        </Link>
                        <Link
                          href="/admin/healthcheck"
                          onClick={() => setMobileMenuOpen(false)}
                          className="block px-3 py-2 rounded-md hover:bg-muted hover:text-primary transition-all text-sm"
                        >
                          Estado del sistema
                        </Link>
                      </>
                    )}
                  </>
                )}

                {/* Botón de cierre de sesión */}
                <button
                  onClick={() => signOut()}
                  className="block w-full text-left px-3 py-2 rounded-md transition-all text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                >
                  Cerrar sesión
                </button>
              </div>
              {/* Avatar y nombre de usuario al final del menú móvil */}
              {isAuthenticated && (
                <div className="flex flex-col items-center mt-6 mb-2 border-t border-border pt-4">
                  <img
                    src={
                      userProfile?.image ||
                      user?.image ||
                      "/assets/default-avatar.svg"
                    }
                    alt={userProfile?.name || user?.name || "Usuario"}
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/20 mb-2"
                    onError={(e) => {
                      e.target.src = "/assets/default-avatar.svg";
                    }}
                  />
                  <span className="text-base font-medium text-foreground">
                    {userProfile?.name ||
                      user?.name ||
                      user?.email?.split("@")[0]}
                  </span>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
