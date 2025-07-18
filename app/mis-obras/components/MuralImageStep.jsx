"use client";

import { useState, useRef } from "react";
import { Box, Tabs, Tab, Typography, Button } from "@mui/material";
import Upload from "lucide-react/dist/esm/icons/upload";
import Image from "next/image";
import CanvasEditor from "./CanvasEditor";
import { useFileUpload } from "../hooks/useFileUpload";

export default function MuralImageStep({ value, onChange }) {
  const [tab, setTab] = useState(0);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [canvasImage, setCanvasImage] = useState(null);
  const canvasRef = useRef();

  // Subida de imagen
  const { getRootProps, getInputProps, isDragActive } = useFileUpload((result) => {
    if (result?.url) {
      setUploadedImage(result.url);
      setCanvasImage(null);
      onChange?.(result.url);
    }
  });

  // Guardar imagen del canvas
  const handleCanvasSave = (imgDataUrl) => {
    setCanvasImage(imgDataUrl);
    setUploadedImage(null);
    onChange?.(imgDataUrl);
  };

  // Preview: prioriza canvas sobre upload
  const previewUrl = canvasImage || uploadedImage || value;

  return (
    <Box sx={{ width: "100%", minHeight: 480 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered sx={{ mb: 2 }}>
        <Tab icon={<Upload size={20} />} label="Subir imagen" />
        <Tab icon={<span role="img" aria-label="Dibujar">🎨</span>} label="Dibujar mural" />
      </Tabs>
      {tab === 0 && (
        <Box {...getRootProps()}
          sx={{
            border: "2px dashed #888",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            bgcolor: isDragActive ? "#e0e7ff" : "background.paper",
            cursor: "pointer",
            mb: 2,
          }}
        >
          <input {...getInputProps()} />
          <Upload size={48} style={{ color: "#888", marginBottom: 8 }} />
          <Typography variant="h6">
            {isDragActive ? "Suelta la imagen aquí" : "Arrastra una imagen o haz click"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Formatos soportados: JPG, PNG, GIF, WebP
          </Typography>
        </Box>
      )}
      {tab === 1 && (
        <Box sx={{ width: "100%", minHeight: 400, display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
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
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>Vista previa:</Typography>
          {/* Si es base64, usar img, si es url, usar next/image */}
          {previewUrl.startsWith("data:") ? (
            <img src={previewUrl} alt="Preview" style={{ maxWidth: 320, maxHeight: 240, borderRadius: 8, boxShadow: "0 2px 8px #0002" }} />
          ) : (
            <Image src={previewUrl} alt="Preview" width={320} height={240} style={{ borderRadius: 8, boxShadow: "0 2px 8px #0002" }} />
          )}
        </Box>
      )}
    </Box>
  );
} 