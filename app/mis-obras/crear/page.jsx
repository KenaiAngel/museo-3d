"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CrearObraModal from "../components/CrearObraModal";
import { AnimatedBackground } from "../../../components/shared";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "../../../components/ProtectedRoute";
import { Button } from "../../components/ui/button";
import { useUser } from '../../../providers/UserProvider';
import { generateSimpleGLB } from "../../../utils/generateSimpleGLB";
import { uploadModelToCloudinary } from "../../../utils/uploadToCloudinary";
import toast from "react-hot-toast";

export default function CrearObraPage() {
  const router = useRouter();
  const [created, setCreated] = useState(false);
  const { user, userProfile } = useUser();

  // Botón de prueba para subir un modelo GLB simple
  const handleTestSimpleGLB = async () => {
    try {
      const glbBlob = await generateSimpleGLB();
      const url = await uploadModelToCloudinary(glbBlob, "test-simple.glb");
      toast.success("Modelo simple subido: " + url);
      window.open(url, "_blank");
    } catch (err) {
      toast.error("Error al subir modelo simple");
      console.error(err);
    }
  };

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
              <CrearObraModal
                isOpen={true}
                asPage={true}
                onClose={null}
                onCreate={() => {
                  setCreated(true);
                  setTimeout(() => router.push("/mis-obras"), 1200);
                }}
                session={{ user: userProfile || user }}
                hideClose={true}
              />
              {/* Botón temporal para pruebas de modelo GLB simple */}
              <button
                onClick={handleTestSimpleGLB}
                className="mt-8 px-4 py-2 bg-blue-600 text-white rounded shadow-lg hover:bg-blue-700"
              >
                Subir modelo GLB simple (prueba)
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
