"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import SalaIcon from "../components/ui/icons/SalaIcon";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Unauthorized from "../../components/Unauthorized";
import { AnimatedBlobsBackground, DotsPattern } from "../components/admin/usuarios/Backgrounds";
import AvatarTooltip from "../components/ui/AvatarTooltip";
import React, { useRef } from "react";
import { Trash2 } from "lucide-react";

export default function MisSalas() {
  const { data: session, status } = useSession();
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [salaToDelete, setSalaToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [muralesDisponibles, setMuralesDisponibles] = useState([]);
  const [showAddMuralModal, setShowAddMuralModal] = useState(false);
  const [selectedSalaId, setSelectedSalaId] = useState(null);
  const [selectedMuralIds, setSelectedMuralIds] = useState([]);
  const addMuralBtnRef = useRef(null);
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });
  const router = useRouter();
  // Nuevo estado para el mural a eliminar
  const [muralToRemove, setMuralToRemove] = useState(null);

  const isAdmin = session?.user?.role === "ADMIN";
  const userId = session?.user?.id;

  useEffect(() => {
    const fetchSalas = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/salas");
        if (!res.ok) throw new Error("No se pudieron cargar las salas");
        const data = await res.json();
        let allSalas = data.salas || [];
        // Si no es admin, filtra solo las salas donde es creador o colaborador
        if (!isAdmin && userId) {
          allSalas = allSalas.filter(
            (sala) =>
              sala.creadorId === userId ||
              sala.colaboradores?.some((col) => col.id === userId)
          );
        }
        setSalas(allSalas);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSalas();
  }, [isAdmin, userId]);

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

  const handleShowAddMural = (salaId, e) => {
    setSelectedSalaId(salaId);
    setShowAddMuralModal(true);
    if (e && addMuralBtnRef.current) {
      const rect = addMuralBtnRef.current.getBoundingClientRect();
      setModalPosition({ top: rect.bottom + window.scrollY + 8, left: rect.left + window.scrollX });
    }
  };

  const handleAddMural = async () => {
    if (!selectedSalaId || selectedMuralIds.length === 0) return;
    try {
      const res = await fetch(`/api/salas/${selectedSalaId}/murales`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ murales: selectedMuralIds }),
      });
      if (!res.ok) throw new Error("No se pudo agregar el mural a la sala");
      // Refrescar la sala localmente
      setSalas((prev) => prev.map((s) => {
        if (s.id === selectedSalaId) {
          const newMurales = muralesDisponibles.filter((m) => selectedMuralIds.includes(m.id));
          return { ...s, murales: [...s.murales, ...newMurales] };
        }
        return s;
      }));
      setShowAddMuralModal(false);
      setSelectedMuralIds([]);
    } catch (e) {
      alert(e.message);
    }
  };

  // UI igual a admin/salas: tabla en desktop, cards en mobile, controles solo para admin
  return (
    <div className="relative w-full flex flex-col items-center justify-start bg-transparent min-h-screen">
      <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
        <AnimatedBlobsBackground />
        <DotsPattern />
      </div>
      <div className="relative z-10 w-full max-w-6xl mx-auto p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Mis Salas</h1>
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
                  <tr key={sala.id} className="bg-white/80 dark:bg-zinc-900/80 rounded-xl shadow border border-gray-200 dark:border-gray-700 dark:border-2">
                    {/* Nombre y creador centrados verticalmente */}
                    <td className="px-4 py-4 align-middle text-lg font-semibold text-foreground text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span>{sala.nombre}</span>
                        <span className="text-xs text-muted-foreground font-normal">ID: {sala.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-center">
                      <div className="flex flex-col items-center justify-center gap-1">
                        <span className="font-medium text-base">
                          {sala.creador?.id === userId ? (
                            <span className="text-green-600 font-bold">Tú (Propietario)</span>
                          ) : (
                            sala.creador?.name || <span className="italic text-muted-foreground">Sin nombre</span>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">{sala.creador?.email}</span>
                      </div>
                    </td>
                    {/* Murales de la sala */}
                    <td className="px-4 py-4 align-middle text-center">
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 justify-center items-center max-w-xs mx-auto">
                        {sala.murales.map((sm) => (
                          <div key={sm.mural.id} className="relative group">
                            <img
                              src={sm.mural.url_imagen}
                              alt={sm.mural.titulo}
                              className="w-24 h-24 aspect-square object-cover rounded-lg border border-gray-200 dark:border-gray-700 shadow transition-all duration-200"
                            />
                            {isAdmin && (
                              <button
                                type="button"
                                className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                                title="Eliminar mural de la sala"
                                onClick={() => setMuralToRemove({ salaId: sala.id, muralId: sm.mural.id })}
                              >
                                <Trash2 className="w-8 h-8 text-red-500 drop-shadow" />
                              </button>
                            )}
                          </div>
                        ))}
                        {isAdmin && (
                          <button
                            type="button"
                            ref={addMuralBtnRef}
                            className="flex flex-col items-center justify-center gap-1 p-0.5 border-2 border-dashed border-indigo-400 rounded-lg bg-white dark:bg-neutral-900 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-neutral-800 transition h-16 w-16 min-w-[4rem] min-h-[4rem]"
                            onClick={(e) => handleShowAddMural(sala.id, e)}
                            title="Añadir mural a la sala"
                          >
                            <span className="text-2xl leading-none">＋</span>
                            <span className="text-xs font-medium">Añadir</span>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-middle text-center">
                      <div className="flex flex-row gap-2 justify-center">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/salas/${sala.id}`}>Editar</Link>
                        </Button>
                        {isAdmin && (
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(sala.id)}>
                            Eliminar
                          </Button>
                        )}
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
                <div key={sala.id} className="bg-white/80 dark:bg-zinc-900/80 rounded-2xl shadow border border-gray-200 dark:border-gray-700 dark:border-2 p-4 flex flex-col gap-3">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="text-lg font-semibold text-foreground">{sala.nombre}</span>
                    <span className="text-xs text-muted-foreground font-normal">ID: {sala.id}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="font-medium text-base">
                      {sala.creador?.id === userId ? (
                        <span className="text-green-600 font-bold">Tú (Propietario)</span>
                      ) : (
                        sala.creador?.name || <span className="italic text-muted-foreground">Sin nombre</span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">{sala.creador?.email}</span>
                  </div>
                  {/* Murales en grid 2 columnas */}
                  <div className="grid grid-cols-2 gap-5 justify-items-center items-center py-2 mx-auto">
                    {sala.murales.map((sm) => (
                      <div key={sm.mural.id} className="relative group overflow-visible w-20 h-20 flex items-center justify-center">
                        <img
                          src={sm.mural.url_imagen}
                          alt={sm.mural.titulo}
                          className="w-20 h-20 object-cover object-center rounded-lg border border-gray-200 dark:border-gray-700 shadow"
                        />
                        {isAdmin && (
                          <button
                            type="button"
                            className="absolute top-1 right-1 z-10 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-base shadow-lg transition pointer-events-auto"
                            title="Eliminar mural de la sala"
                            onClick={() => handleRemoveMural(sala.id, sm.mural.id)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {isAdmin && (
                      <button
                        type="button"
                        ref={addMuralBtnRef}
                        className="col-span-2 flex flex-col items-center justify-center gap-1 p-2 border-2 border-dashed border-indigo-400 rounded-lg bg-white dark:bg-neutral-900 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-neutral-800 transition min-h-[4rem]"
                        onClick={(e) => handleShowAddMural(sala.id, e)}
                        title="Añadir mural a la sala"
                      >
                        <span className="text-2xl leading-none">＋</span>
                        <span className="text-xs font-medium">Añadir mural</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-row gap-2 justify-center mt-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/salas/${sala.id}`}>Editar</Link>
                    </Button>
                    {isAdmin && (
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(sala.id)}>
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Modal para añadir mural en mobile */}
        {showAddMuralModal && (
          <div
            id="add-mural-modal"
            className="fixed inset-0 z-50 flex justify-center items-start pt-10 pb-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
          >
            <div className="bg-white dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl p-4 md:p-8 flex flex-col items-center w-full max-w-xs md:max-w-lg mx-auto">
              <h3 className="font-semibold mb-4 text-lg md:text-2xl text-indigo-700 dark:text-indigo-300">Añadir mural a la sala</h3>
              <div className="flex flex-col gap-4 max-h-80 md:max-h-[32rem] overflow-y-auto w-full mb-6 border border-gray-200 dark:border-gray-700 dark:border-2 rounded-xl p-2 md:p-4">
                {muralesDisponibles
                  .filter((mural) => {
                    const sala = salas.find((s) => s.id === selectedSalaId);
                    return sala && !sala.murales.some((sm) => sm.mural.id === mural.id);
                  })
                  .map((mural) => (
                    <button
                      key={mural.id}
                      type="button"
                      className={`flex flex-row items-center border rounded-lg p-2 md:p-4 transition shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 ${selectedMuralIds.includes(mural.id) ? "border-indigo-600 ring-2 ring-indigo-400" : "border-gray-300 dark:border-gray-700 dark:border-2"}`}
                      onClick={() => {
                        setSelectedMuralIds((prev) =>
                          prev.includes(mural.id)
                            ? prev.filter((id) => id !== mural.id)
                            : [...prev, mural.id]
                        );
                      }}
                    >
                      <img
                        src={mural.url_imagen}
                        alt={mural.titulo}
                        className="w-14 h-14 md:w-24 md:h-24 object-cover rounded mr-3 md:mr-6"
                      />
                      <div className="flex flex-col flex-1 max-w-[10rem] md:max-w-[18rem] overflow-hidden">
                        <span className="font-medium text-sm md:text-lg text-left truncate w-full">{mural.titulo}</span>
                        <span className="text-xs md:text-base text-muted-foreground text-left truncate w-full">{mural.tecnica}</span>
                      </div>
                      {selectedMuralIds.includes(mural.id) && (
                        <span className="ml-2 text-indigo-600 font-bold text-lg md:text-2xl">✓</span>
                      )}
                    </button>
                  ))}
                {muralesDisponibles.filter((mural) => {
                  const sala = salas.find((s) => s.id === selectedSalaId);
                  return sala && !sala.murales.some((sm) => sm.mural.id === mural.id);
                }).length === 0 && (
                  <div className="text-center text-muted-foreground py-8">No hay murales disponibles para agregar.</div>
                )}
              </div>
              <div className="flex gap-4 w-full justify-center">
                <button
                  className="px-4 py-2 rounded bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition w-1/2"
                  onClick={() => setShowAddMuralModal(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 rounded bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition w-1/2 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleAddMural}
                  disabled={selectedMuralIds.length === 0 || muralesDisponibles.filter((mural) => {
                    const sala = salas.find((s) => s.id === selectedSalaId);
                    return sala && !sala.murales.some((sm) => sm.mural.id === mural.id);
                  }).length === 0}
                >
                  Añadir{selectedMuralIds.length > 0 ? ` (${selectedMuralIds.length})` : ""}
                </button>
              </div>
            </div>
          </div>
        )}
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
      {/* Modal de confirmación para eliminar mural de sala */}
      {muralToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl p-8 flex flex-col items-center max-w-xs">
            <h3 className="font-semibold mb-4 text-lg text-red-600">¿Eliminar mural de la sala?</h3>
            <p className="mb-6 text-center text-sm">Esta acción no se puede deshacer.<br/>¿Seguro que quieres quitar este mural de la sala?</p>
            <div className="flex gap-4 w-full justify-center">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition w-1/2"
                onClick={() => setMuralToRemove(null)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700 transition w-1/2"
                onClick={async () => {
                  await handleRemoveMural(muralToRemove.salaId, muralToRemove.muralId);
                  setMuralToRemove(null);
                }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 