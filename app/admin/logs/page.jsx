"use client";
import { useEffect, useState, useRef, useCallback } from "react";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const logsPerPage = 30;
  const pageRef = useRef(1);
  const tableEndRef = useRef(null);
  const [openTooltipIdx, setOpenTooltipIdx] = useState(null);
  const tooltipRef = useRef();
  const logsCache = useRef({ data: null, timestamp: 0 });
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
    if (logsCache.current.data && now - logsCache.current.timestamp < 2 * 60 * 1000) {
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
  }, [hasMore, loading, logs, search]);

  function loadMoreLogs() {
    if (isFetchingMore || !hasMore) return;
    setIsFetchingMore(true);
    setTimeout(() => {
      const filtered = getFilteredLogs(allLogs, search);
      const nextPage = pageRef.current + 1;
      const nextLogs = filtered.slice(0, nextPage * logsPerPage);
      setLogs(nextLogs);
      setHasMore(nextLogs.length < filtered.length);
      pageRef.current = nextPage;
      setIsFetchingMore(false);
    }, 400); // Simula carga
  }

  // Filtrar logs según búsqueda
  function getFilteredLogs(logsArr, q) {
    const query = q.toLowerCase();
    return logsArr.filter((log) => {
      const user = log.user || {};
      const browser = log.contexts?.browser;
      const os = log.contexts?.os;
      const device = log.contexts?.device;
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
        (user.ip_address || "").toLowerCase().includes(query) ||
        (browser?.name || "").toLowerCase().includes(query) ||
        (browser?.version || "").toLowerCase().includes(query) ||
        (os?.name || "").toLowerCase().includes(query) ||
        (os?.version || "").toLowerCase().includes(query) ||
        (device?.model || "").toLowerCase().includes(query) ||
        (device?.name || "").toLowerCase().includes(query)
      );
    });
  }

  // Resetear paginación al cambiar búsqueda
  useEffect(() => {
    const filtered = getFilteredLogs(allLogs, search);
    setLogs(filtered.slice(0, logsPerPage));
    setHasMore(filtered.length > logsPerPage);
    pageRef.current = 1;
  }, [search, allLogs]);

  // Highlight helper
  function Highlight({ text, query }) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
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
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Panel de eventos y errores
      </h1>
      <p className="mb-6 max-w-2xl text-center text-gray-700 dark:text-gray-300 text-sm">
        Este panel permite monitorear en tiempo real los errores y eventos importantes que ocurren en la aplicación. Detectar y analizar estos eventos es fundamental para mejorar la estabilidad, seguridad y experiencia de usuario. Los eventos informativos ayudan a auditar acciones clave, mientras que los errores permiten reaccionar rápidamente ante problemas críticos.
      </p>
      {loading && <div className="text-gray-600">Cargando logs...</div>}
      {error && (
        <div className="text-red-600">Error: {error}</div>
      )}
      {!loading && !error && logs.length === 0 && (
        <div className="text-gray-600">No hay logs recientes.</div>
      )}
      {!loading && !error && logs.length > 0 && (
        <>
          <div className="w-full max-w-6xl mb-4 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            <input
              type="text"
              className="w-full sm:w-80 px-3 py-2 border rounded shadow-sm text-sm"
              placeholder="Buscar por mensaje, usuario, tipo, navegador, SO, dispositivo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto w-full max-w-6xl">
            <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left">Fecha</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Mensaje / Título</th>
                  <th className="px-4 py-2 text-left">Usuario</th>
                  <th className="px-4 py-2 text-left">Navegador</th>
                  <th className="px-4 py-2 text-left">SO</th>
                  <th className="px-4 py-2 text-left">Dispositivo</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const user = log.user || {};
                  const browser = log.contexts?.browser;
                  const os = log.contexts?.os;
                  const device = log.contexts?.device;
                  // --- Mejor detección de nivel para color, incluyendo tags array ---
                  const tagLevel = Array.isArray(log.tags) ? log.tags.find(t => t.key?.toLowerCase() === 'level')?.value?.toLowerCase() : undefined;
                  const levelRaw = (log.level || log.type || log.event_type || tagLevel || "").toLowerCase();
                  // --- Colores de fila más notorios y borde izquierdo visible en dark ---
                  let borderColor = "";
                  let typeTextColor = "";
                  if (["error", "fatal"].some(l => levelRaw.includes(l))) {
                    borderColor = "border-l-4 border-red-500 dark:border-red-400/80";
                    typeTextColor = "text-red-600 dark:text-red-400 font-bold";
                  } else if (["warning", "warn"].some(l => levelRaw.includes(l))) {
                    borderColor = "border-l-4 border-yellow-500 dark:border-yellow-300/80";
                    typeTextColor = "text-yellow-700 dark:text-yellow-300 font-bold";
                  } else if (["info", "log", "event"].some(l => levelRaw.includes(l))) {
                    borderColor = "border-l-4 border-blue-500 dark:border-blue-400/80";
                    typeTextColor = "text-blue-700 dark:text-blue-300 font-bold";
                  } else if (["debug"].some(l => levelRaw.includes(l))) {
                    borderColor = "border-l-4 border-gray-500 dark:border-gray-300/80";
                    typeTextColor = "text-gray-700 dark:text-gray-300 font-bold";
                  }
                  // --- Mejor detección de replayId, incluyendo tags array ---
                  let tagReplay = undefined;
                  if (Array.isArray(log.tags)) {
                    tagReplay = log.tags.find(t => t.key?.toLowerCase() === 'replayid' || t.key?.toLowerCase() === 'replay_id')?.value;
                  } else if (log.tags && typeof log.tags === 'object') {
                    tagReplay = log.tags.replayId || log.tags.replay_id;
                  }
                  const replayId = log.replayId || log.replay_id || log.replay || tagReplay;
                  // --- Slug de organización ---
                  const ORG_SLUG = process.env.NEXT_PUBLIC_SENTRY_ORG || "museo-3d"; // Cambia aquí si tu slug es diferente
                  // --- Tooltip de mensaje: soporte mobile ---
                  // Mensaje completo para tooltip
                  const fullMsg = log.title || log.message || log.culprit || "-";
                  return (
                    <tr
                      key={log.id}
                      className={`border-t border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${borderColor}`}
                      onClick={() => setSelectedLog({ ...log, _replayId: replayId, _orgSlug: ORG_SLUG })}
                    >
                      <td className="px-4 py-2 whitespace-nowrap">
                        {log.dateCreated ? new Date(log.dateCreated).toLocaleString() : "-"}
                      </td>
                      <td className={`px-4 py-2 font-semibold ${typeTextColor}`}>
                        <Highlight text={log.level || log.type || log.platform || "-"} query={search} />
                      </td>
                      <td
                        className={`px-4 py-2 max-w-xs truncate ${typeTextColor} relative group select-none`}
                        tabIndex={0}
                        aria-label="Ver mensaje completo"
                      >
                        <span>
                          <Highlight text={fullMsg} query={search} />
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <Highlight text={user.email || user.username || user.id || user.ip_address || "-"} query={search} />
                      </td>
                      <td className="px-4 py-2">
                        <Highlight text={browser?.name ? `${browser.name} ${browser.version || ''}`.trim() : "-"} query={search} />
                      </td>
                      <td className="px-4 py-2">
                        <Highlight text={os?.name ? `${os.name} ${os.version || ''}`.trim() : "-"} query={search} />
                      </td>
                      <td className="px-4 py-2">
                        <Highlight text={device?.model || device?.name || "-"} query={search} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div ref={tableEndRef} />
            {isFetchingMore && (
              <div className="text-center py-2 text-gray-500">Cargando más...</div>
            )}
            {!hasMore && !loading && logs.length > 0 && (
              <div className="text-center py-2 text-gray-400 text-xs">Fin de los logs</div>
            )}
          </div>
        </>
      )}
      {/* Modal de detalle */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto"
          style={{ minHeight: '100vh' }}
          onClick={e => {
            // Cierra modal si se hace click en el fondo (no en el contenido)
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-b-lg shadow-2xl w-full max-w-2xl mt-0 sm:mt-8 mx-0 sm:mx-auto max-h-[90vh] overflow-auto p-4 sm:p-6 relative animate-fade-in"
            style={{ boxSizing: 'border-box' }}
            tabIndex={-1}
            ref={el => {
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-red-600 text-xl font-bold"
              onClick={() => setSelectedLog(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Detalle del evento</h2>
              <button
                className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                onClick={() => {
                  const blob = new Blob([
                    JSON.stringify(selectedLog, null, 2)
                  ], { type: "application/json" });
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
                title="Exportar JSON"
              >
                Exportar JSON
              </button>
            </div>
            {/* Campos principales destacados */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div><b>Fecha:</b> {selectedLog.dateCreated ? new Date(selectedLog.dateCreated).toLocaleString() : "-"}</div>
              <div><b>Tipo:</b> {selectedLog.level || selectedLog.type || selectedLog.platform || "-"}</div>
              <div className="col-span-2"><b>Mensaje:</b> {selectedLog.title || selectedLog.message || selectedLog.culprit || "-"}</div>
              <div><b>Usuario:</b> {selectedLog.user?.email || selectedLog.user?.username || selectedLog.user?.id || selectedLog.user?.ip_address || "-"}</div>
              {selectedLog.user?.id && (
                <div><b>ID usuario:</b> {selectedLog.user.id}</div>
              )}
              {selectedLog.user?.username && (
                <div><b>Username:</b> {selectedLog.user.username}</div>
              )}
              {selectedLog.user?.email && (
                <div><b>Email:</b> {selectedLog.user.email}</div>
              )}
              <div><b>Navegador:</b> {selectedLog.contexts?.browser?.name ? `${selectedLog.contexts.browser.name} ${selectedLog.contexts.browser.version || ''}`.trim() : "-"}</div>
              <div><b>SO:</b> {selectedLog.contexts?.os?.name ? `${selectedLog.contexts.os.name} ${selectedLog.contexts.os.version || ''}`.trim() : "-"}</div>
              <div><b>Dispositivo:</b> {selectedLog.contexts?.device?.model || selectedLog.contexts?.device?.name || "-"}</div>
              <div><b>ID evento:</b> {selectedLog.eventID || selectedLog.id || "-"}</div>
              {(selectedLog._replayId) && (
                <div className="col-span-2">
                  <b>Replay:</b> <a href={`https://sentry.io/organizations/${selectedLog._orgSlug}/replays/${selectedLog._replayId}/`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Ver replay en Sentry</a>
                </div>
              )}
            </div>
            <pre className="text-xs bg-gray-100 dark:bg-neutral-800 rounded p-3 overflow-x-auto max-h-[60vh] sm:max-h-[70vh]">
              {JSON.stringify(selectedLog, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
} 