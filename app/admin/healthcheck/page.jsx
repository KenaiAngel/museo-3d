"use client";
import { useEffect, useState } from "react";
import {
  StatusBar,
  MetricCard,
  MetricSection,
  MemoryUsageCard,
} from "../../../components/HealthcheckWidgets";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

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

    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getLatencyColor = (latency) => {
    if (!latency || latency === "-") return "text-gray-500";
    const ms = parseInt(latency);
    if (ms < 100) return "text-green-600";
    if (ms < 300) return "text-yellow-600";
    return "text-red-600";
  };

  const getLatencyDescription = (latency) => {
    if (!latency || latency === "-") return "No disponible";
    const ms = parseInt(latency);
    if (ms < 100) return "Excelente";
    if (ms < 300) return "Aceptable";
    return "Lento";
  };

  return (
    <div className="max-w-7xl mx-auto mt-8 md:mt-16 p-4 md:p-8 space-y-8">
      {/* Header */}
      <Card className="border-2">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span
              className="inline-block w-4 h-4 rounded-full"
              style={{
                background: status?.api === "OK" ? "#22c55e" : "#ef4444",
              }}
            />
            <CardTitle className="text-3xl font-bold">
              Estado del Sistema
            </CardTitle>
          </div>
          <p className="text-muted-foreground text-lg">
            Monitoreo en tiempo real de la infraestructura y servicios del Museo
            3D
          </p>
        </CardHeader>

        {loading ? (
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="w-16 h-16 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">
              Consultando estado del sistema...
            </p>
          </CardContent>
        ) : error ? (
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <p className="text-red-600 text-xl font-semibold">
                ⚠️ Error del Sistema
              </p>
              <p className="text-red-500">{error}</p>
              <Badge variant="destructive">Sistema no disponible</Badge>
            </div>
          </CardContent>
        ) : status ? (
          <CardContent>
            <StatusBar
              status={
                status.api === "OK" && status.db === "OK"
                  ? "OK"
                  : status.db === "Error"
                    ? "Error"
                    : "Warning"
              }
            />
          </CardContent>
        ) : null}
      </Card>

      {status && !loading && !error && (
        <>
          {/* Servicios Principales */}
          <MetricSection title="Servicios Principales" icon="🔧">
            <MetricCard
              label="API"
              value={status.api}
              icon={status.api === "OK" ? "✅" : "❌"}
              color={status.api === "OK" ? "text-green-600" : "text-red-600"}
              description={
                status.api === "OK" ? "Operacional" : "Fuera de servicio"
              }
            />
            <MetricCard
              label="Base de datos"
              value={status.db}
              icon={status.db === "OK" ? "🗄️" : "❌"}
              color={status.db === "OK" ? "text-green-600" : "text-red-600"}
              description={
                status.db === "OK" ? "Conectada" : "Error de conexión"
              }
            />
            <MetricCard
              label="Latencia API"
              value={latency.api}
              icon="⏱️"
              color={getLatencyColor(latency.api)}
              description={getLatencyDescription(latency.api)}
            />
            <MetricCard
              label="Latencia DB"
              value={latency.db}
              icon="📊"
              color={getLatencyColor(latency.db)}
              description={getLatencyDescription(latency.db)}
            />
          </MetricSection>

          {/* Estadísticas de Contenido */}
          <MetricSection title="Estadísticas de Contenido" icon="📈">
            <MetricCard
              label="Usuarios registrados"
              value={
                status.userCount !== null && status.userCount !== undefined
                  ? status.userCount.toLocaleString()
                  : "-"
              }
              icon="👤"
              color="text-indigo-600"
              description="Total de cuentas activas"
            />
            <MetricCard
              label="Murales registrados"
              value={
                status.muralCount !== null && status.muralCount !== undefined
                  ? status.muralCount.toLocaleString()
                  : "-"
              }
              icon="🖼️"
              color="text-pink-600"
              description="Obras digitalizadas"
            />
            <MetricCard
              label="Salas creadas"
              value={
                status.roomCount !== null && status.roomCount !== undefined
                  ? status.roomCount.toLocaleString()
                  : "-"
              }
              icon="🏛️"
              color="text-amber-600"
              description="Galerías virtuales"
            />
            <MetricCard
              label="Sesiones activas"
              value={
                status.activeSessionsCount !== null &&
                status.activeSessionsCount !== undefined
                  ? status.activeSessionsCount.toLocaleString()
                  : "-"
              }
              icon="🔗"
              color="text-emerald-600"
              description="Últimas 24 horas"
            />
          </MetricSection>

          {/* Información del Sistema */}
          <MetricSection title="Información del Sistema" icon="💻">
            <MetricCard
              label="Uptime"
              value={
                status.uptime
                  ? `${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m`
                  : "-"
              }
              icon="⏰"
              color="text-blue-600"
              description="Tiempo en línea"
            />
            <MemoryUsageCard memoryUsage={status.memoryUsage} />
            <MetricCard
              label="Versión"
              value={status.version || "v1.0.0"}
              icon="🏷️"
              color="text-gray-600"
              description="Build actual"
            />
            <MetricCard
              label="Entorno"
              value={
                process.env.NODE_ENV === "production"
                  ? "Producción"
                  : "Desarrollo"
              }
              icon="�"
              color={
                process.env.NODE_ENV === "production"
                  ? "text-green-600"
                  : "text-yellow-600"
              }
              description="Ambiente de ejecución"
            />
          </MetricSection>

          {/* Footer */}
          <Card>
            <CardContent className="flex flex-col md:flex-row justify-between items-center py-4">
              <div className="text-sm text-muted-foreground mb-2 md:mb-0 flex items-center gap-2">
                <span className="font-medium">Última comprobación:</span>
                <Badge variant="outline">
                  {new Date(status.timestamp).toLocaleString("es-ES")}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Actualización automática cada 30s</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
