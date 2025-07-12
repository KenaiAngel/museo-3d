"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Badge } from "../../../components/ui/badge";
import { DatePicker } from "../../../components/ui/date-picker";
import { useSessionData } from "providers/SessionProvider";
import * as yup from "yup";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ChevronDown } from "lucide-react";
import { AnimatedBlobsBackground, DotsPattern } from "../../../components/admin/usuarios/Backgrounds";
import Unauthorized from "../../../../components/Unauthorized";

const schema = yup.object().shape({
  nombre: yup.string().required("El nombre es obligatorio").min(3),
  descripcion: yup.string().required("La descripción es obligatoria").min(5),
  color: yup.string().required("El color es obligatorio"),
  maxColaboradores: yup.number().min(1, "Debe ser al menos 1"),
  // Puedes agregar más validaciones según tus necesidades
});

function AccordionSection({ title, open, onToggle, children }) {
  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-lg bg-white/90 dark:bg-zinc-900/90 relative">
      <button
        type="button"
        className={`w-full flex items-center justify-between px-6 py-4 transition-all text-lg font-semibold focus:outline-none group ${open ? "bg-gradient-to-r from-indigo-100/80 via-pink-100/60 to-blue-100/60 dark:from-zinc-800/80 dark:via-fuchsia-900/40 dark:to-blue-900/40" : "bg-muted/40 hover:bg-muted/60"}`}
        onClick={onToggle}
        aria-expanded={open}
        style={{ borderBottom: open ? "1px solid #e0e7ef" : "none" }}
      >
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 group-hover:bg-pink-400 transition-all" style={{ boxShadow: open ? "0 0 0 4px #a5b4fc44" : "none" }}></span>
          {title}
        </span>
        <ChevronDown className={`transition-transform duration-300 ${open ? "rotate-180 text-indigo-500" : "rotate-0 text-muted-foreground"}`} />
      </button>
      <div className={`transition-all duration-300 ${open ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>{open && <CardContent className="pt-0 pb-6">{children}</CardContent>}</div>
    </Card>
  );
}

export default function EditarSala() {
  const { data: sessionAuth, status } = useSession();
  const router = useRouter();
  const { id } = useParams();
  const { session } = useSessionData();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sala, setSala] = useState(null);
  const [form, setForm] = useState(null);
  const [muralesDisponibles, setMuralesDisponibles] = useState([]);
  const [colaboradoresDisponibles, setColaboradoresDisponibles] = useState([]);
  const [errors, setErrors] = useState({});
  const [userSearch, setUserSearch] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sections, setSections] = useState({
    generales: true,
    apariencia: false,
    colaboradores: false,
    murales: false,
    avanzadas: false,
  });
  const toggleSection = (key) => setSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Verificación de autorización
  if (status === "loading") return <div>Cargando...</div>;
  if (!sessionAuth?.user || sessionAuth.user.role !== "ADMIN") {
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

  // Cargar datos de la sala y murales disponibles
  useEffect(() => {
    const fetchSala = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/salas/${id}`);
        if (!res.ok) throw new Error("No se pudo cargar la sala");
        const data = await res.json();
        setSala(data);
        setForm({
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
          texturaPared: data.texturaPared || "",
          texturaPiso: data.texturaPiso || "",
          color: data.color || "#ffffff",
          tema: data.tema || "",
          musica: data.musica || "",
          imagenPortada: data.imagenPortada || "",
          esPrivada: data.esPrivada || false,
          maxColaboradores: data.maxColaboradores || 10,
          fechaApertura: data.fechaApertura ? data.fechaApertura.split("T")[0] : "",
          notas: data.notas || "",
          murales: (data.murales || []).map((m) => m.mural?.id || m.muralId),
          colaboradores: (data.colaboradores || []).map((c) => c.id),
        });
      } catch (e) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    const fetchMurales = async () => {
      const res = await fetch("/api/murales");
      if (res.ok) {
        const data = await res.json();
        setMuralesDisponibles(data.murales || []);
      }
    };
    fetchSala();
    fetchMurales();
  }, [id]);

  // Buscar usuarios por nombre/email
  useEffect(() => {
    if (userSearch.length < 2) {
      setUserResults([]);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/usuarios?search=${encodeURIComponent(userSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setUserResults(data.usuarios || []);
      }
      setSearching(false);
    }, 350);
    return () => clearTimeout(timeout);
  }, [userSearch]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Manejar selección de murales
  const handleToggleMural = (muralId) => {
    setForm((prev) => {
      const murales = prev.murales.includes(muralId)
        ? prev.murales.filter((id) => id !== muralId)
        : [...prev.murales, muralId];
      return { ...prev, murales };
    });
  };

  // Manejar selección de colaboradores
  const handleToggleColaborador = (userId) => {
    setForm((prev) => {
      const colaboradores = prev.colaboradores.includes(userId)
        ? prev.colaboradores.filter((id) => id !== userId)
        : [...prev.colaboradores, userId];
      return { ...prev, colaboradores };
    });
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await schema.validate(form, { abortEarly: false });
      setErrors({});
      const res = await fetch(`/api/salas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          murales: form.murales,
          colaboradores: form.colaboradores,
        }),
      });
      if (!res.ok) throw new Error("No se pudo actualizar la sala");
      toast.success("Sala actualizada");
      router.push("/mis-salas");
    } catch (e) {
      if (e.name === "ValidationError") {
        const newErrors = {};
        e.inner.forEach((err) => {
          newErrors[err.path] = err.message;
        });
        setErrors(newErrors);
      } else {
        toast.error(e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !form) return <div className="p-8 text-center">Cargando sala...</div>;

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-start bg-transparent">
      {/* Fondo animado y patrón de puntos */}
      <div className="pointer-events-none absolute inset-0 w-full h-full z-0">
        <AnimatedBlobsBackground />
        <DotsPattern />
      </div>
      <div className="relative z-10 w-full max-w-2xl mx-auto p-4 sm:p-8">
        <h1 className="text-3xl font-bold mb-10 text-center drop-shadow-lg text-zinc-800 dark:text-zinc-100" style={{textShadow: '0 2px 12px rgba(0,0,0,0.08)'}}>Editar sala</h1>
        <form onSubmit={handleSubmit} className="space-y-2">
          <AccordionSection title="Datos generales" open={sections.generales} onToggle={() => toggleSection("generales")}> 
            <div className="mb-4">
              <label className="block font-semibold mb-1">Nombre</label>
              <input name="nombre" value={form.nombre} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
              {errors.nombre && <div className="text-red-500 text-xs mt-1">{errors.nombre}</div>}
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Descripción</label>
              <textarea name="descripcion" value={form.descripcion} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
              {errors.descripcion && <div className="text-red-500 text-xs mt-1">{errors.descripcion}</div>}
            </div>
          </AccordionSection>
          <AccordionSection title="Apariencia" open={sections.apariencia} onToggle={() => toggleSection("apariencia")}> 
            <div className="mb-4">
              <label className="block font-semibold mb-1">Color de paredes</label>
              <input name="color" type="color" value={form.color} onChange={handleChange} className="w-16 h-10 rounded border" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Textura de pared</label>
              <input name="texturaPared" value={form.texturaPared} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Textura de piso</label>
              <input name="texturaPiso" value={form.texturaPiso} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Tema visual</label>
              <input name="tema" value={form.tema} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Música</label>
              <input name="musica" value={form.musica} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Imagen de portada (URL)</label>
              <input name="imagenPortada" value={form.imagenPortada} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
            </div>
          </AccordionSection>
          <AccordionSection title="Colaboradores" open={sections.colaboradores} onToggle={() => toggleSection("colaboradores")}> 
            <div className="mb-2">
              <label className="block font-semibold mb-1">Buscar usuario por nombre o email</label>
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-4 py-2 rounded border mb-2"
              />
              {searching && <div className="text-xs text-muted-foreground">Buscando...</div>}
              {userResults.length > 0 && (
                <div className="border rounded bg-white shadow p-2 max-h-40 overflow-y-auto">
                  {userResults.map((user) => (
                    <button
                      type="button"
                      key={user.id}
                      className={`block w-full text-left px-2 py-1 rounded hover:bg-indigo-50 ${form.colaboradores.includes(user.id) ? "bg-indigo-100 text-indigo-800" : ""}`}
                      onClick={() => handleToggleColaborador(user.id)}
                    >
                      {user.name} <span className="text-xs text-gray-500">{user.email}</span>
                      {form.colaboradores.includes(user.id) && <span className="ml-2">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.colaboradores.map((userId) => {
                const user = userResults.find((u) => u.id === userId) || colaboradoresDisponibles.find((u) => u.id === userId);
                return (
                  <span key={userId} className="inline-flex items-center px-3 py-1 rounded bg-indigo-100 text-indigo-800 text-sm font-medium">
                    {user?.name || userId}
                    <button type="button" className="ml-2 text-red-500 hover:text-red-700" onClick={() => handleToggleColaborador(userId)}>
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            {errors.colaboradores && <div className="text-red-500 text-xs mt-1">{errors.colaboradores}</div>}
          </AccordionSection>
          <AccordionSection title="Murales asociados" open={sections.murales} onToggle={() => toggleSection("murales")}> 
            <div className="flex flex-wrap gap-2 mb-2">
              {muralesDisponibles.map((mural) => (
                <button
                  type="button"
                  key={mural.id}
                  className={`px-3 py-1 rounded border text-sm flex items-center gap-2 ${form.murales.includes(mural.id) ? "bg-indigo-600 text-white" : "bg-white"}`}
                  onClick={() => handleToggleMural(mural.id)}
                >
                  {mural.url_imagen && (
                    <img
                      src={mural.url_imagen}
                      alt={mural.titulo}
                      className="w-8 h-8 object-cover rounded border border-gray-200 dark:border-gray-700 shadow"
                    />
                  )}
                  <span className="truncate max-w-[120px]">{mural.titulo}</span>
                </button>
              ))}
            </div>
            {errors.murales && <div className="text-red-500 text-xs mt-1">{errors.murales}</div>}
          </AccordionSection>
          <AccordionSection title="Opciones avanzadas" open={sections.avanzadas} onToggle={() => toggleSection("avanzadas")}> 
            <div className="mb-4">
              <label className="block font-semibold mb-1">¿Sala privada?</label>
              <input name="esPrivada" type="checkbox" checked={form.esPrivada} onChange={handleChange} className="mr-2" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Máx. colaboradores</label>
              <input name="maxColaboradores" type="number" min={1} value={form.maxColaboradores} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Fecha de apertura</label>
              <input name="fechaApertura" type="date" value={form.fechaApertura} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
            </div>
            <div className="mb-4">
              <label className="block font-semibold mb-1">Notas internas</label>
              <textarea name="notas" value={form.notas} onChange={handleChange} className="w-full px-4 py-2 rounded border" />
            </div>
          </AccordionSection>
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isSubmitting} className="px-8 py-3 text-lg">
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 