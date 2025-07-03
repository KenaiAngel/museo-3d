"use client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCallback, useEffect, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { DatePicker } from "../components/ui/date-picker";
import { X } from "lucide-react";
import RainbowBackground from "../perfil/RainbowBackground";
import { useCardMouseGlow } from "../hooks/useCardMouseGlow";
import { useTheme } from "../../providers/ThemeProvider";
import { useSessionData } from "../../providers/SessionProvider";
import { useCrearSalaStore } from "./crearSalaStore";

// Componentes de fondo animado (copiados de acerca-de)
function AnimatedBlobsBackground() {
  return (
    <>
      <div className="absolute top-0 left-0 w-[520px] h-[520px] bg-orange-300/60 dark:bg-orange-700/20 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe" />
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-pink-300/60 dark:bg-pink-700/20 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe-delayed" />
      <div
        className="absolute top-1/2 left-1/2 w-[340px] h-[340px] bg-fuchsia-200/50 dark:bg-fuchsia-800/10 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe"
        style={{ transform: "translate(-50%,-50%) scale(1.2)" }}
      />
    </>
  );
}

function DotsPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full z-0 pointer-events-none hidden dark:block"
      width="100%"
      height="100%"
      style={{ opacity: 0.13 }}
    >
      <defs>
        <pattern
          id="dots"
          x="0"
          y="0"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="#fff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

// Esquema para el paso 1 (nombre y descripcion)
const schemaStep1 = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre de la sala es obligatorio")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no debe superar 50 caracteres"),
  descripcion: yup
    .string()
    .required("La descripción es obligatoria")
    .min(5, "La descripción debe tener al menos 5 caracteres")
    .max(300, "La descripción no debe superar 300 caracteres"),
});
// Esquema para el paso 2 (textura y piso)
const schemaStep2 = yup.object().shape({
  textura: yup.string().required("Selecciona una textura de pared"),
  colorParedes: yup.string().required("Selecciona un color de pared"),
  piso: yup.string().required("Selecciona una textura de piso"),
});
// Esquema para el paso 3 (musica)
const schemaStep3 = yup.object().shape({
  musica: yup.string().required("Selecciona una música de ambiente"),
});
// Esquema para el paso 4 (murales)
const schemaStep4 = yup.object().shape({
  murales: yup.array().of(yup.number()).min(1, "Selecciona al menos un mural"),
});
// Esquema completo para el submit final
const schemaFinal = yup.object().shape({
  nombre: yup
    .string()
    .required("El nombre de la sala es obligatorio")
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(50, "El nombre no debe superar 50 caracteres"),
  descripcion: yup
    .string()
    .required("La descripción es obligatoria")
    .min(5, "La descripción debe tener al menos 5 caracteres")
    .max(300, "La descripción no debe superar 300 caracteres"),
  textura: yup.string().required("Selecciona una textura de pared"),
  colorParedes: yup.string().required("Selecciona un color de pared"),
  piso: yup.string().required("Selecciona una textura de piso"),
  musica: yup.string().required("Selecciona una música de ambiente"),
  murales: yup.array().of(yup.number()).min(1, "Selecciona al menos un mural"),
});

// Modal visual local para selección de murales
function MuralSelectModal({
  isOpen,
  onClose,
  murales,
  muralesForm,
  setValue,
  muralSearch,
  setMuralSearch,
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">Selecciona murales</h2>
        <input
          type="text"
          placeholder="Buscar mural por título..."
          value={muralSearch}
          onChange={(e) => setMuralSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 mb-4"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {murales
            .filter(
              (m) =>
                !muralesForm.includes(m.id) &&
                m.titulo.toLowerCase().includes(muralSearch.toLowerCase())
            )
            .map((mural) => (
              <button
                key={mural.id}
                type="button"
                className="flex flex-col items-center border rounded-xl p-3 bg-white hover:bg-indigo-50 transition shadow-sm"
                onClick={() => setValue(mural.id)}
              >
                <img
                  src={mural.url_imagen}
                  alt={mural.titulo}
                  className="w-20 h-20 object-cover rounded mb-2"
                />
                <div className="font-medium text-sm text-gray-900 truncate w-full">
                  {mural.titulo}
                </div>
                <div className="text-xs text-gray-500">
                  {mural.autor || "Autor desconocido"}
                </div>
                <div className="text-xs text-gray-400">
                  {mural.tecnica || "Técnica desconocida"}
                </div>
              </button>
            ))}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CrearSala() {
  const router = useRouter();
  const { session, status } = useSessionData();
  const [globalMousePosition, setGlobalMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [hasActiveGlow, setHasActiveGlow] = useState(false);

  const {
    nombre,
    descripcion,
    murales,
    step,
    setNombre,
    setDescripcion,
    addMural,
    removeMural,
    setStep,
    reset,
  } = useCrearSalaStore();

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [addingMural, setAddingMural] = useState(false);
  const [muralForm, setMuralForm] = useState({
    nombre: "",
    tecnica: "",
    fecha: "",
    autor: "",
    imagen: null,
  });
  const [salaConfig, setSalaConfig] = useState({
    textura: "moderna",
    colorParedes: "blanco",
    tipoIluminacion: "natural",
    musica: "ninguna",
    ambiente: "minimalista",
    archivoPersonalizado: null,
  });
  const [view, setView] = useState("crear");
  const [loadingMurales, setLoadingMurales] = useState(false);
  const [selectedMuralForAdd, setSelectedMuralForAdd] = useState("");
  const [showMuralModal, setShowMuralModal] = useState(false);
  const [muralSearch, setMuralSearch] = useState("");

  // Stepper steps
  const steps = [
    { label: "Datos de la sala" },
    { label: "Textura y piso" },
    { label: "Música" },
    { label: "Seleccionar murales" },
    { label: "Confirmar" },
  ];

  // Animations
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      position: "absolute",
    }),
    center: { x: 0, opacity: 1, position: "relative" },
    exit: (direction) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      position: "absolute",
    }),
  };
  const [direction, setDirection] = useState(0);

  const cardGlow = useCardMouseGlow();

  const nombreRef = useRef();
  const descripcionRef = useRef();

  const { theme } = useTheme ? useTheme() : { theme: "light" };

  const muralesForm = murales;

  // 1. Estado local para los murales disponibles
  const [muralesDisponibles, setMuralesDisponibles] = useState([]);

  // Manejar archivo personalizado para características de sala
  const handleCustomFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSalaConfig((prev) => ({ ...prev, archivoPersonalizado: file }));
    }
  };

  // Remover archivo personalizado
  const removeCustomFile = () => {
    setSalaConfig((prev) => ({ ...prev, archivoPersonalizado: null }));
  };

  // Manejar posición global del mouse para el glow
  const handleGlobalMouseMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setGlobalMousePosition({ x, y });

    // Actualizar las variables CSS para la posición del glow
    document.documentElement.style.setProperty("--global-mouse-x", `${x}%`);
    document.documentElement.style.setProperty("--global-mouse-y", `${y}%`);
  }, []);

  const handleGlobalMouseEnter = useCallback(() => {
    setHasActiveGlow(true);
  }, []);

  const handleGlobalMouseLeave = useCallback(() => {
    setHasActiveGlow(false);
  }, []);

  // Añadir mural seleccionado del dropdown
  const handleAddMural = () => {
    if (
      selectedMuralForAdd &&
      !muralesForm.includes(parseInt(selectedMuralForAdd))
    ) {
      const newMurales = [...muralesForm, parseInt(selectedMuralForAdd)];
      addMural(newMurales);
      setSelectedMuralForAdd("");
    }
  };

  // Remover mural seleccionado
  const handleRemoveMural = (muralId) => {
    const newMurales = muralesForm.filter((id) => id !== muralId);
    removeMural(newMurales);
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    },
    [setFiles]
  );
  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
  });

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Subir mural a la API
  const uploadMural = async (muralData) => {
    const formData = new FormData();
    Object.entries(muralData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value);
    });
    // Asegurar que ubicacion siempre esté presente
    if (!formData.has("ubicacion")) formData.append("ubicacion", "");
    if (muralData.imagen) formData.append("imagen", muralData.imagen);
    const res = await fetch("/api/murales", {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Error al subir mural");
    return res.json();
  };

  useEffect(() => {
    if (status === "loading") {
      return (
        <div className="relative min-h-screen flex items-center justify-center">
          <RainbowBackground />
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-blue-300/60 dark:bg-blue-700/40 rounded-full mix-blend-multiply filter blur-[120px] animate-breathe"></div>
            <div className="absolute -bottom-20 -left-24 w-[500px] h-[500px] bg-purple-200/60 dark:bg-purple-800/40 rounded-full mix-blend-multiply filter blur-[120px] animate-breathe-delayed"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-indigo-200 animate-pulse mb-6" />
            <p className="text-lg text-foreground font-semibold">
              Cargando sesión...
            </p>
          </div>
        </div>
      );
    }
    if (!session) {
      return (
        <div className="relative min-h-screen flex items-center justify-center">
          <RainbowBackground />
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-blue-300/60 dark:bg-blue-700/40 rounded-full mix-blend-multiply filter blur-[120px] animate-breathe"></div>
            <div className="absolute -bottom-20 -left-24 w-[500px] h-[500px] bg-purple-200/60 dark:bg-purple-800/40 rounded-full mix-blend-multiply filter blur-[120px] animate-breathe-delayed"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-200 animate-pulse mb-6" />
            <p className="text-lg text-foreground font-semibold">
              Debes iniciar sesión para crear una sala
            </p>
          </div>
        </div>
      );
    }
  }, [status, session]);

  // 2. Cargar murales disponibles SOLO en el estado local
  useEffect(() => {
    const fetchMurales = async () => {
      setLoadingMurales(true);
      try {
        const res = await fetch("/api/murales");
        if (res.ok) {
          const data = await res.json();
          setMuralesDisponibles(data.murales || []);
        }
      } catch (error) {
        toast.error("Error al cargar murales");
      } finally {
        setLoadingMurales(false);
      }
    };
    fetchMurales();
  }, []);

  // Validar y avanzar de step SOLO con los campos del paso actual
  const handleNextStep = async () => {
    let data = { nombre, descripcion, murales, ...salaConfig };
    console.log("DEBUG handleNextStep - data:", data);
    try {
      if (step === 0) {
        await schemaStep1.validate(data, { abortEarly: false });
      } else if (step === 1) {
        await schemaStep2.validate(salaConfig, { abortEarly: false });
      } else if (step === 2) {
        await schemaStep3.validate(salaConfig, { abortEarly: false });
      } else if (step === 3) {
        await schemaStep4.validate(data, { abortEarly: false });
      }
      setErrors({});
      setStep(step + 1);
      console.log("DEBUG handleNextStep - validation passed, advancing step");
    } catch (err) {
      if (err.inner) {
        const newErrors = {};
        err.inner.forEach((e) => {
          newErrors[e.path] = e.message;
        });
        setErrors(newErrors);
        console.log("DEBUG handleNextStep - validation errors:", newErrors);
      } else {
        console.log("DEBUG handleNextStep - unknown error:", err);
      }
    }
  };

  // Validar y enviar (submit final)
  const handleSubmit = async () => {
    let data = { nombre, descripcion, murales, ...salaConfig };
    setIsSubmitting(true);
    try {
      await schemaFinal.validate(data, { abortEarly: false });
      setErrors({});
      // ... lógica de submit ...
      // enviar data al backend, incluyendo salaConfig
      // ...
      reset();
    } catch (err) {
      if (err.inner) {
        const newErrors = {};
        err.inner.forEach((e) => {
          newErrors[e.path] = e.message;
        });
        setErrors(newErrors);
        console.log("DEBUG handleSubmit - validation errors:", newErrors);
      } else {
        console.log("DEBUG handleSubmit - unknown error:", err);
      }
    }
    setIsSubmitting(false);
  };

  // Stepper visual mejorado, ahora dentro de la card
  const Stepper = (
    <div className="w-full flex flex-col items-center mb-8">
      <div className="flex items-end justify-center gap-4 w-full">
        {steps.map((s, i) => {
          const isActive = i === step;
          const isDark = theme === "dark";
          return (
            <motion.div
              key={i}
              initial={false}
              animate={isActive ? { scale: 1.18, y: -6 } : { scale: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="flex flex-col items-center flex-1 min-w-[110px]"
            >
              <div className="relative flex items-center justify-center">
                {isActive && (
                  <motion.div
                    layoutId="step-glow"
                    className={`absolute z-0 w-20 h-20 md:w-28 md:h-28 rounded-full ${
                      isDark ? "bg-indigo-400/40" : "bg-indigo-500/30"
                    } blur-3xl animate-pulse`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, scale: [1, 1.2, 1] }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.7,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                )}
                <div
                  className={`relative z-10 w-14 h-14 flex items-center justify-center rounded-full font-extrabold text-2xl border-4 transition-all duration-300 select-none
                    ${
                      isActive
                        ? `${
                            isDark
                              ? "bg-indigo-400 text-white border-indigo-300"
                              : "bg-indigo-600 text-white border-indigo-700"
                          } shadow-2xl animate-bounce`
                        : `${
                            isDark
                              ? "bg-slate-800 text-indigo-200 border-indigo-900"
                              : "bg-white text-indigo-700 border-indigo-200"
                          }`
                    }
                  `}
                  style={{
                    boxShadow: isActive
                      ? isDark
                        ? "0 0 0 12px #818cf822"
                        : "0 0 0 12px #a5b4fc22"
                      : undefined,
                  }}
                >
                  {i + 1}
                </div>
              </div>
              <div
                className={
                  `mt-3 text-sm font-semibold text-center min-w-[110px] h-10 flex items-center justify-center` +
                  (isActive
                    ? isDark
                      ? " text-indigo-200"
                      : " text-indigo-700"
                    : isDark
                    ? " text-indigo-400"
                    : " text-gray-400")
                }
              >
                {s.label}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // Step 1: Sala config (animación mejorada + shake si error)
  const StepSala = (
    <motion.div
      key={0}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      className={`w-full ${errors.nombre ? "animate-shake" : ""}`}
    >
      <label className="block font-semibold text-foreground dark:text-gray-200 mb-2">
        Nombre de la sala
      </label>
      <input
        id="nombre"
        type="text"
        placeholder="Nombre de la sala"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        ref={nombreRef}
        className={`w-full px-4 py-3 rounded-xl border-2 text-lg font-semibold shadow-sm focus:outline-none transition-all bg-white dark:bg-neutral-800 border-gray-200 dark:border-gray-700 text-foreground dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 ${
          errors.nombre
            ? "border-pink-500 animate-shake"
            : "focus:border-indigo-500"
        }`}
        autoComplete="off"
      />
      {errors.nombre && (
        <div className="text-pink-500 dark:text-pink-400 text-sm mt-1 font-medium animate-shake">
          {errors.nombre}
        </div>
      )}
      <label className="block font-semibold text-foreground dark:text-gray-200 mb-2">
        Descripción
      </label>
      <textarea
        id="descripcion"
        placeholder="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        ref={descripcionRef}
        className={`w-full px-4 py-3 rounded-xl border-2 text-base shadow-sm focus:outline-none transition-all resize-none min-h-[80px] ${
          errors.descripcion
            ? "border-pink-500 animate-shake"
            : "border-indigo-200 focus:border-indigo-500"
        }`}
        autoComplete="off"
      />
      {errors.descripcion && (
        <div className="text-pink-500 dark:text-pink-400 text-sm mt-1 font-medium animate-shake">
          {errors.descripcion}
        </div>
      )}
      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-bold hover:bg-indigo-700 dark:hover:bg-indigo-400 transition"
          onClick={handleNextStep}
        >
          Siguiente
        </button>
      </div>
    </motion.div>
  );

  // Step 2: Textura y piso
  const StepTextura = (
    <motion.div
      key={1}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      className="w-full"
    >
      <label className="block font-semibold mb-2">Textura de paredes</label>
      <select
        value={salaConfig.textura}
        onChange={(e) =>
          setSalaConfig((prev) => ({ ...prev, textura: e.target.value }))
        }
        className="w-full px-4 py-3 rounded-xl border-2 text-lg font-semibold shadow-sm focus:outline-none transition-all mb-4"
      >
        <option value="moderna">Moderna</option>
        <option value="clasica">Clásica</option>
        <option value="industrial">Industrial</option>
      </select>
      {errors.textura && (
        <div className="text-pink-500 dark:text-pink-400 text-sm mt-1 font-medium animate-shake">
          {errors.textura}
        </div>
      )}
      <label className="block font-semibold mb-2">Color de paredes</label>
      <input
        type="color"
        value={salaConfig.colorParedes}
        onChange={(e) =>
          setSalaConfig((prev) => ({ ...prev, colorParedes: e.target.value }))
        }
        className="w-16 h-10 rounded border-2"
      />
      {errors.colorParedes && (
        <div className="text-pink-500 dark:text-pink-400 text-sm mt-1 font-medium animate-shake">
          {errors.colorParedes}
        </div>
      )}
      <label className="block font-semibold mb-2 mt-4">Textura de piso</label>
      <select
        value={salaConfig.piso || "madera"}
        onChange={(e) =>
          setSalaConfig((prev) => ({ ...prev, piso: e.target.value }))
        }
        className="w-full px-4 py-3 rounded-xl border-2 text-lg font-semibold shadow-sm focus:outline-none transition-all"
      >
        <option value="madera">Madera</option>
        <option value="marmol">Mármol</option>
        <option value="cemento">Cemento</option>
      </select>
      {errors.piso && (
        <div className="text-pink-500 dark:text-pink-400 text-sm mt-1 font-medium animate-shake">
          {errors.piso}
        </div>
      )}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
          onClick={() => {
            setDirection(-1);
            setStep(0);
          }}
        >
          Atrás
        </button>
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-bold hover:bg-indigo-700 dark:hover:bg-indigo-400 transition"
          onClick={handleNextStep}
        >
          Siguiente
        </button>
      </div>
    </motion.div>
  );

  // Step 3: Música
  const StepMusica = (
    <motion.div
      key={2}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      className="w-full"
    >
      <label className="block font-semibold mb-2">Música de ambiente</label>
      <select
        value={salaConfig.musica}
        onChange={(e) =>
          setSalaConfig((prev) => ({ ...prev, musica: e.target.value }))
        }
        className="w-full px-4 py-3 rounded-xl border-2 text-lg font-semibold shadow-sm focus:outline-none transition-all"
      >
        <option value="ninguna">Ninguna</option>
        <option value="clasica">Clásica</option>
        <option value="jazz">Jazz</option>
        <option value="electronica">Electrónica</option>
      </select>
      {errors.musica && (
        <div className="text-pink-500 dark:text-pink-400 text-sm mt-1 font-medium animate-shake">
          {errors.musica}
        </div>
      )}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
          onClick={() => {
            setDirection(-1);
            setStep(1);
          }}
        >
          Atrás
        </button>
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-bold hover:bg-indigo-700 dark:hover:bg-indigo-400 transition"
          onClick={handleNextStep}
        >
          Siguiente
        </button>
      </div>
    </motion.div>
  );

  // Step 4: Selección de murales (animación mejorada + shake si error)
  const StepMurales = (
    <motion.div
      key={3}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      className={`w-full ${errors.murales ? "animate-shake" : ""}`}
    >
      <label className="block font-semibold text-foreground dark:text-gray-200 mb-2">
        Murales para la sala
      </label>
      <button
        type="button"
        className="px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition mb-3"
        onClick={() => setShowMuralModal(true)}
      >
        Seleccionar murales
      </button>
      {errors.murales && (
        <div className="text-red-500 text-sm mb-2 animate-pulse">
          {errors.murales}
        </div>
      )}
      {muralesForm.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {muralesForm.map((muralId) => {
            const mural = muralesDisponibles.find((m) => m.id === muralId);
            return mural ? (
              <Badge
                key={muralId}
                variant="blue"
                className="flex items-center gap-1 px-3 py-1"
              >
                {mural.titulo}
                <button
                  type="button"
                  onClick={() => handleRemoveMural(muralId)}
                  className="ml-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
          onClick={() => {
            setDirection(-1);
            setStep(2);
          }}
        >
          Atrás
        </button>
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white font-bold hover:bg-indigo-700 dark:hover:bg-indigo-400 transition"
          onClick={handleNextStep}
          disabled={muralesForm.length === 0}
        >
          Siguiente
        </button>
      </div>
    </motion.div>
  );

  // Step 5: Confirmación (animación mejorada)
  const StepConfirm = (
    <motion.div
      key={4}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
      className="w-full"
    >
      <h2 className="text-xl font-bold mb-4">Confirmar creación de sala</h2>
      <div className="mb-4">
        <div className="font-semibold">Nombre:</div>
        <div className="mb-2">{nombre}</div>
        {errors.nombre && (
          <div className="text-pink-500 dark:text-pink-400 text-sm mt-1 font-medium animate-shake">
            {errors.nombre}
          </div>
        )}
        <div className="font-semibold">Descripción:</div>
        <div className="mb-2">{descripcion}</div>
        {errors.descripcion && (
          <div className="text-pink-500 dark:text-pink-400 text-sm mt-1 font-medium animate-shake">
            {errors.descripcion}
          </div>
        )}
        <div className="font-semibold">Murales seleccionados:</div>
        <div className="flex flex-wrap gap-2">
          {muralesForm.map((muralId) => {
            const mural = muralesDisponibles.find((m) => m.id === muralId);
            return mural ? (
              <Badge
                key={muralId}
                variant="blue"
                className="flex items-center gap-1 px-3 py-1"
              >
                {mural.titulo}
              </Badge>
            ) : null;
          })}
        </div>
        {errors.murales && (
          <div className="text-red-500 text-sm mb-2 animate-pulse">
            {errors.murales}
          </div>
        )}
      </div>
      <div className="flex justify-between mt-6">
        <button
          type="button"
          className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
          onClick={() => {
            setDirection(-1);
            setStep(3);
          }}
        >
          Atrás
        </button>
        <button
          type="submit"
          className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creando..." : "Crear sala"}
        </button>
      </div>
    </motion.div>
  );

  if (!session) {
    return (
      <div className="relative min-h-screen">
        {/* Fondo animado y patrones */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <AnimatedBlobsBackground />
          <DotsPattern />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center">
      {/* Fondo animado y patrón tipo acerca-de */}
      <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
        <AnimatedBlobsBackground />
        <DotsPattern />
      </div>
      {/* Título neutro fuera de la card */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-foreground dark:text-neutral-100 z-20">
        Crea tu sala personalizada
      </h1>
      <div className="relative z-10 max-w-2xl w-full flex items-center justify-center">
        <div className="relative w-full">
          {/* Glow detrás de la card, más grande y difuso */}
          <div className="absolute -inset-16 md:-inset-32 z-0 pointer-events-none">
            <div className="w-full h-full rounded-3xl bg-gradient-radial from-indigo-400/40 via-fuchsia-300/30 to-pink-300/40 blur-[120px] opacity-80 animate-pulse" />
          </div>
          <div
            className="relative z-10 w-full bg-white/90 dark:bg-neutral-900/95 rounded-3xl shadow-xl p-6 md:p-14 flex flex-col items-center card-mouse-glow border border-border"
            onMouseMove={cardGlow.handleMouseMove}
            onMouseLeave={cardGlow.handleMouseLeave}
          >
            {Stepper}
            <form onSubmit={handleSubmit} className="w-full">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                {step === 0 && StepSala}
                {step === 1 && StepTextura}
                {step === 2 && StepMusica}
                {step === 3 && StepMurales}
                {step === 4 && StepConfirm}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </div>
      <MuralSelectModal
        isOpen={showMuralModal}
        onClose={() => setShowMuralModal(false)}
        murales={muralesDisponibles}
        muralesForm={muralesForm}
        setValue={(id) => addMural(id)}
        muralSearch={muralSearch}
        setMuralSearch={setMuralSearch}
      />
    </div>
  );
}
