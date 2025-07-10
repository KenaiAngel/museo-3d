"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "../../components/ui/button";
import Unauthorized from "../../../components/Unauthorized";
import { useSession } from "next-auth/react";
import { AnimatedBlobsBackground, DotsPattern } from "../../components/admin/usuarios/Backgrounds";
import AvatarTooltip from "../../components/ui/AvatarTooltip";
import React, { useRef } from "react";

export default function AdminSalasPage() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Cargando...</div>;
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <Unauthorized title="Acceso denegado" message="Esta sección es solo para administradores." error="403" showLogin={true} redirectPath="/" />
    );
  }

  return <AdminSalasContent />;
}

function AdminSalasContent() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  // Estado para tooltips de miniaturas
  const [hoveredMuralId, setHoveredMuralId] = useState(null);
  const [hoveredMuralPos, setHoveredMuralPos] = useState({ left: 0, top: 0 });
  // Controlar si la imagen de cada mural está cargada
  const [loadedMurales, setLoadedMurales] = useState({});
  // Usar refs individuales para cada miniatura
  const muralRefs = React.useRef({});
  // Modal de confirmación
  const [salaToDelete, setSalaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [muralesDisponibles, setMuralesDisponibles] = useState([]);
  const [showAddMuralModal, setShowAddMuralModal] = useState(false);
  const [selectedSalaId, setSelectedSalaId] = useState(null);
  const [selectedMuralId, setSelectedMuralId] = useState("");

  useEffect(() => {
    const fetchSalas = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/salas");
        if (!res.ok) throw new Error("No se pudieron cargar las salas");
        const data = await res.json();
        setSalas(data.salas || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSalas();
  }, []);

  useEffect(() => {
    // Cargar murales disponibles para añadir
    const fetchMurales = async () => {
      const res = await fetch("/api/murales");
      if (res.ok) {
        const data = await res.json();
        setMuralesDisponibles(data.murales || []);
      }
    };
    fetchMurales();
  }, []);

  const handleDelete = async (id) => {
    setSalaToDelete(id);
  };

  const confirmDelete = async () => {
    if (!salaToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/salas/${salaToDelete}`, { method: "DELETE" });
      if (!res.ok) throw new Error("No se pudo eliminar la sala");
      setSalas((prev) => prev.filter((s) => s.id !== salaToDelete));
      setSalaToDelete(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsDeleting(false);
    }
  };
  const cancelDelete = () => setSalaToDelete(null);

  const handleRemoveMural = async (salaId, muralId) => {
    try {
      const res = await fetch(`/api/salas/${salaId}/murales`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ murales: [muralId] }),
      });
      if (!res.ok) throw new Error("No se pudo eliminar el mural de la sala");
      setSalas((prev) => prev.map((s) =>
        s.id === salaId
          ? { ...s, murales: s.murales.filter((sm) => sm.mural.id !== muralId) }
          : s
      ));
    } catch (e) {
      alert(e.message);
    }
  };

  const handleShowAddMural = (salaId) => {
    setSelectedSalaId(salaId);
    setShowAddMuralModal(true);
  };

  const handleAddMural = async () => {
    if (!selectedSalaId || !selectedMuralId) return;
    try {
      const res = await fetch(`/api/salas/${selectedSalaId}/murales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ murales: [selectedMuralId] }),
      });
      if (!res.ok) throw new Error("No se pudo agregar el mural a la sala");
      // Refrescar la sala localmente
      setSalas((prev) => prev.map((s) => {
        if (s.id === selectedSalaId) {
          const mural = muralesDisponibles.find((m) => m.id === Number(selectedMuralId));
          if (mural) {
            return { ...s, murales: [...s.murales, { mural }] };
          }
        }
        return s;
      }));
      setShowAddMuralModal(false);
      setSelectedMuralId("");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center justify-start bg-transparent min-h-screen">
      {/* Fondo animado, patrón y graffiti sutil */}
      <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
        <AnimatedBlobsBackground />
        <DotsPattern />
      </div>
      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Administrar Salas</h1>
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href="/crear-sala">Crear nueva sala</Link>
          </Button>
        </div>
        {/* Desktop/tablet: tabla, mobile: cards */}
        <div className="hidden md:block">
          {loading ? (
            <div className="text-center py-8">Cargando salas...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : salas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay salas registradas.</div>
          ) : (
            <table className="w-full border-separate border-spacing-y-3">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2">Nombre de la sala</th>
                  <th className="text-center px-4 py-2">Creador</th>
                  <th className="text-center px-4 py-2">Murales</th>
                  <th className="text-center px-4 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {salas.map((sala) => (
                  <tr key={sala.id} className="bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow border border-zinc-200 dark:border-zinc-700">
                    {/* Nombre y creador centrados verticalmente */}
                    <td className="px-4 py-4 align-middle text-lg font-semibold text-foreground text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span>{sala.nombre}</span>
                        <span className="text-xs text-muted-foreground font-normal">ID: {sala.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-medium text-base">{sala.creador?.name || <span className="italic text-muted-foreground">Sin nombre</span>}</span>
                        <span className="text-xs text-muted-foreground">{sala.creador?.email}</span>
                      </div>
                    </td>
                    {/* Murales de la sala */}
                    <td className="px-4 py-4 align-middle text-center">
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 justify-center items-center max-w-xs mx-auto">
                        {sala.murales.map((sm) => (
                          <div key={sm.mural.id} className="relative group">
                            <img
                              ref={muralRefs.current[sm.mural.id]}
                              src={sm.mural.url_imagen}
                              alt={sm.mural.titulo}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow"
                              onLoad={() => setLoadedMurales((prev) => ({ ...prev, [sm.mural.id]: true }))}
                            />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100 transition"
                              title="Eliminar mural de la sala"
                              onClick={() => handleRemoveMural(sala.id, sm.mural.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="flex flex-col items-center justify-center gap-1 p-0.5 border-2 border-dashed border-indigo-400 rounded-lg bg-white dark:bg-neutral-900 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-neutral-800 transition h-16 w-16 min-w-[4rem] min-h-[4rem]"
                          onClick={() => handleShowAddMural(sala.id)}
                          title="Añadir mural a la sala"
                        >
                          <span className="text-2xl leading-none">＋</span>
                          <span className="text-xs font-medium">Añadir</span>
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-center">
                      {/* Acciones: editar, eliminar, etc. */}
                      <div className="flex flex-row gap-2 justify-center">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/salas/${sala.id}`}>Editar</Link>
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(sala.id)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Mobile: cards */}
        <div className="block md:hidden">
          {loading ? (
            <div className="text-center py-8">Cargando salas...</div>
          ) : error ? (
            <div className="text-center text-red-500 py-8">{error}</div>
          ) : salas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No hay salas registradas.</div>
          ) : (
            <div className="flex flex-col gap-6">
              {salas.map((sala) => (
                <div key={sala.id} className="bg-white/80 dark:bg-zinc-900/80 rounded-2xl shadow border border-zinc-200 dark:border-zinc-700 p-4 flex flex-col gap-3">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-lg font-semibold text-foreground">{sala.nombre}</span>
                    <span className="text-xs text-muted-foreground font-normal">ID: {sala.id}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="font-medium text-base">{sala.creador?.name || <span className="italic text-muted-foreground">Sin nombre</span>}</span>
                    <span className="text-xs text-muted-foreground">{sala.creador?.email}</span>
                  </div>
                  <div className="flex flex-row gap-2 overflow-x-auto py-2 justify-center items-center">
                    {sala.murales.map((sm) => {
                      if (!muralRefs.current[sm.mural.id]) muralRefs.current[sm.mural.id] = React.createRef();
                      return (
                        <span
                          key={sm.mural.id}
                          onMouseEnter={() => setHoveredMuralId(null)}
                          onMouseLeave={() => setHoveredMuralId(null)}
                          className="inline-block cursor-pointer transition-transform duration-200 hover:scale-110"
                        >
                          <img
                            ref={muralRefs.current[sm.mural.id]}
                            src={sm.mural.url_imagen}
                            alt={sm.mural.titulo}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow"
                            onLoad={() => setLoadedMurales((prev) => ({ ...prev, [sm.mural.id]: true }))}
                          />
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex flex-row gap-2 justify-center">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/salas/${sala.id}`}>Editar</Link>
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(sala.id)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Modal de confirmación de borrado */}
      { salaToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-xs">
            <h3 className="font-semibold mb-4 text-lg text-red-700 dark:text-red-300">¿Eliminar sala?</h3>
            <p className="mb-6 text-gray-700 dark:text-gray-200 text-center">Esta acción eliminará la sala y no se puede deshacer. ¿Seguro que quieres continuar?</p>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal para añadir mural */}
      {showAddMuralModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-xs">
            <h3 className="font-semibold mb-4 text-lg text-indigo-700 dark:text-indigo-300">Añadir mural a la sala</h3>
            <select
              className="mb-6 w-full p-2 rounded border border-gray-300 dark:border-gray-700"
              value={selectedMuralId}
              onChange={(e) => setSelectedMuralId(e.target.value)}
            >
              <option value="">Selecciona un mural</option>
              {muralesDisponibles.map((mural) => (
                <option key={mural.id} value={mural.id}>{mural.titulo}</option>
              ))}
            </select>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
                onClick={() => setShowAddMuralModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
                onClick={handleAddMural}
                disabled={!selectedMuralId}
              >
                Añadir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 