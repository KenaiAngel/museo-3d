"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../../providers/ThemeProvider";
import { 
  Plus, 
  Palette, 
  Upload, 
  Edit3, 
  Trash2, 
  Download, 
  Share2, 
  Eye, 
  Search,
  Filter,
  Grid,
  List,
  Brush,
  Save,
  X,
  RefreshCw,
  ChevronDown
} from "lucide-react";
import { DatePicker } from "../components/ui/date-picker-new";
import Stepper from "../../components/ui/Stepper";

// Componentes de fondo animado
function AnimatedBlobsBackground() {
  return (
    <>
      <div className="absolute top-0 left-0 w-[520px] h-[520px] bg-orange-300/60 dark:bg-orange-700/30 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe" />
      <div className="absolute bottom-0 right-0 w-[520px] h-[520px] bg-pink-300/60 dark:bg-pink-700/30 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe-delayed" />
      <div
        className="absolute top-1/2 left-1/2 w-[340px] h-[340px] bg-fuchsia-200/50 dark:bg-fuchsia-800/20 rounded-full mix-blend-multiply filter blur-[100px] animate-breathe"
        style={{ transform: "translate(-50%,-50%) scale(1.2)" }}
      />
    </>
  );
}

function DotsPattern() {
  return (
    <svg
      className="absolute inset-0 w-full h-full z-0 pointer-events-none hidden dark:block"
      width="100%"
      height="100%"
      style={{ opacity: 0.13 }}
    >
      <defs>
        <pattern
          id="dots"
          x="0"
          y="0"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.5" fill="#fff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

// Componente Canvas para crear murales
function CanvasEditor({ isOpen, onClose, onSave, editingMural = null }) {
  const canvasRef = useRef(null);
  const [currentTool, setCurrentTool] = useState('brush');
  const [brushSize, setBrushSize] = useState(5);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [canvasHistory, setCanvasHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
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

  // Refs para siempre tener el valor actual de brushType y brushColor
  const brushTypeRef = useRef(currentTool);
  const brushColorRef = useRef(currentColor);
  useEffect(() => { brushTypeRef.current = currentTool; }, [currentTool]);
  useEffect(() => { brushColorRef.current = currentColor; }, [currentColor]);

  // Un solo sistema de coordenadas y handlers
  const [cursorPos, setCursorPos] = useState(null);
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

  // Dibuja usando siempre el valor actual de brushType y brushColor
  const drawAt = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const type = brushTypeRef.current;
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
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
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
        ctx.globalAlpha = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'pencil':
        ctx.globalAlpha = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'classic_brush':
        ctx.globalAlpha = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = 10;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgb(0,0,0)';
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'smooth':
        ctx.globalAlpha = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        if (points.length > 2) {
          const prev = points[points.length - 2];
          const curr = points[points.length - 1];
          const midX = (prev.x + curr.x) / 2;
          const midY = (prev.y + curr.y) / 2;
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'shadow':
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 1.2;
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'rainbow_dynamic':
        {
          let hue = (performance.now() / 5) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
          ctx.lineWidth = brushSize;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'confetti':
        for (let i = 0; i < brushSize; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 2 + Math.random() * 2, 0, 2 * Math.PI);
          ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 60%)`;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'shooting_star':
        {
          const grad = ctx.createLinearGradient(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y);
          grad.addColorStop(0, 'white');
          grad.addColorStop(1, brushColor);
          ctx.strokeStyle = grad;
          ctx.lineWidth = brushSize * 1.2;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
          // Dibuja estrella al final
          ctx.save();
          ctx.translate(points[points.length - 1].x, points[points.length - 1].y);
          ctx.rotate(Math.random() * 2 * Math.PI);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * brushSize, -Math.sin((18 + i * 72) / 180 * Math.PI) * brushSize);
            ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * brushSize * 0.5, -Math.sin((54 + i * 72) / 180 * Math.PI) * brushSize * 0.5);
          }
          ctx.closePath();
          ctx.fillStyle = 'yellow';
          ctx.globalAlpha = 0.8;
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'glitch':
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.strokeStyle = i === 0 ? brushColor : `hsl(${Math.random() * 360},100%,60%)`;
          ctx.lineWidth = brushSize * (0.7 + Math.random() * 0.6);
          ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
          ctx.restore();
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'heart_spray':
        for (let i = 0; i < brushSize; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.random() * 2 * Math.PI);
          ctx.scale(0.7 + Math.random() * 0.6, 0.7 + Math.random() * 0.6);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(0, -3, -3, -3, -3, 0);
          ctx.bezierCurveTo(-3, 3, 0, 3, 0, 6);
          ctx.bezierCurveTo(0, 3, 3, 3, 3, 0);
          ctx.bezierCurveTo(3, -3, 0, -3, 0, 0);
          ctx.closePath();
          ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 60%)`;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'lightning':
        ctx.save();
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = brushSize * 1.2;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        let x = points[points.length - 2].x;
        let y = points[points.length - 2].y;
        for (let i = 0; i < 5; i++) {
          x += (points[points.length - 1].x - x) / (6 - i) + (Math.random() - 0.5) * brushSize * 2;
          y += (points[points.length - 1].y - y) / (6 - i) + (Math.random() - 0.5) * brushSize * 2;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'bubble':
        for (let i = 0; i < brushSize; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 6 + Math.random() * 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(180,220,255,0.15)';
          ctx.globalAlpha = 0.5 + Math.random() * 0.3;
          ctx.fill();
          ctx.strokeStyle = 'rgba(180,220,255,0.4)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'ribbon':
        ctx.save();
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 3;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = brushColor;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'fire_realistic':
        for (let i = 0; i < brushSize * 2; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 2 + Math.random() * 2, 0, 2 * Math.PI);
          const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
          grad.addColorStop(0, 'yellow');
          grad.addColorStop(0.5, 'orange');
          grad.addColorStop(1, 'red');
          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.2 + Math.random() * 0.4;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'particles':
        for (let i = 0; i < brushSize * 2; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.5;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 1 + Math.random() * 2, 0, 2 * Math.PI);
          ctx.fillStyle = brushColor;
          ctx.globalAlpha = 0.2 + Math.random() * 0.5;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
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
                <div className="space-y-3">
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
                <div className="grid grid-cols-5 gap-2">
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
                  className="w-full mt-3 h-10 rounded-lg"
                />
              </div>

              {/* Tamaño del pincel */}
              <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 flex flex-col gap-2">
                <h3 className="font-semibold mb-3">Tamaño del Pincel</h3>
                <div className="flex gap-2 items-center mb-3">
                  <label className="font-medium">Pincel:</label>
                  <select value={currentTool} onChange={e => setCurrentTool(e.target.value)} className="rounded border px-2 py-1">
                    <option value="brush">Pincel</option>
                    <option value="eraser">Borrador</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="font-medium mr-2">Color:</label>
                  <input type="color" value={currentColor} onChange={e => setCurrentColor(e.target.value)} className="w-8 h-8 rounded align-middle" />
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
                  style={{ width: "100%", height: "100%", display: "block", background: "#fff", borderRadius: 12, border: '2px solid #d1d5db', transform: `scale(${canvasZoom})`, transformOrigin: 'center center' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={e => {
                    const rect = canvasRef.current.getBoundingClientRect();
                    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                    handleMouseMove(e);
                  }}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={e => {
                    setCursorPos(null);
                    handleMouseLeave(e);
                  }}
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

        {isCanvasStep && (
          <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 200, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '8px 12px', borderRadius: 8, fontSize: 14, pointerEvents: 'none' }}>
            <div><b>Debug:</b></div>
            <div>Cursor CSS: {cursorPos ? `${Math.round(cursorPos.x)}, ${Math.round(cursorPos.y)}` : '--'}</div>
            <div>Canvas: {cursorPos ? `${Math.round((cursorPos.x * (canvasRef.current?.width || 0)) / (canvasRef.current?.getBoundingClientRect().width || 1))}, ${Math.round((cursorPos.y * (canvasRef.current?.height || 0)) / (canvasRef.current?.getBoundingClientRect().height || 1))}` : '--'}</div>
            <div>Color: <span style={{ background: currentColor, color: '#000', padding: '0 8px', borderRadius: 4 }}>{currentColor}</span></div>
            <div>Pincel: {currentTool}</div>
            <div>isDrawing: {isDrawing ? 'true' : 'false'}</div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// 2. Modal stepper moderno y centrado para crear mural
function CrearObraModal({ isOpen, onClose, onCreate, session }) {
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

  useEffect(() => {
    const img = new window.Image();
    img.src = '/assets/brush2.png';
    img.onload = () => {
      furBrushImgRef.current = img;
      setFurReady(true);
    };
  }, []);

  // Función para obtener coordenadas escaladas en el canvas
  const getScaledCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    return { x, y };
  };

  // Dropzone para archivos (imagen principal)
  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles[0]) setImagen(acceptedFiles[0]);
  }, []);
  const dropzone = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false
  });
  const { getRootProps, getInputProps, isDragActive } = dropzone;

  // Dropzone para fondo de canvas
  const bgDropzone = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles[0]) {
        const file = acceptedFiles[0];
        const reader = new FileReader();
        reader.onload = (ev) => setCanvasBg(ev.target.result);
        reader.readAsDataURL(file);
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
  };

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen]);

  const validateStep = () => {
    if (step === 0) {
      const errs = {};
      if (!titulo.trim()) errs.titulo = "El título es obligatorio";
      if (!tecnica.trim()) errs.tecnica = "La técnica es obligatoria";
      setErrors(errs);
      return Object.keys(errs).length === 0;
    }
    if (step === 1) {
      if (!imagen && imgMode === "archivo") {
        setErrors({ imagen: "Debes subir una imagen" });
        return false;
      }
      setErrors({});
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) setStep(step + 1);
  };
  const handleBack = () => setStep(step - 1);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setImagen(file);
  };
  const handleCanvasBgChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setCanvasBg(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState(null);
  // 2. Función para agregar puntos con ancho aleatorio para 'pen'
  const addPoint = (e) => {
    const { x, y } = getScaledCoords(e);
    pointsRef.current.push({
      x,
      y,
      width: brushType === 'pen' ? getRandomInt(3, 5) : brushSize
    });
  };

  // Función para dibujar en el canvas según el brushType (todos los pinceles de Perfection Kills)
  const draw = (e) => {
    const ctx = canvasRef.current.getContext('2d');
    const points = pointsRef.current;
    if (!ctx || points.length < 2) return;
    ctx.save();
    switch (brushType) {
      // --- ACUARELA: trazo ancho, opacidad baja, blur y overlays ---
      case 'acuarela':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 2.8;
        ctx.globalAlpha = 0.05 + Math.random() * 0.08;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 2.2;
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.7 + Math.random() * 0.3);
        ctx.globalAlpha = 0.18 + Math.random() * 0.18;
        for (let i = 0; i < 2 + Math.floor(brushSize / 6); i++) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 1].x + (Math.random() - 0.5) * brushSize * 0.5, points[points.length - 1].y + (Math.random() - 0.5) * brushSize * 0.5);
          ctx.lineTo(points[points.length - 1].x + (Math.random() - 0.5) * brushSize * 0.5, points[points.length - 1].y + (Math.random() - 0.5) * brushSize * 0.5);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      // --- TIZA: líneas cortas, opacidad baja, offsets aleatorios ---
      case 'tiza':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.7 + Math.random() * 0.5);
        ctx.globalAlpha = 0.13 + Math.random() * 0.18;
        for (let i = 0; i < 2 + Math.floor(brushSize / 4); i++) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 1].x + (Math.random() - 0.5) * brushSize * 0.7, points[points.length - 1].y + (Math.random() - 0.5) * brushSize * 0.7);
          ctx.lineTo(points[points.length - 1].x + (Math.random() - 0.5) * brushSize * 0.7, points[points.length - 1].y + (Math.random() - 0.5) * brushSize * 0.7);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      // --- MARCADOR: línea ancha, opacidad media ---
      case 'marcador':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 1.2;
        ctx.globalAlpha = 0.7;
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      // --- ÓLEO: línea ancha, opacidad media, blur, grosores aleatorios ---
      case 'oleo':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (1.5 + Math.random() * 0.7);
        ctx.globalAlpha = 0.5 + Math.random() * 0.2;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 0.8;
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        break;
      // --- PIXEL: píxeles sueltos, opacidad y posición aleatoria ---
      case 'pixel':
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
        for (let i = 0; i < brushSize * 2; i++) {
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fillRect(points[points.length - 1].x + Math.floor(Math.random() * 3), points[points.length - 1].y + Math.floor(Math.random() * 3), 1, 1);
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 1.1;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 2.5;
        ctx.globalAlpha = 0.8;
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        break;
      // --- NEÓN: modo 'lighter', blur fuerte, color brillante ---
      case 'neon':
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 1.2;
        ctx.shadowColor = brushColor;
        ctx.shadowBlur = brushSize * 2.5;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        break;
      // --- PUNTOS: muchos círculos pequeños, opacidad y posición aleatoria ---
      case 'puntos':
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = brushColor;
        for (let i = 0; i < brushSize * 2; i++) {
          ctx.globalAlpha = 0.5 + Math.random() * 0.5;
          ctx.beginPath();
          ctx.arc(points[points.length - 1].x + Math.random() * 6 - 3, points[points.length - 1].y + Math.random() * 6 - 3, 1 + Math.random() * 2, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      // --- LÍNEAS: líneas cortas en ángulos aleatorios ---
      case 'lineas':
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 0.5;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.lineTo(points[points.length - 1].x + Math.random() * 20 - 10, points[points.length - 1].y + Math.random() * 20 - 10);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      // --- FUEGO: modo 'lighter', shadow naranja, líneas con opacidad baja ---
      case 'fuego':
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * (0.8 + Math.random() * 0.6);
        ctx.shadowColor = 'orange';
        ctx.shadowBlur = brushSize * 2.5;
        ctx.globalAlpha = 0.3 + Math.random() * 0.3;
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        break;
      case 'pencil':
        ctx.globalAlpha = 1;
        ctx.lineCap = 'butt';
        ctx.lineJoin = 'miter';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'classic_brush':
        ctx.globalAlpha = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = 10;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgb(0,0,0)';
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        break;
      case 'fur': // Fur (pelos)
        if (furBrushImgRef.current) {
          for (let i = 0; i < 10; i++) {
            ctx.save();
            ctx.translate(points[points.length - 1].x, points[points.length - 1].y);
            ctx.rotate(Math.random() * 2 * Math.PI);
            ctx.globalAlpha = 0.2 + Math.random() * 0.3;
            ctx.drawImage(furBrushImgRef.current, -brushSize / 2, -brushSize / 2, brushSize, brushSize);
            ctx.restore();
          }
        }
        break;
      case 'pen': // Pluma (ancho variable)
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineWidth = points[points.length - 2].width;
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.strokeStyle = brushColor;
          ctx.stroke();
        }
        break;
      case 'pen2': // Pluma múltiple
        if (points.length > 1) {
          for (let j = 0; j < 3; j++) {
            ctx.beginPath();
            ctx.moveTo(points[points.length - 2].x + Math.random() * 2, points[points.length - 2].y + Math.random() * 2);
            ctx.lineTo(points[points.length - 1].x + Math.random() * 2, points[points.length - 1].y + Math.random() * 2);
            ctx.lineWidth = brushSize * (0.7 + Math.random() * 0.6);
            ctx.strokeStyle = brushColor;
            ctx.globalAlpha = 0.7;
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }
        break;
      case 'thick': // Thick brush
        ctx.globalAlpha = 0.7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 2.5;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        break;
      case 'sliced': // Sliced strokes
        ctx.globalAlpha = 1;
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x + Math.random() * 8 - 4, points[points.length - 2].y + Math.random() * 8 - 4);
          ctx.lineTo(points[points.length - 1].x + Math.random() * 8 - 4, points[points.length - 1].y + Math.random() * 8 - 4);
          ctx.globalAlpha = 0.2;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      case 'multi': // Múltiples líneas
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x + i * 2, points[points.length - 2].y + i * 2);
          ctx.lineTo(points[points.length - 1].x + i * 2, points[points.length - 1].y + i * 2);
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushSize;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      case 'multi_opacity': // Múltiples líneas opacidad
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x + i * 2, points[points.length - 2].y + i * 2);
          ctx.lineTo(points[points.length - 1].x + i * 2, points[points.length - 1].y + i * 2);
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushSize;
          ctx.globalAlpha = 0.2 + 0.15 * Math.abs(i);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      case 'stamp_circle': // Estampado círculo
        ctx.beginPath();
        ctx.arc(points[points.length - 1].x, points[points.length - 1].y, brushSize, 0, 2 * Math.PI);
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.globalAlpha = 1;
        break;
      case 'stamp_star': // Estampado estrella
        ctx.save();
        ctx.translate(points[points.length - 1].x, points[points.length - 1].y);
        ctx.rotate(Math.random() * 2 * Math.PI);
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * brushSize, -Math.sin((18 + i * 72) / 180 * Math.PI) * brushSize);
          ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * brushSize * 0.5, -Math.sin((54 + i * 72) / 180 * Math.PI) * brushSize * 0.5);
        }
        ctx.closePath();
        ctx.fillStyle = brushColor;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
        break;
      case 'pattern_dots': // Patrón puntos
        {
          const patternCanvas = document.createElement('canvas');
          patternCanvas.width = patternCanvas.height = 8;
          const pctx = patternCanvas.getContext('2d');
          pctx.fillStyle = brushColor;
          pctx.beginPath();
          pctx.arc(4, 4, 2, 0, 2 * Math.PI);
          pctx.fill();
          const pattern = ctx.createPattern(patternCanvas, 'repeat');
          ctx.strokeStyle = pattern;
          ctx.lineWidth = brushSize;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        break;
      case 'pattern_lines': // Patrón líneas
        {
          const patternCanvas = document.createElement('canvas');
          patternCanvas.width = 8; patternCanvas.height = 8;
          const pctx = patternCanvas.getContext('2d');
          pctx.strokeStyle = brushColor;
          pctx.beginPath();
          pctx.moveTo(0, 4); pctx.lineTo(8, 4);
          pctx.stroke();
          const pattern = ctx.createPattern(patternCanvas, 'repeat');
          ctx.strokeStyle = pattern;
          ctx.lineWidth = brushSize;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        break;
      case 'pattern_rainbow': // Patrón arcoíris
        {
          const patternCanvas = document.createElement('canvas');
          patternCanvas.width = 16; patternCanvas.height = 16;
          const pctx = patternCanvas.getContext('2d');
          const colors = ['#f00','#ff0','#0f0','#0ff','#00f','#f0f'];
          for (let i = 0; i < 6; i++) {
            pctx.strokeStyle = colors[i];
            pctx.beginPath();
            pctx.moveTo(0, i * 2 + 1);
            pctx.lineTo(16, i * 2 + 1);
            pctx.stroke();
          }
          const pattern = ctx.createPattern(patternCanvas, 'repeat');
          ctx.strokeStyle = pattern;
          ctx.lineWidth = brushSize;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        break;
      case 'pattern_image': // Patrón imagen
        if (furBrushImgRef.current) {
          const pattern = ctx.createPattern(furBrushImgRef.current, 'repeat');
          ctx.strokeStyle = pattern;
          ctx.lineWidth = brushSize;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        break;
      case 'aerosol': // Aerosol (spray clásico)
        for (let i = 0; i < brushSize * 4; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
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
      case 'spray': // Spray (rápido)
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
      case 'spray_time': // Spray por tiempo (usa drawSpray)
        // El temporizador ya llama a drawSpray
        break;
      case 'sketchy': // Sketchy (Harmony)
        if (points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.strokeStyle = brushColor;
          ctx.lineWidth = brushSize;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          // Conexiones a puntos vecinos
          const last = points[points.length - 1];
          for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i].x - last.x;
            const dy = points[i].y - last.y;
            const d = dx * dx + dy * dy;
            if (d < 1000 && Math.random() > d / 1000) {
              ctx.beginPath();
              ctx.moveTo(last.x, last.y);
              ctx.lineTo(points[i].x, points[i].y);
              ctx.globalAlpha = 0.1;
              ctx.stroke();
            }
          }
          ctx.globalAlpha = 1;
        }
        break;
      case 'neighbor': // Neighbor points
        if (points.length > 1) {
          const last = points[points.length - 1];
          for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i].x - last.x;
            const dy = points[i].y - last.y;
            const d = dx * dx + dy * dy;
            if (d < 1000) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(0,0,0,0.3)';
              ctx.moveTo(last.x + dx * 0.2, last.y + dy * 0.2);
              ctx.lineTo(points[i].x - dx * 0.2, points[i].y - dy * 0.2);
              ctx.stroke();
            }
          }
        }
        break;
      case 'fur_neighbor': // Fur via neighbor points
        if (points.length > 1) {
          const last = points[points.length - 1];
          for (let i = 0; i < points.length - 1; i++) {
            const dx = points[i].x - last.x;
            const dy = points[i].y - last.y;
            const d = dx * dx + dy * dy;
            if (d < 1000) {
              ctx.beginPath();
              ctx.strokeStyle = 'rgba(0,0,0,0.15)';
              ctx.moveTo(last.x - dx * 0.2, last.y - dy * 0.2);
              ctx.lineTo(points[i].x + dx * 0.2, points[i].y + dy * 0.2);
              ctx.stroke();
            }
          }
        }
        break;
      case 'eraser':
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.lineWidth = brushSize;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        break;
      case 'rainbow_dynamic': // Arcoíris dinámico
        {
          let hue = (performance.now() / 5) % 360;
          ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
          ctx.lineWidth = brushSize;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
        }
        break;
      case 'confetti': // Confeti
        for (let i = 0; i < brushSize; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 2 + Math.random() * 2, 0, 2 * Math.PI);
          ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 60%)`;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        break;
      case 'shooting_star': // Estrella fugaz
        {
          const grad = ctx.createLinearGradient(points[points.length - 2].x, points[points.length - 2].y, points[points.length - 1].x, points[points.length - 1].y);
          grad.addColorStop(0, 'white');
          grad.addColorStop(1, brushColor);
          ctx.strokeStyle = grad;
          ctx.lineWidth = brushSize * 1.2;
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
          // Dibuja estrella al final
          ctx.save();
          ctx.translate(points[points.length - 1].x, points[points.length - 1].y);
          ctx.rotate(Math.random() * 2 * Math.PI);
          ctx.beginPath();
          for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * brushSize, -Math.sin((18 + i * 72) / 180 * Math.PI) * brushSize);
            ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * brushSize * 0.5, -Math.sin((54 + i * 72) / 180 * Math.PI) * brushSize * 0.5);
          }
          ctx.closePath();
          ctx.fillStyle = 'yellow';
          ctx.globalAlpha = 0.8;
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        break;
      case 'glitch': // Glitch
        for (let i = 0; i < 3; i++) {
          ctx.save();
          ctx.strokeStyle = i === 0 ? brushColor : `hsl(${Math.random() * 360},100%,60%)`;
          ctx.lineWidth = brushSize * (0.7 + Math.random() * 0.6);
          ctx.translate((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
          ctx.beginPath();
          ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
          ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
          ctx.stroke();
          ctx.restore();
        }
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'heart_spray': // Spray de corazones
        for (let i = 0; i < brushSize; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(Math.random() * 2 * Math.PI);
          ctx.scale(0.7 + Math.random() * 0.6, 0.7 + Math.random() * 0.6);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(0, -3, -3, -3, -3, 0);
          ctx.bezierCurveTo(-3, 3, 0, 3, 0, 6);
          ctx.bezierCurveTo(0, 3, 3, 3, 3, 0);
          ctx.bezierCurveTo(3, -3, 0, -3, 0, 0);
          ctx.closePath();
          ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 60%)`;
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.fill();
          ctx.restore();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'lightning': // Rayo
        ctx.save();
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = brushSize * 1.2;
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        let x = points[points.length - 2].x;
        let y = points[points.length - 2].y;
        for (let i = 0; i < 5; i++) {
          x += (points[points.length - 1].x - x) / (6 - i) + (Math.random() - 0.5) * brushSize * 2;
          y += (points[points.length - 1].y - y) / (6 - i) + (Math.random() - 0.5) * brushSize * 2;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'bubble': // Burbuja
        for (let i = 0; i < brushSize; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 6 + Math.random() * 8, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(180,220,255,0.15)';
          ctx.globalAlpha = 0.5 + Math.random() * 0.3;
          ctx.fill();
          ctx.strokeStyle = 'rgba(180,220,255,0.4)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'ribbon': // Cinta
        ctx.save();
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize * 3;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = brushSize;
        ctx.strokeStyle = brushColor;
        ctx.beginPath();
        ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'fire_realistic': // Fuego realista
        for (let i = 0; i < brushSize * 2; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.2;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 2 + Math.random() * 2, 0, 2 * Math.PI);
          const grad = ctx.createRadialGradient(px, py, 0, px, py, 8);
          grad.addColorStop(0, 'yellow');
          grad.addColorStop(0.5, 'orange');
          grad.addColorStop(1, 'red');
          ctx.fillStyle = grad;
          ctx.globalAlpha = 0.2 + Math.random() * 0.4;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
      case 'particles': // Partículas
        for (let i = 0; i < brushSize * 2; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.random() * brushSize * 1.5;
          const px = points[points.length - 1].x + Math.cos(angle) * radius;
          const py = points[points.length - 1].y + Math.sin(angle) * radius;
          ctx.beginPath();
          ctx.arc(px, py, 1 + Math.random() * 2, 0, 2 * Math.PI);
          ctx.fillStyle = brushColor;
          ctx.globalAlpha = 0.2 + Math.random() * 0.5;
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        break;
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

  // ... existente ...
  // En startDrawing:
  const startDrawing = (e) => {
    setIsDrawing(true);
    pointsRef.current = [];
    addPoint(e);
    addPoint(e); // dos puntos iguales para iniciar el trazo
    if (brushType === 'spray_time') {
      sprayTimerRef.current = setInterval(() => {
        drawSpray(pointsRef.current[pointsRef.current.length - 1]);
      }, 20);
    } else {
      draw(e);
    }
  };
  // ... existente ...
  // En handleMouseMove:
  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    addPoint(e);
    draw(e);
  };

  useEffect(() => {
    if (imgMode === "canvas" && canvasBg && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      const img = new window.Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
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
      // Convertir dataURL a Blob
      const res = await fetch(canvasImage);
      imgFile = await res.blob();
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
        reset();
      } else {
        const err = await response.json();
        toast.error(err.error || "Error al crear la obra");
      }
    } catch (error) {
      toast.error("Error al crear la obra");
      console.error(error);
    }
  };

  // Determinar si estamos en el paso de canvas
  const isCanvasStep = step === 1 && imgMode === "canvas";

  const [cursorPos, setCursorPos] = useState(null);
  const handleMouseLeave = () => {
    setCursorPos(null);
    stopDrawing();
  };

  // Función para detener el dibujo y limpiar temporizadores
  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
    setCanvasImage(canvasRef.current.toDataURL());
    if (sprayTimerRef.current) {
      clearInterval(sprayTimerRef.current);
      sprayTimerRef.current = null;
    }
    pointsRef.current = [];
  };

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
                (() => {
                  const cursorType = brushType === 'eraser' ? 'x' : brushType === 'hand' ? 'hand' : 'circle';
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Panel de herramientas */}
                      <div className="lg:col-span-1 space-y-6">
                        {/* Herramientas */}
                        <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4 flex flex-col gap-4">
                          <h3 className="font-semibold mb-3">Herramientas</h3>
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
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Arrastra una imagen de fondo aquí o haz clic para seleccionar</span>
                            )}
                          </div>
                          <div className="w-full mb-3">
                            <div className="flex gap-2 items-center overflow-x-auto px-2 max-w-full">
                              <label className="font-medium">Pincel:</label>
                              <select value={brushType} onChange={e => setBrushType(e.target.value)} className="rounded border-2 px-2 py-1 max-w-xs truncate w-full border-gray-300 dark:border-neutral-700" >
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
                            style={{ width: "100%", height: "100%", display: "block", background: "#fff", borderRadius: 12, border: '2px solid #d1d5db', transform: `scale(${canvasZoom})`, transformOrigin: 'center center' }}
                            onMouseDown={startDrawing}
                            onMouseMove={e => {
                              const rect = canvasRef.current.getBoundingClientRect();
                              setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
                              handleMouseMove(e);
                            }}
                            onMouseUp={stopDrawing}
                            onMouseLeave={e => {
                              setCursorPos(null);
                              handleMouseLeave(e);
                            }}
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
                  );
                })()
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

// Hotspot offsets para cada tipo de cursor visual
const cursorHotspot = {
  circle: { x: 5, y: 5 }, // centro
  x: { x: 12, y: 12 }, // ejemplo: centro de una X de 24x24px
  hand: { x: 8, y: 2 }, // ejemplo: punta del dedo en un SVG de mano de 24x24px
};

// Define drawSpray para spray_time:
function drawSpray(point) {
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

// 1. Agrega la función getRandomInt
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function MisObras() {
  const { data: session, status } = useSession();
  const { user, isAuthenticated } = useAuth();
  const [murales, setMurales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid'); // 'grid' o 'list'
  const [showCanvasEditor, setShowCanvasEditor] = useState(false);
  const [editingMural, setEditingMural] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    tecnica: '',
    year: '',
    sortBy: 'newest'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMurales, setSelectedMurales] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCrearObraModal, setShowCrearObraModal] = useState(false);

  // Cargar murales del usuario
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserMurales();
    }
  }, [session]);

  const fetchUserMurales = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/murales?userId=${session.user.id}`);
      if (response.ok) {
        const data = await response.json();
        setMurales(data.murales || []);
      }
    } catch (error) {
      console.error('Error fetching murales:', error);
      toast.error('Error al cargar tus obras');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar murales
  const filteredMurales = murales.filter(mural => {
    // Solo mostrar obras del usuario actual
    if (session?.user?.id && mural.userId && mural.userId !== session.user.id) return false;
    if (session?.user?.name && mural.autor && mural.autor !== session.user.name) return false;
    // Filtros existentes
    if (filters.search && !mural.titulo?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !mural.autor?.toLowerCase().includes(filters.search.toLowerCase()) &&
        !mural.tecnica?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.tecnica && mural.tecnica !== filters.tecnica) return false;
    if (filters.year && mural.year !== filters.year) return false;
    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
      case 'title': return (a.titulo || '').localeCompare(b.titulo || '');
      case 'year': return (b.year || 0) - (a.year || 0);
      default: return 0;
    }
  });

  // Manejar guardado desde canvas
  const handleCanvasSave = (savedMural) => {
    if (editingMural) {
      setMurales(murales.map(m => m.id === savedMural.id ? savedMural : m));
    } else {
      setMurales([savedMural, ...murales]);
    }
    setEditingMural(null);
  };

  // Eliminar mural
  const handleDeleteMural = async (muralId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta obra?')) return;
    
    try {
      const response = await fetch(`/api/murales/${muralId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMurales(murales.filter(m => m.id !== muralId));
        toast.success('Obra eliminada exitosamente');
      } else {
        toast.error('Error al eliminar la obra');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la obra');
    }
  };

  // Componente de subida de archivos
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imagen', file);
    formData.append('titulo', file.name.split('.')[0]);
    formData.append('tecnica', 'Fotografía/Digital');
    formData.append('year', new Date().getFullYear());
    formData.append('autor', session?.user?.name || 'Usuario');

    try {
      const response = await fetch('/api/murales', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setMurales([result, ...murales]);
        toast.success('Obra subida exitosamente');
        setShowUploadModal(false);
      } else {
        toast.error('Error al subir la obra');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al subir la obra');
    }
  }, [murales, session]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: false
  });

  useEffect(() => {
    if (showCrearObraModal) {
      document.body.classList.add("hide-footer");
    } else {
      document.body.classList.remove("hide-footer");
    }
    return () => document.body.classList.remove("hide-footer");
  }, [showCrearObraModal]);

  if (status === 'loading' || loading) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <AnimatedBlobsBackground />
          <DotsPattern />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
            <p className="text-lg text-foreground">Cargando tus obras...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <AnimatedBlobsBackground />
          <DotsPattern />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              Inicia sesión para ver tus obras
            </h1>
            <Link
              href="/"
              className="text-indigo-600 hover:text-indigo-500 underline"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Fondo animado */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatedBlobsBackground />
        <DotsPattern />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-24 md:pt-28 pb-8 md:pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center gap-3">
              <Palette className="h-10 w-10 text-indigo-600" />
              Mis Obras
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Crea, administra y comparte tus obras de arte digitales
            </p>

            {/* Botones de acción principales */}
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => setShowCanvasEditor(false) || setShowUploadModal(false) || setShowCrearObraModal(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold shadow hover:bg-indigo-700 transition"
              >
                <Plus className="h-5 w-5" /> Crear obra
              </button>
            </div>

            {/* Controles de vista y filtros */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-4 border border-border">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar obras..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  Filtros
                  <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredMurales.length} obra{filteredMurales.length !== 1 ? 's' : ''}
                </span>
                <div className="border-l border-gray-300 dark:border-gray-600 h-6 mx-2"></div>
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    view === 'grid' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    view === 'list' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 dark:bg-neutral-700 hover:bg-gray-200 dark:hover:bg-neutral-600'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Panel de filtros expandible */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-4 border border-border"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <select
                    value={filters.tecnica}
                    onChange={(e) => setFilters({...filters, tecnica: e.target.value})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todas las técnicas</option>
                    {[...new Set(murales.map(m => m.tecnica).filter(Boolean))].map(tecnica => (
                      <option key={tecnica} value={tecnica}>{tecnica}</option>
                    ))}
                  </select>

                  <select
                    value={filters.year}
                    onChange={(e) => setFilters({...filters, year: e.target.value})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Todos los años</option>
                    {[...new Set(murales.map(m => m.year).filter(Boolean))].sort((a, b) => b - a).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>

                  <select
                    value={filters.sortBy}
                    onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-neutral-700 text-foreground focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="newest">Más recientes</option>
                    <option value="oldest">Más antiguos</option>
                    <option value="title">Por título</option>
                    <option value="year">Por año</option>
                  </select>

                  <button
                    onClick={() => setFilters({ search: '', tecnica: '', year: '', sortBy: 'newest' })}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Contenido principal */}
          {filteredMurales.length === 0 ? (
            <div className="text-center py-16">
              <Palette className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {murales.length === 0 ? 'No tienes obras aún' : 'No se encontraron obras'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {murales.length === 0 
                  ? 'Comienza creando tu primera obra de arte digital'
                  : 'Intenta ajustar los filtros de búsqueda'
                }
              </p>
              {murales.length === 0 && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setShowCanvasEditor(false) || setShowUploadModal(false) || setShowCrearObraModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <Plus className="h-5 w-5" />
                    Crear obra
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={
              view === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                : 'space-y-4'
            }>
              {filteredMurales.map((mural) => (
                <motion.div
                  key={mural.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={
                    view === 'grid'
                      ? 'bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border'
                      : 'bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-border flex items-center gap-4 p-4'
                  }
                >
                  {view === 'grid' ? (
                    <>
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={mural.url_imagen}
                          alt={mural.titulo}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingMural(mural);
                                setShowCanvasEditor(true);
                              }}
                              className="p-2 bg-white/90 text-gray-800 rounded-lg hover:bg-white transition-colors"
                              title="Editar"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMural(mural.id)}
                              className="p-2 bg-red-500/90 text-white rounded-lg hover:bg-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
                          {mural.titulo}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {mural.tecnica} • {mural.year}
                        </p>
                        {mural.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {mural.descripcion}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-24 h-24 flex-shrink-0 relative overflow-hidden rounded-lg">
                        <img
                          src={mural.url_imagen}
                          alt={mural.titulo}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground mb-1 truncate">
                          {mural.titulo}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {mural.tecnica} • {mural.year}
                        </p>
                        {mural.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {mural.descripcion}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingMural(mural);
                            setShowCanvasEditor(true);
                          }}
                          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMural(mural.id)}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de subida de imágenes */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full"
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Subir Imagen
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:bg-gray-50 dark:hover:bg-neutral-800'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  {isDragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz click'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Formatos soportados: JPG, PNG, GIF, WebP
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Canvas Editor */}
      <CanvasEditor
        isOpen={showCanvasEditor}
        onClose={() => {
          setShowCanvasEditor(false);
          setEditingMural(null);
        }}
        onSave={handleCanvasSave}
        editingMural={editingMural}
      />

      {/* Crear Obra Modal */}
      <CrearObraModal
        isOpen={showCrearObraModal}
        onClose={() => setShowCrearObraModal(false)}
        onCreate={obra => setMurales([obra, ...murales])}
        session={session}
      />
    </div>
  );
}
