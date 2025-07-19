"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Stepper from "@/components/ui/Stepper";
import {
  CheckCircle,
  AlertCircle,
  Info,
  User,
  MapPin,
  Eye,
  Users,
  Image as ImageIcon,
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
import {
  generateMuralGLB,
  generateMuralGLBFallback,
} from "../../../utils/generateMuralGLB";
import { uploadModelToCloudinary } from "../../../utils/uploadToCloudinary";
import { validateGLB, diagnoseModel } from "../../../utils/validateGLB";

const STEPS = [
  { label: "Datos básicos", subtitle: "Información principal", icon: <User /> },
  {
    label: "Imágenes y medios",
    subtitle: "Sube o crea tu imagen",
    icon: <ImageIcon />,
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
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const canvasImageLoaded = useRef(false);

  // Función para comprimir imagen si es muy grande
  const compressImage = (dataUrl, maxSize = 800) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen comprimida
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 con calidad reducida
        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(compressedDataUrl);
      };
      img.src = dataUrl;
    });
  };

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
    userId: "", // Agregar userId
  });
  const [errors, setErrors] = useState({});
  const [artistList, setArtistList] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [generatingModel, setGeneratingModel] = useState(false);
  const [modelGenerationStep, setModelGenerationStep] = useState("");

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
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  // Cargar datos del mural desde localStorage al montar el componente
  useEffect(() => {
    const savedData = localStorage.getItem("muralDraftData");
    const savedStep = localStorage.getItem("muralStep");

    console.log("📂 Cargando datos guardados:", {
      hasSavedData: !!savedData,
      hasSavedStep: !!savedStep,
      sessionUserId: session?.user?.id,
    });

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log("📋 Datos parseados:", parsed);

        setMural((prev) => {
          // Solo cargar datos si no tenemos datos ya cargados o si el userId coincide
          const shouldLoadData =
            !prev.titulo ||
            !prev.descripcion ||
            !prev.tecnica ||
            parsed.userId === session?.user?.id;

          // Verificar si los datos parseados tienen contenido significativo
          const hasParsedData =
            parsed.titulo ||
            parsed.descripcion ||
            parsed.tecnica ||
            parsed.anio !== 2025 ||
            parsed.dimensiones ||
            parsed.latitud ||
            parsed.longitud ||
            parsed.ubicacion ||
            parsed.salaId ||
            parsed.estado ||
            parsed.autor ||
            parsed.artistId ||
            (parsed.colaboradores && parsed.colaboradores.length > 0);

          if (shouldLoadData && hasParsedData) {
            const newMural = {
              ...prev,
              ...parsed,
              // Mantener la imagen actual si existe (no sobrescribir con null)
              url_imagen: prev.url_imagen || parsed.url_imagen,
              // Asegurar que userId se mantenga si ya está establecido
              userId: session?.user?.id || prev.userId || parsed.userId,
            };
            console.log("🔄 Estado del mural actualizado:", newMural);
            return newMural;
          } else {
            console.log(
              "⏭️ Saltando carga de datos - datos insuficientes o ya tenemos datos válidos",
              { shouldLoadData, hasParsedData }
            );
            return prev;
          }
        });
      } catch (error) {
        console.error("❌ Error parsing saved mural data:", error);
      }
    }

    if (savedStep) {
      setStep(parseInt(savedStep));
    }
  }, [session?.user?.id]); // Depender de session.user.id para recargar cuando esté disponible

  // Establecer userId cuando la sesión esté disponible (solo si no está ya establecido)
  useEffect(() => {
    if (session?.user?.id && !mural.userId) {
      console.log("👤 Estableciendo userId:", session.user.id);
      setMural((prev) => ({ ...prev, userId: session.user.id }));
    }
  }, [session, mural.userId]);

  // Cargar lista de artistas
  useEffect(() => {
    fetch("/api/artists?limit=100")
      .then((res) => res.json())
      .then((data) => {
        console.log("🎨 Artistas cargados:", data.artists?.length || 0);
        setArtistList(data.artists || []);
      })
      .catch((error) => {
        console.error("❌ Error cargando artistas:", error);
        setArtistList([]);
      });
  }, []);

  // Verificar si hay imagen del canvas al cargar el componente
  useEffect(() => {
    const savedCanvasImage = localStorage.getItem("canvasImage");
    console.log("🔍 Verificando imagen del canvas:", {
      hasImage: !!savedCanvasImage,
      canvasImageLoaded: canvasImageLoaded.current,
      currentStep: step,
      hasMuralData: !!mural.titulo, // Verificar si ya hay datos del mural
    });

    if (savedCanvasImage && !canvasImageLoaded.current) {
      console.log("📸 Cargando imagen del canvas...");

      // Verificar si ya tenemos datos del mural antes de cargar la imagen
      const currentMuralData = localStorage.getItem("muralDraftData");
      let existingData = {};
      if (currentMuralData) {
        try {
          existingData = JSON.parse(currentMuralData);
          console.log("📋 Datos existentes antes de cargar imagen:", {
            titulo: existingData.titulo,
            tecnica: existingData.tecnica,
          });
        } catch (error) {
          console.error("❌ Error parsing existing data:", error);
        }
      }

      // Comprimir la imagen si es muy grande
      compressImage(savedCanvasImage)
        .then((compressedImage) => {
          console.log("✅ Imagen comprimida, actualizando estado");
          setMural((m) => {
            // Preservar todos los datos existentes del mural, incluyendo los del localStorage
            const updatedMural = {
              ...m,
              ...existingData, // Restaurar datos del localStorage
              url_imagen: compressedImage,
            };

            // Verificar que los datos se preservaron correctamente
            console.log("🔍 Verificación de preservación de datos:", {
              tituloAntes: m.titulo,
              tituloDespues: updatedMural.titulo,
              tecnicaAntes: m.tecnica,
              tecnicaDespues: updatedMural.tecnica,
              existingDataTitulo: existingData.titulo,
              existingDataTecnica: existingData.tecnica,
            });
            console.log("🎨 Mural actualizado con imagen:", {
              titulo: updatedMural.titulo,
              tecnica: updatedMural.tecnica,
              anio: updatedMural.anio,
              hasImage: !!updatedMural.url_imagen,
              userId: updatedMural.userId,
            });

            // Forzar un guardado inmediato para preservar los datos
            setTimeout(() => {
              const muralWithoutImage = {
                ...updatedMural,
                url_imagen: null, // No guardar la imagen en localStorage
              };
              localStorage.setItem(
                "muralDraftData",
                JSON.stringify(muralWithoutImage)
              );
              console.log("💾 Guardado inmediato después de cargar imagen:", {
                titulo: muralWithoutImage.titulo,
                tecnica: muralWithoutImage.tecnica,
              });
            }, 100);

            return updatedMural;
          });
          // Solo cambiar al paso 1 si no estamos ya en un paso más avanzado
          if (step < 1) {
            console.log("🔄 Cambiando al paso 1");
            setStep(1);
          }
        })
        .catch((error) => {
          console.error("❌ Error comprimiendo imagen:", error);
        });

      // Limpiar localStorage después de cargar
      localStorage.removeItem("canvasImage");
      canvasImageLoaded.current = true;
    }
  }, [step]); // Solo depender del step, no del titulo para evitar loops

  // Guardar estado del mural (sin imagen) y paso actual en localStorage
  useEffect(() => {
    if (!isCreating) {
      // Solo guardar si hay datos significativos o si es un cambio real
      const hasSignificantData =
        mural.titulo ||
        mural.descripcion ||
        mural.tecnica ||
        mural.anio !== 2025 || // Si no es el año por defecto
        mural.dimensiones ||
        mural.latitud ||
        mural.longitud ||
        mural.ubicacion ||
        mural.salaId ||
        mural.estado ||
        mural.autor ||
        mural.artistId ||
        (mural.colaboradores && mural.colaboradores.length > 0);

      // Verificar si ya hay datos guardados para evitar sobrescribir con datos vacíos
      const existingData = localStorage.getItem("muralDraftData");
      let existingMural = {};
      if (existingData) {
        try {
          existingMural = JSON.parse(existingData);
        } catch (error) {
          console.error("❌ Error parsing existing mural data:", error);
        }
      }

      // Evitar sobrescribir datos existentes con datos vacíos
      const isOverwritingWithEmptyData =
        !hasSignificantData &&
        existingMural.titulo &&
        !mural.titulo &&
        step === 0;

      if (isOverwritingWithEmptyData) {
        console.log(
          "🚫 Evitando sobrescribir datos existentes con datos vacíos"
        );
        return;
      }

      // Crear una copia del mural sin la imagen para no exceder el límite de localStorage
      const muralWithoutImage = {
        ...mural,
        url_imagen: null, // No guardar la imagen en localStorage
      };

      // Solo guardar si hay datos significativos o si es un paso avanzado
      if (hasSignificantData || step > 0) {
        console.log("💾 Guardando estado en localStorage:", {
          hasSignificantData,
          step,
          titulo: mural.titulo,
          tecnica: mural.tecnica,
        });
        localStorage.setItem(
          "muralDraftData",
          JSON.stringify(muralWithoutImage)
        );
        localStorage.setItem("muralStep", step.toString());
      }
    }
  }, [
    mural.titulo,
    mural.descripcion,
    mural.tecnica,
    mural.anio,
    mural.dimensiones,
    mural.latitud,
    mural.longitud,
    mural.ubicacion,
    mural.salaId,
    mural.estado,
    mural.publica,
    mural.destacada,
    mural.orden,
    mural.tags,
    mural.autor,
    mural.artistId,
    mural.colaboradores,
    step,
    isCreating,
  ]);

  // Función para generar modelo 3D con fallbacks
  const generateAndValidateModel = async (imageUrl, title = "mural") => {
    setGeneratingModel(true);
    console.log("🚀 Iniciando generación de modelo 3D para:", title);

    let glbBlob = null;
    let generationMethod = "";

    try {
      // Intentar primero con la imagen real
      setModelGenerationStep("Generando modelo 3D con imagen...");
      console.log("📸 Intentando generar modelo con imagen:", imageUrl);
      glbBlob = await generateMuralGLB(imageUrl);
      generationMethod = "imagen_real";

      // Validar el modelo generado
      setModelGenerationStep("Validando modelo generado...");
      const validation = await validateGLB(glbBlob);
      if (!validation.isValid) {
        throw new Error(`Modelo inválido: ${validation.error}`);
      }

      console.log("✅ Modelo generado exitosamente con imagen real");
    } catch (error) {
      console.warn(
        "⚠️ Error con imagen real, intentando fallback:",
        error.message
      );

      try {
        // Fallback: generar con textura programática
        setModelGenerationStep("Generando modelo alternativo...");
        const fallbackColor = "#4A90E2"; // Azul atractivo
        const fallbackText = title.substring(0, 10).toUpperCase() || "OBRA";

        console.log("🎨 Generando modelo fallback con:", {
          color: fallbackColor,
          text: fallbackText,
        });
        glbBlob = await generateMuralGLBFallback(fallbackColor, fallbackText);
        generationMethod = "fallback";

        // Validar el modelo fallback
        setModelGenerationStep("Validando modelo alternativo...");
        const validation = await validateGLB(glbBlob);
        if (!validation.isValid) {
          throw new Error(`Modelo fallback inválido: ${validation.error}`);
        }

        console.log("✅ Modelo fallback generado exitosamente");
      } catch (fallbackError) {
        console.error(
          "❌ Error en fallback, intentando modelo simple:",
          fallbackError.message
        );

        // Último recurso: modelo simple
        setModelGenerationStep("Generando modelo básico...");
        const { generateSimpleGLB } = await import(
          "../../../utils/generateSimpleGLB"
        );
        glbBlob = await generateSimpleGLB(true);
        generationMethod = "simple";

        setModelGenerationStep("Validando modelo básico...");
        const validation = await validateGLB(glbBlob);
        if (!validation.isValid) {
          throw new Error(`Modelo simple inválido: ${validation.error}`);
        }

        console.log("✅ Modelo simple generado como último recurso");
      }
    }

    // Diagnóstico del modelo final
    setModelGenerationStep("Analizando calidad del modelo...");
    const diagnostic = await diagnoseModel(glbBlob);
    console.log("📊 Diagnóstico del modelo:", diagnostic);

    setGeneratingModel(false);
    setModelGenerationStep("");

    return {
      blob: glbBlob,
      method: generationMethod,
      diagnostic,
    };
  };

  // Función para crear el mural
  const handleCreateMural = async () => {
    console.log("🔍 Validando datos antes de crear mural:", {
      titulo: mural.titulo,
      tecnica: mural.tecnica,
      anio: mural.anio,
      userId: mural.userId,
      sessionUserId: session?.user?.id,
      hasImage: !!mural.url_imagen,
    });

    if (!mural.url_imagen) {
      alert("Debes seleccionar o crear una imagen");
      return;
    }

    if (!mural.titulo || !mural.titulo.trim()) {
      alert("El título es requerido. Por favor, completa el paso 1.");
      return;
    }

    if (!mural.tecnica || !mural.tecnica.trim()) {
      alert("La técnica es requerida. Por favor, completa el paso 1.");
      return;
    }

    if (!mural.anio) {
      alert("El año es requerido. Por favor, completa el paso 1.");
      return;
    }

    if (!mural.userId && !session?.user?.id) {
      alert(
        "No se ha cargado el perfil de usuario. Intenta de nuevo en unos segundos."
      );
      return;
    }

    setIsCreating(true);

    try {
      // Convertir dataURL a blob si es necesario
      let imgFile;
      let url_imagen = null;

      if (mural.url_imagen.startsWith("data:")) {
        const res = await fetch(mural.url_imagen);
        const blob = await res.blob();
        imgFile = new File([blob], `${mural.titulo || "obra"}.png`, {
          type: "image/png",
        });
      } else {
        // Si es un archivo File
        imgFile = mural.url_imagen;
      }

      // Subir imagen primero para obtener la URL
      const formDataImage = new FormData();
      formDataImage.append("imagen", imgFile);

      console.log("📤 Subiendo imagen...");
      const resImg = await fetch("/api/upload", {
        method: "POST",
        body: formDataImage,
      });

      if (!resImg.ok) {
        throw new Error("Error al subir la imagen");
      }

      const dataImg = await resImg.json();
      url_imagen = dataImg.url;
      console.log("✅ Imagen subida:", url_imagen);

      // Generar y subir modelo 3D
      let modelo3dUrl = null;
      let modelInfo = null;

      if (url_imagen) {
        try {
          console.log("🏗️ Iniciando proceso de generación de modelo 3D...");

          // Usar la función mejorada para generar el modelo
          const modelResult = await generateAndValidateModel(
            url_imagen,
            mural.titulo
          );

          // Preparar nombre del archivo
          let safeFileName = `${mural.titulo || "mural"}`;
          if (!safeFileName.toLowerCase().endsWith(".glb")) {
            safeFileName += ".glb";
          }

          // Subir a Cloudinary
          setModelGenerationStep("Subiendo modelo a la nube...");
          console.log("☁️ Subiendo modelo a Cloudinary...");
          modelo3dUrl = await uploadModelToCloudinary(
            modelResult.blob,
            safeFileName
          );

          modelInfo = {
            method: modelResult.method,
            size: Math.round(modelResult.blob.size / 1024), // KB
            diagnostic: modelResult.diagnostic,
          };

          console.log("✅ Modelo 3D procesado exitosamente:", {
            url: modelo3dUrl,
            method: modelResult.method,
            size: `${modelInfo.size} KB`,
          });
        } catch (err) {
          console.error("❌ Error completo en generación de modelo 3D:", err);
          // Continuar sin modelo 3D
          modelo3dUrl = null;
        } finally {
          setGeneratingModel(false);
          setModelGenerationStep("");
        }
      } else {
        console.log("ℹ️ No hay imagen, saltando generación de modelo 3D");
      }

      // Crear FormData para el mural
      const formData = new FormData();
      formData.append("titulo", mural.titulo);
      formData.append("tecnica", mural.tecnica);
      formData.append("anio", mural.anio.toString());
      formData.append("descripcion", mural.descripcion || "");
      formData.append("autor", mural.autor || "");
      if (mural.artistId && mural.artistId.trim() !== "") {
        formData.append("artistId", mural.artistId);
      }
      formData.append("userId", mural.userId || session?.user?.id || "");
      formData.append("url_imagen", url_imagen);
      if (modelo3dUrl) {
        formData.append("modelo3dUrl", modelo3dUrl);
      }

      // Campos faltantes
      if (mural.dimensiones) {
        formData.append("dimensiones", mural.dimensiones);
      }
      if (mural.latitud) {
        formData.append("latitud", mural.latitud.toString());
      }
      if (mural.longitud) {
        formData.append("longitud", mural.longitud.toString());
      }
      if (mural.ubicacion) {
        formData.append("ubicacion", mural.ubicacion);
      }
      if (mural.salaId) {
        formData.append("salaId", mural.salaId.toString());
      }
      if (mural.estado) {
        formData.append("estado", mural.estado);
      }
      if (mural.publica !== undefined) {
        formData.append("publica", mural.publica.toString());
      }
      if (mural.destacada !== undefined) {
        formData.append("destacada", mural.destacada.toString());
      }
      if (mural.orden !== undefined) {
        formData.append("orden", mural.orden.toString());
      }
      if (mural.tags && mural.tags.length > 0) {
        formData.append("tags", JSON.stringify(mural.tags));
      }
      if (mural.colaboradores && mural.colaboradores.length > 0) {
        formData.append("colaboradores", JSON.stringify(mural.colaboradores));
      }

      // Debug: mostrar qué datos se están enviando
      console.log("📤 Enviando datos a la API:", {
        titulo: mural.titulo,
        tecnica: mural.tecnica,
        anio: mural.anio,
        descripcion: mural.descripcion,
        autor: mural.autor,
        artistId:
          mural.artistId && mural.artistId.trim() !== ""
            ? mural.artistId
            : "No enviado",
        userId: mural.userId || session?.user?.id,
        url_imagen: url_imagen,
        modelo3dUrl: modelo3dUrl || "No generado",
        dimensiones: mural.dimensiones || "No especificadas",
        latitud: mural.latitud || "No especificada",
        longitud: mural.longitud || "No especificada",
        ubicacion: mural.ubicacion || "No especificada",
        salaId: mural.salaId || "No especificada",
        estado: mural.estado || "No especificado",
        publica: mural.publica,
        destacada: mural.destacada,
        orden: mural.orden,
        tags: mural.tags || [],
        colaboradores: mural.colaboradores || [],
        artistListLength: artistList.length,
        availableArtistIds: artistList.map((a) => a.id),
      });

      // Enviar a la API
      const response = await fetch("/api/murales", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Obra creada exitosamente:", result);

        // Mostrar mensaje de éxito
        setSuccessMessage("¡Obra creada exitosamente!");

        // Limpiar localStorage
        localStorage.removeItem("muralDraftData");
        localStorage.removeItem("muralStep");
        localStorage.removeItem("canvasImage");

        // Redirigir después de un breve delay para mostrar el mensaje
        setTimeout(() => {
          router.push("/mis-obras");
        }, 1000);
      } else {
        let errorMsg = "Error al crear la obra";
        let errorDetails = "";
        try {
          const error = await response.json();
          console.error("❌ Error de la API:", error);
          if (error && error.message) errorMsg = error.message;
          if (error && error.details) errorDetails = error.details;
        } catch (e) {
          console.error("❌ Error parseando respuesta:", e);
        }
        console.error(
          "❌ Status:",
          response.status,
          "StatusText:",
          response.statusText
        );
        setApiError({ message: errorMsg, details: errorDetails });
      }
    } catch (error) {
      setApiError({
        message: "Error al crear la obra",
        details: error.message,
      });
      console.error(error);
    } finally {
      setIsCreating(false);
    }
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

      {/* Botón de debug temporal */}
      <div className="flex justify-center mb-4 gap-2">
        <button
          onClick={() => {
            console.log("🔍 Estado actual del mural:", mural);
            console.log("📂 localStorage:", {
              muralDraftData: localStorage.getItem("muralDraftData"),
              muralStep: localStorage.getItem("muralStep"),
              canvasImage: localStorage.getItem("canvasImage"),
            });
            console.log("👤 Session:", session);
            console.log("🎯 Step actual:", step);
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
        >
          🔍 Debug Estado
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("muralDraftData");
            localStorage.removeItem("muralStep");
            localStorage.removeItem("canvasImage");
            console.log("🧹 localStorage limpiado");
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
        >
          🧹 Limpiar localStorage
        </button>
        <button
          onClick={() => {
            const savedData = localStorage.getItem("muralDraftData");
            if (savedData) {
              try {
                const parsedData = JSON.parse(savedData);
                setMural(parsedData);
                console.log(
                  "🔄 Datos restaurados desde localStorage:",
                  parsedData
                );
              } catch (error) {
                console.error("❌ Error restaurando datos:", error);
              }
            } else {
              console.log("📭 No hay datos guardados en localStorage");
            }
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
        >
          🔄 Restaurar Datos
        </button>
      </div>

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
          {step === 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Completa los datos básicos de tu obra
            </p>
          )}
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
            muralData={mural}
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
          <AutoresColaboradoresStep
            mural={mural}
            setMural={setMural}
            artistList={artistList}
          />
        )}
        {/* Step 6: Confirmación */}
        {step === 5 && (
          <div className="flex flex-col gap-10 mb-8">
            {successMessage ? (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="text-green-500 h-6 w-6" />
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">
                    ¡Éxito!
                  </h3>
                </div>
                <p className="text-green-700 dark:text-green-300 mb-4">
                  {successMessage}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400 mb-4">
                  Redirigiendo a tus obras...
                </p>
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">
                      Modelo 3D generado y listo para AR
                    </span>
                  </div>
                </div>
              </div>
            ) : apiError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="text-red-500 h-6 w-6" />
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                    Error al crear la obra
                  </h3>
                </div>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {apiError.message}
                </p>
                {apiError.details && (
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    Detalles: {apiError.details}
                  </p>
                )}
                <div className="flex gap-3">
                  <Button
                    onClick={() => {
                      setApiError(null);
                      handleCreateMural();
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Reintentar
                  </Button>
                  <Button onClick={() => setApiError(null)} variant="outline">
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="flex-shrink-0 flex flex-col items-center">
                    {mural.url_imagen ? (
                      <img
                        src={mural.url_imagen}
                        alt="preview"
                        className="w-[320px] h-[320px] object-contain rounded-2xl border-4 border-indigo-400 shadow-lg bg-white"
                      />
                    ) : (
                      <div className="w-[320px] h-[320px] flex items-center justify-center rounded-2xl border-4 border-dashed border-gray-300 bg-gray-50 dark:bg-neutral-800 text-gray-400 text-lg">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <div className="flex-1 max-w-md w-full flex flex-col justify-center items-center h-full">
                    <div className="w-full max-w-xs mx-auto flex flex-col justify-center">
                      <h3 className="text-2xl font-bold mb-4 text-foreground text-center">
                        Datos de la obra
                      </h3>
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">
                            Se generará automáticamente un modelo 3D para AR
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3 text-base w-full">
                        <div className="flex gap-2 justify-start">
                          <span className="font-semibold w-28 text-right">
                            Título:
                          </span>{" "}
                          <span className="truncate text-left">
                            {mural.titulo}
                          </span>
                        </div>
                        <div className="flex gap-2 justify-start">
                          <span className="font-semibold w-28 text-right">
                            Técnica:
                          </span>{" "}
                          <span className="text-left">{mural.tecnica}</span>
                        </div>
                        <div className="flex gap-2 justify-start">
                          <span className="font-semibold w-28 text-right">
                            Año:
                          </span>{" "}
                          <span className="text-left">{mural.anio}</span>
                        </div>
                        <div className="flex gap-2 justify-start">
                          <span className="font-semibold w-28 text-right">
                            Ubicación:
                          </span>{" "}
                          <span className="text-left">
                            {mural.ubicacion || (
                              <span className="italic text-gray-400">
                                No especificada
                              </span>
                            )}
                          </span>
                        </div>
                        {mural.descripcion && (
                          <div className="flex gap-2 items-start justify-start">
                            <span className="font-semibold w-28 text-right">
                              Descripción:
                            </span>{" "}
                            <span className="whitespace-pre-line text-left">
                              {mural.descripcion}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  className="mt-4"
                  onClick={handleCreateMural}
                  disabled={isCreating || generatingModel}
                >
                  {isCreating ? (
                    generatingModel ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        {modelGenerationStep || "Generando modelo 3D..."}
                      </div>
                    ) : (
                      "Creando obra..."
                    )
                  ) : (
                    "Crear obra"
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
        {/* Navegación */}
        <div className="flex gap-2 justify-end mt-8">
          {/* Botón de debug temporal */}
          <Button
            variant="ghost"
            onClick={() => {
              console.log("🔍 Estado actual del mural:", mural);
              console.log("📂 localStorage:", {
                muralDraftData: localStorage.getItem("muralDraftData"),
                muralStep: localStorage.getItem("muralStep"),
                canvasImage: !!localStorage.getItem("canvasImage"),
              });
              alert(
                `Estado del mural:\nTítulo: ${mural.titulo || "Vacío"}\nTécnica: ${mural.tecnica || "Vacío"}\nAño: ${mural.anio || "Vacío"}\nImagen: ${mural.url_imagen ? "Sí" : "No"}`
              );
            }}
            className="text-blue-600 hover:text-blue-700"
          >
            Debug Estado
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (
                confirm("¿Estás seguro de que quieres limpiar el borrador?")
              ) {
                localStorage.removeItem("muralDraftData");
                localStorage.removeItem("muralStep");
                localStorage.removeItem("canvasImage");
                setSuccessMessage(null);
                setApiError(null);
                setMural({
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
                setStep(0);
                setErrors({});
              }
            }}
            className="text-red-600 hover:text-red-700"
          >
            Limpiar borrador
          </Button>
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
function AutoresColaboradoresStep({ mural, setMural, artistList }) {
  const usuarios = useUsuarios();

  // Opciones para react-select
  const userOptions = usuarios.map((u) => ({
    value: u.id,
    label: u.name ? `${u.name} (${u.email})` : u.email,
  }));

  // Opciones para artistas (usando artistList del componente padre)
  const artistOptions = artistList.map((artist) => ({
    value: artist.id,
    label: artist.user?.name
      ? `${artist.user.name} (Artista)`
      : `Artista ${artist.id}`,
  }));

  // Para autor principal, puedes usar name o id según tu modelo
  const autorOption =
    userOptions.find((opt) => opt.value === mural.autor) || null;
  const artistaOption =
    artistOptions.find((opt) => opt.value === mural.artistId) || null;
  const colaboradoresOptions = userOptions.filter((opt) =>
    (mural.colaboradores || []).includes(opt.value)
  );

  // Función para manejar cambios en autor (texto libre)
  const handleAutorChange = (opt) => {
    setMural((m) => ({
      ...m,
      autor: opt ? opt.value : "",
      // Limpiar artistId si se selecciona un autor
      artistId: opt ? "" : m.artistId,
    }));
  };

  // Función para manejar cambios en artista (referencia)
  const handleArtistChange = (opt) => {
    setMural((m) => ({
      ...m,
      artistId: opt ? opt.value : "",
      // Limpiar autor si se selecciona un artista
      autor: opt ? "" : m.autor,
    }));
  };

  return (
    <div className="flex flex-col gap-6 mb-8">
      <div>
        <label className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200">
          Autor principal (texto libre)
        </label>
        <input
          type="text"
          placeholder="Escribe el nombre del autor"
          value={mural.autor || ""}
          onChange={(e) => {
            setMural((m) => ({
              ...m,
              autor: e.target.value,
              artistId: "", // Limpiar artista si se escribe autor
            }));
          }}
          className="input-stepper"
          disabled={!!mural.artistId}
        />
        {mural.artistId && (
          <p className="text-sm text-orange-600 mt-1">
            ⚠️ Desactiva el artista para poder escribir el autor
          </p>
        )}
      </div>

      <div>
        <label className="block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200">
          Artista (opcional - excluye autor)
        </label>
        <ReactSelect
          inputId="artistId"
          classNamePrefix="react-select"
          options={artistOptions}
          value={artistaOption}
          onChange={handleArtistChange}
          placeholder="Selecciona un artista (excluye autor)"
          isClearable
          isDisabled={!!mural.autor}
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
        {mural.autor && (
          <p className="text-sm text-orange-600 mt-1">
            ⚠️ Desactiva el autor para poder seleccionar un artista
          </p>
        )}
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
