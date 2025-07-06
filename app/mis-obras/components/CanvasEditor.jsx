"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Brush, Save } from "lucide-react";
import toast from "react-hot-toast";
import { DatePicker } from "../../components/ui/date-picker-new";

export default function CanvasEditor({ isOpen, onClose, onSave, editingMural = null }) {
  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(5);
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

  const colors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#FFC0CB', '#A52A2A', '#808080', '#000080', '#008000'
  ];

  const tools = [
    { id: 'brush', name: 'Pincel', icon: Brush },
    { id: 'eraser', name: 'Borrador', icon: X },
    { id: 'carboncillo', name: 'Carboncillo', icon: Brush },
    { id: 'acuarela', name: 'Acuarela', icon: Brush },
    { id: 'tiza', name: 'Tiza', icon: Brush },
    { id: 'marcador', name: 'Marcador', icon: Brush },
    { id: 'oleo', name: 'Óleo', icon: Brush },
    { id: 'pixel', name: 'Pixel', icon: Brush },
    { id: 'neon', name: 'Neón', icon: Brush },
    { id: 'puntos', name: 'Puntos', icon: Brush },
    { id: 'lineas', name: 'Líneas', icon: Brush },
    { id: 'fuego', name: 'Fuego', icon: Brush },
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) {
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
  useEffect(() => { brushTypeRef.current = currentTool; }, [currentTool]);
  useEffect(() => { brushColorRef.current = currentColor; }, [currentColor]);

  // Sistema de coordenadas y handlers
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    setCursorPos({ x: cssX, y: cssY });
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    if (isDrawing) drawAt(x, y);
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
    setIsDrawing(false);
    setLastPoint(null);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setLastPoint(null);
    saveToHistory();
  };

  const handleMouseDown = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const x = (cssX * canvas.width) / rect.width;
    const y = (cssY * canvas.height) / rect.height;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setLastPoint({ x, y });
  };

  // Función principal de dibujo
  const drawAt = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const type = brushTypeRef.current;
    const brushColor = brushColorRef.current;
    
    ctx.lineCap = 'round';
    
    switch (type) {
      case 'brush':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.9 + Math.random() * 0.2);
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 0.4;
        ctx.globalAlpha = 0.8 + Math.random() * 0.2;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.globalCompositeOperation = 'source-over';
        break;
        
      case 'carboncillo':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.5 + Math.random() * 0.7);
        ctx.globalAlpha = 0.09 + Math.random() * 0.15;
        for (let i = 0; i < 3 + Math.floor(brushSize / 4); i++) {
          ctx.beginPath();
          ctx.moveTo(x + (Math.random() - 0.5) * brushSize * 0.6, y + (Math.random() - 0.5) * brushSize * 0.6);
          ctx.lineTo(x + (Math.random() - 0.5) * brushSize * 0.6, y + (Math.random() - 0.5) * brushSize * 0.6);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'acuarela':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 2.8;
        ctx.globalAlpha = 0.05 + Math.random() * 0.08;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 2.2;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.7 + Math.random() * 0.3);
        ctx.globalAlpha = 0.18 + Math.random() * 0.18;
        for (let i = 0; i < 2 + Math.floor(brushSize / 6); i++) {
          ctx.beginPath();
          ctx.moveTo(x + (Math.random() - 0.5) * brushSize * 0.5, y + (Math.random() - 0.5) * brushSize * 0.5);
          ctx.lineTo(x + (Math.random() - 0.5) * brushSize * 0.5, y + (Math.random() - 0.5) * brushSize * 0.5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'tiza':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.7 + Math.random() * 0.5);
        ctx.globalAlpha = 0.13 + Math.random() * 0.18;
        for (let i = 0; i < 2 + Math.floor(brushSize / 4); i++) {
          ctx.beginPath();
          ctx.moveTo(x + (Math.random() - 0.5) * brushSize * 0.7, y + (Math.random() - 0.5) * brushSize * 0.7);
          ctx.lineTo(x + (Math.random() - 0.5) * brushSize * 0.7, y + (Math.random() - 0.5) * brushSize * 0.7);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'marcador':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 1.2;
        ctx.globalAlpha = 0.7;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'oleo':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (1.5 + Math.random() * 0.7);
        ctx.globalAlpha = 0.5 + Math.random() * 0.2;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 0.8;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'pixel':
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
        for (let i = 0; i < brushSize * 2; i++) {
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fillRect(x + Math.floor(Math.random() * 3), y + Math.floor(Math.random() * 3), 1, 1);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 1.1;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 2.5;
        ctx.globalAlpha = 0.8;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'neon':
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 1.2;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 2.5;
        ctx.globalAlpha = 0.7;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'puntos':
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
        for (let i = 0; i < brushSize * 2; i++) {
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.beginPath();
          ctx.arc(x + Math.random() * 6 - 3, y + Math.random() * 6 - 3, 1 + Math.random() * 2, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'lineas':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 0.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.random() * 20 - 10, y + Math.random() * 20 - 10);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      case 'fuego':
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.8 + Math.random() * 0.6);
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = brushSize * 2.5;
        ctx.globalAlpha = 0.3 + Math.random() * 0.3;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
        
      default:
        ctx.globalAlpha = 1;
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
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
                    cursor: currentTool === 'eraser' ? 'crosshair' : 'crosshair'
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                />
                {currentTool === 'eraser' && cursorPos && (
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
