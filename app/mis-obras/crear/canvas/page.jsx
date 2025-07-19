"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Download } from "lucide-react";
import CanvasEditorPage from "../../components/CanvasEditorPage";
import { AnimatedBackground } from "../../../../components/shared";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function CanvasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Obtener datos del mural desde URL params o localStorage
  const [muralData, setMuralData] = useState({
    titulo: searchParams.get("titulo") || "",
    tecnica: searchParams.get("tecnica") || "",
    year: searchParams.get("year")
      ? parseInt(searchParams.get("year"))
      : undefined,
    descripcion: searchParams.get("descripcion") || "",
  });

  const [canvasImage, setCanvasImage] = useState(null);

  // Cargar datos desde localStorage si no están en URL
  useEffect(() => {
    const savedData = localStorage.getItem("muralDraftData");
    if (savedData && !searchParams.get("titulo")) {
      try {
        const parsed = JSON.parse(savedData);
        setMuralData((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Error parsing saved mural data:", error);
      }
    }
  }, [searchParams]);

  // Guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem("muralDraftData", JSON.stringify(muralData));
  }, [muralData]);

  const handleCanvasSave = (imageDataUrl) => {
    setCanvasImage(imageDataUrl);
    toast.success("Dibujo guardado correctamente");
  };

  const handleContinue = () => {
    if (!canvasImage) {
      toast.error("Debes guardar tu dibujo antes de continuar");
      return;
    }

    // Guardar la imagen del canvas en localStorage
    localStorage.setItem("canvasImage", canvasImage);

    // Regresar al stepper en el paso 1 (imágenes)
    router.push("/mis-obras/crear");
  };

  const handleBack = () => {
    router.push("/mis-obras/crear");
  };

  const handleDownload = () => {
    if (!canvasImage) {
      toast.error("No hay dibujo para descargar");
      return;
    }

    const link = document.createElement("a");
    link.download = `${muralData.titulo || "obra"}.png`;
    link.href = canvasImage;
    link.click();
    toast.success("Dibujo descargado");
  };

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen">
        <AnimatedBackground />

        {/* Header */}
        <div className="relative z-10 fixed top-0 left-0 right-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="text-muted-foreground hover:text-foreground"
                style={{ cursor: "pointer" }}
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Crear obra - Editor de dibujo
                </h1>
                <p className="text-sm text-muted-foreground">
                  {muralData.titulo ? `"${muralData.titulo}"` : "Sin título"}
                  {muralData.tecnica && ` • ${muralData.tecnica}`}
                  {muralData.year && ` • ${muralData.year}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {canvasImage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2"
                  style={{ cursor: "pointer" }}
                >
                  <Download className="h-4 w-4" />
                  Descargar
                </Button>
              )}

              <Button
                onClick={handleContinue}
                disabled={!canvasImage}
                className="flex items-center gap-2"
                style={{ cursor: "pointer" }}
              >
                <Save className="h-4 w-4" />
                Continuar
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Editor */}
        <div className="relative z-10 pt-20 pb-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-7xl mx-auto"
          >
            <div className="bg-white/90 dark:bg-neutral-900/90 rounded-2xl shadow-xl border border-border overflow-hidden p-6">
              <CanvasEditorPage
                onSave={handleCanvasSave}
                editingMural={muralData}
              />
            </div>
          </motion.div>
        </div>

        {/* Indicador de progreso */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-border">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Datos básicos</span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-foreground">
                  Editor de dibujo
                </span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <span className="text-muted-foreground">Confirmar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
