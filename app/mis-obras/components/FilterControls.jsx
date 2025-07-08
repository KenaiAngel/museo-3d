"use client";

import { motion } from "framer-motion";
import { Search, Filter, Grid, List, ChevronDown } from "lucide-react";

export default function FilterControls({
  filters,
  setFilters,
  resetFilters,
  getFilterOptions,
  showFilters,
  setShowFilters,
  view,
  setView,
  resultsCount,
}) {
  const { tecnicas, years } = getFilterOptions();

  return (
    <>
      {/* Controles de vista y filtros */}
      <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 sm:gap-4 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-4 border border-border overflow-hidden min-w-0 w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-4 w-full sm:w-auto min-w-0">
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar obras..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500 w-full sm:w-auto"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors w-full sm:w-auto min-w-0 overflow-hidden break-words"
            style={{ wordBreak: "break-word", minWidth: 0 }}
          >
            <Filter className="h-4 w-4 shrink-0" />
            <span className="truncate">Filtros</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform shrink-0 ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 overflow-x-auto scrollbar-none min-w-0">
          <span className="text-sm text-muted-foreground shrink-0">
            {resultsCount} obra{resultsCount !== 1 ? "s" : ""}
          </span>
          <div className="hidden sm:block border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-lg transition-colors w-10 h-10 flex items-center justify-center shrink-0 ${
              view === "grid"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600"
            }`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-lg transition-colors w-10 h-10 flex items-center justify-center shrink-0 ${
              view === "list"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600"
            }`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-4 border border-border"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={filters.tecnica}
              onChange={(e) =>
                setFilters({ ...filters, tecnica: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todas las técnicas</option>
              {tecnicas.map((tecnica) => (
                <option key={tecnica} value={tecnica}>
                  {tecnica}
                </option>
              ))}
            </select>

            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Todos los años</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="title">Por título</option>
              <option value="year">Por año</option>
            </select>

            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
