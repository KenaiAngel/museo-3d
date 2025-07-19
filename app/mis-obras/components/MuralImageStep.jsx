"use client";

import { useState, useRef, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import Upload from "lucide-react/dist/esm/icons/upload";
import Image from "next/image";
import CanvasEditor from "./CanvasEditor";
import { useFileUpload } from "../hooks/useFileUpload";
import { useRouter } from "next/navigation";

export default function MuralImageStep({ value, onChange, muralData = {} }) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [localImage, setLocalImage] = useState(null); // base64 o File
  const [canvasImage, setCanvasImage] = useState(null);
  const canvasRef = useRef();

  // Cargar imagen del canvas desde localStorage si existe
  useEffect(() => {
    const savedCanvasImage = localStorage.getItem("canvasImage");
    if (savedCanvasImage) {
      setCanvasImage(savedCanvasImage);
      onChange?.(savedCanvasImage);
      // No limpiar localStorage aquí, dejar que el stepper lo maneje
    }
  }, [onChange]);

  // Subida de imagen (solo local, no Cloudinary)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setLocalImage(ev.target.result);
        setCanvasImage(null);
        onChange?.(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Guardar imagen del canvas (base64)
  const handleCanvasSave = (imgDataUrl) => {
    setCanvasImage(imgDataUrl);
    setLocalImage(null);
    onChange?.(imgDataUrl);
  };

  // Preview: prioriza canvas sobre upload
  const previewUrl = canvasImage || localImage || value;

  // Info de archivo (siempre que haya preview)
  let fileName = null;
  let fileSize = null;
  if (previewUrl) {
    if (typeof previewUrl === "string" && previewUrl.startsWith("data:")) {
      // Imagen generada o seleccionada (base64)
      fileName = canvasImage ? "Imagen generada" : "Imagen seleccionada";
      const b64 = previewUrl.split(",")[1] || "";
      fileSize = Math.round(
        (b64.length * 3) / 4 -
          (b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0)
      );
    } else if (
      typeof previewUrl === "object" &&
      previewUrl.name &&
      previewUrl.size
    ) {
      fileName = previewUrl.name;
      fileSize = previewUrl.size;
    } else {
      // Si es una URL (ejemplo: edición de mural existente)
      fileName = "Imagen existente";
      fileSize = null;
    }
  }

  // Custom Tabs UI
  const tabList = [
    {
      label: "Subir imagen",
      icon: <Upload size={20} />,
    },
    {
      label: "Dibujar mural",
      icon: (
        <span role="img" aria-label="Dibujar">
          🎨
        </span>
      ),
    },
  ];

  return (
    <Box sx={{ width: "100%", minHeight: 480 }}>
      {/* Custom Tabs */}
      <div className="flex justify-center gap-4 mb-4">
        {tabList.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setTab(i)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full border transition-all font-semibold text-base focus:outline-none
              ${
                tab === i
                  ? "bg-indigo-600 text-white border-indigo-700 shadow-md dark:bg-indigo-500 dark:text-white"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-neutral-800 dark:text-gray-200 dark:border-neutral-700 dark:hover:bg-neutral-700 dark:hover:text-indigo-300"
              }
            `}
            type="button"
            aria-selected={tab === i}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      {tab === 0 && !previewUrl && (
        <div
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 mb-2 w-full transition-all cursor-pointer
            border-gray-300 bg-gray-50 dark:bg-neutral-900/70
            hover:border-indigo-400 hover:bg-indigo-50 dark:hover:border-indigo-400 dark:hover:bg-neutral-800/80
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center cursor-pointer"
          >
            <Upload
              size={56}
              className="mb-3 text-indigo-400 dark:text-indigo-300"
            />
            <span className="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-100">
              Arrastra una imagen o haz click para subir
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Formatos soportados: JPG, PNG, GIF, WebP
            </span>
          </label>
        </div>
      )}
      {tab === 1 && !previewUrl && (
        <div
          className="flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 mb-2 w-full transition-all
          border-gray-300 bg-gray-50 dark:bg-neutral-900/70
          hover:border-indigo-400 hover:bg-indigo-50 dark:hover:border-indigo-400 dark:hover:bg-neutral-800/80
        "
        >
          <div className="flex flex-col items-center text-center">
            <span role="img" aria-label="Dibujar" className="text-6xl mb-4">
              🎨
            </span>
            <h3 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-100">
              Editor de dibujo dedicado
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Accede a un editor de dibujo completo con herramientas
              profesionales, más espacio de trabajo y mejor experiencia de
              usuario.
            </p>
            <button
              onClick={() => {
                // Guardar datos actuales en localStorage antes de navegar
                const currentData = {
                  titulo: muralData.titulo || "",
                  tecnica: muralData.tecnica || "",
                  year: muralData.anio || muralData.year || undefined,
                  descripcion: muralData.descripcion || "",
                };
                localStorage.setItem(
                  "muralDraftData",
                  JSON.stringify(currentData)
                );

                // Navegar a la página del canvas
                router.push("/mis-obras/crear/canvas");
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              style={{ cursor: "pointer" }}
            >
              Abrir editor de dibujo
            </button>
          </div>
        </div>
      )}
      {previewUrl && (
        <div className="flex flex-col items-center mt-2">
          <div className="relative inline-block">
            <button
              type="button"
              className="absolute top-0.5 right-1 w-8 h-8 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg focus:outline-none z-10"
              style={{ transform: "translate(50%,-50%)" }}
              onClick={() => {
                setLocalImage(null);
                setCanvasImage(null);
                onChange?.(null);
              }}
              aria-label="Eliminar imagen"
            >
              <span className="text-xl leading-tight flex items-center justify-center">
                ×
              </span>
            </button>
            {previewUrl.startsWith("data:") ? (
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  maxWidth: 320,
                  maxHeight: 240,
                  borderRadius: 8,
                  boxShadow: "0 2px 8px #0002",
                }}
              />
            ) : (
              <Image
                src={previewUrl}
                alt="Preview"
                width={320}
                height={240}
                style={{ borderRadius: 8, boxShadow: "0 2px 8px #0002" }}
              />
            )}
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
              {fileName && <span className="font-semibold">{fileName}</span>}
              {fileName && fileSize !== null && fileSize !== undefined && " · "}
              {fileSize !== null && fileSize !== undefined && (
                <span>{(fileSize / 1024).toFixed(1)} KB</span>
              )}
            </div>
          </div>
          {/* Sin texto de 'Vista previa:' */}
        </div>
      )}
    </Box>
  );
}
