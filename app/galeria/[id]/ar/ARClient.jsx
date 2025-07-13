"use client";

import dynamic from "next/dynamic";

const ARExperience = dynamic(() => import("../../../../components/ar/ARExperience"), { ssr: false });

export default function ARClient({ modelUrl }) {
  if (!modelUrl) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Este mural no tiene modelo 3D disponible para AR.
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ARExperience modelUrl={modelUrl} />
    </div>
  );
}
