"use client";
import { useState, useEffect } from "react";
import Stepper from "@/components/ui/Stepper";
import {
  CheckCircle,
  AlertCircle,
  Info,
  User,
  MapPin,
  Eye,
  Users,
  Image,
} from "lucide-react";
import MuralImageStep from "./MuralImageStep";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import React from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useState as useLocalState } from "react";
import { Icon } from "leaflet";
import { Brush } from "lucide-react";
import ReactSelect from "react-select";

const STEPS = [
  { label: "Datos básicos", subtitle: "Información principal", icon: <User /> },
  {
    label: "Imágenes y medios",
    subtitle: "Sube o crea tu imagen",
    icon: <Image />,
  },
  {
    label: "Ubicación y sala",
    subtitle: "Dónde está el mural",
    icon: <MapPin />,
  },
  { label: "Estado", subtitle: "Visibilidad y orden", icon: <Eye /> },
  { label: "Autores", subtitle: "Artistas y colaboradores", icon: <Users /> },
  { label: "Confirmar", subtitle: "Revisa y crea", icon: <CheckCircle /> },
];

export default function CrearMuralStepper() {
  const [step, setStep] = useState(0);
  // Estado global del mural
  const [mural, setMural] = useState({
    titulo: "",
    descripcion: "",
    tecnica: "",
    anio: undefined,
    dimensiones: "",
    tags: [],
    url_imagen: null,
    imagenesSecundarias: [],
    imagenUrlWebp: "",
    videoUrl: "",
    audioUrl: "",
    modelo3dUrl: "",
    ubicacion: "",
    latitud: "",
    longitud: "",
    salaId: "",
    exposiciones: [],
    estado: "",
    publica: true,
    destacada: false,
    orden: 0,
    autor: "",
    artistId: "",
    colaboradores: [],
    tagsInput: "",
  });
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    if (mural.anio === undefined) {
      setMural((prev) => ({ ...prev, anio: new Date().getFullYear() }));
    }
  }, [mural.anio]);

  // Validación simple por step
  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!mural.titulo) e.titulo = "El título es requerido";
      if (!mural.tecnica) e.tecnica = "La técnica es requerida";
      if (!mural.anio) e.anio = "El año es requerido";
    }
    if (step === 1) {
      if (!mural.url_imagen) e.url_imagen = "Selecciona o crea una imagen";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Handlers
  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);

  // Estilos inline para underline moderno
  const underlineInputClass =
    "block w-full bg-transparent border-0 border-b-2 border-gray-300 focus:border-indigo-600 transition-all duration-200 text-lg px-0 py-2 placeholder-gray-400 focus:outline-none";
  const labelClass =
    "block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200";
  const errorClass = "text-red-500 text-xs mt-1 block";

  // Generar años para el select
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1899 },
    (_, i) => currentYear - i
  );

  // Fix default marker icon for leaflet in React (otherwise no marker icon)
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  function LocationMarker({ lat, lng, setLatLng }) {
    useMapEvents({
      click(e) {
        setLatLng([e.latlng.lat, e.latlng.lng]);
      },
    });
    return lat && lng ? <Marker position={[lat, lng]} /> : null;
  }

  // Utilidad para generar SVG string de un icono Lucide
  function getLucideSvgUrl(iconName = "brush", color = "#4F46E5") {
    let svg = "";
    if (iconName === "brush") {
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-brush' viewBox='0 0 24 24'><path d='M9 7 17 15'/><path d='M12 20h9'/><path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5a2.121 2.121 0 1 1-3-3Z'/></svg>`;
    } else if (iconName === "image") {
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-image' viewBox='0 0 24 24'><rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-4.586-4.586a2 2 0 0 0-2.828 0L3 21'/></svg>`;
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  // Determinar estados de los steps para feedback visual
  const stepStates = STEPS.map((stepObj, i) => {
    if (i < step)
      return {
        ...stepObj,
        status: "success",
        icon: <CheckCircle className="text-green-600 mx-auto" />,
      };
    if (i === step && Object.keys(errors).length > 0)
      return {
        ...stepObj,
        status: "error",
        icon: <AlertCircle className="text-red-500 mx-auto" />,
      };
    return {
      ...stepObj,
      icon: React.cloneElement(stepObj.icon, { className: "mx-auto" }),
    };
  });

  // Render steps
  return (
    <div className="w-full max-w-3xl mx-auto bg-white/80 dark:bg-neutral-900/80 rounded-2xl shadow-xl border border-border p-0 md:p-8">
      <Stepper
        steps={stepStates}
        activeStep={step}
        color="indigo"
        className="mb-8"
        onStepClick={(i) => {
          if (i < step) setStep(i);
        }}
      />
      {/* Separador visual */}
      <div className="w-full flex items-center justify-center mb-10">
        <div className="w-full h-[2px] bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 dark:from-indigo-900 dark:via-indigo-700 dark:to-indigo-900 rounded-full shadow-md" />
      </div>
      {/* Formulario principal */}
      <div className="bg-white/90 dark:bg-neutral-900/90 rounded-xl px-4 md:px-10 py-8 flex flex-col gap-12 shadow-lg border border-indigo-100 dark:border-indigo-900">
        {/* Título del paso actual */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {STEPS[step].label}
          </h2>
        </div>
        {/* Geolocalización automática para el paso de ubicación */}
        {step === 2 && <GeolocateIfNeeded mural={mural} setMural={setMural} />}
        {step === 0 && (
          <div className="flex flex-col gap-10 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label htmlFor="titulo" className={labelClass}>
                  Título*
                </label>
                <input
                  id="titulo"
                  className="input-stepper"
                  value={mural.titulo}
                  onChange={(e) =>
                    setMural((m) => ({ ...m, titulo: e.target.value }))
                  }
                  aria-invalid={!!errors.titulo}
                  placeholder="Ej: Mural de la esperanza"
                  autoComplete="off"
                />
                {errors.titulo && (
                  <span className={errorClass}>{errors.titulo}</span>
                )}
              </div>
              <div>
                <label htmlFor="tecnica" className={labelClass}>
                  Técnica*
                </label>
                <input
                  id="tecnica"
                  className="input-stepper"
                  value={mural.tecnica}
                  onChange={(e) =>
                    setMural((m) => ({ ...m, tecnica: e.target.value }))
                  }
                  aria-invalid={!!errors.tecnica}
                  placeholder="Ej: Acrílico sobre muro"
                  autoComplete="off"
                />
                {errors.tecnica && (
                  <span className={errorClass}>{errors.tecnica}</span>
                )}
              </div>
              <div>
                <label htmlFor="anio" className={labelClass}>
                  Año*
                </label>
                <select
                  className="input-stepper"
                  value={String(mural.anio)}
                  onChange={(e) =>
                    setMural((m) => ({ ...m, anio: e.target.value }))
                  }
                >
                  <option value="">Selecciona el año</option>
                  {years.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
                {errors.anio && (
                  <span className={errorClass}>{errors.anio}</span>
                )}
              </div>
              <div>
                <label htmlFor="dimensiones" className={labelClass}>
                  Dimensiones
                </label>
                <input
                  id="dimensiones"
                  className="input-stepper"
                  value={mural.dimensiones}
                  onChange={(e) =>
                    setMural((m) => ({ ...m, dimensiones: e.target.value }))
                  }
                  placeholder="Ej: 3m x 5m"
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <label htmlFor="descripcion" className={labelClass}>
                Descripción
              </label>
              <textarea
                id="descripcion"
                className="input-stepper min-h-[80px] resize-y mt-1"
                value={mural.descripcion}
                onChange={(e) =>
                  setMural((m) => ({ ...m, descripcion: e.target.value }))
                }
                placeholder="Describe brevemente el mural, su inspiración, etc."
              />
            </div>
            <div>
              <label htmlFor="tags" className={labelClass}>
                Tags
              </label>
              <input
                id="tags"
                className="input-stepper"
                value={mural.tagsInput || ""}
                onChange={(e) =>
                  setMural((m) => ({ ...m, tagsInput: e.target.value }))
                }
                placeholder="Escribe un tag y presiona Enter o coma"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (["Enter", ","].includes(e.key)) {
                    e.preventDefault();
                    const val = mural.tagsInput?.trim();
                    if (val && !mural.tags.includes(val)) {
                      setMural((m) => ({
                        ...m,
                        tags: [...m.tags, val],
                        tagsInput: "",
                      }));
                    }
                  } else if (
                    e.key === "Backspace" &&
                    !mural.tagsInput &&
                    mural.tags.length > 0
                  ) {
                    setMural((m) => ({ ...m, tags: m.tags.slice(0, -1) }));
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {mural.tags.map((tag, i) => (
                  <Badge key={tag} variant="blue" className="pr-2 pl-3">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-blue-700 hover:text-red-500 focus:outline-none"
                      onClick={() =>
                        setMural((m) => ({
                          ...m,
                          tags: m.tags.filter((t, idx) => idx !== i),
                        }))
                      }
                      aria-label={`Eliminar tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Step 2: Imágenes y medios */}
        {step === 1 && (
          <MuralImageStep
            value={mural.url_imagen}
            onChange={(img) => setMural((m) => ({ ...m, url_imagen: img }))}
          />
        )}
        {/* Step 3: Ubicación y sala */}
        {step === 2 && <LocationPicker mural={mural} setMural={setMural} />}
        {/* Step 4: Estado y visibilidad */}
        {step === 3 && (
          <div className="flex flex-col gap-6 mb-8">
            <div>
              <label
                htmlFor="estado"
                className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
              >
                Estado
              </label>
              <select
                id="estado"
                className="input-stepper"
                value={mural.estado}
                onChange={(e) =>
                  setMural((m) => ({ ...m, estado: e.target.value }))
                }
              >
                <option value="">Selecciona un estado</option>
                <option value="Activo">Activo</option>
                <option value="En restauración">En restauración</option>
                <option value="Oculto">Oculto</option>
                <option value="Archivado">Archivado</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="publica"
                type="checkbox"
                checked={mural.publica}
                onChange={(e) =>
                  setMural((m) => ({ ...m, publica: e.target.checked }))
                }
                className="form-checkbox h-5 w-5 text-indigo-600 transition-all"
              />
              <label
                htmlFor="publica"
                className="text-base font-semibold text-gray-700 dark:text-gray-200 select-none cursor-pointer"
              >
                Pública
              </label>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="destacada"
                type="checkbox"
                checked={mural.destacada}
                onChange={(e) =>
                  setMural((m) => ({ ...m, destacada: e.target.checked }))
                }
                className="form-checkbox h-5 w-5 text-indigo-600 transition-all"
              />
              <label
                htmlFor="destacada"
                className="text-base font-semibold text-gray-700 dark:text-gray-200 select-none cursor-pointer"
              >
                Destacada
              </label>
            </div>
            <div>
              <label
                htmlFor="orden"
                className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
              >
                Orden
              </label>
              <input
                id="orden"
                className="input-stepper"
                type="number"
                value={mural.orden}
                onChange={(e) =>
                  setMural((m) => ({ ...m, orden: e.target.value }))
                }
                placeholder="Ejemplo: 1, 2, 3..."
                min={0}
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">
                Entre menor sea el número, más arriba aparecerá tu obra.
              </span>
            </div>
          </div>
        )}
        {/* Step 5: Autores y colaboradores */}
        {step === 4 && (
          <AutoresColaboradoresStep mural={mural} setMural={setMural} />
        )}
        {/* Step 6: Confirmación */}
        {step === 5 && (
          <div className="flex flex-col gap-10 mb-8">
            <pre className="bg-gray-100 dark:bg-neutral-800 rounded p-4 text-xs overflow-x-auto">
              {JSON.stringify(mural, null, 2)}
            </pre>
            <Button
              className="mt-4"
              onClick={() => alert("Crear mural (TODO)")}
            >
              Crear mural
            </Button>
          </div>
        )}
        {/* Navegación */}
        <div className="flex gap-2 justify-end mt-8">
          {step > 0 && (
            <Button variant="secondary" onClick={handleBack}>
              Atrás
            </Button>
          )}
          {step < STEPS.length - 1 && (
            <Button onClick={handleNext}>Siguiente</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Utilidad para reverse geocoding con Nominatim
async function fetchAddressFromLatLon(lat, lon) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
    );
    if (!res.ok) return "";
    const data = await res.json();
    return data.display_name || "";
  } catch {
    return "";
  }
}

// Utilidad para detectar dark mode
function isDarkMode() {
  if (typeof window !== "undefined") {
    return (
      document.documentElement.classList.contains("dark") ||
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
  return false;
}

// Componente auxiliar para geolocalización automática y reverse geocoding
function GeolocateIfNeeded({ mural, setMural }) {
  useEffect(() => {
    // Solo si no hay lat/lon ya seleccionadas
    if (!mural.latitud && !mural.longitud) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            let ubicacion = mural.ubicacion;
            if (!ubicacion) {
              ubicacion = await fetchAddressFromLatLon(lat, lon);
            }
            setMural((m) => ({ ...m, latitud: lat, longitud: lon, ubicacion }));
          },
          () => {
            // Si falla, no hacer nada (se usará el default CCU BUAP)
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    }
  }, [mural.latitud, mural.longitud, mural.ubicacion, setMural]);

  // Reverse geocoding cuando el usuario selecciona en el mapa
  useEffect(() => {
    if (mural.latitud && mural.longitud && !mural.ubicacion) {
      let ignore = false;
      fetchAddressFromLatLon(mural.latitud, mural.longitud).then((address) => {
        if (!ignore && address) {
          setMural((m) => ({ ...m, ubicacion: address }));
        }
      });
      return () => {
        ignore = true;
      };
    }
  }, [mural.latitud, mural.longitud, mural.ubicacion, setMural]);
  return null;
}

// Hook para cargar salas desde la API
function useSalas() {
  const [salas, setSalas] = useState([]);
  useEffect(() => {
    fetch("/api/salas")
      .then((res) => res.json())
      .then((data) => setSalas(data.salas || []))
      .catch(() => setSalas([]));
  }, []);
  return salas;
}

// Hook para cargar usuarios desde la API
function useUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  useEffect(() => {
    fetch("/api/usuarios")
      .then((res) => res.json())
      .then((data) => setUsuarios(data.usuarios || []))
      .catch(() => setUsuarios([]));
  }, []);
  return usuarios;
}

// Componente para seleccionar ubicación con pin draggable y confirmación
function LocationPicker({ mural, setMural }) {
  const salas = useSalas();
  // Utilidad para generar SVG string de un icono Lucide
  function getLucideSvgUrl(iconName = "brush", color = "#4F46E5") {
    let svg = "";
    if (iconName === "brush") {
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-brush' viewBox='0 0 24 24'><path d='M9 7 17 15'/><path d='M12 20h9'/><path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5a2.121 2.121 0 1 1-3-3Z'/></svg>`;
    } else if (iconName === "image") {
      svg = `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' fill='none' stroke='${color}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-image' viewBox='0 0 24 24'><rect width='18' height='18' x='3' y='3' rx='2'/><circle cx='9' cy='9' r='2'/><path d='m21 15-4.586-4.586a2 2 0 0 0-2.828 0L3 21'/></svg>`;
    }
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  const [tempLatLng, setTempLatLng] = useLocalState(() => [
    mural.latitud && !isNaN(Number(mural.latitud))
      ? Number(mural.latitud)
      : 18.9996,
    mural.longitud && !isNaN(Number(mural.longitud))
      ? Number(mural.longitud)
      : -98.2417,
  ]);
  const [showConfirm, setShowConfirm] = useLocalState(false);
  const [loading, setLoading] = useLocalState(false);

  // brushIcon debe estar definido aquí para que esté en scope
  const brushIcon = new Icon({
    iconUrl: getLucideSvgUrl("brush", "#4F46E5"),
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    className: "leaflet-brush-icon",
  });

  function DraggableMarker() {
    const [position, setPosition] = useLocalState(tempLatLng);
    const eventHandlers = {
      dragend(e) {
        const marker = e.target;
        const latlng = marker.getLatLng();
        setPosition([latlng.lat, latlng.lng]);
        setTempLatLng([latlng.lat, latlng.lng]);
        setShowConfirm(true);
      },
    };
    return (
      <Marker
        position={position}
        icon={brushIcon}
        draggable={true}
        eventHandlers={eventHandlers}
      />
    );
  }

  // Centrar el mapa en la posición temporal
  const mapCenter = tempLatLng;

  // Confirmar ubicación: actualiza mural.lat/lon y hace reverse geocoding
  const handleConfirm = async () => {
    setLoading(true);
    const [lat, lon] = tempLatLng;
    const ubicacion = await fetchAddressFromLatLon(lat, lon);
    setMural((m) => ({ ...m, latitud: lat, longitud: lon, ubicacion }));
    setShowConfirm(false);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-6 mb-8">
      <label className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200">
        Selecciona la ubicación del mural en el mapa
      </label>
      <div className="w-full h-72 rounded-xl overflow-hidden border border-gray-300 dark:border-neutral-700 mb-2">
        <MapContainer
          center={mapCenter}
          zoom={15}
          style={{ width: "100%", height: "100%" }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker />
        </MapContainer>
      </div>
      {showConfirm && (
        <button
          className="px-4 py-2 rounded bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition w-fit mx-auto"
          onClick={handleConfirm}
          disabled={loading}
        >
          {loading ? "Confirmando..." : "Confirmar ubicación"}
        </button>
      )}
      {/* Inputs debajo del mapa */}
      <div>
        <label
          htmlFor="ubicacion"
          className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
        >
          Ubicación
        </label>
        <input
          id="ubicacion"
          type="text"
          placeholder="Ejemplo: Edificio A, Planta Baja, Pasillo 2"
          value={mural.ubicacion}
          onChange={(e) =>
            setMural((m) => ({ ...m, ubicacion: e.target.value }))
          }
          className="input-stepper"
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label
            htmlFor="latitud"
            className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
          >
            Latitud
          </label>
          <input
            id="latitud"
            type="number"
            placeholder="Ejemplo: 19.0432"
            value={
              mural.latitud !== undefined && mural.latitud !== null
                ? String(mural.latitud)
                : ""
            }
            onChange={(e) =>
              setMural((m) => ({ ...m, latitud: e.target.value }))
            }
            className="input-stepper"
          />
        </div>
        <div className="flex-1">
          <label
            htmlFor="longitud"
            className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
          >
            Longitud
          </label>
          <input
            id="longitud"
            type="number"
            placeholder="Ejemplo: -98.1987"
            value={
              mural.longitud !== undefined && mural.longitud !== null
                ? String(mural.longitud)
                : ""
            }
            onChange={(e) =>
              setMural((m) => ({ ...m, longitud: e.target.value }))
            }
            className="input-stepper"
          />
        </div>
      </div>
      <div>
        <label
          htmlFor="salaId"
          className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
        >
          Sala
        </label>
        <select
          id="salaId"
          className="input-stepper"
          value={mural.salaId || ""}
          onChange={(e) => setMural((m) => ({ ...m, salaId: e.target.value }))}
        >
          <option value="">Selecciona una sala (opcional)</option>
          {salas.map((sala) => (
            <option key={sala.id} value={sala.id}>
              {sala.nombre ? `${sala.nombre} (ID: ${sala.id})` : sala.id}
            </option>
          ))}
        </select>
      </div>
      {/*
      <div>
        <label htmlFor="exposiciones" className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200">Exposiciones (JSON)</label>
        <input
          id="exposiciones"
          type="text"
          placeholder='Ejemplo: ["Expo 2023", "Muestra Digital"]'
          value={JSON.stringify(mural.exposiciones)}
          onChange={(e) => setMural((m) => ({
            ...m,
            exposiciones: e.target.value ? JSON.parse(e.target.value) : [],
          }))}
          className="input-stepper font-mono"
        />
      </div>
      */}
    </div>
  );
}

// Componente para autores, artista y colaboradores con selects
function AutoresColaboradoresStep({ mural, setMural }) {
  const usuarios = useUsuarios();
  // Opciones para react-select
  const userOptions = usuarios.map((u) => ({
    value: u.id,
    label: u.name ? `${u.name} (${u.email})` : u.email,
  }));
  // Para autor principal, puedes usar name o id según tu modelo
  const autorOption =
    userOptions.find((opt) => opt.value === mural.autor) || null;
  const artistaOption =
    userOptions.find((opt) => opt.value === mural.artistId) || null;
  const colaboradoresOptions = userOptions.filter((opt) =>
    (mural.colaboradores || []).includes(opt.value)
  );

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div>
        <label
          htmlFor="autor"
          className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
        >
          Autor principal
        </label>
        <ReactSelect
          inputId="autor"
          classNamePrefix="react-select"
          options={userOptions}
          value={autorOption}
          onChange={(opt) =>
            setMural((m) => ({ ...m, autor: opt ? opt.value : "" }))
          }
          placeholder="Selecciona un usuario"
          isClearable
          menuPortalTarget={
            typeof window !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          styles={
            isDarkMode()
              ? {
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: "#18181b",
                    borderColor: state.isFocused ? "#6366f1" : "#27272a",
                    color: "#fff",
                    boxShadow: state.isFocused
                      ? "0 0 0 1.5px #6366f1"
                      : undefined,
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "#222",
                    color: "#fff",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#6366f1"
                      : state.isFocused
                        ? "#3730a3"
                        : "#222",
                    color: state.isSelected ? "#fff" : "#fff",
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#6366f1",
                    color: "#fff",
                  }),
                  multiValueLabel: (base) => ({ ...base, color: "#fff" }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#fff",
                    ":hover": { backgroundColor: "#3730a3", color: "#fff" },
                  }),
                  placeholder: (base) => ({ ...base, color: "#a1a1aa" }),
                  singleValue: (base) => ({ ...base, color: "#fff" }),
                  input: (base) => ({ ...base, color: "#fff" }),
                }
              : { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
          }
        />
      </div>
      <div>
        <label
          htmlFor="artistId"
          className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
        >
          Artista
        </label>
        <ReactSelect
          inputId="artistId"
          classNamePrefix="react-select"
          options={userOptions}
          value={artistaOption}
          onChange={(opt) =>
            setMural((m) => ({ ...m, artistId: opt ? opt.value : "" }))
          }
          placeholder="Selecciona un usuario"
          isClearable
          menuPortalTarget={
            typeof window !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          styles={
            isDarkMode()
              ? {
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: "#18181b",
                    borderColor: state.isFocused ? "#6366f1" : "#27272a",
                    color: "#fff",
                    boxShadow: state.isFocused
                      ? "0 0 0 1.5px #6366f1"
                      : undefined,
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "#222",
                    color: "#fff",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#6366f1"
                      : state.isFocused
                        ? "#3730a3"
                        : "#222",
                    color: state.isSelected ? "#fff" : "#fff",
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#6366f1",
                    color: "#fff",
                  }),
                  multiValueLabel: (base) => ({ ...base, color: "#fff" }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#fff",
                    ":hover": { backgroundColor: "#3730a3", color: "#fff" },
                  }),
                  placeholder: (base) => ({ ...base, color: "#a1a1aa" }),
                  singleValue: (base) => ({ ...base, color: "#fff" }),
                  input: (base) => ({ ...base, color: "#fff" }),
                }
              : { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
          }
        />
      </div>
      <div>
        <label
          htmlFor="colaboradores"
          className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200"
        >
          Colaboradores
        </label>
        <ReactSelect
          inputId="colaboradores"
          classNamePrefix="react-select"
          options={userOptions}
          value={colaboradoresOptions}
          onChange={(opts) =>
            setMural((m) => ({
              ...m,
              colaboradores: opts ? opts.map((o) => o.value) : [],
            }))
          }
          isMulti
          placeholder="Selecciona uno o varios usuarios"
          menuPortalTarget={
            typeof window !== "undefined" ? document.body : null
          }
          menuPosition="fixed"
          styles={
            isDarkMode()
              ? {
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                  control: (base, state) => ({
                    ...base,
                    backgroundColor: "#18181b",
                    borderColor: state.isFocused ? "#6366f1" : "#27272a",
                    color: "#fff",
                    boxShadow: state.isFocused
                      ? "0 0 0 1.5px #6366f1"
                      : undefined,
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "#222",
                    color: "#fff",
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected
                      ? "#6366f1"
                      : state.isFocused
                        ? "#3730a3"
                        : "#222",
                    color: state.isSelected ? "#fff" : "#fff",
                  }),
                  multiValue: (base) => ({
                    ...base,
                    backgroundColor: "#6366f1",
                    color: "#fff",
                  }),
                  multiValueLabel: (base) => ({ ...base, color: "#fff" }),
                  multiValueRemove: (base) => ({
                    ...base,
                    color: "#fff",
                    ":hover": { backgroundColor: "#3730a3", color: "#fff" },
                  }),
                  placeholder: (base) => ({ ...base, color: "#a1a1aa" }),
                  singleValue: (base) => ({ ...base, color: "#fff" }),
                  input: (base) => ({ ...base, color: "#fff" }),
                }
              : { menuPortal: (base) => ({ ...base, zIndex: 9999 }) }
          }
        />
      </div>
    </div>
  );
}
