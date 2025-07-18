"use client";
import { useState } from "react";
import { useUser } from "@/providers/UserProvider";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function PushTestPage() {
  const { isAdmin } = useUser();
  const [message, setMessage] = useState("¡Notificación push de prueba!");
  const [url, setUrl] = useState("https://museo-3d.vercel.app/");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  if (!isAdmin) return <ProtectedRoute />;

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/push-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, url }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ error: err.message });
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto mt-16 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4">Prueba de Push Notifications</h1>
      <form onSubmit={handleSend} className="flex flex-col gap-4">
        <label className="font-semibold">Mensaje</label>
        <input
          className="border rounded px-3 py-2"
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <label className="font-semibold">URL al hacer click</label>
        <input
          className="border rounded px-3 py-2"
          value={url}
          onChange={e => setUrl(e.target.value)}
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white rounded px-4 py-2 font-bold mt-2 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar notificación push"}
        </button>
      </form>
      {result && (
        <div className="mt-4 text-sm">
          {result.error ? (
            <span className="text-red-600">Error: {result.error}</span>
          ) : (
            <span className="text-green-600">Enviadas {result.sent} de {result.total} notificaciones.</span>
          )}
        </div>
      )}
    </div>
  );
} 