import { ChevronDown } from "lucide-react";

export default function GalleryHeader({
  searchTerm,
  setSearchTerm,
  filterTecnica,
  setFilterTecnica,
  filterAnio,
  setFilterAnio,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  tecnicasUnicas = [],
  aniosUnicos = [],
}) {
  const selectClass =
    "border rounded px-3 py-2 text-sm min-w-[120px] focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white dark:bg-neutral-800 dark:text-white dark:border-neutral-700 appearance-none pr-8";
  const selectWrapper = "relative flex items-center w-full md:w-auto";
  const iconClass =
    "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-neutral-400 w-4 h-4";

  return (
    <div className="flex flex-col md:flex-row gap-2 md:gap-4 items-center justify-between mb-6 bg-white/80 dark:bg-neutral-900/80 rounded-xl p-3 shadow border border-border">
      <input
        type="text"
        placeholder="Buscar mural..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border rounded px-3 py-2 text-sm w-full md:w-64 focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white dark:bg-neutral-800 dark:text-white dark:border-neutral-700"
      />
      <div className={selectWrapper}>
        <select
          value={filterTecnica}
          onChange={(e) => setFilterTecnica(e.target.value)}
          className={selectClass}
        >
          <option value="">Todas las técnicas</option>
          {tecnicasUnicas.map((tecnica) => (
            <option key={tecnica} value={tecnica}>
              {tecnica}
            </option>
          ))}
        </select>
        <ChevronDown className={iconClass} />
      </div>
      <div className={selectWrapper}>
        <select
          value={filterAnio}
          onChange={(e) => setFilterAnio(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos los años</option>
          {aniosUnicos.map((anio) => (
            <option key={anio} value={anio}>
              {anio}
            </option>
          ))}
        </select>
        <ChevronDown className={iconClass} />
      </div>
      <div className={selectWrapper}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={selectClass}
        >
          <option value="titulo">Título</option>
          <option value="autor">Autor</option>
          <option value="anio">Año</option>
        </select>
        <ChevronDown className={iconClass} />
      </div>
      <div className="flex gap-2 mt-2 md:mt-0">
        <button
          className={`px-3 py-2 rounded font-medium transition-all duration-200 ${viewMode === "salas" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          onClick={() => setViewMode("salas")}
        >
          🏛️ Salas
        </button>
        <button
          className={`px-3 py-2 rounded font-medium transition-all duration-200 ${viewMode === "archivo" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
          onClick={() => setViewMode("archivo")}
        >
          📚 Archivo
        </button>
      </div>
    </div>
  );
}
