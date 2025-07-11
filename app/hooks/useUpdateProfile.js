"use client";
import { useState } from "react";
import { useSession, getSession } from "next-auth/react";
import { useUser } from "../../providers/UserProvider";

export const useUpdateProfile = () => {
  const { data: session, update } = useSession();
  const { loadUserProfile } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const updateProfile = async (formData) => {
    if (!session?.user?.id) {
      setError("Debes iniciar sesión para actualizar tu perfil");
      return false;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Si hay una imagen, subirla primero
      let imageUrl = session.user.image;
      if (formData.image && formData.image instanceof File) {
        const uploadFormData = new FormData();
        uploadFormData.append("imagen", formData.image); // Cambiar "file" por "imagen"
        uploadFormData.append("folder", "avatars");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (res.ok) {
          const uploadData = await res.json();
          imageUrl = uploadData.url;
        } else {
          throw new Error("Error al subir la imagen");
        }
      }

      // Actualizar el perfil del usuario
      const updateData = {
        name: formData.name,
        email: formData.email,
        image: imageUrl,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
      };

      const res = await fetch(
        `/api/usuarios/${session.user.id}?t=${Date.now()}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (res.ok) {
        const updatedUser = await res.json();

        // Actualizar la sesión con los nuevos datos
        const newUserData = {
          ...session.user,
          name: updatedUser.usuario?.name || updatedUser.name || formData.name,
          email:
            updatedUser.usuario?.email ||
            updatedUser.email ||
            session.user.email,
          image: updatedUser.usuario?.image || updatedUser.image || imageUrl,
        };

        await update({
          name: newUserData.name,
          image: newUserData.image,
        });

        // Forzar refetch de la sesión
        await getSession();

        // Actualizar el UserProvider
        if (loadUserProfile && session.user.email) {
          await loadUserProfile(session.user.email);
        }

        setSuccess(true);
        return true;
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError(error.message || "Error al actualizar el perfil");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProfile,
    loading,
    error,
    success,
  };
};
