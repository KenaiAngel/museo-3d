"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import useSWR, { mutate } from "swr";

const CollectionContext = createContext();

export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error("useCollection must be used within a CollectionProvider");
  }
  return context;
};

export const CollectionProvider = ({ children }) => {
  const { data: session } = useSession();
  const fetcher = async () => {
    if (!session?.user?.id) return [];
    const response = await fetch("/api/collection");
    if (!response.ok) throw new Error("Error al cargar la colección");
    const data = await response.json();
    return Array.isArray(data) ? data : data.items || [];
  };

  const {
    data: collection = [],
    error,
    isLoading: loading,
    mutate: swrMutate,
  } = useSWR(
    session?.user?.id ? ["collection", session.user.id] : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  // Agregar obra a la colección
  const addToCollection = useCallback(
    async (artworkId, artworkType = "mural", artworkData = {}) => {
      if (!session?.user?.id) {
        throw new Error(
          "Debes iniciar sesión para agregar obras a tu colección"
        );
      }
      const response = await fetch("/api/collection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          muralId: Number(artworkId),
          artworkType,
          artworkData: {
            id: artworkId,
            type: artworkType,
            addedAt: new Date().toISOString(),
            ...artworkData,
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al agregar obra a la colección"
        );
      }
      await swrMutate(); // Refresca la colección tras agregar
      return await response.json();
    },
    [session?.user?.id, swrMutate]
  );

  // Remover obra de la colección
  const removeFromCollection = useCallback(
    async (itemId) => {
      if (!session?.user?.id) {
        throw new Error("Debes iniciar sesión para modificar tu colección");
      }
      const response = await fetch(`/api/collection?itemId=${itemId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Error al remover obra de la colección"
        );
      }
      await swrMutate(); // Refresca la colección tras eliminar
      return await response.json();
    },
    [session?.user?.id, swrMutate]
  );

  // Verificar si una obra está en la colección
  const isInCollection = useCallback(
    (artworkId) => {
      return collection.some(
        (item) => item && item.id && item.id.toString() === artworkId.toString()
      );
    },
    [collection]
  );

  // Obtener estadísticas de la colección
  const getCollectionStats = useCallback(() => {
    if (collection.length === 0) {
      return {
        totalItems: 0,
        byType: {},
        oldestItem: null,
        newestItem: null,
      };
    }
    const byType = collection.reduce((acc, item) => {
      const type = item.artworkType || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const sortedByDate = collection
      .map((item) => ({
        ...item,
        addedAt: new Date(item.addedAt || item.createdAt),
      }))
      .sort((a, b) => a.addedAt - b.addedAt);
    return {
      totalItems: collection.length,
      byType,
      oldestItem: sortedByDate[0] || null,
      newestItem: sortedByDate[sortedByDate.length - 1] || null,
    };
  }, [collection]);

  // Refrescar colección manualmente
  const refreshCollection = useCallback(() => swrMutate(), [swrMutate]);

  const value = {
    collection,
    loading,
    error,
    addToCollection,
    removeFromCollection,
    isInCollection,
    getCollectionStats,
    refreshCollection,
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};
