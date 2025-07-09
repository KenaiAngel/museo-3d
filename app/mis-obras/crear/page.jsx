"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CrearObraModal from "../components/CrearObraModal";
import { AnimatedBackground } from "../../../components/shared";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function CrearObraPage() {
  const router = useRouter();
  const [created, setCreated] = useState(false);

  return (
    <div className="relative">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-0 sm:px-4 pt-24 md:pt-28 pb-2 md:pb-4 min-h-screen flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <button
            onClick={() => router.push("/mis-obras")}
            className="flex items-center gap-2 px-5 py-3 mb-8 rounded-xl bg-muted text-foreground font-bold shadow hover:bg-gray-200 dark:hover:bg-neutral-800 transition w-fit"
          >
            <ArrowLeft className="h-5 w-5" /> Volver a mis obras
          </button>
          <div className="w-full flex justify-center">
            <div className="w-full">
              <CrearObraModal
                isOpen={true}
                asPage={true}
                onClose={() => router.push("/mis-obras")}
                onCreate={() => {
                  setCreated(true);
                  setTimeout(() => router.push("/mis-obras"), 1200);
                }}
                session={null}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
} 