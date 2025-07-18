"use client";
import { useState } from "react";
import Stepper from "@/components/ui/Stepper";
import { CheckCircle, AlertCircle, Info, User, Image as ImageIcon, MapPin, Eye, Users } from "lucide-react";
import MuralImageStep from "./MuralImageStep";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import React from "react";

const STEPS = [
  { label: "Datos básicos", subtitle: "Información principal", icon: <User /> },
  { label: "Imágenes y medios", subtitle: "Sube o crea tu imagen", icon: <ImageIcon /> },
  { label: "Ubicación y sala", subtitle: "Dónde está el mural", icon: <MapPin /> },
  { label: "Estado", subtitle: "Visibilidad y orden", icon: <Eye /> },
  { label: "Autores", subtitle: "Artistas y colaboradores", icon: <Users /> },
  { label: "Confirmar", subtitle: "Revisa y crea", icon: <CheckCircle /> },
];

export default function CrearMuralStepper() {
  const [step, setStep] = useState(0);
  // Estado global del mural
  const [mural, setMural] = useState({
    titulo: "",
    descripcion: "",
    tecnica: "",
    anio: new Date().getFullYear(),
    dimensiones: "",
    tags: [],
    url_imagen: null,
    imagenesSecundarias: [],
    imagenUrlWebp: "",
    videoUrl: "",
    audioUrl: "",
    modelo3dUrl: "",
    ubicacion: "",
    latitud: "",
    longitud: "",
    salaId: "",
    exposiciones: [],
    estado: "",
    publica: true,
    destacada: false,
    orden: 0,
    autor: "",
    artistId: "",
    colaboradores: [],
    tagsInput: "",
  });
  const [errors, setErrors] = useState({});

  // Validación simple por step
  const validateStep = () => {
    const e = {};
    if (step === 0) {
      if (!mural.titulo) e.titulo = "El título es requerido";
      if (!mural.tecnica) e.tecnica = "La técnica es requerida";
      if (!mural.anio) e.anio = "El año es requerido";
    }
    if (step === 1) {
      if (!mural.url_imagen) e.url_imagen = "Selecciona o crea una imagen";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Handlers
  const handleNext = () => {
    if (validateStep()) setStep((s) => s + 1);
  };
  const handleBack = () => setStep((s) => s - 1);

  // Estilos inline para underline moderno
  const underlineInputClass =
    "block w-full bg-transparent border-0 border-b-2 border-gray-300 focus:border-indigo-600 transition-all duration-200 text-lg px-0 py-2 placeholder-gray-400 focus:outline-none";
  const labelClass =
    "block mb-2 text-base font-semibold text-gray-700 dark:text-gray-200";
  const errorClass = "text-red-500 text-xs mt-1 block";

  // Generar años para el select
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  // Determinar estados de los steps para feedback visual
  const stepStates = STEPS.map((stepObj, i) => {
    if (i < step) return { ...stepObj, status: "success", icon: <CheckCircle className="text-green-600 mx-auto" /> };
    if (i === step && Object.keys(errors).length > 0) return { ...stepObj, status: "error", icon: <AlertCircle className="text-red-500 mx-auto" /> };
    return { ...stepObj, icon: React.cloneElement(stepObj.icon, { className: "mx-auto" }) };
  });

  // Render steps
  return (
    <div className="w-full max-w-3xl mx-auto bg-white/80 dark:bg-neutral-900/80 rounded-2xl shadow-xl border border-border p-0 md:p-8">
      <Stepper
        steps={stepStates}
        activeStep={step}
        color="indigo"
        className="mb-8"
        onStepClick={i => { if (i < step) setStep(i); }}
      />
      {/* Separador visual */}
      <div className="w-full flex items-center justify-center mb-10">
        <div className="w-full h-[2px] bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 dark:from-indigo-900 dark:via-indigo-700 dark:to-indigo-900 rounded-full shadow-md" />
      </div>
      {/* Formulario principal */}
      <div className="bg-white/90 dark:bg-neutral-900/90 rounded-xl px-4 md:px-10 py-8 flex flex-col gap-12 shadow-lg border border-indigo-100 dark:border-indigo-900">
        {step === 0 && (
          <div className="flex flex-col gap-10 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label htmlFor="titulo" className={labelClass}>Título*</label>
                <input
                  id="titulo"
                  className={underlineInputClass}
                  value={mural.titulo}
                  onChange={e => setMural(m => ({ ...m, titulo: e.target.value }))}
                  aria-invalid={!!errors.titulo}
                  placeholder="Ej: Mural de la esperanza"
                  autoComplete="off"
                />
                {errors.titulo && <span className={errorClass}>{errors.titulo}</span>}
              </div>
              <div>
                <label htmlFor="tecnica" className={labelClass}>Técnica*</label>
                <input
                  id="tecnica"
                  className={underlineInputClass}
                  value={mural.tecnica}
                  onChange={e => setMural(m => ({ ...m, tecnica: e.target.value }))}
                  aria-invalid={!!errors.tecnica}
                  placeholder="Ej: Acrílico sobre muro"
                  autoComplete="off"
                />
                {errors.tecnica && <span className={errorClass}>{errors.tecnica}</span>}
              </div>
              <div>
                <label htmlFor="anio" className={labelClass}>Año*</label>
                <Select
                  value={String(mural.anio)}
                  onValueChange={val => setMural(m => ({ ...m, anio: val }))}
                  placeholder="Selecciona el año"
                >
                  {years.map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </Select>
                {errors.anio && <span className={errorClass}>{errors.anio}</span>}
              </div>
              <div>
                <label htmlFor="dimensiones" className={labelClass}>Dimensiones</label>
                <input
                  id="dimensiones"
                  className={underlineInputClass}
                  value={mural.dimensiones}
                  onChange={e => setMural(m => ({ ...m, dimensiones: e.target.value }))}
                  placeholder="Ej: 3m x 5m"
                  autoComplete="off"
                />
              </div>
            </div>
            <div>
              <label htmlFor="descripcion" className={labelClass}>Descripción</label>
              <textarea
                id="descripcion"
                className={underlineInputClass + " min-h-[80px] resize-y mt-1"}
                value={mural.descripcion}
                onChange={e => setMural(m => ({ ...m, descripcion: e.target.value }))}
                placeholder="Describe brevemente el mural, su inspiración, etc."
              />
            </div>
            <div>
              <label htmlFor="tags" className={labelClass}>Tags</label>
              <input
                id="tags"
                className={underlineInputClass}
                value={mural.tagsInput || ""}
                onChange={e => setMural(m => ({ ...m, tagsInput: e.target.value }))}
                placeholder="Escribe un tag y presiona Enter o coma"
                autoComplete="off"
                onKeyDown={e => {
                  if (["Enter", ","].includes(e.key)) {
                    e.preventDefault();
                    const val = mural.tagsInput?.trim();
                    if (val && !mural.tags.includes(val)) {
                      setMural(m => ({ ...m, tags: [...m.tags, val], tagsInput: "" }));
                    }
                  } else if (e.key === "Backspace" && !mural.tagsInput && mural.tags.length > 0) {
                    setMural(m => ({ ...m, tags: m.tags.slice(0, -1) }));
                  }
                }}
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {mural.tags.map((tag, i) => (
                  <Badge key={tag} variant="blue" className="pr-2 pl-3">
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-blue-700 hover:text-red-500 focus:outline-none"
                      onClick={() => setMural(m => ({ ...m, tags: m.tags.filter((t, idx) => idx !== i) }))}
                      aria-label={`Eliminar tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Step 2: Imágenes y medios */}
        {step === 1 && (
          <MuralImageStep
            value={mural.url_imagen}
            onChange={img => setMural(m => ({ ...m, url_imagen: img }))}
          />
        )}
        {/* Step 3: Ubicación y sala */}
        {step === 2 && (
          <div className="flex flex-col gap-10 mb-8">
            <label>
              Ubicación
              <input
                className="input"
                value={mural.ubicacion}
                onChange={e => setMural(m => ({ ...m, ubicacion: e.target.value }))}
              />
            </label>
            <label>
              Latitud
              <input
                className="input"
                type="number"
                value={mural.latitud}
                onChange={e => setMural(m => ({ ...m, latitud: e.target.value }))}
              />
            </label>
            <label>
              Longitud
              <input
                className="input"
                type="number"
                value={mural.longitud}
                onChange={e => setMural(m => ({ ...m, longitud: e.target.value }))}
              />
            </label>
            <label>
              Sala (ID)
              <input
                className="input"
                value={mural.salaId}
                onChange={e => setMural(m => ({ ...m, salaId: e.target.value }))}
              />
            </label>
            <label>
              Exposiciones (JSON)
              <textarea
                className="input"
                value={JSON.stringify(mural.exposiciones)}
                onChange={e => setMural(m => ({ ...m, exposiciones: e.target.value ? JSON.parse(e.target.value) : [] }))}
              />
            </label>
          </div>
        )}
        {/* Step 4: Estado y visibilidad */}
        {step === 3 && (
          <div className="flex flex-col gap-10 mb-8">
            <label>
              Estado
              <input
                className="input"
                value={mural.estado}
                onChange={e => setMural(m => ({ ...m, estado: e.target.value }))}
              />
            </label>
            <label>
              Pública
              <input
                type="checkbox"
                checked={mural.publica}
                onChange={e => setMural(m => ({ ...m, publica: e.target.checked }))}
              />
            </label>
            <label>
              Destacada
              <input
                type="checkbox"
                checked={mural.destacada}
                onChange={e => setMural(m => ({ ...m, destacada: e.target.checked }))}
              />
            </label>
            <label>
              Orden
              <input
                className="input"
                type="number"
                value={mural.orden}
                onChange={e => setMural(m => ({ ...m, orden: e.target.value }))}
              />
            </label>
          </div>
        )}
        {/* Step 5: Autores y colaboradores */}
        {step === 4 && (
          <div className="flex flex-col gap-10 mb-8">
            <label>
              Autor principal
              <input
                className="input"
                value={mural.autor}
                onChange={e => setMural(m => ({ ...m, autor: e.target.value }))}
              />
            </label>
            <label>
              Artista (ID)
              <input
                className="input"
                value={mural.artistId}
                onChange={e => setMural(m => ({ ...m, artistId: e.target.value }))}
              />
            </label>
            <label>
              Colaboradores (JSON)
              <textarea
                className="input"
                value={JSON.stringify(mural.colaboradores)}
                onChange={e => setMural(m => ({ ...m, colaboradores: e.target.value ? JSON.parse(e.target.value) : [] }))}
              />
            </label>
          </div>
        )}
        {/* Step 6: Confirmación */}
        {step === 5 && (
          <div className="flex flex-col gap-10 mb-8">
            <pre className="bg-gray-100 dark:bg-neutral-800 rounded p-4 text-xs overflow-x-auto">
              {JSON.stringify(mural, null, 2)}
            </pre>
            <Button className="mt-4" onClick={() => alert("Crear mural (TODO)")}>Crear mural</Button>
          </div>
        )}
        {/* Navegación */}
        <div className="flex gap-2 justify-end mt-8">
          {step > 0 && (
            <Button variant="secondary" onClick={handleBack}>
              Atrás
            </Button>
          )}
          {step < STEPS.length - 1 && (
            <Button onClick={handleNext}>
              Siguiente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
} 