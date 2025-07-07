"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { X, Undo2, Redo2, Download, Trash2, Brush, Eraser, Droplets, Sparkles, PaintBucket, Palette, Flame, Grid3X3, Zap, MoreHorizontal, Target, Scissors, Waves, Circle, Star, Heart, Image } from "lucide-react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useTheme } from "../../../providers/ThemeProvider";
import Stepper from "../../../components/ui/Stepper";
import { DatePicker } from "../../components/ui/date-picker-new";
import ReactDOM from "react-dom";

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

// Agregar función auxiliar para variar el color:
function shadeColor(color, percent) {
  // color: #rrggbb
  let R = parseInt(color.substring(1,3),16);
  let G = parseInt(color.substring(3,5),16);
  let B = parseInt(color.substring(5,7),16);
  R = Math.min(255, Math.max(0, R + percent));
  G = Math.min(255, Math.max(0, G + percent));
  B = Math.min(255, Math.max(0, B + percent));
  return `rgb(${R},${G},${B})`;
}

// Agregar función auxiliar para dibujar una estrella:
function drawStar(ctx, x, y, outerRadius, innerRadius, points, color) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - outerRadius);
  for (let i = 0; i < points * 2; i++) {
    const angle = Math.PI / points * i;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    ctx.lineTo(x + Math.sin(angle) * r, y - Math.cos(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// Agregar función auxiliar para convertir hex a rgba:
function hexToRgba(hex, alpha) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(x => x + x).join('');
  }
  const r = parseInt(hex.substring(0,2), 16);
  const g = parseInt(hex.substring(2,4), 16);
  const b = parseInt(hex.substring(4,6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Definir herramientas principales con íconos
const TOOL_ICONS = {
  pencil: Brush,
  smooth: Sparkles,
  shadow: Zap,
  eraser: Eraser,
  carboncillo: Scissors,
  acuarela: Droplets,
  tiza: Grid3X3,
  marcador: PaintBucket,
  oleo: Palette,
  pixel: Grid3X3,
  neon: Zap,
  puntos: Target,
  lineas: MoreHorizontal,
  fuego: Flame,
  thick: Brush,
  sliced: Scissors,
  pen: Brush,
  pen2: Brush,
  multi: Waves,
  multi_opacity: Waves,
  beads: Circle,
  wiggle: Waves,
  // Estampados y patrones
  stamp_circle: Circle,
  stamp_star: Star,
  pattern_dots: Grid3X3,
  pattern_lines: MoreHorizontal,
  pattern_rainbow: Flame,
  pattern_image: Image,
  // Spray
  aerosol: Droplets,
  spray: Droplets,
  spray_time: Droplets,
  spray_speed: Droplets,
  // Sketch/Harmony
  sketchy: Brush,
  neighbor: Brush,
  fur_neighbor: Brush,
  // Especiales
  rainbow_dynamic: Flame,
  confetti: Sparkles,
  shooting_star: Star,
  glitch: Zap,
  heart_spray: Heart,
  lightning: Zap,
  bubble: Circle,
  ribbon: Waves,
  fire_realistic: Flame,
  particles: Sparkles,
};

// Agrupación de pinceles por sección
const BRUSH_SECTIONS = [
  {
    label: "Básicos",
    keys: ["pencil", "smooth", "shadow", "brush", "eraser"],
  },
  {
    label: "Artísticos",
    keys: ["pen", "pen2", "thick", "sliced", "multi", "multi_opacity", "carboncillo", "acuarela", "tiza", "marcador", "oleo", "pixel", "neon", "puntos", "lineas", "fuego", "beads", "wiggle"],
  },
  {
    label: "Estampado",
    keys: ["stamp_circle", "stamp_star"],
  },
  {
    label: "Patrón",
    keys: ["pattern_dots", "pattern_lines", "pattern_rainbow", "pattern_image"],
  },
  {
    label: "Spray",
    keys: ["aerosol", "spray", "spray_time", "spray_speed"],
  },
  {
    label: "Sketch/Harmony",
    keys: ["sketchy", "neighbor", "fur_neighbor"],
  },
  {
    label: "Especiales",
    keys: ["rainbow_dynamic", "confetti", "shooting_star", "glitch", "heart_spray", "lightning", "bubble", "ribbon", "fire_realistic", "particles"],
  },
];

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
  const [patternImage, setPatternImage] = useState(null);
  const [patternImageUrl, setPatternImageUrl] = useState(null);
  const [showPatternImageModal, setShowPatternImageModal] = useState(false);
  const [patternImageReady, setPatternImageReady] = useState(false);
  const [aerosolTimer, setAerosolTimer] = useState(null);
  const [aerosolPos, setAerosolPos] = useState(null);
  // Estados para historial de canvas
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const HISTORY_LIMIT = 30;
  // Estado para mostrar/ocultar el dropdown de pinceles
  const [showBrushDropdown, setShowBrushDropdown] = useState(false);
  const brushDropdownRef = useRef(null);
  const brushButtonRef = useRef(null);
  const modalRef = useRef(null);
  const [brushDropdownPos, setBrushDropdownPos] = useState({ left: '50%', top: '48px', width: 420 });

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

  // Dropzone para patrón de imagen
  const patternImageDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        setPatternImage(file);
        setShowPatternImageModal(false);
      }
    },
    accept: { "image/*": [] },
    multiple: false
  });
  const { getRootProps: getPatternImgRootProps, getInputProps: getPatternImgInputProps, isDragActive: isPatternImgDragActive } = patternImageDropzone;

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
      // Lápiz simple: línea continua, sin efectos especiales
      case 'pencil': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        break;
      }
      // Lápiz suave: línea continua, sin sombra ni glow, solo lineJoin y lineCap 'round'
      case 'smooth': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        break;
      }
      // Glow: resplandor intenso, modo lighter, halo extenso
      case 'shadow': {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 2.5;
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
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

      case 'glitch': {
        // Línea principal
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 3; i++) {
          const offset = (i - 1) * 2;
          ctx.strokeStyle = ['#f00', '#0ff', '#fff'][i];
          ctx.lineWidth = brushSize + (i === 1 ? 2 : 0);
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x + offset, points[points.length - 2].y + offset);
          ctx.lineTo(points[points.length - 1].x + offset, points[points.length - 1].y + offset);
          ctx.stroke();
        }
        // Saltos aleatorios
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = brushSize * 0.7;
          const t = Math.random();
          const x1 = points[points.length - 2].x + (points[points.length - 1].x - points[points.length - 2].x) * t + getRandomInt(-4, 4);
          const y1 = points[points.length - 2].y + (points[points.length - 1].y - points[points.length - 2].y) * t + getRandomInt(-4, 4);
          const x2 = x1 + getRandomInt(-8, 8);
          const y2 = y1 + getRandomInt(-8, 8);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case 'heart_spray': {
        // Spray de corazones
        for (let i = 0; i < brushSize * 1.2; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.5;
          const x = points[points.length - 1].x + Math.cos(angle) * radius;
          const y = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);
          ctx.scale(0.7 + Math.random() * 0.7, 0.7 + Math.random() * 0.7);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(0, -brushSize * 0.4, -brushSize * 0.5, -brushSize * 0.4, -brushSize * 0.5, 0);
          ctx.bezierCurveTo(-brushSize * 0.5, brushSize * 0.5, 0, brushSize * 0.7, 0, brushSize * 1.1);
          ctx.bezierCurveTo(0, brushSize * 0.7, brushSize * 0.5, brushSize * 0.5, brushSize * 0.5, 0);
          ctx.bezierCurveTo(brushSize * 0.5, -brushSize * 0.4, 0, -brushSize * 0.4, 0, 0);
          ctx.closePath();
          ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 60%)`;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fill();
          ctx.restore();
        }
        break;
      }
      case 'lightning': {
        // Rayo zig-zag
        const x1 = points[points.length - 2].x;
        const y1 = points[points.length - 2].y;
        const x2 = points[points.length - 1].x;
        const y2 = points[points.length - 1].y;
        const steps = 8;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let j = 0; j < 2; j++) {
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const nx = x1 + (x2 - x1) * t + getRandomInt(-6, 6);
            const ny = y1 + (y2 - y1) * t + getRandomInt(-6, 6);
            ctx.lineTo(nx, ny);
          }
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = j === 0 ? '#fff' : 'yellow';
          ctx.lineWidth = j === 0 ? brushSize * 1.2 : brushSize * 0.7;
          ctx.shadowColor = 'yellow';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = j === 0 ? 0.7 : 0.5;
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case 'bubble': {
        // Burbujas translúcidas
        for (let i = 0; i < brushSize * 1.2; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.5;
          const x = points[points.length - 1].x + Math.cos(angle) * radius;
          const y = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(3, brushSize * 0.5 + Math.random() * brushSize * 0.5), 0, Math.PI * 2);
          ctx.globalAlpha = 0.18 + Math.random() * 0.22;
          ctx.fillStyle = `rgba(180,220,255,0.5)`;
          ctx.fill();
          // Reflejo
          ctx.globalAlpha = 0.12;
          ctx.beginPath();
          ctx.arc(x - brushSize * 0.2, y - brushSize * 0.2, Math.max(1, brushSize * 0.18), 0, Math.PI * 2);
          ctx.fillStyle = '#fff';
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'ribbon': {
        // Cinta ondulante
        const x1 = points[points.length - 2].x;
        const y1 = points[points.length - 2].y;
        const x2 = points[points.length - 1].x;
        const y2 = points[points.length - 1].y;
        const steps = 16;
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const angle = Math.PI * 2 * t * 2 + Date.now() / 200;
          const r = Math.sin(angle) * brushSize * 0.7;
          const x = x1 + (x2 - x1) * t + Math.cos(angle) * r;
          const y = y1 + (y2 - y1) * t + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 0.9;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
        break;
      }
      case 'fire_realistic': {
        // Llama realista
        for (let i = 0; i < 3; i++) {
          const flameColor = [
            'rgba(255, 200, 0, 0.18)',
            'rgba(255, 100, 0, 0.13)',
            'rgba(255, 255, 255, 0.08)'
          ][i];
          const flameSize = brushSize * (1.2 + i * 0.5);
          ctx.beginPath();
          ctx.ellipse(points[points.length - 1].x, points[points.length - 1].y, flameSize, flameSize * (1.2 + Math.random() * 0.5), 0, 0, Math.PI * 2);
          ctx.fillStyle = flameColor;
          ctx.fill();
        }
        // Chispas
        for (let i = 0; i < Math.floor(brushSize / 2); i++) {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = 'yellow';
          ctx.beginPath();
          ctx.arc(points[points.length - 1].x + (Math.random() - 0.5) * brushSize * 2, points[points.length - 1].y - Math.random() * brushSize * 2, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      case 'particles': {
        // Partículas de colores
        for (let i = 0; i < brushSize * 2; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const x = points[points.length - 1].x + Math.cos(angle) * radius;
          const y = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(x, y, Math.max(1, brushSize * 0.18), 0, Math.PI * 2);
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 60%)`;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Carboncillo: puntos aleatorios y multiply
      case 'carboncillo': {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 0.8;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        // Granulado
        for (let i = 0; i < brushSize * 2; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * brushSize * 0.7;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.globalAlpha = 0.1 + Math.random() * 0.2;
          ctx.beginPath();
          ctx.arc(px, py, Math.random() * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = brushColor;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Acuarela: gradientes radiales multicapa
      case 'acuarela': {
        ctx.globalCompositeOperation = 'multiply';
        for (let ring = 0; ring < 4; ring++) {
          const ringRadius = brushSize * (0.7 + ring * 0.5);
          const baseAlpha = 0.18 - ring * 0.03;
          const gradient = ctx.createRadialGradient(points[points.length - 1].x, points[points.length - 1].y, 0, points[points.length - 1].x, points[points.length - 1].y, ringRadius);
          gradient.addColorStop(0, `${brushColor}${Math.floor(baseAlpha * 255).toString(16).padStart(2, '0')}`);
          gradient.addColorStop(1, `${brushColor}00`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(points[points.length - 1].x, points[points.length - 1].y, ringRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Tiza: puntos dispersos y screen
      case 'tiza': {
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        for (let i = 0; i < brushSize * 4; i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.globalAlpha = 0.1 + Math.random() * 0.15;
          ctx.beginPath();
          ctx.arc(px, py, Math.random() * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = brushColor;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Marcador: círculo relleno semitransparente (estilo p5.js)
      case 'marcador': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.arc(points[points.length - 1].x, points[points.length - 1].y, brushSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      // Óleo mejorado: pinceladas visibles, textura y mezcla de tonos
      case 'oleo': {
        ctx.globalCompositeOperation = 'source-over';
        const x1 = points[points.length - 2].x;
        const y1 = points[points.length - 2].y;
        const x2 = points[points.length - 1].x;
        const y2 = points[points.length - 1].y;
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const steps = Math.max(1, Math.ceil(distance / 2));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const interpX = x1 + (x2 - x1) * t;
          const interpY = y1 + (y2 - y1) * t;
          // Mancha principal
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = brushColor;
          ctx.beginPath();
          ctx.ellipse(interpX, interpY, brushSize * 0.7, brushSize * (0.4 + Math.random() * 0.3), Math.random() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
          // Pinceladas: líneas cortas y manchas
          for (let j = 0; j < 3; j++) {
            const angle = Math.random() * 2 * Math.PI;
            const len = brushSize * (0.7 + Math.random() * 0.5);
            ctx.globalAlpha = 0.10 + Math.random() * 0.05;
            ctx.strokeStyle = shadeColor(brushColor, (Math.random() - 0.5) * 18);
            ctx.lineWidth = brushSize * (0.18 + Math.random() * 0.18);
            ctx.beginPath();
            ctx.moveTo(interpX, interpY);
            ctx.lineTo(interpX + Math.cos(angle) * len, interpY + Math.sin(angle) * len);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Pixel: cuadrado tipo pixel art
      case 'pixel': {
        ctx.globalCompositeOperation = 'source-over';
        const pixelSize = Math.max(2, Math.round(brushSize / 2));
        const gridX = Math.floor(points[points.length - 1].x / pixelSize) * pixelSize;
        const gridY = Math.floor(points[points.length - 1].y / pixelSize) * pixelSize;
        ctx.fillStyle = brushColor;
        ctx.fillRect(gridX, gridY, pixelSize, pixelSize);
        break;
      }
      // Neón: glow fuerte y modo lighter
      case 'neon': {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 2.1;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 1.4;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Puntillismo: puntos aleatorios
      case 'puntos': {
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < Math.floor(brushSize * 2); i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * brushSize * 0.7;
          const dotX = points[points.length - 1].x + Math.cos(angle) * radius;
          const dotY = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.fillStyle = brushColor;
          ctx.beginPath();
          ctx.arc(dotX, dotY, Math.max(1, brushSize * 0.18), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Líneas: grabado cruzado
      case 'lineas': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineCap = 'round';
        for (let dir = 0; dir < 4; dir++) {
          const angle = dir * Math.PI / 4;
          const lineCount = Math.floor(brushSize / 4);
          ctx.globalAlpha = 0.5 - dir * 0.1;
          ctx.lineWidth = 1.2;
          for (let i = 0; i < lineCount; i++) {
            const offset = (i - lineCount / 2) * 2;
            const length = brushSize * (0.8 + Math.random() * 0.4);
            const perpAngle = angle + Math.PI / 2;
            const startX = points[points.length - 1].x + Math.cos(perpAngle) * offset - Math.cos(angle) * length / 2;
            const startY = points[points.length - 1].y + Math.sin(perpAngle) * offset - Math.sin(angle) * length / 2;
            const endX = startX + Math.cos(angle) * length;
            const endY = startY + Math.sin(angle) * length;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Fuego: elipse y chispas
      case 'fuego': {
        ctx.globalCompositeOperation = 'lighter';
        for (let layer = 0; layer < 3; layer++) {
          const flameColor = `rgba(255,${140 + layer * 40},0,${0.3 - layer * 0.08})`;
          const flameSize = brushSize * (1.2 + layer * 0.3);
          ctx.beginPath();
          ctx.ellipse(points[points.length - 1].x, points[points.length - 1].y, flameSize, flameSize * 1.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = flameColor;
          ctx.fill();
        }
        for (let i = 0; i < Math.floor(brushSize / 2); i++) {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = 'yellow';
          ctx.beginPath();
          ctx.arc(points[points.length - 1].x + (Math.random() - 0.5) * brushSize * 2, points[points.length - 1].y - Math.random() * brushSize * 2, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Spray: puntos aleatorios en área circular
      case 'spray': {
        for (let i = 0; i < brushSize * 8; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.5;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.fillStyle = brushColor;
          ctx.globalAlpha = 0.08 + Math.random() * 0.18;
          ctx.beginPath();
          ctx.arc(px, py, 0.8 + Math.random() * 2.2, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Pen: ancho variable
      case 'pen': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.7 + Math.random() * 0.6);
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        break;
      }
      // Pen2: múltiples líneas
      case 'pen2': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 0.7;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 1;
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * brushSize * 0.7;
          const offsetY = (Math.random() - 0.5) * brushSize * 0.7;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x + offsetX, points[points.length - 2].y + offsetY);
          ctx.lineTo(points[points.length - 1].x + offsetX, points[points.length - 1].y + offsetY);
          ctx.stroke();
        }
        break;
      }
      // Multi-line mejorado: líneas paralelas y cruzadas, opacidad y grosor aleatorio
      case 'multi': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineCap = 'round';
        const numLines = 7;
        for (let i = 0; i < numLines; i++) {
          // Offset aleatorio para cada línea
          const offsetX = (Math.random() - 0.5) * brushSize * 1.5;
          const offsetY = (Math.random() - 0.5) * brushSize * 1.5;
          ctx.globalAlpha = 0.18 + Math.random() * 0.32;
          ctx.lineWidth = brushSize * (0.25 + Math.random() * 0.25);
          // Variar longitud (simula líneas más cortas/largas)
          const t1 = Math.random() * 0.2;
          const t2 = 0.8 + Math.random() * 0.2;
          ctx.beginPath();
          ctx.moveTo(
            points[points.length - 2].x + offsetX * (1 - t1),
            points[points.length - 2].y + offsetY * (1 - t1)
          );
          ctx.lineTo(
            points[points.length - 1].x + offsetX * (1 - t2),
            points[points.length - 1].y + offsetY * (1 - t2)
          );
          ctx.stroke();
        }
        // Líneas cruzadas (diagonales)
        for (let i = 0; i < 3; i++) {
          const angle = Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 2;
          const length = brushSize * (2 + Math.random() * 2);
          ctx.globalAlpha = 0.12 + Math.random() * 0.18;
          ctx.lineWidth = brushSize * (0.18 + Math.random() * 0.18);
          ctx.beginPath();
          const midX = (points[points.length - 2].x + points[points.length - 1].x) / 2;
          const midY = (points[points.length - 2].y + points[points.length - 1].y) / 2;
          ctx.moveTo(
            midX - Math.cos(angle) * length / 2,
            midY - Math.sin(angle) * length / 2
          );
          ctx.lineTo(
            midX + Math.cos(angle) * length / 2,
            midY + Math.sin(angle) * length / 2
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Multi-opacity mejorado: líneas superpuestas con offsets, opacidad y grosor decreciente
      case 'multi_opacity': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const numLines = 5;
        for (let i = 0; i < numLines; i++) {
          const offsetX = (Math.random() - 0.5) * brushSize * 1.1;
          const offsetY = (Math.random() - 0.5) * brushSize * 1.1;
          ctx.globalAlpha = 1 - i * 0.18 - Math.random() * 0.12;
          ctx.lineWidth = brushSize * (0.7 - i * 0.12 + Math.random() * 0.08);
          // Variar longitud de la línea
          const t1 = Math.random() * 0.15;
          const t2 = 0.85 + Math.random() * 0.15;
          ctx.beginPath();
          ctx.moveTo(
            points[points.length - 2].x + offsetX * (1 - t1),
            points[points.length - 2].y + offsetY * (1 - t1)
          );
          ctx.lineTo(
            points[points.length - 1].x + offsetX * (1 - t2),
            points[points.length - 1].y + offsetY * (1 - t2)
          );
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Beads: círculo en el punto medio, diámetro igual a la distancia entre puntos
      case 'beads': {
        if (points.length < 2) break;
        const x1 = points[points.length - 2].x;
        const y1 = points[points.length - 2].y;
        const x2 = points[points.length - 1].x;
        const y2 = points[points.length - 1].y;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(midX, midY, distance / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      }
      // Pincel clásico mejorado: trazo artístico con variación de ancho y opacidad
      case 'brush': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Simular presión y textura
        const width = brushSize * (0.85 + Math.random() * 0.3);
        ctx.lineWidth = width;
        ctx.globalAlpha = 0.7 + Math.random() * 0.25;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      }
      // Pincel grueso mejorado: centro opaco, bordes difusos y residuos
      case 'thick': {
        ctx.globalCompositeOperation = 'source-over';
        // Trazo principal (más opaco en el centro)
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        // Bordes difusos (círculos semitransparentes)
        for (let i = 0; i < 8; i++) {
          const t = i / 7;
          const x = points[points.length - 2].x + (points[points.length - 1].x - points[points.length - 2].x) * t;
          const y = points[points.length - 2].y + (points[points.length - 1].y - points[points.length - 2].y) * t;
          for (let j = 0; j < 6; j++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = brushSize * (1.1 + Math.random() * 0.7);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            ctx.globalAlpha = 0.13 + Math.random() * 0.09;
            ctx.beginPath();
            ctx.arc(px, py, brushSize * (0.18 + Math.random() * 0.18), 0, Math.PI * 2);
            ctx.fillStyle = brushColor;
            ctx.fill();
          }
        }
        // Residuos de pintura (puntos pequeños en los bordes)
        for (let i = 0; i < 10; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = brushSize * (1.7 + Math.random() * 0.7);
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.globalAlpha = 0.08 + Math.random() * 0.08;
          ctx.beginPath();
          ctx.arc(px, py, Math.random() * 1.2 + 0.5, 0, Math.PI * 2);
          ctx.fillStyle = brushColor;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Pincel cortado: simula poca pintura, líneas sueltas e irregulares
      case 'sliced': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const numLines = Math.max(3, Math.floor(brushSize / 2));
        for (let i = 0; i < numLines; i++) {
          const offset = (i - numLines / 2) * (brushSize * 0.4 + Math.random() * brushSize * 0.2);
          // Simular líneas interrumpidas
          if (Math.random() < 0.35) continue;
          ctx.globalAlpha = 0.18 + Math.random() * 0.22;
          ctx.lineWidth = brushSize * (0.18 + Math.random() * 0.18);
          ctx.beginPath();
          // A veces la línea es más corta (simula falta de pintura)
          const t1 = Math.random() * 0.3;
          const t2 = 0.7 + Math.random() * 0.3;
          const xStart = points[points.length - 2].x + offset * (1 - t1);
          const yStart = points[points.length - 2].y + offset * (1 - t1);
          const xEnd = points[points.length - 1].x + offset * (1 - t2);
          const yEnd = points[points.length - 1].y + offset * (1 - t2);
          ctx.moveTo(xStart, yStart);
          ctx.lineTo(xEnd, yEnd);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Wiggle: arco ondulado entre puntos, alternando dirección
      case 'wiggle': {
        if (points.length < 2) break;
        const x1 = points[points.length - 2].x;
        const y1 = points[points.length - 2].y;
        const x2 = points[points.length - 1].x;
        const y2 = points[points.length - 1].y;
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1);
        // Alternar flip usando un contador local
        if (!draw.wiggleFlip) draw.wiggleFlip = 0;
        draw.wiggleFlip = 1 - draw.wiggleFlip;
        const flip = draw.wiggleFlip * Math.PI;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = Math.max(2, brushSize * 0.7);
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(midX, midY, distance / 2, angle + flip, angle + Math.PI + flip);
        ctx.stroke();
        break;
      }
      // Estampado círculo mejorado: patrón de círculos repetidos como trazo
      case 'stamp_circle': {
        if (!draw.stampCirclePatternCache || draw.stampCirclePatternColor !== brushColor || draw.stampCirclePatternSize !== brushSize) {
          // Crear patrón de círculo
          const patternCanvas = document.createElement('canvas');
          const dotWidth = Math.max(6, brushSize * 1.2);
          const dotDistance = Math.max(2, brushSize * 0.4);
          patternCanvas.width = patternCanvas.height = dotWidth + dotDistance;
          const patternCtx = patternCanvas.getContext('2d');
          patternCtx.fillStyle = brushColor;
          patternCtx.beginPath();
          patternCtx.arc(dotWidth / 2, dotWidth / 2, dotWidth / 2, 0, Math.PI * 2);
          patternCtx.closePath();
          patternCtx.fill();
          draw.stampCirclePatternCache = ctx.createPattern(patternCanvas, 'repeat');
          draw.stampCirclePatternColor = brushColor;
          draw.stampCirclePatternSize = brushSize;
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = brushSize * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = draw.stampCirclePatternCache;
        // Trazar curva suave entre los dos últimos puntos
        if (points.length >= 2) {
          const p1 = points[points.length - 2];
          const p2 = points[points.length - 1];
          const midX = p1.x + (p2.x - p1.x) / 2;
          const midY = p1.y + (p2.y - p1.y) / 2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          ctx.stroke();
        }
        break;
      }
      // Estampado estrella: patrón de estrellas repetidas como trazo
      case 'stamp_star': {
        if (!draw.stampStarPatternCache || draw.stampStarPatternColor !== brushColor || draw.stampStarPatternSize !== brushSize) {
          // Crear patrón de estrella
          const patternCanvas = document.createElement('canvas');
          const starSize = Math.max(8, brushSize * 1.4);
          const starDistance = Math.max(3, brushSize * 0.7);
          patternCanvas.width = patternCanvas.height = starSize + starDistance;
          const patternCtx = patternCanvas.getContext('2d');
          patternCtx.save();
          patternCtx.translate(patternCanvas.width / 2, patternCanvas.height / 2);
          drawStar(patternCtx, 0, 0, starSize / 2, starSize / 4, 5, brushColor);
          patternCtx.restore();
          draw.stampStarPatternCache = ctx.createPattern(patternCanvas, 'repeat');
          draw.stampStarPatternColor = brushColor;
          draw.stampStarPatternSize = brushSize;
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = brushSize * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = draw.stampStarPatternCache;
        // Trazar curva suave entre los dos últimos puntos
        if (points.length >= 2) {
          const p1 = points[points.length - 2];
          const p2 = points[points.length - 1];
          const midX = p1.x + (p2.x - p1.x) / 2;
          const midY = p1.y + (p2.y - p1.y) / 2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          ctx.stroke();
        }
        break;
      }
      // Patrón líneas: patrón de líneas paralelas como trazo
      case 'pattern_lines': {
        if (!draw.patternLinesCache || draw.patternLinesColor !== brushColor || draw.patternLinesSize !== brushSize) {
          // Crear patrón de líneas
          const patternCanvas = document.createElement('canvas');
          const lineSpacing = Math.max(4, brushSize * 1.2);
          const lineWidth = Math.max(2, brushSize * 0.5);
          patternCanvas.width = patternCanvas.height = lineSpacing * 2;
          const patternCtx = patternCanvas.getContext('2d');
          patternCtx.strokeStyle = brushColor;
          patternCtx.lineWidth = lineWidth;
          for (let i = 0; i < 2; i++) {
            patternCtx.beginPath();
            patternCtx.moveTo(0, i * lineSpacing + lineWidth / 2);
            patternCtx.lineTo(patternCanvas.width, i * lineSpacing + lineWidth / 2);
            patternCtx.stroke();
          }
          draw.patternLinesCache = ctx.createPattern(patternCanvas, 'repeat');
          draw.patternLinesColor = brushColor;
          draw.patternLinesSize = brushSize;
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = brushSize * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = draw.patternLinesCache;
        // Trazar curva suave entre los dos últimos puntos
        if (points.length >= 2) {
          const p1 = points[points.length - 2];
          const p2 = points[points.length - 1];
          const midX = p1.x + (p2.x - p1.x) / 2;
          const midY = p1.y + (p2.y - p1.y) / 2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          ctx.stroke();
        }
        break;
      }
      // Patrón arcoíris: patrón de franjas de colores como trazo
      case 'pattern_rainbow': {
        if (!draw.patternRainbowCache || draw.patternRainbowSize !== brushSize) {
          // Crear patrón de arcoíris
          const patternCanvas = document.createElement('canvas');
          patternCanvas.width = 35;
          patternCanvas.height = Math.max(20, brushSize * 1.5);
          const ctxPat = patternCanvas.getContext('2d');
          const h = patternCanvas.height;
          ctxPat.fillStyle = 'red';      ctxPat.fillRect(0, 0, 5, h);
          ctxPat.fillStyle = 'orange';   ctxPat.fillRect(5, 0, 5, h);
          ctxPat.fillStyle = 'yellow';   ctxPat.fillRect(10, 0, 5, h);
          ctxPat.fillStyle = 'green';    ctxPat.fillRect(15, 0, 5, h);
          ctxPat.fillStyle = 'lightblue';ctxPat.fillRect(20, 0, 5, h);
          ctxPat.fillStyle = 'blue';     ctxPat.fillRect(25, 0, 5, h);
          ctxPat.fillStyle = 'purple';   ctxPat.fillRect(30, 0, 5, h);
          draw.patternRainbowCache = ctx.createPattern(patternCanvas, 'repeat');
          draw.patternRainbowSize = brushSize;
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = brushSize * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = draw.patternRainbowCache;
        // Trazar curva suave entre los dos últimos puntos
        if (points.length >= 2) {
          const p1 = points[points.length - 2];
          const p2 = points[points.length - 1];
          const midX = p1.x + (p2.x - p1.x) / 2;
          const midY = p1.y + (p2.y - p1.y) / 2;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
          ctx.stroke();
        }
        break;
      }
      // Patrón imagen: patrón de imagen seleccionada por el usuario (sin caché, crea el patrón en cada draw)
      case 'pattern_image': {
        if (patternImageUrl) {
          const img = new window.Image();
          img.crossOrigin = 'anonymous';
          img.src = patternImageUrl;
          img.onload = () => {
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineWidth = brushSize * 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = ctx.createPattern(img, 'repeat');
            // Trazar curva suave entre los dos últimos puntos
            if (points.length >= 2) {
              const p1 = points[points.length - 2];
              const p2 = points[points.length - 1];
              const midX = p1.x + (p2.x - p1.x) / 2;
              const midY = p1.y + (p2.y - p1.y) / 2;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
              ctx.stroke();
            }
          };
        }
        break;
      }
      // Aerosol: spray continuo mientras el mouse está presionado
      case 'aerosol': {
        // El efecto se maneja en el temporizador, no aquí
        break;
      }
      // Neighbor points: conecta cada punto con su vecino anterior
      case 'neighbor': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = Math.max(1, brushSize * 0.5);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
          const nearIdx = i - 5;
          if (nearIdx >= 0) {
            ctx.moveTo(points[nearIdx].x, points[nearIdx].y);
            ctx.lineTo(points[i].x, points[i].y);
          }
        }
        ctx.stroke();
        break;
      }
      // Fur neighbor: conecta el punto actual con todos los puntos anteriores cercanos (efecto peludo)
      case 'fur_neighbor': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = Math.max(1, brushSize * 0.5);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Línea principal
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        // Líneas peludas a vecinos cercanos
        for (let i = 0; i < points.length; i++) {
          const dx = points[i].x - points[points.length - 1].x;
          const dy = points[i].y - points[points.length - 1].y;
          const d = dx * dx + dy * dy;
          if (d < 1000) {
            ctx.beginPath();
            ctx.strokeStyle = hexToRgba(brushColor, 0.3);
            ctx.moveTo(points[points.length - 1].x + dx * 0.2, points[points.length - 1].y + dy * 0.2);
            ctx.lineTo(points[i].x - dx * 0.2, points[i].y - dy * 0.2);
            ctx.stroke();
            ctx.strokeStyle = brushColor;
          }
        }
        break;
      }
      // Fountain pen: líneas inclinadas interpoladas entre puntos (efecto pluma estilográfica)
      case 'fountain_pen': {
        if (points.length < 2) break;
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = 1;
        const width = Math.max(3, brushSize * 0.7);
        const lerps = 16;
        const x1 = points[points.length - 2].x;
        const y1 = points[points.length - 2].y;
        const x2 = points[points.length - 1].x;
        const y2 = points[points.length - 1].y;
        for (let i = 0; i < lerps; i++) {
          const t = i / lerps;
          const x = x1 + (x2 - x1) * t;
          const y = y1 + (y2 - y1) * t;
          ctx.beginPath();
          ctx.moveTo(x - width, y - width);
          ctx.lineTo(x + width, y + width);
          ctx.stroke();
        }
        break;
      }
      // Sketchy: línea principal y líneas cruzadas semitransparentes a puntos cercanos (efecto boceto)
      case 'sketchy': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = Math.max(1, brushSize * 0.5);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        // Línea principal
        if (points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        // Líneas cruzadas tipo sketch
        for (let i = 0; i < points.length; i++) {
          const dx = points[i].x - points[points.length - 1].x;
          const dy = points[i].y - points[points.length - 1].y;
          const d = dx * dx + dy * dy;
          if (d < 2000 && Math.random() > d / 2000) {
            ctx.beginPath();
            ctx.strokeStyle = hexToRgba(brushColor, 0.3);
            ctx.moveTo(points[points.length - 1].x + dx * 0.5, points[points.length - 1].y + dy * 0.5);
            ctx.lineTo(points[points.length - 1].x - dx * 0.5, points[points.length - 1].y - dy * 0.5);
            ctx.stroke();
            ctx.strokeStyle = brushColor;
          }
        }
        break;
      }
      case 'spray_speed': {
        // Spray dependiente de la velocidad del mouse
        if (points.length < 2) break;
        const p1 = points[points.length - 2];
        const p2 = points[points.length - 1];
        const speed = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
        const minRadius = 10;
        const sprayDensity = 80;
        const r = speed + minRadius;
        const rSquared = r * r;
        const lerps = 10;
        for (let i = 0; i < lerps; i++) {
          // Interpolación entre los dos últimos puntos
          const t = i / lerps;
          const x = p1.x + (p2.x - p1.x) * t;
          const y = p1.y + (p2.y - p1.y) * t;
          // Spray de puntos
          for (let j = 0; j < sprayDensity; j++) {
            const angle = Math.random() * 2 * Math.PI;
            const radius = Math.sqrt(Math.random() * rSquared);
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            ctx.beginPath();
            ctx.arc(px, py, 0.8 + Math.random() * 1.2, 0, 2 * Math.PI);
            ctx.globalAlpha = 0.12 + Math.random() * 0.18;
            ctx.fillStyle = brushColor;
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
        break;
      }
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
    } else if (brushType === 'aerosol') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setAerosolPos({ x, y });
      const timer = setInterval(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const density = Math.max(10, brushSize * 3);
        for (let i = 0; i < density; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 2;
          const px = aerosolPos ? aerosolPos.x + Math.cos(angle) * radius : x + Math.cos(angle) * radius;
          const py = aerosolPos ? aerosolPos.y + Math.sin(angle) * radius : y + Math.sin(angle) * radius;
          ctx.fillStyle = brushColor;
          ctx.globalAlpha = 0.18 + Math.random() * 0.18;
          ctx.fillRect(px, py, 1.2, 1.2);
        }
        ctx.globalAlpha = 1;
      }, 50);
      setAerosolTimer(timer);
    } else {
      draw(e);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    addPoint(e);
    if (brushType === 'aerosol') {
      const rect = canvasRef.current.getBoundingClientRect();
      setAerosolPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      draw(e);
    }
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
      saveToHistory();
    }
    if (sprayTimerRef.current) {
      clearInterval(sprayTimerRef.current);
      sprayTimerRef.current = null;
    }
    if (aerosolTimer) {
      clearInterval(aerosolTimer);
      setAerosolTimer(null);
    }
    setAerosolPos(null);
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

  // Actualizar patternImageUrl cuando cambia patternImage
  useEffect(() => {
    if (patternImage) {
      const url = URL.createObjectURL(patternImage);
      setPatternImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPatternImageUrl(null);
    }
  }, [patternImage]);

  // Crear patrón de imagen y marcarlo como listo
  useEffect(() => {
    setPatternImageReady(false);
    if (patternImageUrl) {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.src = patternImageUrl;
      img.onload = () => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const pattern = ctx.createPattern(img, 'repeat');
          draw.patternImageCache = pattern;
          draw.patternImageUrl = patternImageUrl;
          draw.patternImageSize = brushSize;
          setPatternImageReady(true);
        }
      };
      img.onerror = () => {
        setPatternImageReady(false);
      };
    } else {
      draw.patternImageCache = null;
      setPatternImageReady(false);
    }
  }, [patternImageUrl, brushSize]);

  // Limpia el temporizador de aerosol al desmontar
  useEffect(() => {
    return () => {
      if (aerosolTimer) clearInterval(aerosolTimer);
    };
  }, [aerosolTimer]);

  // Guardar el estado actual del canvas en el historial
  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    let newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(dataUrl);
    if (newHistory.length > HISTORY_LIMIT) newHistory = newHistory.slice(newHistory.length - HISTORY_LIMIT);
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [canvasRef, canvasHistory, historyIndex]);

  // Deshacer
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const img = new window.Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[newIndex];
    }
  };
  // Rehacer
  const redo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const img = new window.Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[newIndex];
    }
  };
  // Descargar canvas
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `${titulo || 'obra'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  // Limpiar canvas y guardar en historial
  const clearCanvasAndSave = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (canvasBg) {
      const img = new window.Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveToHistory();
      };
      img.src = canvasBg;
    } else {
      saveToHistory();
    }
  };
  // Inicializar historial al abrir modal
  useEffect(() => {
    if (isOpen && imgMode === "canvas") {
      setTimeout(() => {
        saveToHistory();
      }, 200);
    }
    // eslint-disable-next-line
  }, [isOpen, imgMode]);

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

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    if (!showBrushDropdown) return;
    function handleClick(e) {
      if (brushDropdownRef.current && !brushDropdownRef.current.contains(e.target)) {
        setShowBrushDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showBrushDropdown]);

  useEffect(() => {
    if (showBrushDropdown && brushButtonRef.current) {
      const btnRect = brushButtonRef.current.getBoundingClientRect();
      setBrushDropdownPos({
        left: btnRect.right + 8, // 8px de separación a la derecha del botón
        top: btnRect.top,
        width: 420
      });
    }
  }, [showBrushDropdown]);

  if (!isOpen) return null;

  // Overlay y modal principal
  const modalClassName = `relative w-full ${isCanvasStep ? 'max-w-4xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl p-8 md:p-10' : 'max-w-lg p-4 md:p-6'} bg-background dark:bg-neutral-900 rounded-2xl shadow-2xl border border-border flex flex-col`;
  const modalStyle = isCanvasStep ? { minHeight: 'min(90vh, 600px)' } : { minHeight: 'min(80vh, 400px)' };

  return (
    <div
      className={`fixed inset-0 z-[99999] flex ${isCanvasStep ? 'items-start justify-center mt-16' : 'items-center justify-center'} bg-black/40 backdrop-blur-sm`}
      style={{ isolation: 'isolate' }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.96, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 40 }}
        transition={{ duration: 0.25 }}
        className={modalClassName}
        style={modalStyle}
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
                      <motion.div
                        {...getBgRootProps()}
                        className={`w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition relative ${isBgDragActive ? "border-indigo-500 bg-indigo-50" : "border-border bg-muted/40"}`}
                        initial={{ scale: 1 }}
                        animate={isBgDragActive ? { scale: 1.04 } : { scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                      >
                        <input {...getBgInputProps()} />
                        {canvasBg ? (
                          <motion.div
                            className="relative inline-block w-full"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                          >
                            <img src={canvasBg} alt="bg" className="w-full max-h-32 object-contain rounded-xl border mx-auto" />
                            <motion.button
                              type="button"
                              onClick={e => { e.stopPropagation(); setCanvasBg(null); }}
                              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 z-10"
                              tabIndex={-1}
                              aria-label="Eliminar fondo"
                              whileTap={{ scale: 0.9 }}
                              whileHover={{ scale: 1.1 }}
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                          </motion.div>
                        ) : (
                          <span className="text-muted-foreground">Arrastra una imagen de fondo aquí o haz clic para seleccionar</span>
                        )}
                      </motion.div>

                      {/* Selector de pincel compacto con dropdown usando portal */}
                      <div className="w-full mb-3 relative">
                        <button
                          ref={brushButtonRef}
                          type="button"
                          className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 font-medium bg-muted text-foreground border-border hover:bg-gray-100 dark:hover:bg-neutral-700 w-full justify-start"
                          onClick={() => setShowBrushDropdown((v) => !v)}
                          aria-haspopup="listbox"
                          aria-expanded={showBrushDropdown}
                        >
                          {(() => {
                            const Icon = TOOL_ICONS[brushType] || Brush;
                            return <Icon className="w-5 h-5" />;
                          })()}
                          <span className="truncate">{brushType}</span>
                          <svg className="ml-auto w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.584l3.71-3.354a.75.75 0 111.02 1.1l-4.25 3.846a.75.75 0 01-1.02 0l-4.25-3.846a.75.75 0 01.02-1.06z" clipRule="evenodd" /></svg>
                        </button>
                        {showBrushDropdown && typeof window !== 'undefined' && ReactDOM.createPortal(
                          <div ref={brushDropdownRef} className="fixed z-[999999] pointer-events-none left-0 top-0 w-screen h-screen">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.96, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.96, y: 20 }}
                              transition={{ duration: 0.18 }}
                              className="absolute z-[999999] bg-background dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto animate-fade-in pointer-events-auto flex flex-col items-center"
                              style={{ left: `${brushDropdownPos.left}px`, top: `${brushDropdownPos.top}px`, width: `${brushDropdownPos.width}px`, minWidth: 320, maxWidth: 480 }}
                            >
                              {BRUSH_SECTIONS.map(section => (
                                <div key={section.label} className="mb-3 w-full">
                                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 px-2">{section.label}</div>
                                  <div className="flex flex-wrap gap-3 mb-1">
                                    {section.keys.map(key => {
                                      const Icon = TOOL_ICONS[key] || Brush;
                                      return (
                                        <button
                                          key={key}
                                          onClick={() => { setBrushType(key); setShowBrushDropdown(false); }}
                                          className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-colors text-xs font-medium w-16 h-16 ${brushType === key ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-muted text-foreground border-border hover:bg-gray-100 dark:hover:bg-neutral-700'}`}
                                          title={key}
                                          type="button"
                                        >
                                          <Icon className="w-6 h-6 mb-1" />
                                          <span className="truncate w-full text-[11px] text-center leading-tight max-w-[3.5rem]">{key}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          </div>,
                          document.body
                        )}
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

                      {/* Imagen para patrón (solo si pattern_image) */}
                      {brushType === 'pattern_image' && (
                        <motion.div
                          className="mb-3"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <label className="font-medium mr-2">Imagen para patrón:</label>
                          <button type="button" className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700" onClick={() => setShowPatternImageModal(true)}>
                            Seleccionar imagen
                          </button>
                          {patternImageUrl && (
                            <motion.div
                              className="mt-2 w-24 h-16 object-cover rounded border relative"
                              initial={{ scale: 0.9, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0.9, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <img src={patternImageUrl} alt="pattern preview" className="w-full h-full object-cover rounded border" />
                              <motion.button
                                type="button"
                                onClick={() => setPatternImageUrl(null)}
                                className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 z-10"
                                tabIndex={-1}
                                aria-label="Eliminar imagen"
                                whileTap={{ scale: 0.9 }}
                                whileHover={{ scale: 1.1 }}
                              >
                                <X className="h-4 w-4" />
                              </motion.button>
                            </motion.div>
                          )}
                          {!patternImageReady && patternImageUrl && (
                            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full"></span> Cargando patrón...</div>
                          )}
                        </motion.div>
                      )}

                      {/* Modal para seleccionar imagen de patrón */}
                      {showPatternImageModal && (
                        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ isolation: 'isolate' }}>
                          <div className="bg-background dark:bg-neutral-900 border border-border rounded-2xl shadow-2xl p-8 flex flex-col items-center">
                            <h3 className="font-semibold mb-4">Selecciona una imagen para el patrón</h3>
                            <motion.div
                              {...getPatternImgRootProps()}
                              className={`w-64 h-32 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex items-center justify-center ${isPatternImgDragActive ? "border-indigo-500 bg-indigo-50" : "border-border bg-muted/40"}`}
                              initial={{ scale: 1 }}
                              animate={isPatternImgDragActive ? { scale: 1.04 } : { scale: 1 }}
                              whileHover={{ scale: 1.02 }}
                            >
                              <input {...getPatternImgInputProps()} />
                              <span className="text-muted-foreground">Arrastra una imagen aquí o haz clic para seleccionar</span>
                            </motion.div>
                            <button type="button" className="mt-6 px-4 py-2 rounded bg-gray-200 dark:bg-neutral-800 text-gray-700 dark:text-gray-200 font-bold hover:bg-gray-300 dark:hover:bg-neutral-700 transition" onClick={() => setShowPatternImageModal(false)}>
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Canvas grande */}
                  <div className="lg:col-span-3 flex flex-col items-center justify-center">
                    {/* Botones de control arriba del canvas */}
                    <div className="flex gap-2 mb-2 items-center">
                      <button
                        onClick={undo}
                        disabled={historyIndex <= 0}
                        title="Deshacer"
                        className="p-2 rounded transition-colors disabled:opacity-50 bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                      >
                        <Undo2 className="w-5 h-5 text-gray-800 dark:text-gray-100" />
                      </button>
                      <button
                        onClick={redo}
                        disabled={historyIndex >= canvasHistory.length - 1}
                        title="Rehacer"
                        className="p-2 rounded transition-colors disabled:opacity-50 bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                      >
                        <Redo2 className="w-5 h-5 text-gray-800 dark:text-gray-100" />
                      </button>
                      <button
                        onClick={downloadCanvas}
                        title="Descargar imagen"
                        className="p-2 rounded transition-colors bg-gray-200 hover:bg-gray-300 dark:bg-neutral-700 dark:hover:bg-neutral-600"
                      >
                        <Download className="w-5 h-5 text-gray-800 dark:text-gray-100" />
                      </button>
                      <button
                        onClick={clearCanvasAndSave}
                        title="Limpiar canvas"
                        className="p-2 rounded transition-colors bg-red-200 hover:bg-red-400 dark:bg-red-900 dark:hover:bg-red-700"
                      >
                        <Trash2 className="w-5 h-5 text-red-700 dark:text-red-200" />
                      </button>
                    </div>
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
