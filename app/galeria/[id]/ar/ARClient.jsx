"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const ARExperience = dynamic(
  () => import("../../../../components/ar/ARExperience"),
  { ssr: false }
);

export default function ARClient({ modelUrl, muralData }) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  // Verificar si hay contenido para mostrar
  if (!modelUrl) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
          color: "#fff",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: 20 }}>🎨</div>
        <h2 style={{ marginBottom: 16, fontSize: "24px" }}>
          Contenido no disponible
        </h2>
        <p style={{ marginBottom: 24, fontSize: "16px", opacity: 0.8 }}>
          Este mural no tiene modelo 3D disponible para visualizar en AR.
        </p>
        <button
          onClick={handleClose}
          style={{
            background: "rgba(255,255,255,0.9)",
            color: "#1e3c72",
            border: "none",
            padding: "12px 24px",
            borderRadius: 8,
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            backdropFilter: "blur(10px)",
          }}
        >
          ← Volver a la galería
        </button>
      </div>
    );
  }

  // Cargar directamente ARExperience sin página de entrada
  return (
    <ARExperience
      modelUrl={modelUrl}
      onClose={handleClose}
      showCloseButton={true}
      restoreMaterials={true}
    />
  );
}
