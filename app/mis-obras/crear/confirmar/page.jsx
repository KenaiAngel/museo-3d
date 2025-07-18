"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle, Image as ImageIcon } from "lucide-react";
import { AnimatedBackground } from "../../../../components/shared";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

export default function ConfirmarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [muralData, setMuralData] = useState({
    titulo: searchParams.get("titulo") || "",
    tecnica: searchParams.get("tecnica") || "",
    year: searchParams.get("year")
      ? parseInt(searchParams.get("year"))
      : undefined,
    descripcion: searchParams.get("descripcion") || "",
    autor: "",
    artistId: "",
  });

  const [canvasImage, setCanvasImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [artistList, setArtistList] = useState([]);

  // Cargar datos desde localStorage
  useEffect(() => {
    const savedData = localStorage.getItem("muralDraftData");
    const savedCanvasImage = localStorage.getItem("canvasImage");

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setMuralData((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Error parsing saved mural data:", error);
      }
    }

    if (savedCanvasImage) {
      setCanvasImage(savedCanvasImage);
    }
  }, []);

  // Cargar lista de artistas
  useEffect(() => {
    fetch("/api/artists?limit=100")
      .then((res) => res.json())
      .then((data) => setArtistList(data.artists || []))
      .catch(() => setArtistList([]));
  }, []);

  const handleBack = () => {
    if (canvasImage) {
      router.push("/mis-obras/crear/canvas");
    } else {
      router.push("/mis-obras/crear");
    }
  };

  const handleCreate = async () => {
    if (!session?.user?.id) {
      toast.error(
        "No se ha cargado el perfil de usuario. Intenta de nuevo en unos segundos."
      );
      return;
    }

    if (!canvasImage) {
      toast.error("No se encontró la imagen del canvas.");
      return;
    }

    if (!muralData.titulo.trim()) {
      toast.error("El título es requerido");
      return;
    }

    if (!muralData.tecnica.trim()) {
      toast.error("La técnica es requerida");
      return;
    }

    if (!muralData.year) {
      toast.error("El año es requerido");
      return;
    }

    setIsSubmitting(true);

    try {
      // Convertir dataURL a blob
      const res = await fetch(canvasImage);
      const blob = await res.blob();
      const imgFile = new File([blob], `${muralData.titulo || "obra"}.png`, {
        type: "image/png",
      });

      // Crear FormData
      const formData = new FormData();
      formData.append("titulo", muralData.titulo);
      formData.append("tecnica", muralData.tecnica);
      formData.append("year", muralData.year.toString());
      formData.append("descripcion", muralData.descripcion || "");
      formData.append("autor", muralData.autor || "");
      formData.append("artistId", muralData.artistId || "");
      formData.append("imagen", imgFile);

      // Enviar a la API
      const response = await fetch("/api/murales", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Obra creada exitosamente");

        // Limpiar localStorage
        localStorage.removeItem("muralDraftData");
        localStorage.removeItem("canvasImage");

        // Redirigir a mis obras
        router.push("/mis-obras");
      } else {
        let errorMsg = "Error al crear la obra";
        try {
          const error = await response.json();
          if (error && error.message) errorMsg = error.message;
        } catch {}
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error("Error al crear la obra");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
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
                  Crear obra - Confirmar
                </h1>
                <p className="text-sm text-muted-foreground">
                  Revisa los datos antes de crear tu obra
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="relative z-10 pt-20 pb-8 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Datos de la obra */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Datos de la obra
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="titulo">Título</Label>
                      <Input
                        id="titulo"
                        value={muralData.titulo}
                        onChange={(e) =>
                          setMuralData((prev) => ({
                            ...prev,
                            titulo: e.target.value,
                          }))
                        }
                        placeholder="Título de la obra"
                      />
                    </div>

                    <div>
                      <Label htmlFor="tecnica">Técnica</Label>
                      <Input
                        id="tecnica"
                        value={muralData.tecnica}
                        onChange={(e) =>
                          setMuralData((prev) => ({
                            ...prev,
                            tecnica: e.target.value,
                          }))
                        }
                        placeholder="Técnica utilizada"
                      />
                    </div>

                    <div>
                      <Label htmlFor="year">Año</Label>
                      <Input
                        id="year"
                        type="number"
                        value={muralData.year || ""}
                        onChange={(e) =>
                          setMuralData((prev) => ({
                            ...prev,
                            year: parseInt(e.target.value) || undefined,
                          }))
                        }
                        placeholder="Año de creación"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                      />
                    </div>

                    <div>
                      <Label htmlFor="descripcion">Descripción</Label>
                      <Textarea
                        id="descripcion"
                        value={muralData.descripcion}
                        onChange={(e) =>
                          setMuralData((prev) => ({
                            ...prev,
                            descripcion: e.target.value,
                          }))
                        }
                        placeholder="Descripción de la obra (opcional)"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="autor">Autor</Label>
                      <Input
                        id="autor"
                        value={muralData.autor}
                        onChange={(e) =>
                          setMuralData((prev) => ({
                            ...prev,
                            autor: e.target.value,
                          }))
                        }
                        placeholder="Nombre del autor (opcional)"
                      />
                    </div>

                    <div>
                      <Label htmlFor="artistId">Artista registrado</Label>
                      <select
                        id="artistId"
                        value={muralData.artistId || ""}
                        onChange={(e) =>
                          setMuralData((prev) => ({
                            ...prev,
                            artistId: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 rounded-md border-2 text-base bg-background dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-foreground dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-all focus:ring-2 focus:ring-indigo-400 focus:border-indigo-500 hover:border-indigo-400"
                      >
                        <option value="">
                          Selecciona un artista (opcional)
                        </option>
                        {artistList.map((artist) => (
                          <option key={artist.id} value={artist.id}>
                            {artist.user?.name || artist.id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Vista previa de la imagen */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-blue-500" />
                      Vista previa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {canvasImage ? (
                      <div className="space-y-4">
                        <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                          <img
                            src={canvasImage}
                            alt="Vista previa de la obra"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground text-center">
                          Tu dibujo está listo para ser creado como obra
                        </p>
                      </div>
                    ) : (
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <p className="text-muted-foreground">
                          No hay imagen disponible
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Botón de crear */}
                <Card>
                  <CardContent className="pt-6">
                    <Button
                      onClick={handleCreate}
                      disabled={isSubmitting || !canvasImage}
                      className="w-full h-12 text-lg font-semibold"
                      style={{ cursor: "pointer" }}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Creando obra...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          <span>Crear obra</span>
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
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
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Editor de dibujo</span>
              </div>
              <div className="w-px h-4 bg-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium text-foreground">Confirmar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
