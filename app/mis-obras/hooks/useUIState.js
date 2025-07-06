"use client";

import { useState, useEffect } from "react";

export const useUIState = () => {
  const [view, setView] = useState("grid");
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [editingMural, setEditingMural] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCrearObraModal, setShowCrearObraModal] = useState(false);

  // Manejar footer cuando se abre el modal de crear obra
  useEffect(() => {
    if (showCrearObraModal) {
      document.body.classList.add("hide-footer");
    } else {
      document.body.classList.remove("hide-footer");
    }
    return () => document.body.classList.remove("hide-footer");
  }, [showCrearObraModal]);

  const openCreateModal = () => {
    setShowCanvasEditor(false);
    setShowUploadModal(false);
    setShowCrearObraModal(true);
  };

  const openCanvasEditor = (mural = null) => {
    setEditingMural(mural);
    setShowCanvasEditor(true);
  };

  const closeCanvasEditor = () => {
    setShowCanvasEditor(false);
    setEditingMural(null);
  };

  const closeCreateModal = () => {
    setShowCrearObraModal(false);
  };

  const openUploadModal = () => {
    setShowUploadModal(true);
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
  };

  return {
    // Estados
    view,
    showCanvasEditor,
    editingMural,
    showFilters,
    showUploadModal,
    showCrearObraModal,

    // Setters básicos
    setView,
    setShowFilters,

    // Acciones compuestas
    openCreateModal,
    openCanvasEditor,
    closeCanvasEditor,
    closeCreateModal,
    openUploadModal,
    closeUploadModal,
  };
};
