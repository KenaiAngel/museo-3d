"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";

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
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar colección del usuario
  const loadCollection = useCallback(async () => {
    if (!session?.user?.id) {
      setCollection([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/collection");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCollection(Array.isArray(data) ? data : (data.items || []));
    } catch (err) {
      console.error("Error loading collection:", err);
      setError(err.message);
      setCollection([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  // Agregar obra a la colección
  const addToCollection = useCallback(
    async (artworkId, artworkType = "mural", artworkData = {}) => {
      if (!session?.user?.id) {
        throw new Error(
          "Debes iniciar sesión para agregar obras a tu colección"
        );
      }

      try {
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

        const result = await response.json();

        // Actualizar la colección local
        setCollection((prev) => [...prev, result.item]);

        return result;
      } catch (error) {
        console.error("Error adding to collection:", error);
        throw error;
      }
    },
    [session?.user?.id]
  );

  // Remover obra de la colección
  const removeFromCollection = useCallback(
    async (itemId) => {
      if (!session?.user?.id) {
        throw new Error("Debes iniciar sesión para modificar tu colección");
      }

      try {
        const response = await fetch(`/api/collection?itemId=${itemId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Error al remover obra de la colección"
          );
        }

        // Actualizar la colección local
        setCollection((prev) => prev.filter((item) => item.id !== itemId));

        return await response.json();
      } catch (error) {
        console.error("Error removing from collection:", error);
        throw error;
      }
    },
    [session?.user?.id]
  );

  // Verificar si una obra está en la colección
  const isInCollection = useCallback(
    (artworkId) => {
      return collection.some((item) => item && item.id && item.id.toString() === artworkId.toString());
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

  // Cargar colección cuando cambie la sesión
  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const value = {
    collection,
    loading,
    error,
    addToCollection,
    removeFromCollection,
    isInCollection,
    getCollectionStats,
    refreshCollection: loadCollection,
  };

  return (
    <CollectionContext.Provider value={value}>
      {children}
    </CollectionContext.Provider>
  );
};
