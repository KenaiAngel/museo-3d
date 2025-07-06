"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export function useFileUpload(onUploadSuccess) {
  const { data: session } = useSession();

  const onDrop = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("imagen", file);
      formData.append("titulo", file.name.split(".")[0]);
      formData.append("tecnica", "Fotografía/Digital");
      formData.append("year", new Date().getFullYear());
      formData.append("autor", session?.user?.name || "Usuario");

      try {
        const response = await fetch("/api/murales", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          onUploadSuccess?.(result);
          toast.success("Obra subida exitosamente");
          return result;
        } else {
          toast.error("Error al subir la obra");
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Error al subir la obra");
      }
    },
    [session, onUploadSuccess]
  );

  const dropzoneConfig = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
  });

  return dropzoneConfig;
}
