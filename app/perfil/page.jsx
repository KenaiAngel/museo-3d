"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import {
  getPersonalCollection,
  getCollectionStats,
} from "../../lib/personalCollection.js";
import ProtectedRoute from "../../components/ProtectedRoute";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import RainbowBackground from "./RainbowBackground";
import MuralIcon from "../components/ui/icons/MuralIcon";
import SalaIcon from "../components/ui/icons/SalaIcon";
import ArtistaIcon from "../components/ui/icons/ArtistaIcon";
import TecnicaIcon from "../components/ui/icons/TecnicaIcon";
import ReactDOM from "react-dom";
import React from "react";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { Switch } from "../components/ui/switch";
import { Input } from "../components/ui/input";
import { Settings as SettingsIcon } from "lucide-react";
import useSWR from "swr";
import { useUser } from "../../providers/UserProvider";
import { useModal } from "../../providers/ModalProvider";
import { ModalWrapper } from "../../components/ui/Modal";
import { useSessionData } from "../../providers/SessionProvider";
import toast from "react-hot-toast";
import { useCardMouseGlow } from "../hooks/useCardMouseGlow";

const fetcher = (url) => fetch(url).then((res) => res.json());

function ImageTooltip({ src, alt, anchorRef, show }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipWidth = 260;
  const tooltipHeight = 260;
  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      let top, left;
      const padding = 8;
      // Mobile: centrar abajo, Desktop: derecha
      if (window.innerWidth < 600) {
        // Centrar horizontalmente sobre el elemento, mostrar abajo
        left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        top = rect.bottom + padding + window.scrollY;
        // Si se sale por la izquierda
        if (left < padding) left = padding;
        // Si se sale por la derecha
        if (left + tooltipWidth > window.innerWidth - padding)
          left = window.innerWidth - tooltipWidth - padding;
        // Si se sale por abajo, mostrar arriba
        if (
          top + tooltipHeight >
          window.innerHeight + window.scrollY - padding
        ) {
          top = rect.top - tooltipHeight - padding + window.scrollY;
        }
      } else {
        // Desktop: mostrar a la derecha
        left = rect.right + padding + window.scrollX;
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        // Si se sale por la derecha
        if (left + tooltipWidth > window.innerWidth - padding)
          left = rect.left - tooltipWidth - padding + window.scrollX;
        // Si se sale por la izquierda
        if (left < padding) left = padding;
        // Si se sale por arriba
        if (top < padding) top = padding;
        // Si se sale por abajo
        if (top + tooltipHeight > window.innerHeight + window.scrollY - padding)
          top = window.innerHeight + window.scrollY - tooltipHeight - padding;
      }
      setPos({ top, left });
    }
  }, [show, anchorRef]);
  if (!show) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 1000,
        width: tooltipWidth,
        height: tooltipHeight,
        maxWidth: "90vw",
        maxHeight: "90vw",
      }}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2 flex items-center justify-center"
    >
      <img
        src={src}
        alt={alt}
        className="w-56 h-56 object-contain rounded-lg"
      />
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
}

function CollectionItem({ item, allItems }) {
  const imgRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);
  return (
    <div className="flex items-center gap-4 border-b py-2 relative group">
      {item.src && (
        <>
          <img
            ref={imgRef}
            src={item.src}
            alt={item.title}
            className="w-12 h-12 object-cover rounded-md cursor-pointer group-hover:ring-2 group-hover:ring-primary transition ml-2"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          />
          <ImageTooltip
            src={item.src}
            alt={item.title}
            anchorRef={imgRef}
            show={hovered}
          />
        </>
      )}
      <div className="flex-1 text-left">
        <div className="font-medium">{item.title}</div>
        <div className="text-xs text-muted-foreground">
          {item.artist} · {item.year} · {item.technique}
        </div>
      </div>
    </div>
  );
}

function TagPreviewTooltip({ anchorRef, show, images }) {
  const [pos, setPos] = React.useState({ top: 0, left: 0 });
  const tooltipWidth = 320;
  const tooltipHeight = 120;
  React.useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      let top, left;
      const padding = 8;
      if (window.innerWidth < 600) {
        // Mobile: centrar horizontalmente sobre el tag, mostrar abajo
        left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        top = rect.bottom + padding + window.scrollY;
        if (left < padding) left = padding;
        if (left + tooltipWidth > window.innerWidth - padding)
          left = window.innerWidth - tooltipWidth - padding;
        if (
          top + tooltipHeight >
          window.innerHeight + window.scrollY - padding
        ) {
          top = rect.top - tooltipHeight - padding + window.scrollY;
        }
      } else {
        // Desktop: mostrar a la derecha
        left = rect.right + padding + window.scrollX;
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        if (left + tooltipWidth > window.innerWidth - padding)
          left = rect.left - tooltipWidth - padding + window.scrollX;
        if (left < padding) left = padding;
        if (top < padding) top = padding;
        if (top + tooltipHeight > window.innerHeight + window.scrollY - padding)
          top = window.innerHeight + window.scrollY - tooltipHeight - padding;
      }
      setPos({ top, left });
    }
  }, [show, anchorRef]);
  if (!show || images.length === 0) return null;
  const maxPreview = 5;
  const previewImages = images.slice(0, maxPreview);
  const extra = images.length - maxPreview;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 1000,
        width: tooltipWidth,
        height: tooltipHeight,
        maxWidth: "90vw",
        maxHeight: "90vw",
      }}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2 flex items-center justify-center"
    >
      <div className="flex gap-2">
        {previewImages.map((img, i) => {
          // Usar url_imagen en lugar de imagenUrl según el esquema actual
          const imageUrl = img.url_imagen || img.imagenUrl;

          // Si es el último preview y hay extra, muestra overlay
          if (i === maxPreview - 1 && extra > 0) {
            return (
              <div key={img.id || i} className="relative w-16 h-16">
                <img
                  src={imageUrl}
                  alt={img.titulo}
                  className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-700 opacity-60"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                  <span className="text-white font-bold text-lg">+{extra}</span>
                </div>
              </div>
            );
          }
          return (
            <img
              key={img.id || i}
              src={imageUrl}
              alt={img.titulo}
              className="w-16 h-16 object-cover rounded-md border border-gray-200 dark:border-gray-700"
            />
          );
        })}
      </div>
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
}

function TagWithPreview({ label, variant, images, children }) {
  const ref = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);
  return (
    <span
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "inline-block" }}
    >
      <Badge variant={variant}>{label}</Badge>
      {hovered && (
        <TagPreviewTooltip anchorRef={ref} show={true} images={images} />
      )}
      {children}
    </span>
  );
}

function AvatarTooltip({ src, alt, anchorRef, show }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipWidth = 260;
  const tooltipHeight = 260;
  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      let top, left;
      const padding = 8;
      if (window.innerWidth < 600) {
        // Mobile: centrar horizontalmente sobre el avatar, mostrar abajo
        left = rect.left + rect.width / 2 - tooltipWidth / 2 + window.scrollX;
        top = rect.bottom + padding + window.scrollY;
        if (left < padding) left = padding;
        if (left + tooltipWidth > window.innerWidth - padding)
          left = window.innerWidth - tooltipWidth - padding;
        if (
          top + tooltipHeight >
          window.innerHeight + window.scrollY - padding
        ) {
          top = rect.top - tooltipHeight - padding + window.scrollY;
        }
      } else {
        // Desktop: mostrar a la derecha
        left = rect.right + padding + window.scrollX;
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        if (left + tooltipWidth > window.innerWidth - padding)
          left = rect.left - tooltipWidth - padding + window.scrollX;
        if (left < padding) left = padding;
        if (top < padding) top = padding;
        if (top + tooltipHeight > window.innerHeight + window.scrollY - padding)
          top = window.innerHeight + window.scrollY - tooltipHeight - padding;
      }
      setPos({ top, left });
    }
  }, [show, anchorRef]);
  if (!show) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 1000,
        width: tooltipWidth,
        height: tooltipHeight,
        maxWidth: "90vw",
        maxHeight: "90vw",
      }}
      className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-2 flex items-center justify-center"
    >
      <img
        src={src}
        alt={alt}
        className="w-56 h-56 object-contain rounded-lg"
      />
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
}

function PerfilAvatarEdit({
  imagePreview,
  newName,
  handleImageChange,
  handleNameChange,
  checkingName,
  nameAvailable,
  updating,
  setEditMode,
  handleSave,
  fileInputRef,
  nameInputRef,
}) {
  const avatarRef = useRef();
  const [hovered, setHovered] = useState(false);

  // Determinar si el botón guardar debe estar habilitado
  const canSave = !updating && nameAvailable === true && newName.length >= 3;

  return (
    <>
      <div className="relative mb-2">
        <span
          ref={avatarRef}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{ display: "inline-block" }}
        >
          <Avatar className="size-32">
            <AvatarImage src={imagePreview} alt={newName || "Avatar"} />
            <AvatarFallback>{newName?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <AvatarTooltip
            src={imagePreview}
            alt={newName || "Avatar"}
            anchorRef={avatarRef}
            show={hovered}
          />
        </span>
        <button
          className="absolute bottom-2 right-2 rounded-full p-2 shadow-lg border border-white bg-black text-white hover:bg-black/90"
          onClick={() => fileInputRef.current?.click()}
          type="button"
          disabled={updating}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6"
              stroke="currentColor"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
      </div>
      <input
        ref={nameInputRef}
        type="text"
        className="border rounded-lg px-3 py-2 text-center w-full mb-2"
        value={newName}
        onChange={handleNameChange}
        disabled={updating}
        maxLength={32}
        placeholder="Ingresa tu nombre"
      />
      {checkingName && (
        <div className="text-xs text-muted-foreground">
          Comprobando disponibilidad...
        </div>
      )}
      {nameAvailable === false && (
        <div className="text-xs text-red-500">Nombre no disponible</div>
      )}
      {nameAvailable === true && (
        <div className="text-xs text-green-600">¡Nombre disponible!</div>
      )}
      <div className="flex gap-2 mt-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditMode(false)}
          disabled={updating}
        >
          Cancelar
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!canSave}>
          {updating ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </>
  );
}

function PerfilAvatarView({ image, name, onEdit }) {
  const avatarRef = useRef();
  const [hovered, setHovered] = useState(false);
  return (
    <>
      <span
        ref={avatarRef}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: "inline-block" }}
      >
        <Avatar className="size-32 mb-2">
          <AvatarImage src={image || undefined} alt={name || "Avatar"} />
          <AvatarFallback>{name?.[0] || "U"}</AvatarFallback>
        </Avatar>
        <AvatarTooltip
          src={image || undefined}
          alt={name || "Avatar"}
          anchorRef={avatarRef}
          show={hovered}
        />
      </span>
      <CardTitle className="text-lg font-semibold">
        {name || "Usuario"}
      </CardTitle>
      <Badge variant="secondary" className="mt-1">
        Usuario
      </Badge>
      <Button size="sm" className="mt-2" onClick={onEdit}>
        Editar perfil
      </Button>
    </>
  );
}

function PerfilContent() {
  const { data: session, status, update } = useSession();
  const [updating, setUpdating] = useState(false);
  const [personalCollection, setPersonalCollection] = useState([]);
  const [collectionStats, setCollectionStats] = useState({});
  const [museumStats, setMuseumStats] = useState({
    totalArtworks: 0,
    totalSalas: 0,
    totalArtists: 0,
    totalTechniques: 0,
    salas: [],
  });
  const [muralesStats, setMuralesStats] = useState({
    total: 0,
    porSala: {},
    porTecnica: {},
    porAnio: {},
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [hoveredTag, setHoveredTag] = React.useState({
    type: null,
    value: null,
    anchor: null,
  });
  const [murales, setMurales] = React.useState([]);
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState(session?.user?.name || "");
  const [newImage, setNewImage] = useState(session?.user?.image || "");
  const [imagePreview, setImagePreview] = useState(session?.user?.image || "");
  const [checkingName, setCheckingName] = useState(false);
  const [nameAvailable, setNameAvailable] = useState(null); // null | true | false
  const fileInputRef = useRef();
  const {
    updateProfile,
    error: updateError,
    success: updateSuccess,
  } = useUpdateProfile();
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [subsEnabled, setSubsEnabled] = useState(false);
  const [emailValidated, setEmailValidated] = useState(false);
  const switchesInitialized = useRef(false);
  const [verifLoading, setVerifLoading] = useState(false);
  const [verifMsg, setVerifMsg] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const debounceRef = useRef();
  const [accountInfo, setAccountInfo] = useState(null);
  const {
    user,
    userProfile,
    isAuthenticated,
    isAdmin,
    isModerator,
    getUserRole,
    getUserSetting,
    updateUserSetting,
    updateUserProfile,
    loadUserProfile,
    isLoadingProfile,
  } = useUser();
  const {
    session: sessionData,
    sessionDuration,
    sessionTimeRemaining,
    isSessionExpiringSoon,
    isSessionExpired,
    lastActivity,
  } = useSessionData();
  const { openModal } = useModal();
  const nameInputRef = useRef(null);

  const userId = session?.user?.id || null;

  useEffect(() => {
    if (session?.user?.settings && !switchesInitialized.current) {
      setNotifEnabled(session.user.settings.notificaciones === "true");
      setSubsEnabled(session.user.settings.subscripcion === "true");
      setEmailValidated(session.user.settings.emailValidated === "true");
      switchesInitialized.current = true;
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status !== "loading") setInitialLoading(false);
  }, [status]);

  // SWR para estadísticas del museo
  const {
    data: salasData,
    isLoading: salasLoading,
    error: salasError,
  } = useSWR("/api/salas", fetcher);
  const {
    data: muralesData,
    isLoading: muralesLoading,
    error: muralesError,
  } = useSWR("/api/murales", fetcher);

  useEffect(() => {
    if (salasData && muralesData && salasData.salas && muralesData.murales) {
      const salas = salasData.salas || [];
      const murales = muralesData.murales || [];

      // Debug: Log de datos cargados
      console.log("📊 Datos cargados:", {
        salas: salas.length,
        murales: murales.length,
        primerMural: murales[0],
        muralesConImagen: murales.filter((m) => m.url_imagen || m.imagenUrl)
          .length,
      });

      const uniqueArtists = new Set(murales.map((m) => m.autor).filter(Boolean))
        .size;
      const uniqueTechniques = new Set(
        murales.map((m) => m.tecnica).filter(Boolean)
      ).size;
      setMuseumStats({
        totalArtworks: murales.length,
        totalSalas: salas.length,
        totalArtists: uniqueArtists,
        totalTechniques: uniqueTechniques,
        salas: salas.slice(0, 4),
      });
      setMuralesStats(muralesData.estadisticas);
      setMurales(murales);
      setIsLoadingStats(false);
    } else if (salasError || muralesError) {
      console.error("❌ Error cargando datos:", { salasError, muralesError });
      setMuseumStats({
        totalArtworks: 0,
        totalSalas: 0,
        totalArtists: 0,
        totalTechniques: 0,
        salas: [],
      });
      setMuralesStats({ total: 0, porSala: {}, porTecnica: {}, porAnio: {} });
      setMurales([]);
      setIsLoadingStats(false);
    } else if (salasLoading || muralesLoading) {
      setIsLoadingStats(true);
    }
  }, [
    salasData,
    muralesData,
    salasLoading,
    muralesLoading,
    salasError,
    muralesError,
  ]);

  // Debug: Monitor changes in museumStats
  useEffect(() => {
    console.log("museumStats updated:", museumStats);
  }, [museumStats]);

  // Cargar colección personal
  useEffect(() => {
    if (status !== "loading" && userId) {
      const collection = getPersonalCollection(userId);
      const stats = getCollectionStats(userId);
      setPersonalCollection(collection);
      setCollectionStats(stats);
    }
  }, [userId, status]);

  // Simulación de validación de nombre (reemplazar con API real)
  async function checkNameAvailability(name) {
    setCheckingName(true);
    try {
      const res = await fetch(`/api/usuarios?name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json();
        setNameAvailable(data.available);
      } else {
        setNameAvailable(null);
      }
    } catch (e) {
      setNameAvailable(null);
    }
    setCheckingName(false);
  }

  function handleNameChange(e) {
    const value = e.target.value;
    setNewName(value);
    setNameAvailable(null);
    if (value.length > 2) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const valueToCheck = value;
      debounceRef.current = setTimeout(() => {
        setCheckingName(true);
        checkNameAvailability(valueToCheck);
      }, 1200);
    } else {
      setNameAvailable(null);
      setCheckingName(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target.result);
      reader.readAsDataURL(file);
      setNewImage(file);
    }
  }

  async function handleSave() {
    if (!session?.user?.id) {
      toast.error("Error: No se pudo identificar al usuario");
      nameInputRef.current?.focus();
      return;
    }

    if (newName.length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      nameInputRef.current?.focus();
      return;
    }

    if (nameAvailable === false) {
      toast.error("El nombre no está disponible, elige otro");
      nameInputRef.current?.focus();
      return;
    }

    setUpdating(true);
    await toast.promise(
      updateProfile({
        name: newName,
        image: imagePreview,
      }),
      {
        loading: "Guardando perfil...",
        success: "Perfil actualizado correctamente",
        error: "Error al actualizar el perfil",
      }
    );
    // Forzar recarga del perfil en el contexto global y esperar a que termine
    if (typeof loadUserProfile === "function" && session?.user?.email) {
      await loadUserProfile(session.user.email);
    }
    setEditMode(false);
    setUpdating(false);
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    setDeleteLoading(true);
    // Simulación: en real, llamar a API para eliminar cuenta
    setTimeout(() => {
      if (deleteEmail !== session?.user?.email) {
        setDeleteError("El email no coincide");
        toast.error("El email no coincide");
        setDeleteLoading(false);
        return;
      }
      setDeleteSuccess(true);
      setDeleteLoading(false);
      toast.success("Cuenta eliminada correctamente");
      // Aquí iría signOut y redirección
    }, 1200);
  }

  async function handleSettingsChange(newSettings) {
    if (!session?.user?.id) return;
    try {
      const response = await fetch(
        `/api/usuarios/${session.user.id}?t=${Date.now()}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ settings: newSettings }),
        }
      );

      if (response.ok) {
        // Actualizar la sesión
        if (typeof update === "function") {
          await update();
        }

        // Actualizar el UserProvider
        if (typeof loadUserProfile === "function" && session.user.email) {
          await loadUserProfile(session.user.email);
        }

        toast.success("Configuración actualizada");
      } else {
        console.error("Error updating settings");
        toast.error("Error al actualizar configuración");
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Error al actualizar configuración");
    }
  }

  const onNotifChange = async (checked, e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setNotifEnabled(checked);
    try {
      await handleSettingsChange({
        ...session.user.settings,
        notificaciones: checked ? "true" : "false",
        subscripcion: subsEnabled ? "true" : "false",
        emailValidated: emailValidated ? "true" : "false",
      });
      toast.success(`Notificaciones ${checked ? "activadas" : "desactivadas"}`);
    } catch (error) {
      toast.error("Error al cambiar configuración de notificaciones");
    }
  };

  const onSubsChange = async (checked, e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    setSubsEnabled(checked);
    try {
      await handleSettingsChange({
        ...session.user.settings,
        notificaciones: notifEnabled ? "true" : "false",
        subscripcion: checked ? "true" : "false",
        emailValidated: emailValidated ? "true" : "false",
      });
      toast.success(`Suscripción ${checked ? "activada" : "desactivada"}`);
    } catch (error) {
      toast.error("Error al cambiar configuración de suscripción");
    }
  };

  // Simulación de verificación de email
  const handleVerifyEmail = async () => {
    setVerifLoading(true);
    setVerifMsg("");
    // Simula un proceso de verificación
    setTimeout(async () => {
      setEmailValidated(true);
      await handleSettingsChange({
        ...session.user.settings,
        notificaciones: notifEnabled ? "true" : "false",
        subscripcion: subsEnabled ? "true" : "false",
        emailValidated: "true",
      });
      setVerifMsg("¡Email verificado!");
      toast.success("¡Email verificado correctamente!");
      setVerifLoading(false);
    }, 1200);
  };

  const handleEditProfile = () => {
    setNewName(session?.user?.name || "");
    setEditMode(true);
  };

  const handleUpdateSetting = async (key, value) => {
    const success = await updateUserSetting(key, value);
    if (success) {
      toast.success(`Configuración "${key}" actualizada`);
    } else {
      toast.error(`Error al actualizar configuración "${key}"`);
    }
  };

  // Cargar información de Account
  useEffect(() => {
    if (userId) {
      fetch(`/api/usuarios/${userId}/account`)
        .then((res) => res.json())
        .then((data) => {
          setAccountInfo(data);
        })
        .catch((error) => {
          console.error("Error cargando información de cuenta:", error);
        });
    }
  }, [userId]);

  // Sincronizar todos los estados cuando la sesión cambie
  useEffect(() => {
    if (session?.user && !editMode) {
      setNewName(session.user.name || "");
      setNewImage(session.user.image || "");
      setImagePreview(session.user.image || "");
      setNameAvailable(null);
      setCheckingName(false);
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.image, editMode]);

  // Forzar el foco al input cuando termina la comprobación de nombre
  useEffect(() => {
    if (!checkingName && editMode) {
      nameInputRef.current?.focus();
    }
  }, [checkingName, editMode]);

  // Para cada card principal, aplica el efecto mouse glow
  const statsGlow = useCardMouseGlow();
  const collectionGlow = useCardMouseGlow();
  const sessionGlow = useCardMouseGlow();
  const profileGlow = useCardMouseGlow();

  if (initialLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <RainbowBackground />
        <div className="z-10 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <RainbowBackground />
        <Card className="z-10 max-w-md w-full p-8 text-center">
          <CardTitle className="mb-4">Acceso requerido</CardTitle>
          <p className="text-muted-foreground mb-6">
            Debes iniciar sesión para ver tu perfil y colección personal.
          </p>
          <Button onClick={() => (window.location.href = "/")}>
            Ir al inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="relative min-h-screen pt-8 md:pt-12 pb-8 md:pb-12">
        <div className="absolute inset-0 z-0">
          <RainbowBackground />
        </div>
        <div className="z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8 px-4 sm:px-8">
          {/* Sidebar Perfil */}
          <div className="md:col-span-1 flex flex-col md:max-w-md mx-auto w-full">
            <div
              className="card-mouse-glow w-full"
              onMouseMove={profileGlow.handleMouseMove}
              onMouseLeave={profileGlow.handleMouseLeave}
            >
              <div ref={profileGlow.blobRef} className="card-blob" />
              <Card className="w-full p-4 md:p-6 text-center shadow-xl min-h-[400px] flex flex-col justify-start bg-transparent shadow-none border-0">
                <CardHeader className="flex flex-col items-center gap-2 border-b pb-4">
                  {editMode ? (
                    <PerfilAvatarEdit
                      imagePreview={imagePreview}
                      newName={newName}
                      handleImageChange={handleImageChange}
                      handleNameChange={handleNameChange}
                      checkingName={checkingName}
                      nameAvailable={nameAvailable}
                      updating={updating}
                      setEditMode={setEditMode}
                      handleSave={handleSave}
                      fileInputRef={fileInputRef}
                      nameInputRef={nameInputRef}
                    />
                  ) : (
                    <PerfilAvatarView
                      image={session?.user?.image}
                      name={session?.user?.name}
                      onEdit={handleEditProfile}
                    />
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-4 mt-4">
                  {/* Info de perfil */}
                  <div className="w-full text-left mb-6">
                    <div className="text-left">
                      <Label>Email</Label>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        {session?.user?.email || "No disponible"}
                        {emailValidated ? (
                          <Badge variant="success">Verificado</Badge>
                        ) : (
                          <a
                            href="#"
                            className="text-primary underline text-xs font-medium hover:text-primary/80 transition"
                            onClick={(e) => {
                              e.preventDefault();
                              handleVerifyEmail();
                            }}
                            disabled={verifLoading}
                          >
                            {verifLoading
                              ? "Verificando..."
                              : "Verificar email"}
                          </a>
                        )}
                      </div>
                      {verifMsg && (
                        <div className="text-xs text-green-600 mt-1">
                          {verifMsg}
                        </div>
                      )}
                    </div>
                    <div className="text-left mt-2">
                      <Label>ID de usuario</Label>
                      <div className="text-xs font-mono text-muted-foreground mt-1">
                        {userId || "No disponible"}
                      </div>
                    </div>
                    <div className="text-left mt-4">
                      <Label>Notificaciones</Label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                        <Switch
                          checked={notifEnabled}
                          onCheckedChange={(checked, e) =>
                            onNotifChange(checked, e)
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {notifEnabled ? "Activadas" : "Desactivadas"}
                        </span>
                      </div>
                    </div>
                    <div className="text-left mt-2">
                      <Label>Suscripción</Label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                        <Switch
                          checked={subsEnabled}
                          onCheckedChange={(checked, e) =>
                            onSubsChange(checked, e)
                          }
                        />
                        <span className="text-xs text-muted-foreground">
                          {subsEnabled ? "Activa" : "Inactiva"}
                        </span>
                      </div>
                    </div>
                    <div className="text-left mt-2">
                      <Label>Email verificado</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Switch checked={emailValidated} disabled />
                        {emailValidated ? (
                          <Badge variant="success">Verificado</Badge>
                        ) : (
                          <a
                            href="#"
                            className="text-primary underline text-xs font-medium hover:text-primary/80 transition"
                            onClick={(e) => {
                              e.preventDefault();
                              handleVerifyEmail();
                            }}
                            disabled={verifLoading}
                          >
                            {verifLoading
                              ? "Verificando..."
                              : "Verificar email"}
                          </a>
                        )}
                      </div>
                      {verifMsg && (
                        <div className="text-xs text-green-600 mt-1">
                          {verifMsg}
                        </div>
                      )}
                    </div>
                    <div className="text-left mt-4">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full"
                        onClick={() => setShowDelete((v) => !v)}
                      >
                        Eliminar cuenta
                      </Button>
                    </div>
                  </div>
                  <div className="my-2 border-t border-muted-foreground/10 dark:border-neutral-800" />
                  {/* Mensaje de proveedor */}
                  <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                    La información se obtiene de tu proveedor de autenticación.
                    <br />
                    Para cambios, contacta al administrador.
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          {/* Main content: Estadísticas y Colección */}
          <div className="md:col-span-1 flex flex-col gap-8 w-full">
            {/* Estadísticas del museo */}
            <div
              className="card-mouse-glow w-full mb-4"
              onMouseMove={statsGlow.handleMouseMove}
              onMouseLeave={statsGlow.handleMouseLeave}
            >
              <div ref={statsGlow.blobRef} className="card-blob" />
              <Card className="w-full p-8 bg-transparent shadow-none border-0">
                <CardHeader className="mb-4">
                  <CardTitle className="text-lg font-semibold">
                    Estadísticas del museo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="text-center text-muted-foreground">
                      Cargando estadísticas...
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-wrap gap-4 justify-center">
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-1">
                            <SalaIcon className="w-8 h-8 text-blue-500" />
                            <span className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                              {museumStats.totalSalas}
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 text-xs font-semibold border border-blue-200 dark:border-blue-700 shadow-sm">
                            Salas
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-1">
                            <MuralIcon className="w-8 h-8 text-indigo-500" />
                            <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                              {museumStats.totalArtworks}
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 text-xs font-semibold border border-indigo-200 dark:border-indigo-700 shadow-sm">
                            Murales
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-1">
                            <ArtistaIcon className="w-8 h-8 text-rose-500" />
                            <span className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                              {museumStats.totalArtists}
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-200 text-xs font-semibold border border-rose-200 dark:border-rose-700 shadow-sm">
                            Artistas
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-1">
                            <TecnicaIcon className="w-8 h-8 text-green-500" />
                            <span className="text-2xl font-bold text-green-700 dark:text-green-300">
                              {museumStats.totalTechniques}
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-200 text-xs font-semibold border border-green-200 dark:border-green-700 shadow-sm">
                            Técnicas
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-2">
                          Técnicas más usadas
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(muralesStats.porTecnica || {})
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([tecnica, count], i) => (
                              <TagWithPreview
                                key={tecnica}
                                label={`${tecnica} (${count})`}
                                variant={
                                  i === 0
                                    ? "blue"
                                    : i === 1
                                    ? "green"
                                    : "violet"
                                }
                                images={murales.filter(
                                  (m) =>
                                    m.tecnica === tecnica &&
                                    (m.url_imagen || m.imagenUrl)
                                )}
                              />
                            ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-2">
                          Murales por año (últimos 5)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(muralesStats.porAnio || {})
                            .sort((a, b) => b[0] - a[0])
                            .slice(0, 5)
                            .map(([anio, count], i) => (
                              <TagWithPreview
                                key={anio}
                                label={`${anio}: ${count}`}
                                variant={i % 2 === 0 ? "yellow" : "pink"}
                                images={murales.filter(
                                  (m) =>
                                    String(m.anio) === String(anio) &&
                                    (m.url_imagen || m.imagenUrl)
                                )}
                              />
                            ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-2">
                          Salas con más murales
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(muralesStats.porSala || {})
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([sala, count], i) => (
                              <TagWithPreview
                                key={sala}
                                label={`${sala}: ${count}`}
                                variant={
                                  i === 0
                                    ? "violet"
                                    : i === 1
                                    ? "blue"
                                    : "green"
                                }
                                images={murales.filter(
                                  (m) =>
                                    (m.sala?.nombre || "Sin sala") === sala &&
                                    (m.url_imagen || m.imagenUrl)
                                )}
                              />
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Mi colección personal */}
            <div
              className="card-mouse-glow w-full"
              onMouseMove={collectionGlow.handleMouseMove}
              onMouseLeave={collectionGlow.handleMouseLeave}
            >
              <div ref={collectionGlow.blobRef} className="card-blob" />
              <Card className="w-full p-8 bg-transparent shadow-none border-0">
                <CardHeader className="mb-4">
                  <CardTitle className="text-lg font-semibold">
                    Mi colección personal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {personalCollection.length === 0 ? (
                    <div className="text-center text-muted-foreground">
                      No tienes obras guardadas en tu colección.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <MuralIcon className="w-10 h-10 text-indigo-500" />
                            <span className="text-2xl font-bold">
                              {collectionStats.totalArtworks}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Obras
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <ArtistaIcon className="w-10 h-10 text-rose-500" />
                            <span className="text-2xl font-bold">
                              {collectionStats.uniqueArtists}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Artistas
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <TecnicaIcon className="w-10 h-10 text-green-500" />
                            <span className="text-2xl font-bold">
                              {collectionStats.uniqueTechniques}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Técnicas
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <svg
                              className="w-10 h-10 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M8 17l4 4 4-4m-4-5v9" />
                            </svg>
                            <span className="text-2xl font-bold">
                              {collectionStats.oldestYear || "-"}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Año más antiguo
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium mb-2">Obras guardadas</div>
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                          {personalCollection.map((item) => (
                            <CollectionItem
                              key={item.id}
                              item={item}
                              allItems={personalCollection}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <Button asChild>
                          <Link href="/mis-documentos">
                            Gestionar colección avanzada
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            {/* Estadísticas de Sesión */}
            <div
              className="card-mouse-glow w-full"
              onMouseMove={sessionGlow.handleMouseMove}
              onMouseLeave={sessionGlow.handleMouseLeave}
            >
              <div ref={sessionGlow.blobRef} className="card-blob" />
              <Card className="w-full p-8 bg-transparent shadow-none border-0">
                <CardHeader className="mb-4">
                  <CardTitle className="text-lg font-semibold">
                    Estadísticas de Sesión
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Rol principal:
                      </span>
                      <span className="font-medium">{getUserRole()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Es administrador:
                      </span>
                      <span
                        className={
                          isAdmin
                            ? "text-green-600 dark:text-green-400 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {isAdmin ? "Sí" : "No"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Es moderador:
                      </span>
                      <span
                        className={
                          isModerator
                            ? "text-yellow-600 dark:text-yellow-400 font-medium"
                            : "text-muted-foreground"
                        }
                      >
                        {isModerator ? "Sí" : "No"}
                      </span>
                    </div>

                    {/* Información de la sesión */}
                    {sessionData && (
                      <>
                        <div className="pt-3 border-t border-border">
                          <h4 className="text-sm font-medium mb-2">
                            Información de Sesión
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">
                                Proveedor:
                              </span>
                              <span className="text-sm font-medium">
                                {accountInfo?.primaryProvider ||
                                  sessionData.user?.provider ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">
                                Tipo:
                              </span>
                              <span className="text-sm font-medium">
                                {accountInfo?.accountType ||
                                  sessionData.user?.accountType ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">
                                Duración:
                              </span>
                              <span
                                className={`text-sm font-medium ${
                                  isSessionExpiringSoon
                                    ? "text-yellow-600 dark:text-yellow-400"
                                    : isSessionExpired
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-green-600 dark:text-green-400"
                                }`}
                              >
                                {sessionDuration}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground text-sm">
                                Tiempo restante:
                              </span>
                              <span className="text-sm font-medium">
                                {sessionTimeRemaining} min
                              </span>
                            </div>
                            {lastActivity && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">
                                  Última actividad:
                                </span>
                                <span className="text-sm font-medium">
                                  {new Date(lastActivity).toLocaleTimeString(
                                    "es-ES"
                                  )}
                                </span>
                              </div>
                            )}
                            {accountInfo?.expiresAt && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground text-sm">
                                  Expira:
                                </span>
                                <span className="text-sm font-medium">
                                  {new Date(
                                    accountInfo.expiresAt
                                  ).toLocaleString("es-ES")}
                                </span>
                              </div>
                            )}
                            {isSessionExpiringSoon && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg">
                                <p className="text-xs text-yellow-800 dark:text-yellow-200">
                                  ⚠️ Tu sesión expirará pronto. Considera
                                  renovarla.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ModalWrapper
        modalName="admin-panel-modal"
        title="Panel de Administración"
        size="md"
      >
        {(data) => (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-4">👑</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Panel de Administración
              </h3>
              <p className="text-gray-600 mb-4">
                Acceso a funciones administrativas y de moderación
              </p>
            </div>

            <div className="space-y-3">
              {data?.isAdmin && (
                <button
                  onClick={() => (window.location.href = "/admin/usuarios")}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  👥 Gestionar Usuarios
                </button>
              )}
              {(data?.isAdmin || data?.isModerator) && (
                <button
                  onClick={() => (window.location.href = "/admin/contenido")}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  📝 Moderar Contenido
                </button>
              )}
              {data?.isAdmin && (
                <button
                  onClick={() =>
                    (window.location.href = "/admin/configuracion")
                  }
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ⚙️ Configuración del Sistema
                </button>
              )}
            </div>
          </div>
        )}
      </ModalWrapper>
    </>
  );
}

export default function Perfil() {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen w-full">
        {/* Fondo de blobs animados como el footer */}
        <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-300 dark:bg-blue-700 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob"></div>
          <div className="absolute -top-20 -right-24 w-96 h-96 bg-purple-200 dark:bg-purple-800 rounded-full mix-blend-multiply filter blur-2xl opacity-60 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative z-10">
          <PerfilContent />
        </div>
      </div>
    </ProtectedRoute>
  );
}
