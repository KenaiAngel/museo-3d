"use client";
import { useEffect, useState } from "react";

function StatusBar({ status }) {
  const color =
    status === "OK"
      ? "bg-green-500"
      : status === "Error"
        ? "bg-red-500"
        : "bg-yellow-500";
  return (
    <div className="w-full h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-800 mb-4">
      <div
        className={`h-full transition-all duration-500 ${color}`}
        style={{
          width: status === "OK" ? "100%" : status === "Error" ? "100%" : "50%",
        }}
      />
    </div>
  );
}

function MetricCard({ label, value, icon, color = "text-gray-700" }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 shadow-sm">
      <span className={`text-2xl ${color}`}>{icon}</span>
      <div>
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
        <div className="text-lg font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}

export default function HealthcheckPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [latency, setLatency] = useState({ api: null, db: null });

  useEffect(() => {
    async function fetchStatus() {
      setLoading(true);
      setError(null);
      const t0 = performance.now();
      try {
        const res = await fetch("/api/healthcheck");
        const t1 = performance.now();
        if (!res.ok) throw new Error("Error al consultar el estado");
        const data = await res.json();
        setStatus(data);
        setLatency({
          api: (t1 - t0).toFixed(0) + " ms",
          db:
            data.dbLatency !== null && data.dbLatency !== undefined
              ? data.dbLatency + " ms"
              : "-",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  return (
    <div className="max-w-xl mx-auto mt-8 md:mt-24 p-4 md:p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border text-center">
      <h1 className="text-2xl md:text-3xl font-extrabold mb-2 flex items-center justify-center gap-3">
        <span
          className="inline-block w-2 h-2 rounded-full mr-2"
          style={{ background: status?.api === "OK" ? "#22c55e" : "#ef4444" }}
        />
        Estado del sistema
      </h1>
      <p className="text-muted-foreground mb-6 md:mb-8 text-sm md:text-base">
        Monitoreo en tiempo real de la API y la base de datos
      </p>
      {loading ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground text-sm">Consultando estado...</p>
        </div>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : status ? (
        <>
          <StatusBar
            status={
              status.api === "OK" && status.db === "OK"
                ? "OK"
                : status.db === "Error"
                  ? "Error"
                  : "Warning"
            }
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 mb-6 md:mb-8">
            <MetricCard
              label="API"
              value={status.api}
              icon={status.api === "OK" ? "✅" : "❌"}
              color={status.api === "OK" ? "text-green-600" : "text-red-600"}
            />
            <MetricCard
              label="Base de datos"
              value={status.db}
              icon={status.db === "OK" ? "🗄️" : "❌"}
              color={status.db === "OK" ? "text-green-600" : "text-red-600"}
            />
            <MetricCard
              label="Latencia API"
              value={latency.api}
              icon="⏱️"
              color="text-blue-600"
            />
            <MetricCard
              label="Latencia DB"
              value={latency.db}
              icon="📊"
              color="text-purple-600"
            />
            <MetricCard
              label="Usuarios registrados"
              value={
                status.userCount !== null && status.userCount !== undefined
                  ? status.userCount
                  : "-"
              }
              icon="👤"
              color="text-indigo-600"
            />
            <MetricCard
              label="Murales registrados"
              value={
                status.muralCount !== null && status.muralCount !== undefined
                  ? status.muralCount
                  : "-"
              }
              icon="🖼️"
              color="text-pink-600"
            />
            {/* Aquí puedes agregar más métricas en el futuro */}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            Última comprobación: {status.timestamp}
          </div>
        </>
      ) : null}
    </div>
  );
}
