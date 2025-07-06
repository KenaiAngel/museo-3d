"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useTheme } from "../../../providers/ThemeProvider";
import Stepper from "../../../components/ui/Stepper";
import { DatePicker } from "../../components/ui/date-picker-new";

// Función auxiliar para obtener coordenadas escaladas en el canvas
const getScaledCoords = (e, canvasRef, canvasZoom) => {
  const rect = canvasRef.current.getBoundingClientRect();
  const scaleX = canvasRef.current.width / rect.width;
  const scaleY = canvasRef.current.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX / canvasZoom,
    y: (e.clientY - rect.top) * scaleY / canvasZoom
  };
};

// Función auxiliar para números aleatorios
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para dibujar spray (para spray_time)
function drawSpray(point, brushSize, brushColor, canvasRef) {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < brushSize * 8; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * brushSize * 1.5;
    const px = point.x + Math.cos(angle) * radius;
    const py = point.y + Math.sin(angle) * radius;
    ctx.fillStyle = brushColor;
    ctx.globalAlpha = 0.08 + Math.random() * 0.18;
    ctx.beginPath();
    ctx.arc(px, py, 0.8 + Math.random() * 2.2, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export default function CrearObraModal({ isOpen, onClose, onCreate, session }) {
  const { theme } = useTheme();
  const [step, setStep] = useState(0);
  const [titulo, setTitulo] = useState("");
  const [tecnica, setTecnica] = useState("");
  const [year, setYear] = useState(new Date().getFullYear());
  const [imagen, setImagen] = useState(null);
  const [canvasImage, setCanvasImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [imgMode, setImgMode] = useState("archivo");
  const [brushType, setBrushType] = useState("brush");
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [canvasBg, setCanvasBg] = useState(null);
  const fileInputRef = useRef();
  const canvasRef = useRef();
  const pointsRef = useRef([]);
  const sprayTimerRef = useRef(null);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [furReady, setFurReady] = useState(false);
  const furBrushImgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);

  useEffect(() => {
    // Preparar textura para pincel "fur"
    const img = new window.Image();
    img.onload = () => {
      setFurReady(true);
    };
    img.src = "/assets/textures/fur.png";
    furBrushImgRef.current = img;
  }, []);

  // Dropzone para archivos (imagen principal)
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    if (file) {
      setImagen(file);
      if (errors.imagen) {
        setErrors(prev => ({ ...prev, imagen: undefined }));
      }
    }
  }, [errors.imagen]);

  const dropzone = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false
  });
  const { getRootProps, getInputProps, isDragActive } = dropzone;

  // Dropzone para fondo de canvas
  const bgDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        const url = URL.createObjectURL(file);
        setCanvasBg(url);
      }
    },
    accept: { "image/*": [] },
    multiple: false
  });
  const { getRootProps: getBgRootProps, getInputProps: getBgInputProps, isDragActive: isBgDragActive } = bgDropzone;

  const reset = () => {
    setStep(0);
    setTitulo("");
    setTecnica("");
    setYear(new Date().getFullYear());
    setImagen(null);
    setCanvasImage(null);
    setErrors({});
    setImgMode("archivo");
    setBrushType("brush");
    setBrushColor("#000000");
    setBrushSize(5);
    setCanvasBg(null);
    setCanvasZoom(1);
    setIsDrawing(false);
    setLastPoint(null);
    setCursorPos(null);
  };

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen]);

  const validateStep = () => {
    const newErrors = {};
    
    if (step === 0) {
      if (!titulo.trim()) newErrors.titulo = "El título es requerido";
      if (!tecnica.trim()) newErrors.tecnica = "La técnica es requerida";
      if (!year) newErrors.year = "El año es requerido";
    }
    
    if (step === 1) {
      if (imgMode === "archivo" && !imagen) {
        newErrors.imagen = "Selecciona una imagen";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => setStep(step - 1);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagen(file);
      if (errors.imagen) {
        setErrors(prev => ({ ...prev, imagen: undefined }));
      }
    }
  };

  const handleCanvasBgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCanvasBg(url);
    }
  };

  // Función para agregar puntos con ancho aleatorio para 'pen'
  const addPoint = (e) => {
    const coords = getScaledCoords(e, canvasRef, canvasZoom);
    pointsRef.current.push(coords);
  };

  // Función para dibujar en el canvas según el brushType
  const draw = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const points = pointsRef.current;
    
    if (points.length < 2) return;

    ctx.save();

    switch (brushType) {
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        break;

      case 'rainbow_dynamic':
        const hue = (Date.now() / 10) % 360;
        ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        break;

      case 'confetti':
      case 'shooting_star':
        for (let i = 0; i < 5; i++) {
          const offsetX = (Math.random() - 0.5) * brushSize * 2;
          const offsetY = (Math.random() - 0.5) * brushSize * 2;
          ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
          ctx.fillRect(
            points[points.length - 1].x + offsetX,
            points[points.length - 1].y + offsetY,
            2, 2
          );
        }
        break;

      case 'glitch':
      case 'heart_spray':
      case 'lightning':
      case 'bubble':
      case 'ribbon':
      case 'fire_realistic':
      case 'particles':
      default:
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        ctx.stroke();
        break;
    }
    ctx.restore();
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    pointsRef.current = [];
    addPoint(e);
    addPoint(e); // dos puntos iguales para iniciar el trazo
    if (brushType === 'spray_time') {
      sprayTimerRef.current = setInterval(() => {
        if (pointsRef.current.length > 0) {
          drawSpray(pointsRef.current[pointsRef.current.length - 1], brushSize, brushColor, canvasRef);
        }
      }, 20);
    } else {
      draw(e);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    addPoint(e);
    draw(e);
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    stopDrawing();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
    if (canvasRef.current) {
      setCanvasImage(canvasRef.current.toDataURL());
    }
    if (sprayTimerRef.current) {
      clearInterval(sprayTimerRef.current);
      sprayTimerRef.current = null;
    }
    pointsRef.current = [];
  };

  useEffect(() => {
    if (imgMode === "canvas" && canvasBg && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new window.Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
      };
      img.src = canvasBg;
    }
  }, [canvasBg, imgMode]);

  const handleCreate = async () => {
    if (!validateStep()) return;
    
    let imgFile = null;
    let imgUrl = null;
    
    if (imgMode === "archivo" && imagen) {
      imgFile = imagen;
    } else if (imgMode === "canvas" && canvasImage) {
      // Convertir canvas a blob
      const canvas = canvasRef.current;
      canvas.toBlob((blob) => {
        imgFile = new File([blob], `${titulo || 'obra'}.png`, { type: 'image/png' });
      }, 'image/png');
    }

    const formData = new FormData();
    if (imgFile) formData.append("imagen", imgFile, titulo ? `${titulo}.png` : "obra.png");
    formData.append("titulo", titulo);
    formData.append("tecnica", tecnica);
    formData.append("anio", year ? year.toString() : "");
    formData.append("autor", session?.user?.name || "Usuario");
    formData.append("userId", session?.user?.id || "");

    try {
      const response = await fetch("/api/murales", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        onCreate(result);
        toast.success("Obra creada exitosamente");
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || "Error al crear la obra");
      }
    } catch (error) {
      toast.error("Error al crear la obra");
      console.error(error);
    }
  };

  // Determinar si estamos en el paso de canvas
  const isCanvasStep = step === 1 && imgMode === "canvas";

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ isolation: 'isolate' }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`fixed bg-background dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl w-full ${isCanvasStep ? "max-w-5xl min-h-[700px] mt-32" : "max-w-lg mt-20"} mx-auto p-0 overflow-hidden flex flex-col z-[99999]`}
        style={isCanvasStep ? { minHeight: 700, minWidth: 0 } : {}}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-foreground">Crear nueva obra</h2>
            <button onClick={onClose} className="p-2 rounded hover:bg-muted transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* Stepper */}
          <div className="flex items-center justify-center gap-4 mb-2">
            <Stepper
              steps={["Datos", "Imagen", "Confirmar"]}
              activeStep={step}
              color="indigo"
              className="mb-8"
              onStepClick={i => { if (i < step) setStep(i); }}
            />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 px-8 py-6 flex flex-col gap-6 justify-center">
          {step === 0 && (
            <>
              <motion.input
                type="text"
                placeholder="Título de la obra"
                value={titulo}
                onChange={e => {
                  setTitulo(e.target.value);
                  if (errors.titulo) setErrors(prev => ({ ...prev, titulo: undefined }));
                }}
                className="w-full px-4 py-3 rounded-xl border-2 text-base bg-background dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-foreground dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                animate={errors.titulo ? { x: [0, -8, 8, -6, 6, -4, 4, 0, Math.random()] } : false}
                transition={{ duration: 0.4 }}
              />
              {errors.titulo && <div className="text-pink-500 text-sm">{errors.titulo}</div>}
              
              <motion.input
                type="text"
                placeholder="Técnica"
                value={tecnica}
                onChange={e => {
                  setTecnica(e.target.value);
                  if (errors.tecnica) setErrors(prev => ({ ...prev, tecnica: undefined }));
                }}
                className="w-full px-4 py-3 rounded-xl border-2 text-base bg-background dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-foreground dark:text-neutral-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                animate={errors.tecnica ? { x: [0, -8, 8, -6, 6, -4, 4, 0, Math.random()] } : false}
                transition={{ duration: 0.4 }}
              />
              {errors.tecnica && <div className="text-pink-500 text-sm">{errors.tecnica}</div>}
              
              <motion.div
                animate={errors.year ? { x: [0, -8, 8, -6, 6, -4, 4, 0, Math.random()] } : false}
                transition={{ duration: 0.4 }}
              >
                <DatePicker
                  value={year ? `${year}-01-01` : null}
                  onChange={dateString => {
                    if (dateString) {
                      const d = new Date(dateString);
                      setYear(d.getFullYear());
                      if (errors.year) setErrors(prev => ({ ...prev, year: undefined }));
                    } else {
                      setYear(null);
                    }
                  }}
                  placeholder="Selecciona el año..."
                />
              </motion.div>
              {errors.year && <div className="text-pink-500 text-sm">{errors.year}</div>}
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex gap-4 mb-4">
                <button
                  className={`px-4 py-2 rounded-lg font-bold border ${imgMode === "archivo" ? "bg-indigo-600 text-white border-indigo-700" : "bg-muted text-foreground border-border"}`}
                  onClick={() => setImgMode("archivo")}
                >
                  Subir archivo
                </button>
                <button
                  className={`px-4 py-2 rounded-lg font-bold border ${imgMode === "canvas" ? "bg-indigo-600 text-white border-indigo-700" : "bg-muted text-foreground border-border"}`}
                  onClick={() => setImgMode("canvas")}
                >
                  Crear en canvas
                </button>
              </div>

              {imgMode === "archivo" && (
                <>
                  <div {...getRootProps()} className={`w-full border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${isDragActive ? "border-indigo-500 bg-indigo-50" : "border-border bg-muted/40"}`}>
                    <input {...getInputProps()} />
                    {imagen ? (
                      <img src={URL.createObjectURL(imagen)} alt="preview" className="w-full max-h-64 object-contain rounded-xl border mt-2 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">Arrastra una imagen aquí o haz clic para seleccionar</span>
                    )}
                  </div>
                  {errors.imagen && <div className="text-pink-500 text-sm">{errors.imagen}</div>}
                </>
              )}

              {imgMode === "canvas" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Panel de herramientas */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 flex flex-col gap-4">
                      <h3 className="font-semibold mb-3">Herramientas</h3>
                      
                      {/* Fondo del canvas */}
                      <div {...getBgRootProps()} className={`w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative ${isBgDragActive ? "border-indigo-500 bg-indigo-50" : "border-border bg-muted/40"}`}>
                        <input {...getBgInputProps()} />
                        {canvasBg ? (
                          <div className="relative inline-block w-full">
                            <img src={canvasBg} alt="bg" className="w-full max-h-32 object-contain rounded-xl border mx-auto" />
                            <button
                              type="button"
                              onClick={e => { e.stopPropagation(); setCanvasBg(null); }}
                              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 z-10"
                              tabIndex={-1}
                              aria-label="Eliminar fondo"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Arrastra una imagen de fondo aquí o haz clic para seleccionar</span>
                        )}
                      </div>

                      {/* Selector de pincel */}
                      <div className="w-full mb-3">
                        <div className="flex gap-2 items-center overflow-x-auto px-2 max-w-full">
                          <label className="font-medium">Pincel:</label>
                          <select value={brushType} onChange={e => setBrushType(e.target.value)} className="rounded border-2 px-2 py-1 max-w-xs truncate w-full border-gray-300 dark:border-neutral-700">
                            <optgroup label="Básicos">
                              <option value="pencil">Lápiz simple</option>
                              <option value="smooth">Lápiz suave (Bezier)</option>
                              <option value="shadow">Sombra/Glow</option>
                              <option value="brush">Pincel clásico</option>
                              <option value="classic_brush">Pincel clásico (HTML/JS)</option>
                              <option value="eraser">Borrador</option>
                            </optgroup>
                            <optgroup label="Artísticos">
                              <option value="fur" disabled={!furReady}>Fur (pelos){!furReady ? ' (cargando...)' : ''}</option>
                              <option value="pen">Pluma (ancho variable)</option>
                              <option value="pen2">Pluma múltiple</option>
                              <option value="thick">Pincel grueso</option>
                              <option value="sliced">Pincel cortado</option>
                              <option value="multi">Múltiples líneas</option>
                              <option value="multi_opacity">Múltiples líneas opacidad</option>
                              <option value="carboncillo">Carboncillo</option>
                              <option value="acuarela">Acuarela</option>
                              <option value="tiza">Tiza</option>
                              <option value="marcador">Marcador</option>
                              <option value="oleo">Óleo</option>
                              <option value="pixel">Pixel</option>
                              <option value="neon">Neón</option>
                              <option value="puntos">Puntos</option>
                              <option value="lineas">Líneas</option>
                              <option value="fuego">Fuego</option>
                            </optgroup>
                            <optgroup label="Estampado">
                              <option value="stamp_circle">Estampado círculo</option>
                              <option value="stamp_star">Estampado estrella</option>
                            </optgroup>
                            <optgroup label="Patrón">
                              <option value="pattern_dots">Patrón puntos</option>
                              <option value="pattern_lines">Patrón líneas</option>
                              <option value="pattern_rainbow">Patrón arcoíris</option>
                              <option value="pattern_image">Patrón imagen</option>
                            </optgroup>
                            <optgroup label="Spray">
                              <option value="aerosol">Aerosol</option>
                              <option value="spray">Spray</option>
                              <option value="spray_time">Spray tiempo</option>
                            </optgroup>
                            <optgroup label="Sketch/Harmony">
                              <option value="sketchy">Sketchy (Harmony)</option>
                              <option value="neighbor">Neighbor points</option>
                              <option value="fur_neighbor">Fur neighbor</option>
                            </optgroup>
                            <optgroup label="Especiales">
                              <option value="rainbow_dynamic">Arcoíris dinámico</option>
                              <option value="confetti">Confeti</option>
                              <option value="shooting_star">Estrella fugaz</option>
                              <option value="glitch">Glitch</option>
                              <option value="heart_spray">Spray de corazones</option>
                              <option value="lightning">Rayo</option>
                              <option value="bubble">Burbuja</option>
                              <option value="ribbon">Cinta</option>
                              <option value="fire_realistic">Fuego realista</option>
                              <option value="particles">Partículas</option>
                            </optgroup>
                          </select>
                        </div>
                      </div>

                      {/* Color y tamaño */}
                      <div className="mb-3">
                        <label className="font-medium mr-2">Color:</label>
                        <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} className="w-8 h-8 rounded align-middle" />
                      </div>
                      
                      <div className="mt-2 mb-3">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={brushSize}
                          onChange={e => setBrushSize(parseInt(e.target.value))}
                          className="w-full max-w-xs"
                        />
                        <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{brushSize}px</div>
                      </div>

                      {/* Botones de acción */}
                      <div className="flex gap-2 mb-3">
                        <button type="button" onClick={() => setCanvasBg("/assets/textures/wall.jpg")}
                          className="px-3 py-1 rounded bg-gray-300 text-gray-800 text-xs font-bold hover:bg-gray-400">
                          Fondo muro
                        </button>
                        <button
                          onClick={() => {
                            const canvas = canvasRef.current;
                            const ctx = canvas.getContext('2d');
                            ctx.clearRect(0, 0, canvas.width, canvas.height);
                            if (canvasBg) {
                              const img = new window.Image();
                              img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                              img.src = canvasBg;
                            }
                          }}
                          className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold hover:bg-red-700"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Canvas grande */}
                  <div className="lg:col-span-3 flex items-center justify-center">
                    <div style={{ position: "relative", width: "100%", maxWidth: 900, aspectRatio: "4/3" }}>
                      <div className="absolute top-2 right-2 z-10 flex gap-2">
                        <button
                          type="button"
                          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold"
                          onClick={() => setCanvasZoom(z => Math.max(0.5, z - 0.1))}
                          title="Zoom -"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono bg-white/80 rounded border border-gray-300 text-black">{(canvasZoom * 100).toFixed(0)}%</span>
                        <button
                          type="button"
                          className="px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold"
                          onClick={() => setCanvasZoom(z => Math.min(2, z + 0.1))}
                          title="Zoom +"
                        >
                          +
                        </button>
                      </div>
                      <canvas
                        ref={canvasRef}
                        width={800}
                        height={600}
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          display: "block", 
                          background: "#fff", 
                          borderRadius: 12, 
                          border: '2px solid #d1d5db', 
                          transform: `scale(${canvasZoom})`, 
                          transformOrigin: 'center center' 
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={e => {
                          const rect = canvasRef.current.getBoundingClientRect();
                          setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                          handleMouseMove(e);
                        }}
                        onMouseUp={stopDrawing}
                        onMouseLeave={handleMouseLeave}
                      />
                      {brushType === 'eraser' && cursorPos && (
                        <div
                          style={{
                            position: 'absolute',
                            left: `calc(${cursorPos.x}px - ${brushSize / 2}px)`,
                            top: `calc(${cursorPos.y}px - ${brushSize / 2}px)`,
                            width: brushSize,
                            height: brushSize,
                            borderRadius: '50%',
                            background: 'rgba(200,200,200,0.3)',
                            border: '2px solid #888',
                            pointerEvents: 'none',
                            zIndex: 20,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-lg font-semibold text-foreground">¿Listo para crear tu obra?</div>
              <div className="flex flex-col gap-2">
                <div><span className="font-medium">Título:</span> {titulo}</div>
                <div><span className="font-medium">Técnica:</span> {tecnica}</div>
                <div><span className="font-medium">Año:</span> {year}</div>
                {imagen && <img src={URL.createObjectURL(imagen)} alt="preview" className="w-full max-h-40 object-contain rounded-xl border" />}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 px-8 py-4 border-t border-border bg-muted/40">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded-lg bg-muted text-foreground font-bold hover:bg-gray-100 dark:hover:bg-neutral-700 transition"
              >
                Atrás
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition"
              >
                Crear obra
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
