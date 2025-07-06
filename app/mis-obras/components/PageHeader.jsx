"use client";

import { Palette, Plus } from "lucide-react";

const PageHeader = ({ onCreateNew }) => {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
        <Palette className="h-10 w-10 text-indigo-600" />
        Mis Obras
      </h1>
      <p className="text-lg text-muted-foreground mb-6">
        Crea, administra y comparte tus obras de arte digitales
      </p>

      {/* Botones de acción principales */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={onCreateNew}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow hover:bg-indigo-700 transition"
        >
          <Plus className="h-5 w-5" /> Crear obra
        </button>
      </div>
    </div>
  );
};

export default PageHeader;
