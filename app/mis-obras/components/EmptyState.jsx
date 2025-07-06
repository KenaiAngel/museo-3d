"use client";

import { Palette, Plus } from "lucide-react";

const EmptyState = ({ 
  hasAnyMurales, 
  onCreateNew 
}) => {
  return (
    <div className="text-center py-16">
      <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {!hasAnyMurales ? 'No tienes obras aún' : 'No se encontraron obras'}
      </h3>
      <p className="text-muted-foreground mb-6">
        {!hasAnyMurales 
          ? 'Comienza creando tu primera obra de arte digital'
          : 'Intenta ajustar los filtros de búsqueda'
        }
      </p>
      {!hasAnyMurales && (
        <div className="flex justify-center gap-4">
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Crear obra
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
