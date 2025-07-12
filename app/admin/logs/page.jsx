"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import Unauthorized from "../../components/Unauthorized";

export default function AdminLogsPage() {
  const { data: session, status } = useSession();
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const logsPerPage = 30;
  const pageRef = useRef(1);
  const tableEndRef = useRef(null);
  const [openTooltipIdx, setOpenTooltipIdx] = useState(null);
  const tooltipRef = useRef();
  const logsCache = useRef({ data: null, timestamp: 0 });

  // Verificación de autorización
  if (status === "loading") return <div>Cargando...</div>;
  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <Unauthorized
        title="Acceso denegado"
        message="Esta sección es solo para administradores."
        error="403"
        showLogin={true}
        redirectPath="/"
      />
    );
  }
  // Cerrar tooltip al hacer tap fuera (mobile/desktop)
  useEffect(() => {
    if (openTooltipIdx === null) return;
    function handleClick(e) {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setOpenTooltipIdx(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
    };
  }, [openTooltipIdx]);

  // Cargar todos los logs al inicio (puedes paginar desde el backend si lo prefieres)
  useEffect(() => {
    const now = Date.now();
    if (
      logsCache.current.data &&
      now - logsCache.current.timestamp < 2 * 60 * 1000
    ) {
      // Usa cache si no ha expirado (2 minutos)
      setAllLogs(logsCache.current.data);
      setLogs(logsCache.current.data.slice(0, logsPerPage));
      setHasMore(logsCache.current.data.length > logsPerPage);
      setLoading(false);
      return;
    }
    fetch("/api/admin/sentry-logs")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        logsCache.current = { data, timestamp: Date.now() };
        setAllLogs(data);
        setLogs(data.slice(0, logsPerPage));
        setHasMore(data.length > logsPerPage);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Infinite scroll: cargar más logs cuando el usuario llega al final
  useEffect(() => {
    if (!hasMore || loading) return;
    const handleScroll = () => {
      if (!tableEndRef.current) return;
      const rect = tableEndRef.current.getBoundingClientRect();
      if (rect.top < window.innerHeight + 100) {
        loadMoreLogs();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loading, logs, search, levelFilter]);

  // Apply search and level filtering when they change
  useEffect(() => {
    if (allLogs.length === 0) return;
    const filtered = getFilteredLogs(allLogs, search, levelFilter);
    setLogs(filtered.slice(0, logsPerPage));
    setHasMore(filtered.length > logsPerPage);
    pageRef.current = 1;
  }, [search, levelFilter, allLogs]);

  function loadMoreLogs() {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    setTimeout(() => {
      const filtered = getFilteredLogs(allLogs, search, levelFilter);
      const nextPage = pageRef.current + 1;
      const nextLogs = filtered.slice(0, nextPage * logsPerPage);
      setLogs(nextLogs);
      setHasMore(nextLogs.length < filtered.length);
      pageRef.current = nextPage;
      setIsFetchingMore(false);
    }, 400); // Simula carga
  }

  // Filtrar logs según búsqueda y nivel
  function getFilteredLogs(logsArr, q, level) {
    const query = q.toLowerCase();
    let filtered = logsArr.filter((log) => {
      const user = log.user || {};
      return (
        (log.title || "").toLowerCase().includes(query) ||
        (log.message || "").toLowerCase().includes(query) ||
        (log.culprit || "").toLowerCase().includes(query) ||
        (log.level || "").toLowerCase().includes(query) ||
        (log.type || "").toLowerCase().includes(query) ||
        (log.platform || "").toLowerCase().includes(query) ||
        (user.email || "").toLowerCase().includes(query) ||
        (user.username || "").toLowerCase().includes(query) ||
        (user.id || "").toLowerCase().includes(query) ||
        (user.ip_address || "").toLowerCase().includes(query)
      );
    });

    // Filtrar por nivel si no es "all"
    if (level && level !== "all") {
      filtered = filtered.filter((log) => {
        const tagLevel = Array.isArray(log.tags)
          ? log.tags
              .find((t) => t.key?.toLowerCase() === "level")
              ?.value?.toLowerCase()
          : undefined;
        const levelRaw = (
          log.level ||
          log.type ||
          log.event_type ||
          tagLevel ||
          ""
        ).toLowerCase();
        return levelRaw.includes(level.toLowerCase());
      });
    }

    return filtered;
  }

  // Highlight helper
  function Highlight({ text, query }) {
    if (!query) return text;
    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = String(text).split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Panel de eventos y errores
          </CardTitle>
          <p className="text-muted-foreground">
            Este panel permite monitorear en tiempo real los errores y eventos
            importantes que ocurren en la aplicación. Detectar y analizar estos
            eventos es fundamental para mejorar la estabilidad, seguridad y
            experiencia de usuario.
          </p>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="text-muted-foreground">Cargando logs...</div>
          )}
          {error && <div className="text-destructive">Error: {error}</div>}

          {/* Barra de búsqueda y filtros - siempre visible */}
          {!loading && !error && (
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <input
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Buscar por mensaje, usuario, tipo, navegador, SO, dispositivo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="flex h-10 w-full sm:w-48 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="all">Todos los niveles</option>
                <option value="error">Errores</option>
                <option value="warning">Advertencias</option>
                <option value="info">Información</option>
                <option value="debug">Debug</option>
              </select>
            </div>
          )}

          {!loading && !error && logs.length === 0 && (
            <div className="text-muted-foreground text-center py-8">
              {search || levelFilter !== "all"
                ? "No se encontraron logs con los filtros aplicados."
                : "No hay logs recientes."}
            </div>
          )}
          {!loading && !error && logs.length > 0 && (
            <>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left font-medium">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Nivel
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Mensaje
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Usuario
                          </th>
                          {/* Removed columns: Navegador, SO, Dispositivo */}
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, idx) => {
                          const user = log.user || {};
                          const browser = log.contexts?.browser;
                          const os = log.contexts?.os;
                          const device = log.contexts?.device;

                          // Better level detection including tags array
                          const tagLevel = Array.isArray(log.tags)
                            ? log.tags
                                .find((t) => t.key?.toLowerCase() === "level")
                                ?.value?.toLowerCase()
                            : undefined;
                          const levelRaw = (
                            log.level ||
                            log.type ||
                            log.event_type ||
                            tagLevel ||
                            ""
                          ).toLowerCase();

                          // Badge variant based on level
                          let badgeVariant = "secondary";
                          if (
                            ["error", "fatal"].some((l) => levelRaw.includes(l))
                          ) {
                            badgeVariant = "destructive";
                          } else if (
                            ["warning", "warn"].some((l) =>
                              levelRaw.includes(l)
                            )
                          ) {
                            badgeVariant = "outline";
                          } else if (
                            ["info", "log", "event"].some((l) =>
                              levelRaw.includes(l)
                            )
                          ) {
                            badgeVariant = "default";
                          }

                          // Better replay detection
                          let tagReplay = undefined;
                          if (Array.isArray(log.tags)) {
                            tagReplay = log.tags.find(
                              (t) =>
                                t.key?.toLowerCase() === "replayid" ||
                                t.key?.toLowerCase() === "replay_id"
                            )?.value;
                          } else if (log.tags && typeof log.tags === "object") {
                            tagReplay = log.tags.replayId || log.tags.replay_id;
                          }
                          const replayId =
                            log.replayId ||
                            log.replay_id ||
                            log.replay ||
                            tagReplay;

                          const ORG_SLUG =
                            process.env.NEXT_PUBLIC_SENTRY_ORG || "museo-3d";
                          const fullMsg =
                            log.title || log.message || log.culprit || "-";

                          return (
                            <tr
                              key={log.id}
                              className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                              onClick={() =>
                                setSelectedLog({
                                  ...log,
                                  _replayId: replayId,
                                  _orgSlug: ORG_SLUG,
                                })
                              }
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {log.dateCreated
                                  ? new Date(log.dateCreated).toLocaleString()
                                  : "-"}
                              </td>
                              <td className="px-4 py-3">
                                <Badge variant={badgeVariant}>
                                  <Highlight
                                    text={
                                      log.level ||
                                      log.type ||
                                      log.platform ||
                                      "-"
                                    }
                                    query={search}
                                  />
                                </Badge>
                              </td>
                              <td className="px-4 py-3 max-w-xs truncate">
                                <Highlight text={fullMsg} query={search} />
                              </td>
                              <td className="px-4 py-3 text-sm">
                                <Highlight
                                  text={
                                    user.email ||
                                    user.username ||
                                    user.id ||
                                    user.ip_address ||
                                    "-"
                                  }
                                  query={search}
                                />
                              </td>
                              {/* Removed columns: Navegador, SO, Dispositivo */}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div ref={tableEndRef} />
                    {isFetchingMore && (
                      <div className="text-center py-4 text-muted-foreground">
                        Cargando más...
                      </div>
                    )}
                    {!hasMore && !loading && logs.length > 0 && (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Fin de los logs
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
      {/* Modal de detalle */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto"
          style={{ minHeight: "100vh" }}
          onClick={(e) => {
            // Cierra modal si se hace click en el fondo (no en el contenido)
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
        >
          <Card className="w-full max-w-2xl mt-0 sm:mt-8 mx-0 sm:mx-auto max-h-[90vh] overflow-auto animate-fade-in">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalle del evento</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify(selectedLog, null, 2)],
                        { type: "application/json" }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `sentry-event-${selectedLog.id || "log"}.json`;
                      document.body.appendChild(a);
                      a.click();
                      setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      }, 100);
                    }}
                  >
                    Exportar JSON
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLog(null)}
                  >
                    ×
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Event details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="font-medium">Fecha:</span>{" "}
                  {selectedLog.dateCreated
                    ? new Date(selectedLog.dateCreated).toLocaleString()
                    : "-"}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>{" "}
                  {selectedLog.level ||
                    selectedLog.type ||
                    selectedLog.platform ||
                    "-"}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Mensaje:</span>{" "}
                  {selectedLog.title ||
                    selectedLog.message ||
                    selectedLog.culprit ||
                    "-"}
                </div>
                <div>
                  <span className="font-medium">Usuario:</span>{" "}
                  {selectedLog.user?.email ||
                    selectedLog.user?.username ||
                    selectedLog.user?.id ||
                    selectedLog.user?.ip_address ||
                    "-"}
                </div>
                {selectedLog.user?.id && (
                  <div>
                    <span className="font-medium">ID usuario:</span>{" "}
                    {selectedLog.user.id}
                  </div>
                )}
                {selectedLog.user?.username && (
                  <div>
                    <span className="font-medium">Username:</span>{" "}
                    {selectedLog.user.username}
                  </div>
                )}
                {selectedLog.user?.email && (
                  <div>
                    <span className="font-medium">Email:</span>{" "}
                    {selectedLog.user.email}
                  </div>
                )}
                <div>
                  <span className="font-medium">Navegador:</span>{" "}
                  {selectedLog.contexts?.browser?.name
                    ? `${selectedLog.contexts.browser.name} ${selectedLog.contexts.browser.version || ""}`.trim()
                    : "-"}
                </div>
                <div>
                  <span className="font-medium">SO:</span>{" "}
                  {selectedLog.contexts?.os?.name
                    ? `${selectedLog.contexts.os.name} ${selectedLog.contexts.os.version || ""}`.trim()
                    : "-"}
                </div>
                <div>
                  <span className="font-medium">Dispositivo:</span>{" "}
                  {selectedLog.contexts?.device?.model ||
                    selectedLog.contexts?.device?.name ||
                    "-"}
                </div>
                <div>
                  <span className="font-medium">ID evento:</span>{" "}
                  {selectedLog.eventID || selectedLog.id || "-"}
                </div>
                {selectedLog._replayId && (
                  <div className="col-span-2">
                    <span className="font-medium">Replay:</span>{" "}
                    <a
                      href={`https://sentry.io/organizations/${selectedLog._orgSlug}/replays/${selectedLog._replayId}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      Ver replay en Sentry
                    </a>
                  </div>
                )}
              </div>

              <div className="bg-muted rounded-md p-3 max-h-[60vh] sm:max-h-[70vh] overflow-auto">
                <pre className="text-xs whitespace-pre-wrap">
                  {JSON.stringify(selectedLog, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
