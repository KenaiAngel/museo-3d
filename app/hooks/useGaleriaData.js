import { useState, useEffect } from "react";

export default function useGaleriaData() {
  const [salas, setSalas] = useState([]);
  const [murales, setMurales] = useState([]);
  const [allMurales, setAllMurales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMurales, setLoadingMurales] = useState(false);
  const [selectedSala, setSelectedSala] = useState(null);
  const [allMuralesLoaded, setAllMuralesLoaded] = useState(false);

  useEffect(() => {
    const fetchSalas = async () => {
      try {
        setLoading(true);
        const salasResponse = await fetch("/api/salas");
        if (salasResponse.ok) {
          const salasData = await salasResponse.json();
          setSalas(salasData.salas || []);
          if (salasData.salas && salasData.salas.length > 0) {
            setSelectedSala(salasData.salas[0].id);
            fetchMuralesDeSala(salasData.salas[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSalas();
    // eslint-disable-next-line
  }, []);

  const fetchMuralesDeSala = async (salaId) => {
    try {
      setLoadingMurales(true);
      const response = await fetch(`/api/salas/${salaId}/murales`);
      if (response.ok) {
        const data = await response.json();
        setMurales(data.murales || []);
      }
    } finally {
      setLoadingMurales(false);
    }
  };

  const handleSalaSelect = async (salaId) => {
    setSelectedSala(salaId);
    fetchMuralesDeSala(salaId);
  };

  // Solo fetch de todos los murales si se requiere (vista archivo)
  const fetchAllMurales = async () => {
    if (allMuralesLoaded) return;
    setLoading(true);
    try {
      const muralesResponse = await fetch("/api/murales");
      if (muralesResponse.ok) {
        const muralesData = await muralesResponse.json();
        setAllMurales(muralesData.murales || []);
        setAllMuralesLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    salas,
    murales,
    allMurales,
    loading,
    loadingMurales,
    selectedSala,
    setSelectedSala,
    handleSalaSelect,
    fetchAllMurales,
  };
}
