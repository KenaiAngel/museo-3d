"use client";

import { motion } from "framer-motion";
import { Edit3, Trash2, Ban } from "lucide-react";

const MuralCard = ({ mural, view = "grid", onEdit, onDelete }) => {
  const handleEdit = () => {
    onEdit(mural);
  };

  const handleDelete = () => {
    onDelete(mural.id);
  };

  if (view === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border flex items-center gap-4 p-4"
      >
        <div className="w-24 h-24 flex-shrink-0 relative overflow-hidden rounded-lg">
          <img
            src={mural.url_imagen}
            alt={mural.titulo}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
            {mural.titulo}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            {mural.tecnica} • {mural.year}
          </p>
          {mural.descripcion && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {mural.descripcion}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors relative"
            title="Editar"
            disabled={!mural.editable}
            style={{ opacity: mural.editable ? 1 : 0.5, cursor: mural.editable ? 'pointer' : 'not-allowed' }}
          >
            <Edit3 className="h-4 w-4" />
            {!mural.editable && (
              <span className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 flex items-center justify-center">
                <Ban className="h-3 w-3 text-white" />
              </span>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Eliminar"
            disabled={!mural.editable}
            style={{ opacity: mural.editable ? 1 : 0.5, cursor: mural.editable ? 'pointer' : 'not-allowed' }}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  // Grid view (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-white backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border"
    >
      <div className="aspect-square relative overflow-hidden">
        <img
          src={mural.url_imagen}
          alt={mural.titulo}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
          <div className="flex gap-2">
            <button
              onClick={handleEdit}
              className="p-2 bg-white/90 text-gray-800 rounded-lg hover:bg-white transition-colors relative"
              title="Editar"
              disabled={!mural.editable}
              style={{ opacity: mural.editable ? 1 : 0.5, cursor: mural.editable ? 'pointer' : 'not-allowed' }}
            >
              <Edit3 className="h-4 w-4" />
              {!mural.editable && (
                <span className="absolute -top-2 -right-2 bg-red-600 rounded-full p-0.5 flex items-center justify-center">
                  <Ban className="h-3 w-3 text-white" />
                </span>
              )}
            </button>
            <button
              onClick={handleDelete}
              className="p-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors"
              title="Eliminar"
              disabled={!mural.editable}
              style={{ opacity: mural.editable ? 1 : 0.5, cursor: mural.editable ? 'pointer' : 'not-allowed' }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-4 bg-white dark:bg-neutral-900 transition-colors duration-300">
        <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
          {mural.titulo}
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          {mural.tecnica} • {mural.year}
        </p>
        {mural.descripcion && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {mural.descripcion}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default MuralCard;
