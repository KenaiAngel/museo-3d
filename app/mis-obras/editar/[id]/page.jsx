"use client";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import CrearObraModal from "../../components/CrearObraModal";
import AnimatedBackground from "../../../../components/shared/AnimatedBackground";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import { Button } from "../../../../app/components/ui/button";
import { useUser } from "../../../../providers/UserProvider";

export default function EditarObraPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [obra, setObra] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, userProfile } = useUser();

  useEffect(() => {
    async function fetchObra() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/murales/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar la obra");
        const data = await res.json();
        setObra(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchObra();
  }, [id]);

  // Solo el dueño puede editar
  const isOwner =
    obra && (userProfile?.id === obra.userId || user?.id === obra.userId);

  if (loading) return <div className="pt-32 text-center">Cargando obra...</div>;
  if (error)
    return <div className="pt-32 text-center text-red-500">{error}</div>;
  if (!obra) return <div className="pt-32 text-center">Obra no encontrada</div>;
  if (!isOwner)
    return (
      <div className="pt-32 text-center text-red-500">
        No tienes permiso para editar esta obra.
      </div>
    );

  return (
    <ProtectedRoute>
      <div className="relative">
        <AnimatedBackground />
        <div className="relative z-10 w-full max-w-5xl mx-auto px-0 sm:px-4 pt-24 md:pt-28 pb-2 md:pb-4 min-h-screen flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="w-full flex flex-col gap-4 items-start">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Volver
              </Button>
              <CrearObraModal
                isOpen={true}
                asPage={true}
                onClose={null}
                onCreate={() => {
                  setTimeout(() => router.push("/mis-obras"), 1200);
                }}
                session={{ user: userProfile || user }}
                hideClose={true}
                initialData={obra}
                editMode={true}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
