"use client";
import React, { createContext,useRef ,useContext, useState, useCallback } from "react";
import * as Sentry from "@sentry/nextjs";

const GalleryContext = createContext();

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error("useGallery must be used within a GalleryProvider");
  }
  return context;
};

export const GalleryProvider = ({ children }) => {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allMurales, setAllMurales] = useState([]);
  
  const [loadingAllMurales, setLoadingAllMurales] = useState(false);
  const [allMuralesLoaded, setAllMuralesLoaded] = useState(false);


  const loadArtworksForRoom = useCallback(async (roomId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/salas/${roomId}/murales`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transformar los datos del nuevo esquema
      const transformedArtworks = data.murales.map((mural) => ({
        id: mural.id,
        title: mural.titulo,
        artist: mural.artista,
        technique: mural.tecnica,
        year: mural.anio,
        description: mural.descripcion,
        imageUrl: mural.imagenUrl,
        imageUrlWebp: mural.imagenUrlWebp,
        location: mural.ubicacion,
        dimensions: mural.dimensiones,
        state: mural.estado,
        latitude: mural.latitud,
        longitude: mural.longitud,
        createdAt: mural.createdAt,
        updatedAt: mural.updatedAt,
        // Campos adicionales para compatibilidad
        url_imagen: mural.imagenUrl,
        nombre: mural.titulo,
        autor: mural.artista,
        medidas: mural.dimensiones,
      }));

      setArtworks(transformedArtworks);

      // Log exitoso de carga de galería
      Sentry.addBreadcrumb({
        message: `Galería cargada exitosamente para sala: ${roomId}`,
        category: "api",
        level: "info",
        data: { roomId, artworkCount: transformedArtworks.length },
      });
    } catch (err) {
      console.error("Error loading artworks:", err);
      setError(err.message);

      // Capturar error en Sentry
      Sentry.captureException(err, {
        tags: {
          action: "load_room_artworks",
          roomId: roomId,
        },
        extra: {
          roomId,
          errorMessage: err.message,
        },
      });
      setArtworks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar todos los murales (para galería general, filtros, carrusel, etc.)
  const fetchAllMurales = useCallback(async (force = false) => {
    if (allMuralesLoaded && !force) return;
    setLoadingAllMurales(true);
    setError(null);
    try {
      const response = await fetch("/api/murales");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAllMurales(data.murales || []);
      setAllMuralesLoaded(true);
    } catch (err) {
      console.error("Error loading all murales:", err);
      setError(err.message);
      setAllMurales([]);
    } finally {
      setLoadingAllMurales(false);
    }
  }, [allMuralesLoaded]);

  const [muralesForScroll, setMuralesForScroll] = useState([]);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [loadingPageMurales, setLoadingPageMurales] = useState(false);
  const pageRef = useRef(0);
  const pageTotalRef = useRef(1);

  const fetchPageMurales = useCallback(async (page = 1) =>{
    if (pageRef.current === page ) return;
    if (page > pageTotalRef.current) return;
    setLoadingPageMurales(true);
    setError(null);
    try{
      pageRef.current = page;
      const response = await fetch(`/api/murales/?page=${page}`);
      const data = await response.json();
      pageTotalRef.current = data.filtros.paginationInfo.totalPages;
      console.log("Si entre",data,pageTotalRef);
      setMuralesForScroll(prev=>[...prev,...data.murales]);
      setPageLoaded(true);
      
    } catch (err) {
      console.error(`Error loading ${page} from murales:`, err);
      setError(err.message);
      setMuralesForScroll([]);
    } finally {
      setLoadingPageMurales(false);
    }
  }, []);


  const getGalleryStats = useCallback(() => {
    if (artworks.length === 0) {
      return {
        totalArtworks: 0,
        uniqueArtists: 0,
        uniqueTechniques: 0,
        oldestYear: null,
        newestYear: null,
      };
    }

    const artists = new Set(artworks.map((a) => a.artist).filter(Boolean));
    const techniques = new Set(
      artworks.map((a) => a.technique).filter(Boolean)
    );
    const years = artworks
      .map((a) => a.year)
      .filter(Boolean)
      .sort((a, b) => a - b);

    return {
      totalArtworks: artworks.length,
      uniqueArtists: artists.size,
      uniqueTechniques: techniques.size,
      oldestYear: years.length > 0 ? years[0] : null,
      newestYear: years.length > 0 ? years[years.length - 1] : null,
    };
  }, [artworks]);

  const addArtworkToCollection = useCallback(
    async (artworkId, artworkType = "mural") => {
      try {
        const response = await fetch("/api/collection", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            artworkId: artworkId.toString(),
            artworkType,
            artworkData: {
              id: artworkId,
              type: artworkType,
              addedAt: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to add artwork to collection");
        }

        return await response.json();
      } catch (error) {
        console.error("Error adding artwork to collection:", error);
        throw error;
      }
    },
    []
  );

  const removeArtworkFromCollection = useCallback(async (itemId) => {
    try {
      const response = await fetch(`/api/collection?itemId=${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove artwork from collection");
      }

      return await response.json();
    } catch (error) {
      console.error("Error removing artwork from collection:", error);
      throw error;
    }
  }, []);

  const value = {
    artworks,
    loading,
    error,
    loadArtworksForRoom,
    getGalleryStats,
    addArtworkToCollection,
    removeArtworkFromCollection,
    // NUEVO: para galería general
    allMurales,
    loadingAllMurales,
    fetchAllMurales,
    //INFINITE SCROLL en galeria general
    muralesForScroll,
    loadingPageMurales,
    fetchPageMurales,
    setMuralesForScroll,
    pageTotalRef,
  };

  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  );
};
