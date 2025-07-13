import { useMemo } from "react";
import { normalizeTecnica } from "../../components/gallery/utils";

export default function useMuralFilters({
  allMurales,
  searchTerm,
  filterTecnica,
  filterAnio,
  sortBy,
}) {
  return useMemo(() => {
    let filtered = allMurales;
    if (searchTerm) {
      filtered = filtered.filter(
        (mural) =>
          mural.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          mural.autor?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterTecnica) {
      filtered = filtered.filter(
        (mural) => normalizeTecnica(mural.tecnica) === filterTecnica
      );
    }
    if (filterAnio) {
      filtered = filtered.filter((mural) => mural.anio === filterAnio);
    }
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        if (sortBy === "titulo") return a.titulo.localeCompare(b.titulo);
        if (sortBy === "autor") return a.autor.localeCompare(b.autor);
        if (sortBy === "anio") return (a.anio || 0) - (b.anio || 0);
        return 0;
      });
    }
    return filtered;
  }, [allMurales, searchTerm, filterTecnica, filterAnio, sortBy]);
}
