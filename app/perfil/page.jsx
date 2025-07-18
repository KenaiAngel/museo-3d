"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useCollection } from "../../providers/CollectionProvider";
import ProtectedRoute from "../../components/ProtectedRoute";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import RainbowBackground from "./RainbowBackground";
import MuralIcon from "@/components/ui/icons/MuralIcon";
import SalaIcon from "@/components/ui/icons/SalaIcon";
import ArtistaIcon from "@/components/ui/icons/ArtistaIcon";
import TecnicaIcon from "@/components/ui/icons/TecnicaIcon";
import ReactDOM from "react-dom";
import React from "react";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import useSWR from "swr";
import { useUser } from "../../providers/UserProvider";
import toast from "react-hot-toast";
import { GalleryHorizontal as GalleryIcon } from "lucide-react";
import { usePushNotifications } from "../components/PushNotificationsProvider";

const fetcher = (url) => fetch(url).then((res) => res.json());

// Helper function to parse authors/artists
function parseAutores(artist) {
  if (!artist || typeof artist !== "string") return [];
  return artist
    .split(",")
    .map((a) => a.trim())
    .filter((a) => a.length > 0);
}

// Hook simple para el efecto mouse glow
const useCardMouseGlow = () => {
  const blobRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!blobRef.current) return;
    const { left, top } = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    blobRef.current.style.left = `${x}px`;
    blobRef.current.style.top = `${y}px`;
  };

  const handleMouseLeave = () => {
    if (!blobRef.current) return;
    blobRef.current.style.left = "-100px";
    blobRef.current.style.top = "-100px";
  };

  return { blobRef, handleMouseMove, handleMouseLeave };
};

// Hook simple para datos de sesión
const useSessionData = () => {
  return {
    session: null,
    sessionDuration: 0,
    sessionTimeRemaining: 0,
    isSessionExpiringSoon: false,
    isSessionExpired: false,
    lastActivity: new Date(),
  };
};

// Hook simple para modal
const useModal = () => {
  return {
    openModal: () => {},
  };
};

// Componente simple PageLoader
const PageLoader = ({ text }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    <p className="mt-4 text-muted-foreground">{text}</p>
  </div>
);

// Componente simple ModalWrapper
const ModalWrapper = ({ children, modalName, title, size }) => {
  return null; // Por ahora no mostrar modales
};

// --- Lógica de posicionamiento de Tooltip robusta y simplificada ---
function calculateTooltipPosition(
  anchorRect,
  tooltipWidth,
  tooltipHeight,
  preferredPosition = "top"
) {
  const padding = 8;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Calcular la mejor posición 'left' relativa al viewport
  let left = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2;
  if (left < padding) left = padding;
  if (left + tooltipWidth > viewportWidth - padding) {
    left = viewportWidth - tooltipWidth - padding;
  }

  // Calcular posiciones 'top' relativas al viewport (arriba y abajo del ancla)
  const posAbove = anchorRect.top - tooltipHeight - padding;
  const posBelow = anchorRect.bottom + padding;

  let top;
  // Decidir si se coloca arriba o abajo
  if (preferredPosition === "top") {
    // Se prefiere arriba, pero se coloca abajo si no hay espacio
    if (posAbove > padding) {
      top = posAbove;
    } else {
      top = posBelow;
    }
  } else {
    // Se prefiere abajo, pero se coloca arriba si no hay espacio
    if (posBelow + tooltipHeight < viewportHeight - padding) {
      top = posBelow;
    } else {
      top = posAbove;
    }
  }

  // Convertir a coordenadas absolutas del documento para `position: absolute`
  return {
    top: top + window.scrollY,
    left: left + window.scrollX,
  };
}

function ImageTooltip({ src, alt, anchorRef, show }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipWidth = 260;
  const tooltipHeight = 260;

  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const newPos = calculateTooltipPosition(
        rect,
        tooltipWidth,
        tooltipHeight,
        "bottom"
      );
      setPos(newPos);
    }
  }, [show, anchorRef]);

  if (!show) return null;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "absolute",
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
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-56 h-56 object-contain rounded-lg"
        />
      ) : (
        <div className="w-56 h-56 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl text-gray-400 dark:text-gray-600 mb-4">
              👤
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Vista previa de imagen
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Selecciona una imagen para ver la vista previa
            </p>
          </div>
        </div>
      )}
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
}

function CollectionItem({ item, allItems }) {
  const imgRef = React.useRef(null);
  const [hovered, setHovered] = React.useState(false);
  // Usar los campos reales del modelo Mural
  const imageUrl = item.url_imagen || item.imagenUrl;
  const title = item.titulo || item.title;
  const artist = item.autor || item.artist || (item.artistName ?? "");
  const year = item.anio || item.year;
  const technique = item.tecnica || item.technique;
  const autores = parseAutores(artist);
  return (
    <div className="flex items-center gap-4 border-b py-2 relative group">
      {imageUrl && (
        <>
          <img
            ref={imgRef}
            src={imageUrl}
            alt={title}
            className="w-12 h-12 object-cover rounded-md cursor-pointer group-hover:ring-2 group-hover:ring-primary transition ml-2"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          />
          <ImageTooltip
            src={imageUrl}
            alt={title}
            anchorRef={imgRef}
            show={hovered}
          />
        </>
      )}
      <div className="flex-1 text-left">
        <div className="font-medium">{title}</div>
        <div className="flex flex-wrap gap-1 mb-1">
          {autores.length > 0 ? (
            autores.map((autor, idx) => (
              <span
                key={idx}
                className="inline-block bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-200 px-2 py-0.5 rounded-full text-xs font-semibold"
              >
                {autor}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground">Artista desconocido</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          {year ? ` · ${year}` : ""}
          {technique ? ` · ${technique}` : ""}
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
      const newPos = calculateTooltipPosition(
        rect,
        tooltipWidth,
        tooltipHeight
      );
      setPos(newPos);
    }
  }, [show, anchorRef]);

  if (!show || images.length === 0) return null;
  const maxPreview = 5;
  const previewImages = images.slice(0, maxPreview);
  const extra = images.length - maxPreview;
  return ReactDOM.createPortal(
    <div
      style={{
        position: "absolute",
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

function PerfilAvatarTooltip({ src, alt, anchorRef, show }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const tooltipWidth = 260;
  const tooltipHeight = 260;

  useEffect(() => {
    if (show && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const newPos = calculateTooltipPosition(
        rect,
        tooltipWidth,
        tooltipHeight
      );
      setPos(newPos);
    }
  }, [show, anchorRef]);

  if (!show) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: "absolute",
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
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-56 h-56 object-contain rounded-lg"
        />
      ) : (
        <div className="w-56 h-56 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl text-gray-400 dark:text-gray-600 mb-4">
              👤
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Sin foto de perfil
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
              Haz clic en "Editar perfil" para agregar una imagen
            </p>
          </div>
        </div>
      )}
    </div>,
    typeof window !== "undefined" ? document.body : null
  );
}

function PerfilAvatarEdit({
  imagePreview,
  newName,
  newImage,
  originalName,
  originalImage,
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
  const nameChanged = newName !== originalName;
  // Para detectar cambio de imagen, verificamos si hay un archivo nuevo
  const imageChanged = newImage && newImage !== originalImage;
  const hasChanges = nameChanged || imageChanged;

  // Si cambió el nombre, debe estar disponible; si no cambió, no importa
  const nameIsValid = nameChanged ? nameAvailable === true : true;

  // Si solo cambió la imagen (sin cambiar nombre), no necesita validar disponibilidad
  const onlyImageChanged = imageChanged && !nameChanged;

  const canSave =
    !updating &&
    hasChanges &&
    newName.length >= 3 &&
    (onlyImageChanged || nameIsValid) &&
    !checkingName;

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
          <PerfilAvatarTooltip
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

      {/* Mensaje de estado del guardado */}
      {!hasChanges && (
        <div className="text-xs text-muted-foreground">
          Realiza cambios para poder guardar
        </div>
      )}
      {hasChanges && onlyImageChanged && (
        <div className="text-xs text-green-600">
          ¡Imagen actualizada! Puedes guardar los cambios
        </div>
      )}
      {hasChanges && nameChanged && nameAvailable === false && (
        <div className="text-xs text-red-500">El nombre no está disponible</div>
      )}
      {hasChanges && nameChanged && checkingName && (
        <div className="text-xs text-yellow-600">Verificando nombre...</div>
      )}
      {hasChanges && nameChanged && nameAvailable === true && (
        <div className="text-xs text-green-600">
          ¡Cambios listos para guardar!
        </div>
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
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!canSave}
          title={
            !hasChanges
              ? "Realiza cambios para guardar"
              : onlyImageChanged
                ? "Guardar nueva imagen de perfil"
                : nameChanged && nameAvailable === false
                  ? "El nombre no está disponible"
                  : nameChanged && checkingName
                    ? "Verificando disponibilidad del nombre"
                    : newName.length < 3
                      ? "El nombre debe tener al menos 3 caracteres"
                      : hasChanges && nameIsValid
                        ? "Guardar cambios de perfil"
                        : ""
          }
        >
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
        <PerfilAvatarTooltip
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
  const { collection, loading: collectionLoading } = useCollection();
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
    updateProfile = () => Promise.resolve(false),
    error: updateError,
    success: updateSuccess,
  } = useUpdateProfile() || {};
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [subsEnabled, setSubsEnabled] = useState(false);
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
    isAdmin = false,
    isModerator = false,
    getUserRole = () => "Usuario",
    getUserSetting = () => null,
    updateUserSetting = () => Promise.resolve(false),
    updateUserProfile = () => Promise.resolve(false),
    loadUserProfile = () => Promise.resolve(),
    isLoadingProfile,
  } = useUser() || {};
  const {
    session: sessionData,
    sessionDuration,
    sessionTimeRemaining,
    isSessionExpiringSoon,
    isSessionExpired,
    lastActivity,
  } = useSessionData() || {};
  const { openModal } = useModal() || {};
  const nameInputRef = useRef(null);

  // --- NUEVO: Estado real de suscripción ---
  const {
    subscribed: realSubscribed,
    loading: subLoading,
    error: subError,
    refetch: refetchSub,
  } = useSubscriptionStatus("all");

  // Sincronizar el toggle con el estado real de la suscripción
  useEffect(() => {
    if (subLoading) return;
    setSubsEnabled(!!realSubscribed);
  }, [realSubscribed, subLoading]);

  const userId = session?.user?.id || null;

  useEffect(() => {
    if (session?.user?.settings && !switchesInitialized.current) {
      setNotifEnabled(session.user.settings.notificaciones === "true");
      // Solo permitir suscripción si el email está verificado
      const subsFromSettings = session.user.settings.subscripcion === "true";
      setSubsEnabled(subsFromSettings && session.user.emailVerified);
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
      reader.onload = (ev) => {
        setImagePreview(ev.target.result);
      };
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
    try {
      await toast.promise(
        updateProfile({
          name: newName,
          image: newImage, // Enviar el archivo real, no la preview
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

      // Limpiar el estado después de guardar exitosamente
      setNewImage(null);
      setImagePreview(session?.user?.image || "");
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setUpdating(false);
    }
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
      });
      toast.success(`Notificaciones ${checked ? "activadas" : "desactivadas"}`);
    } catch (error) {
      toast.error("Error al cambiar configuración de notificaciones");
    }
  };

  const onSubsChange = async (checked, e) => {
    if (e && typeof e.preventDefault === "function") e.preventDefault();
    if (subLoading) return;

    // Verificar que el email esté verificado antes de permitir suscripción
    if (checked && !session?.user?.emailVerified) {
      toast.error("Debes verificar tu email antes de activar la suscripción");
      return;
    }

    setSubsEnabled(checked);
    try {
      if (checked) {
        // Suscribir
        const res = await fetch("/api/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "all" }),
        });
        if (!res.ok) throw new Error("No se pudo suscribir");
      } else {
        // Desuscribir
        const res = await fetch("/api/subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "all" }),
        });
        if (!res.ok) throw new Error("No se pudo desuscribir");
      }
      await handleSettingsChange({
        ...session.user.settings,
        notificaciones: notifEnabled ? "true" : "false",
        subscripcion: checked ? "true" : "false",
      });
      await refetchSub(); // Refrescar estado real
      toast.success(`Suscripción ${checked ? "activada" : "desactivada"}`);
    } catch (error) {
      toast.error("Error al cambiar suscripción global");
      setSubsEnabled(!checked); // revertir visual si falla
      await refetchSub();
    }
  };

  // Reemplaza la función handleVerifyEmail para llamar al endpoint real
  const handleVerifyEmail = async () => {
    setVerifLoading(true);
    setVerifMsg("");
    try {
      const res = await fetch("/api/usuarios/email/verify/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session?.user?.email }),
      });
      if (res.ok) {
        setVerifMsg(
          "¡Email de verificación enviado! Revisa tu bandeja de entrada."
        );
        toast.success("¡Email de verificación enviado!");
      } else {
        const data = await res.text();
        setVerifMsg("Error: " + data);
        toast.error("No se pudo enviar el email de verificación");
      }
    } catch (err) {
      setVerifMsg("Error al enviar email de verificación");
      toast.error("Error al enviar email de verificación");
    }
    setVerifLoading(false);
  };

  const handleEditProfile = () => {
    setNewName(session?.user?.name || "");
    setNewImage(null); // Limpiar archivo pendiente
    setImagePreview(session?.user?.image || ""); // Mostrar imagen actual
    setNameAvailable(null);
    setCheckingName(false);
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

  // Sincronizar nombre cuando la sesión cambie
  useEffect(() => {
    if (session?.user && !editMode) {
      setNewName(session.user.name || "");
      setNameAvailable(null);
      setCheckingName(false);
    }
  }, [session?.user?.id, session?.user?.name, editMode]);

  // Sincronizar imagen cuando la sesión cambie, pero solo si no hay archivo pendiente
  useEffect(() => {
    if (
      session?.user &&
      !editMode &&
      (!newImage || typeof newImage === "string")
    ) {
      setNewImage(session.user.image || "");
      setImagePreview(session.user.image || "");
    }
  }, [session?.user?.image, editMode]);

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

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    permission: pushPermission,
    subscribe: enablePush,
    unsubscribe: disablePush,
    loading: pushLoading,
  } = usePushNotifications();

  if (initialLoading) {
    return (
      <div className="relative min-h-screen flex items-center justify-center">
        <RainbowBackground />
        <PageLoader text="Cargando perfil..." />
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

  const emailVerified = userProfile?.emailVerified ?? session?.user?.emailVerified;

  return (
    <>
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0">
          <RainbowBackground />
        </div>
        <div className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[350px_1fr] gap-8 px-4 sm:px-8 pt-24 md:pt-28 pb-8 md:pb-12">
          {/* Sidebar Perfil */}
          <div className="md:col-span-1 flex flex-col md:max-w-md mx-auto w-full">
            <div
              className="card-mouse-glow w-full"
              onMouseMove={profileGlow.handleMouseMove}
              onMouseLeave={profileGlow.handleMouseLeave}
            >
              <div ref={profileGlow.blobRef} className="card-blob" />
              <Card className="w-full p-4 md:p-6 text-center min-h-[400px] flex flex-col justify-start">
                <CardHeader className="flex flex-col items-center gap-2 border-b pb-4">
                  {editMode ? (
                    <PerfilAvatarEdit
                      imagePreview={imagePreview}
                      newName={newName}
                      newImage={newImage}
                      originalName={session?.user?.name || ""}
                      originalImage={session?.user?.image || ""}
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
                        {!emailVerified && (
                          <button
                            onClick={handleVerifyEmail}
                            disabled={verifLoading}
                            className="text-primary hover:underline text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {verifLoading ? "Enviando..." : "(Verificar)"}
                          </button>
                        )}
                        {emailVerified && (
                          <span className="text-green-600 text-xs font-semibold ml-2">
                            (Verificado)
                          </span>
                        )}
                      </div>
                      {verifMsg && (
                        <div
                          className="text-xs mt-1"
                          style={{
                            color: verifMsg.startsWith("¡Email")
                              ? "#16a34a"
                              : "#dc2626",
                          }}
                        >
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
                          disabled={!session?.user?.emailVerified || subLoading}
                          onCheckedChange={(checked, e) => onSubsChange(checked, e)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {subLoading ? "Cargando..." : subsEnabled ? "Activa" : "Inactiva"}
                          {!session?.user?.emailVerified && " (Requiere email verificado)"}
                          {subError && <span className="text-red-500 ml-2">{subError}</span>}
                        </span>
                      </div>
                      {!session?.user?.emailVerified && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          ⚠️ Debes verificar tu email para activar las
                          suscripciones
                        </div>
                      )}
                    </div>
                    <div className="text-left mt-2">
                      <Label>Email verificado</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={emailVerified ? "success" : "destructive"}
                        >
                          {emailVerified ? "Sí" : "No"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-left mt-2">
                      <Label>Notificaciones Push</Label>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-1">
                        <Switch
                          checked={pushSubscribed}
                          disabled={!pushSupported || pushLoading}
                          onCheckedChange={checked => checked ? enablePush() : disablePush()}
                        />
                        <span className="text-xs text-muted-foreground">
                          {pushLoading ? "Cargando..." : pushSubscribed ? "Activas" : "Inactivas"}
                          {!pushSupported && " (No soportado en este navegador)"}
                          {pushPermission === "denied" && " (Bloqueadas en el navegador)"}
                        </span>
                      </div>
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
              <Card className="w-full p-8">
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
              <Card className="w-full p-8">
                <CardHeader className="mb-4">
                  <CardTitle className="text-lg font-semibold">
                    Mi colección personal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {collectionLoading ? (
                    <div className="text-center text-muted-foreground">
                      Cargando colección...
                    </div>
                  ) : collection.length === 0 ? (
                    <div className="flex flex-col items-center gap-4 text-center text-muted-foreground">
                      <div>No tienes obras guardadas en tu colección.</div>
                      <Button
                        asChild
                        variant="default"
                        size="lg"
                        className="shadow-lg transition-transform hover:scale-105 hover:shadow-xl gap-2"
                      >
                        <Link href="/galeria">
                          <GalleryIcon className="w-5 h-5" />
                          Explora la galería y empieza tu colección
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div>
                        <div className="font-medium mb-2">Obras guardadas</div>
                        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                          {collection.map((item) => (
                            <CollectionItem
                              key={item.id}
                              item={item}
                              allItems={collection}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-center mt-4">
                        <Button asChild>
                          <Link href="/mis-obras">
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
              <Card className="w-full p-8">
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

function parseColaboradores(colabString) {
  return colabString
    ? colabString
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];
}

// --- NUEVO: Hook para consultar el estado real de la suscripción desde el backend ---
function useSubscriptionStatus(type = "all") {
  const [subscribed, setSubscribed] = useState(null); // null = loading, true/false
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/subscription?type=${type}`);
      if (!res.ok) throw new Error("No se pudo consultar la suscripción");
      const data = await res.json();
      setSubscribed(!!data.subscribed);
    } catch (err) {
      setError(err.message);
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line
  }, [type]);

  return { subscribed, loading, error, refetch: fetchStatus };
}

export default function PerfilPage() {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden pt-20"> {/* pt-20 para dejar espacio a la navbar fija */}
        {/* Fondo arcoíris con blobs controlados */}
        <RainbowBackground />
        <div className="relative z-10">
          <PerfilContent />
        </div>
      </div>
    </ProtectedRoute>
  );
}
