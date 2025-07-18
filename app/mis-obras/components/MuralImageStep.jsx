"use client";

import { useState, useRef } from "react";
import { Box, Typography, Button } from "@mui/material";
import Upload from "lucide-react/dist/esm/icons/upload";
import Image from "next/image";
import CanvasEditor from "./CanvasEditor";
import { useFileUpload } from "../hooks/useFileUpload";

export default function MuralImageStep({ value, onChange }) {
  const [tab, setTab] = useState(0);
  const [localImage, setLocalImage] = useState(null); // base64 o File
  const [canvasImage, setCanvasImage] = useState(null);
  const canvasRef = useRef();

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
        <Box
          sx={{
            width: "100%",
            minHeight: 400,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
          }}
        >
          <CanvasEditor
            isOpen={true}
            onClose={() => {}}
            onSave={handleCanvasSave}
            ref={canvasRef}
          />
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => {
              if (canvasRef.current?.exportImage) {
                const img = canvasRef.current.exportImage();
                handleCanvasSave(img);
              }
            }}
          >
            Guardar dibujo
          </Button>
        </Box>
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
