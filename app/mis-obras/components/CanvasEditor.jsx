"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  X, Brush, Save, Eraser, Droplets, Sparkles, 
  Square, Palette, Flame, Circle, Grid3X3, 
  Minus, PaintBucket, Scissors, Waves, Zap,
  MoreHorizontal, Target
} from "lucide-react";
import toast from "react-hot-toast";
import { DatePicker } from "../../components/ui/date-picker-new";

// Estilos CSS para animaciones del cursor
const cursorAnimationStyles = `
  @keyframes pulse {
    0%, 100% { opacity: 0.6; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  
  @keyframes flicker {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
  }
  
  @keyframes sparkle {
    0%, 100% { transform: rotate(0deg) scale(1); }
    25% { transform: rotate(90deg) scale(1.1); }
    50% { transform: rotate(180deg) scale(0.9); }
    75% { transform: rotate(270deg) scale(1.1); }
  }
`;

// Inyectar estilos en el documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = cursorAnimationStyles;
  document.head.appendChild(styleSheet);
}

export default function CanvasEditor({ isOpen, onClose, onSave, editingMural = null }) {
  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(15);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  const [cursorPos, setCursorPos] = useState(null);
  const [muralData, setMuralData] = useState({
    titulo: editingMural?.titulo || '',
    descripcion: editingMural?.descripcion || '',
    tecnica: editingMural?.tecnica || 'Digital',
    year: editingMural?.year || new Date().getFullYear(),
  });
  const [muralDataError, setMuralDataError] = useState(null);

  // Funciones de utilidad para manejo de colores
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
  ];

  const tools = [
    { id: 'brush', name: 'Lápiz simple', icon: Brush },
    { id: 'brush-soft', name: 'Lápiz suave', icon: Sparkles },
    { id: 'glow', name: 'Glow', icon: Zap },
    { id: 'eraser', name: 'Borrador', icon: Eraser },
    { id: 'carboncillo', name: 'Carboncillo', icon: Scissors },
    { id: 'acuarela', name: 'Acuarela', icon: Droplets },
    { id: 'tiza', name: 'Tiza', icon: Square },
    { id: 'marcador', name: 'Marcador', icon: PaintBucket },
    { id: 'oleo', name: 'Óleo', icon: Palette },
    { id: 'pixel', name: 'Pixel', icon: Grid3X3 },
    { id: 'neon', name: 'Neón', icon: Zap },
    { id: 'puntos', name: 'Puntos', icon: Target },
    { id: 'lineas', name: 'Líneas', icon: MoreHorizontal },
    { id: 'fuego', name: 'Fuego', icon: Flame },
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      console.log('CanvasEditor montado y abierto');
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = 800;
      canvas.height = 600;
      
      // Fondo blanco por defecto
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Si estamos editando un mural existente, cargar la imagen
      if (editingMural?.url_imagen) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          saveToHistory();
        };
        img.src = editingMural.url_imagen;
      } else {
        saveToHistory();
      }
    }
  }, [isOpen, editingMural]);

  const saveToHistory = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(canvas.toDataURL());
    setCanvasHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyIndex - 1];
    }
  };

  const redo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = canvasHistory[historyIndex + 1];
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  // Refs para siempre tener el valor actual de brushType y brushColor
  const brushTypeRef = useRef(currentTool);
  const brushColorRef = useRef(currentColor);
  useEffect(() => { 
    brushTypeRef.current = currentTool; 
  }, [currentTool]);
  useEffect(() => { brushColorRef.current = currentColor; }, [currentColor]);

  // Sistema de coordenadas y handlers
  const handleMouseMove = (e) => {
    console.log('handleMouseMove');
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    setCursorPos({ x: cssX, y: cssY });
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    if (isDrawing) {
      drawAt(x, y);
    }
  };

  const handleMouseLeave = () => {
    console.log('handleMouseLeave');
    setCursorPos(null);
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleMouseUp = () => {
    console.log('handleMouseUp');
    setIsDrawing(false);
    setLastPoint(null);
    saveToHistory();
  };

  const handleMouseDown = (e) => {
    console.log('handleMouseDown');
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    
    const ctx = canvas.getContext('2d');
    const type = brushTypeRef.current;
    
    // Inicializar el trazo basado en el tipo de pincel
    if (type === 'brush' || type === 'marcador' || type === 'oleo') {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    
    setLastPoint({ x, y });
    drawAt(x, y);
  };

  // Función para resetear completamente el contexto del canvas
  const resetCanvasContext = (ctx) => {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowColor = 'transparent';
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.fillStyle = '#000000';
  };

  // Función principal de dibujo con técnicas avanzadas basadas en perfectionkills.com
  const drawAt = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const type = brushTypeRef.current;
    const brushColor = brushColorRef.current;
    const rgb = hexToRgb(brushColor);

    // Log de depuración para saber qué pincel se está usando
    console.log('drawAt type:', type);

    // Cada pincel tiene su propio efecto visual
    switch (type) {
      // Lápiz simple: línea continua, sin efectos especiales
      case 'brush': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        if (lastPoint) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = brushColor;
          ctx.fill();
        }
        break;
      }
      // Lápiz suave: igual que el simple pero con sombra difusa (glow)
      case 'brush-soft': {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 1.2;
        ctx.globalAlpha = 1;
        if (lastPoint) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = brushColor;
          ctx.shadowColor = brushColor;
          ctx.shadowBlur = brushSize * 1.2;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        break;
      }
      // Glow: resplandor intenso, modo lighter, halo extenso
      case 'glow': {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 2.5;
        ctx.globalAlpha = 0.85;
        if (lastPoint) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
          ctx.fillStyle = brushColor;
          ctx.shadowColor = brushColor;
          ctx.shadowBlur = brushSize * 2.5;
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Borrador
      case 'eraser': {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        if (lastPoint) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Carboncillo
      case 'carboncillo': {
        ctx.globalCompositeOperation = 'multiply';
        for (let offset = 0; offset < 5; offset++) {
          const offsetDist = offset * 0.5;
          const alpha = 0.22 - offset * 0.04;
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
          ctx.lineWidth = Math.max(1, brushSize - offset);
          ctx.lineCap = 'round';
          if (lastPoint) {
            const angle = Math.atan2(y - lastPoint.y, x - lastPoint.x) + Math.PI / 2;
            const offsetX = Math.cos(angle) * offsetDist;
            const offsetY = Math.sin(angle) * offsetDist;
            ctx.beginPath();
            ctx.moveTo(lastPoint.x + offsetX, lastPoint.y + offsetY);
            ctx.lineTo(x + offsetX, y + offsetY);
            ctx.stroke();
          }
        }
        // Textura granular
        for (let i = 0; i < Math.floor(brushSize * 1.2); i++) {
          const grainX = x + (Math.random() - 0.5) * brushSize * 1.2;
          const grainY = y + (Math.random() - 0.5) * brushSize * 1.2;
          ctx.globalAlpha = 0.10 + Math.random() * 0.15;
          ctx.fillStyle = brushColor;
          ctx.beginPath();
          ctx.arc(grainX, grainY, Math.random() * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Acuarela
      case 'acuarela': {
        ctx.globalCompositeOperation = 'multiply';
        for (let ring = 0; ring < 4; ring++) {
          const ringRadius = brushSize * (0.7 + ring * 0.5);
          const baseAlpha = 0.18 - ring * 0.03;
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, ringRadius);
          gradient.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${baseAlpha})`);
          gradient.addColorStop(1, `rgba(${rgb.r},${rgb.g},${rgb.b},0)`);
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Tiza
      case 'tiza': {
        ctx.globalCompositeOperation = 'screen';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.45;
        if (lastPoint) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        // Polvillo
        for (let i = 0; i < Math.floor(brushSize * 5); i++) {
          const dustX = x + (Math.random() - 0.5) * brushSize * 2;
          const dustY = y + (Math.random() - 0.5) * brushSize * 2;
          ctx.globalAlpha = 0.10 + Math.random() * 0.15;
          ctx.fillStyle = brushColor;
          ctx.beginPath();
          ctx.arc(dustX, dustY, Math.random() * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Marcador
      case 'marcador': {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 1.3;
        ctx.lineCap = 'square';
        ctx.globalAlpha = 0.65;
        if (lastPoint) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        } else {
          ctx.fillRect(x - brushSize/2, y - brushSize/2, brushSize, brushSize * 1.1);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Oleo
      case 'oleo': {
        ctx.globalCompositeOperation = 'source-over';
        if (lastPoint) {
          const distance = Math.sqrt((x - lastPoint.x) ** 2 + (y - lastPoint.y) ** 2);
          const steps = Math.max(1, Math.ceil(distance / 3));
          for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const interpX = lastPoint.x + (x - lastPoint.x) * t;
            const interpY = lastPoint.y + (y - lastPoint.y) * t;
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = brushColor;
            ctx.beginPath();
            ctx.arc(interpX, interpY, brushSize * 0.45, 0, Math.PI * 2);
            ctx.fill();
            // Textura
            ctx.globalAlpha = 0.22;
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1 + Math.random() * 1.2;
            ctx.beginPath();
            ctx.moveTo(interpX, interpY);
            ctx.lineTo(interpX + Math.random() * 5 - 2.5, interpY + Math.random() * 5 - 2.5);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Pixel
      case 'pixel': {
        ctx.globalCompositeOperation = 'source-over';
        const pixelSize = Math.max(2, Math.round(brushSize / 2));
        const gridX = Math.floor(x / pixelSize) * pixelSize;
        const gridY = Math.floor(y / pixelSize) * pixelSize;
        ctx.fillStyle = brushColor;
        ctx.fillRect(gridX, gridY, pixelSize, pixelSize);
        break;
      }
      // Neon
      case 'neon': {
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 2.1;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 1.4;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(x, y, brushSize * 0.9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Puntillismo
      case 'puntos': {
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < Math.floor(brushSize * 2); i++) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * brushSize * 0.7;
          const dotX = x + Math.cos(angle) * radius;
          const dotY = y + Math.sin(angle) * radius;
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.fillStyle = brushColor;
          ctx.beginPath();
          ctx.arc(dotX, dotY, Math.max(1, brushSize * 0.18), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      }
      // Lineas (grabado)
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
            const startX = x + Math.cos(perpAngle) * offset - Math.cos(angle) * length / 2;
            const startY = y + Math.sin(perpAngle) * offset - Math.sin(angle) * length / 2;
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
      // Fuego
      case 'fuego': {
        ctx.globalCompositeOperation = 'lighter';
        for (let layer = 0; layer < 3; layer++) {
          const flameColor = `rgba(255,${140 + layer * 40},0,${0.3 - layer * 0.08})`;
          const flameSize = brushSize * (1.2 + layer * 0.3);
          ctx.beginPath();
          ctx.ellipse(x, y, flameSize, flameSize * 1.5, 0, 0, Math.PI * 2);
          ctx.fillStyle = flameColor;
          ctx.fill();
        }
        // Chispas
        for (let i = 0; i < Math.floor(brushSize / 2); i++) {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = 'yellow';
          ctx.beginPath();
          ctx.arc(x + (Math.random() - 0.5) * brushSize * 2, y - Math.random() * brushSize * 2, Math.random() * 2 + 1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        break;
      }
      // Default: pincel simple
      default: {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = 1;
        if (lastPoint) {
          ctx.beginPath();
          ctx.moveTo(lastPoint.x, lastPoint.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        break;
      }
    }
    setLastPoint({ x, y });
  };

  const handleSave = async () => {
    if (!muralData.titulo.trim()) {
      toast.error('Por favor ingresa un título para tu obra');
      return;
    }

    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('imagen', blob, `${muralData.titulo}.png`);
      formData.append('titulo', muralData.titulo);
      formData.append('descripcion', muralData.descripcion);
      formData.append('tecnica', muralData.tecnica);
      formData.append('year', muralData.year);
      formData.append('autor', 'Usuario'); // Esto debería ser el nombre del usuario logueado
      
      try {
        const url = editingMural ? `/api/murales/${editingMural.id}` : '/api/murales';
        const method = editingMural ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method,
          body: formData,
        });

        if (response.ok) {
          const result = await response.json();
          toast.success(editingMural ? 'Obra actualizada exitosamente' : 'Obra creada exitosamente');
          onSave(result);
          onClose();
        } else {
          toast.error('Error al guardar la obra');
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error('Error al guardar la obra');
      }
    }, 'image/png');
  };

  if (!isOpen) return null;

  console.log('currentTool:', currentTool);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editingMural ? 'Editar Obra' : 'Crear Nueva Obra'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Panel de herramientas */}
            <div className="lg:col-span-1 space-y-6">
              {/* Información del mural */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Información de la Obra</h3>
                <div className="space-y-3">
                  <motion.input
                    type="text"
                    placeholder="Título de la obra"
                    value={muralData.titulo}
                    onChange={e => {
                      setMuralData({...muralData, titulo: e.target.value});
                      if (muralDataError?.titulo) setMuralDataError(prev => ({ ...prev, titulo: undefined }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                    animate={muralDataError?.titulo ? { x: [0, -8, 8, -6, 6, -4, 4, 0, Math.random()] } : false}
                    transition={{ duration: 0.4 }}
                  />
                  {muralDataError?.titulo && <div className="text-pink-500 text-sm">{muralDataError.titulo}</div>}
                  
                  <motion.textarea
                    placeholder="Descripción (opcional)"
                    value={muralData.descripcion}
                    onChange={e => {
                      setMuralData({...muralData, descripcion: e.target.value});
                      if (muralDataError?.descripcion) setMuralDataError(prev => ({ ...prev, descripcion: undefined }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                    animate={muralDataError?.descripcion ? { x: [0, -8, 8, -6, 6, -4, 4, 0, Math.random()] } : false}
                    transition={{ duration: 0.4 }}
                  />
                  {muralDataError?.descripcion && <div className="text-pink-500 text-sm">{muralDataError.descripcion}</div>}
                  
                  <motion.input
                    type="text"
                    placeholder="Técnica"
                    value={muralData.tecnica}
                    onChange={e => {
                      setMuralData({...muralData, tecnica: e.target.value});
                      if (muralDataError?.tecnica) setMuralDataError(prev => ({ ...prev, tecnica: undefined }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                    animate={muralDataError?.tecnica ? { x: [0, -8, 8, -6, 6, -4, 4, 0, Math.random()] } : false}
                    transition={{ duration: 0.4 }}
                  />
                  {muralDataError?.tecnica && <div className="text-pink-500 text-sm">{muralDataError.tecnica}</div>}
                  
                  <motion.div
                    animate={muralDataError?.year ? { x: [0, -8, 8, -6, 6, -4, 4, 0, Math.random()] } : false}
                    transition={{ duration: 0.4 }}
                  >
                    <DatePicker
                      value={muralData.year ? `${muralData.year}-01-01` : null}
                      onChange={dateString => {
                        if (dateString) {
                          const d = new Date(dateString);
                          setMuralData({...muralData, year: d.getFullYear()});
                          if (muralDataError?.year) setMuralDataError(prev => ({ ...prev, year: undefined }));
                        } else {
                          setMuralData({...muralData, year: null});
                        }
                      }}
                      placeholder="Selecciona el año..."
                    />
                  </motion.div>
                  {muralDataError?.year && <div className="text-pink-500 text-sm">{muralDataError.year}</div>}
                </div>
              </div>

              {/* Herramientas */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Herramientas</h3>
                <div className="mb-3 text-sm text-blue-600 font-medium">
                  Herramienta actual: {currentTool}
                </div>
                <div className="space-y-2">
                  {tools.map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <button
                        key={tool.id}
                        onClick={() => setCurrentTool(tool.id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                          currentTool === tool.id
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white dark:bg-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-600'
                        }`}
                      >
                        <IconComponent className="h-4 w-4" />
                        {tool.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Colores */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Colores</h3>
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setCurrentColor(color)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${
                        currentColor === color
                          ? 'border-indigo-600 scale-110'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="w-full h-10 rounded-lg"
                />
              </div>

              {/* Tamaño del pincel */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Tamaño del Pincel</h3>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={brushSize}
                  onChange={e => setBrushSize(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">{brushSize}px</div>
              </div>

              {/* Acciones */}
              <div className="space-y-2">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Deshacer
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= canvasHistory.length - 1}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Rehacer
                </button>
                <button
                  onClick={clearCanvas}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Limpiar Lienzo
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="lg:col-span-3 flex items-center justify-center">
              <div style={{ position: "relative", width: "100%", maxWidth: 900, aspectRatio: "4/3" }}>
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
                    cursor: 'crosshair'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                />
                {/* Cursor personalizado avanzado con previsualización de cada pincel */}
                {cursorPos && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `calc(${cursorPos.x}px - ${brushSize / 2}px)`,
                      top: `calc(${cursorPos.y}px - ${brushSize / 2}px)`,
                      width: brushSize,
                      height: brushSize,
                      borderRadius: (() => {
                        switch(currentTool) {
                          case 'pixel': return '0';
                          case 'marcador': return '15%';
                          case 'tiza': return '40%';
                          case 'carboncillo': return '20%';
                          case 'oleo': return '30%';
                          default: return '50%';
                        }
                      })(),
                      background: (() => {
                        const rgb = hexToRgb(currentColor);
                        switch(currentTool) {
                          case 'eraser': 
                            return 'repeating-conic-gradient(rgba(200,200,200,0.6) 0deg 45deg, rgba(150,150,150,0.3) 45deg 90deg)';
                          case 'neon': 
                            return `radial-gradient(circle, ${currentColor}80, ${currentColor}40, ${currentColor}10)`;
                          case 'acuarela': 
                            return `radial-gradient(circle, ${currentColor}30 0%, ${currentColor}15 40%, ${currentColor}05 70%, transparent 100%)`;
                          case 'fuego': 
                            return 'radial-gradient(circle, #FF450060 0%, #FF8C0040 30%, #FFD70020 60%, transparent 100%)';
                          case 'carboncillo': 
                            return `radial-gradient(circle, rgba(${Math.min(rgb.r + 30, 255)}, ${Math.min(rgb.g + 30, 255)}, ${Math.min(rgb.b + 30, 255)}, 0.4) 0%, rgba(50,50,50,0.2) 100%)`;
                          case 'tiza': 
                            return `radial-gradient(circle, ${currentColor}50 0%, ${currentColor}20 60%, transparent 100%)`;
                          case 'marcador':
                            return `linear-gradient(45deg, ${currentColor}70, ${currentColor}50)`;
                          case 'oleo':
                            return `conic-gradient(${currentColor}60, ${currentColor}40, ${currentColor}60)`;
                          case 'pixel':
                            const pixelSize = Math.max(2, brushSize / 6);
                            return `repeating-linear-gradient(0deg, ${currentColor}60 0px, ${currentColor}60 ${pixelSize}px, transparent ${pixelSize}px, transparent ${pixelSize * 2}px), repeating-linear-gradient(90deg, ${currentColor}60 0px, ${currentColor}60 ${pixelSize}px, transparent ${pixelSize}px, transparent ${pixelSize * 2}px)`;
                          case 'puntos':
                            return 'transparent';
                          case 'lineas':
                            return 'transparent';
                          default: 
                            return `${currentColor}40`;
                        }
                      })(),
                      border: (() => {
                        switch(currentTool) {
                          case 'eraser': return '2px dashed #888';
                          case 'neon': return `2px solid ${currentColor}`;
                          case 'pixel': return `2px solid ${currentColor}`;
                          case 'marcador': return `3px solid ${currentColor}80`;
                          case 'carboncillo': return `1px solid ${currentColor}60`;
                          case 'tiza': return `1px dotted ${currentColor}`;
                          case 'oleo': return `2px ridge ${currentColor}80`;
                          default: return `1px solid ${currentColor}60`;
                        }
                      })(),
                      pointerEvents: 'none',
                      zIndex: 20,
                      transform: (() => {
                        switch(currentTool) {
                          case 'neon': return 'scale(1.3)';
                          case 'fuego': return 'scale(1.2)';
                          case 'acuarela': return 'scale(1.1)';
                          default: return 'scale(1)';
                        }
                      })(),
                      boxShadow: (() => {
                        switch(currentTool) {
                          case 'neon': return `0 0 ${brushSize * 1.5}px ${currentColor}40, 0 0 ${brushSize * 0.5}px ${currentColor}80`;
                          case 'fuego': return `0 0 ${brushSize}px #FF450040, 0 0 ${brushSize * 2}px #FF8C0020`;
                          case 'oleo': return `inset 0 0 ${brushSize/3}px ${currentColor}30`;
                          case 'acuarela': return `0 0 ${brushSize}px ${currentColor}20`;
                          case 'carboncillo': return `0 0 ${brushSize/2}px rgba(50,50,50,0.3)`;
                          default: return 'none';
                        }
                      })(),
                      opacity: (() => {
                        switch(currentTool) {
                          case 'acuarela': return '0.8';
                          case 'tiza': return '0.9';
                          case 'carboncillo': return '0.7';
                          default: return '1';
                        }
                      })(),
                      animation: (() => {
                        switch(currentTool) {
                          case 'neon': return 'pulse 1.5s ease-in-out infinite alternate';
                          case 'fuego': return 'flicker 0.5s ease-in-out infinite alternate';
                          default: return 'none';
                        }
                      })(),
                    }}
                  >
                    {/* Indicadores internos específicos para cada pincel */}
                    {currentTool === 'puntos' && (
                      <>
                        {[...Array(Math.min(8, Math.floor(brushSize / 8)))].map((_, i) => {
                          const angle = (i / Math.min(8, Math.floor(brushSize / 8))) * Math.PI * 2;
                          const radius = brushSize * 0.3;
                          return (
                            <div 
                              key={i}
                              style={{
                                position: 'absolute',
                                top: `calc(50% + ${Math.sin(angle) * radius}px)`,
                                left: `calc(50% + ${Math.cos(angle) * radius}px)`,
                                transform: 'translate(-50%, -50%)',
                                width: '3px',
                                height: '3px',
                                borderRadius: '50%',
                                background: currentColor,
                                opacity: 0.6,
                              }} 
                            />
                          );
                        })}
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: currentColor,
                        }} />
                      </>
                    )}
                    
                    {currentTool === 'lineas' && (
                      <>
                        {[0, Math.PI/4, Math.PI/2, 3*Math.PI/4].map((angle, i) => (
                          <div 
                            key={i}
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              width: `${brushSize * 0.8}px`,
                              height: '1px',
                              background: currentColor,
                              transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                              opacity: 0.5 - i * 0.1,
                            }} 
                          />
                        ))}
                      </>
                    )}
                    
                    {currentTool === 'pixel' && (
                      <div style={{
                        position: 'absolute',
                        top: '2px',
                        left: '2px',
                        right: '2px',
                        bottom: '2px',
                        background: `repeating-conic-gradient(${currentColor}60 0deg 90deg, transparent 90deg 180deg)`,
                        imageRendering: 'pixelated',
                      }} />
                    )}
                    
                    {currentTool === 'carboncillo' && (
                      <div style={{
                        position: 'absolute',
                        top: '20%',
                        left: '20%',
                        right: '20%',
                        bottom: '20%',
                        background: `radial-gradient(circle, ${currentColor}40, transparent)`,
                        borderRadius: '30%',
                      }} />
                    )}
                    
                    {currentTool === 'oleo' && (
                      <>
                        <div style={{
                          position: 'absolute',
                          top: '25%',
                          left: '25%',
                          width: '50%',
                          height: '50%',
                          background: currentColor,
                          borderRadius: '20%',
                          opacity: 0.6,
                        }} />
                        <div style={{
                          position: 'absolute',
                          top: '35%',
                          left: '15%',
                          width: '30%',
                          height: '30%',
                          background: currentColor,
                          borderRadius: '50%',
                          opacity: 0.4,
                        }} />
                      </>
                    )}
                    
                    {currentTool === 'marcador' && (
                      <div style={{
                        position: 'absolute',
                        top: '10%',
                        left: '10%',
                        right: '10%',
                        bottom: '10%',
                        background: `linear-gradient(135deg, ${currentColor}80, ${currentColor}40)`,
                        borderRadius: '10%',
                      }} />
                    )}
                    
                    {currentTool === 'tiza' && (
                      <>
                        {[...Array(6)].map((_, i) => (
                          <div 
                            key={i}
                            style={{
                              position: 'absolute',
                              top: `${20 + Math.random() * 60}%`,
                              left: `${20 + Math.random() * 60}%`,
                              width: '2px',
                              height: '2px',
                              borderRadius: '50%',
                              background: currentColor,
                              opacity: 0.4 + Math.random() * 0.4,
                            }} 
                          />
                        ))}
                      </>
                    )}
                    
                    {currentTool === 'fuego' && (
                      <div style={{
                        position: 'absolute',
                        top: '30%',
                        left: '30%',
                        right: '30%',
                        bottom: '30%',
                        background: 'radial-gradient(ellipse 40% 60% at 50% 70%, #FFD700 0%, #FF8C00 40%, #FF4500 100%)',
                        borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                        transform: 'rotate(-5deg)',
                      }} />
                    )}
                    
                    {currentTool === 'acuarela' && (
                      <>
                        <div style={{
                          position: 'absolute',
                          top: '25%',
                          left: '25%',
                          width: '50%',
                          height: '50%',
                          background: `radial-gradient(circle, ${currentColor}30, transparent)`,
                          borderRadius: '50%',
                        }} />
                        <div style={{
                          position: 'absolute',
                          top: '15%',
                          left: '35%',
                          width: '30%',
                          height: '30%',
                          background: `radial-gradient(circle, ${currentColor}20, transparent)`,
                          borderRadius: '50%',
                        }} />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {editingMural ? 'Actualizar Obra' : 'Guardar Obra'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
