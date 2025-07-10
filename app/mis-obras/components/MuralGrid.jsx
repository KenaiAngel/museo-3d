"use client";

import MuralCard from "./MuralCard";
import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";

const MuralGrid = ({ murales, view = "grid", onEditMural, onDeleteMural }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const handleRequestDelete = (id, titulo) => {
    setDeleteId(id);
    setDeleteTitle(titulo);
  };
  const handleConfirmDelete = () => {
    if (deleteId) onDeleteMural(deleteId);
    setDeleteId(null);
    setDeleteTitle("");
  };
  const handleCancelDelete = () => {
    setDeleteId(null);
    setDeleteTitle("");
  };
  return (
    <>
      <div
        className={
          view === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-4"
        }
      >
        {murales.map((mural) => (
          <MuralCard
            key={mural.id}
            mural={mural}
            view={view}
            onEdit={onEditMural}
            onDelete={() => handleRequestDelete(mural.id, mural.titulo)}
          />
        ))}
      </div>
      <Modal
        isOpen={!!deleteId}
        onClose={handleCancelDelete}
        title="¿Eliminar obra?"
        size="sm"
      >
        <div className="mb-4">
          ¿Estás seguro de que quieres eliminar la obra <b>{deleteTitle}</b>?
          Esta acción no se puede deshacer.
        </div>
        <div className="flex gap-4 justify-end">
          <button
            onClick={handleCancelDelete}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmDelete}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </>
  );
};

export default MuralGrid;
