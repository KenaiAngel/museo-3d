"use client";

import MuralCard from "./MuralCard";
import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";

const MuralGrid = ({ murales, view = "grid", onEditMural, onDeleteMural }) => {
  const [deleteId, setDeleteId] = useState(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [deleteImage, setDeleteImage] = useState("");
  const handleRequestDelete = (id, titulo, url_imagen) => {
    setDeleteId(id);
    setDeleteTitle(titulo);
    setDeleteImage(url_imagen);
  };
  const handleConfirmDelete = () => {
    if (deleteId) onDeleteMural(deleteId);
    setDeleteId(null);
    setDeleteTitle("");
    setDeleteImage("");
  };
  const handleCancelDelete = () => {
    setDeleteId(null);
    setDeleteTitle("");
    setDeleteImage("");
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
            onDelete={() => handleRequestDelete(mural.id, mural.titulo, mural.url_imagen)}
          />
        ))}
      </div>
      <Modal
        isOpen={!!deleteId}
        onClose={handleCancelDelete}
        title="¿Eliminar obra?"
        size="sm"
      >
        <div className="mb-4 flex flex-col items-center gap-2">
          <span>¿Estás seguro de que quieres eliminar la obra <b>{deleteTitle}</b>?</span>
          {deleteImage && (
            <img src={deleteImage} alt={deleteTitle} className="w-20 h-20 object-cover rounded shadow border" />
          )}
          <span className="text-xs text-muted-foreground">Esta acción no se puede deshacer.</span>
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
