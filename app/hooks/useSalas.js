import { useState, useEffect } from "react";

export default function useSalas() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/salas")
      .then((res) => res.json())
      .then((data) => setSalas(data.salas || []))
      .finally(() => setLoading(false));
  }, []);

  return { salas, loading };
}
