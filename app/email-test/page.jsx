"use client";
import { useState } from "react";

export default function EmailTestPage() {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Error desconocido");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-12 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h1 className="text-2xl font-bold mb-6">Prueba de envío de email (Resend)</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-medium">Para (to):</span>
          <input
            type="email"
            value={to}
            onChange={e => setTo(e.target.value)}
            required
            className="border rounded px-3 py-2 dark:bg-neutral-800"
            placeholder="destinatario@ejemplo.com"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Asunto (subject):</span>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            required
            className="border rounded px-3 py-2 dark:bg-neutral-800"
            placeholder="Asunto del email"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-medium">Contenido HTML:</span>
          <textarea
            value={html}
            onChange={e => setHtml(e.target.value)}
            required
            className="border rounded px-3 py-2 min-h-[100px] dark:bg-neutral-800 font-mono"
            placeholder="<h1>Hola</h1><p>Este es un email de prueba.</p>"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {loading ? "Enviando..." : "Enviar email de prueba"}
        </button>
      </form>
      {result && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 rounded">
          <b>¡Email enviado!</b>
          <pre className="text-xs mt-2 whitespace-pre-wrap break-all">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 rounded">
          <b>Error:</b> {error}
        </div>
      )}
    </div>
  );
} 