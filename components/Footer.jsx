"use client";

export default function Footer() {
  return (
    <footer
      className="hidden md:block bg-background text-foreground w-full border-t border-gray-200 dark:border-gray-700 transition-colors duration-300 relative overflow-hidden"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      {/* Blobs animados de fondo */}
      <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
        <div className="absolute -bottom-8 -left-24 w-96 h-96 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob"></div>
        <div className="absolute -top-8 -right-24 w-96 h-96 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-2000"></div>
      </div>
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex flex-col items-center justify-center gap-3 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <img
            src="/assets/nav/logo.svg"
            alt="Logo"
            className="h-7 w-auto dark:hidden"
          />
          <img
            src="/assets/nav/logo-white.svg"
            alt="Logo"
            className="h-7 w-auto hidden dark:block"
          />
          <span className="text-base font-semibold tracking-wide text-gray-800 dark:text-gray-200">
            Mural ARPA
          </span>
        </div>
        <p className="text-xs font-semibold text-gray-700 dark:font-light dark:text-gray-400 mb-1 text-center max-w-xs">
          Preservando el arte mural con tecnología.
        </p>
        <div className="w-full flex justify-center">
          <span className="text-xs font-semibold text-gray-600 dark:font-light dark:text-gray-500 text-center">
            &copy; {new Date().getFullYear()} TakitoCorp. Todos los derechos
            reservados.
          </span>
        </div>
      </div>
    </footer>
  );
}
