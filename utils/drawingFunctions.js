/**
 * @fileoverview Professional Drawing Engine for Canvas-based Digital Art
 * @author Museo 3D Development Team
 * @version 2.0.0
 *
 * This module provides a comprehensive, performant, and type-safe drawing system
 * for canvas-based digital art applications. Features include:
 * - 46+ advanced brush implementations
 * - Memory-efficient history management
 * - Color utilities with caching
 * - Professional error handling
 * - Modular architecture for easy extension
 *
 * @example
 * ```javascript
 * import { BrushEngine, ColorUtils, CanvasUtils } from './drawingFunctions';
 *
 * const engine = new BrushEngine(canvas);
 * engine.configure({ type: 'acuarela', color: '#ff0000', size: 20 });
 * engine.draw({ x: 100, y: 100 });
 * ```
 */

// ===========================
// TYPE DEFINITIONS & CONSTANTS
// ===========================

/**
 * @typedef {Object} Point
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} RGB
 * @property {number} r - Red value (0-255)
 * @property {number} g - Green value (0-255)
 * @property {number} b - Blue value (0-255)
 */

/**
 * @typedef {Object} BrushSettings
 * @property {string} type - Brush type identifier
 * @property {string} color - Color in hex format
 * @property {number} size - Brush size (1-200)
 * @property {number} [opacity=1] - Opacity value (0-1)
 */

// Performance and memory optimization constants
const PERFORMANCE = {
  MAX_BRUSH_SIZE: 200,
  MIN_BRUSH_SIZE: 1,
  PARTICLE_DENSITY_FACTOR: 0.3,
  INTERPOLATION_STEP: 3,
  MAX_HISTORY_SIZE: 50,
};

const DEFAULT_CANVAS_SIZE = { width: 800, height: 600 };

// ===========================
// COLOR UTILITIES
// ===========================

/**
 * Professional color utility class with validation, caching, and performance optimization
 */
export class ColorUtils {
  static #hexCache = new Map();
  static #rgbCache = new Map();

  /**
   * Validates hex color format with comprehensive checking
   * @param {string} hex - Color in hex format
   * @returns {boolean} - True if valid hex color
   */
  static isValidHex(hex) {
    if (typeof hex !== "string") return false;
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  }

  /**
   * Converts hex color to RGB with caching and error handling
   * @param {string} hex - Hex color string
   * @returns {RGB|null} - RGB object or null if invalid
   */
  static hexToRgb(hex) {
    if (!this.isValidHex(hex)) {
      console.warn(`Invalid hex color format: ${hex}`);
      return null;
    }

    // Check cache first for performance
    if (this.#hexCache.has(hex)) {
      return this.#hexCache.get(hex);
    }

    const cleanHex = hex.replace("#", "");
    const fullHex =
      cleanHex.length === 3
        ? cleanHex
            .split("")
            .map((char) => char + char)
            .join("")
        : cleanHex;

    const result = {
      r: parseInt(fullHex.slice(0, 2), 16),
      g: parseInt(fullHex.slice(2, 4), 16),
      b: parseInt(fullHex.slice(4, 6), 16),
    };

    // Cache for future use
    this.#hexCache.set(hex, result);
    return result;
  }

  /**
   * Converts hex to RGBA string with alpha channel
   * @param {string} hex - Hex color
   * @param {number} alpha - Alpha value (0-1)
   * @returns {string} - RGBA string
   */
  static hexToRgba(hex, alpha = 1) {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return "rgba(0,0,0,1)";

    const clampedAlpha = Math.max(0, Math.min(1, alpha));
    return `rgba(${rgb.r},${rgb.g},${rgb.b},${clampedAlpha})`;
  }

  /**
   * Converts RGB values to hex with caching
   * @param {number} r - Red (0-255)
   * @param {number} g - Green (0-255)
   * @param {number} b - Blue (0-255)
   * @returns {string} - Hex color string
   */
  static rgbToHex(r, g, b) {
    const cacheKey = `${r}-${g}-${b}`;
    if (this.#rgbCache.has(cacheKey)) {
      return this.#rgbCache.get(cacheKey);
    }

    const toHex = (n) =>
      Math.max(0, Math.min(255, Math.round(n)))
        .toString(16)
        .padStart(2, "0");
    const result = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    this.#rgbCache.set(cacheKey, result);
    return result;
  }

  /**
   * Creates optimized radial gradient for brush effects
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} x - Center X
   * @param {number} y - Center Y
   * @param {number} radius - Gradient radius
   * @param {string} color - Base color
   * @param {number[]} stops - Alpha stops for gradient
   * @returns {CanvasGradient} - Radial gradient
   */
  static createRadialGradient(ctx, x, y, radius, color, stops = [1, 0.5, 0]) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    stops.forEach((alpha, index) => {
      const position = index / (stops.length - 1);
      gradient.addColorStop(position, this.hexToRgba(color, alpha));
    });

    return gradient;
  }

  /**
   * Shades a color by a given percentage
   * @param {string} hex - Base color in hex
   * @param {number} percent - Percentage to shade (e.g., 10 for 10% lighter)
   * @returns {string} - Shaded color in hex
   */
  static shadeColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8) & (0x00ff + amt);
    const B = (num & 0x0000ff) + amt;
    const newHex =
      "#" + (0x10000 + R * 0x100 + G * 0x1 + B).toString(16).slice(1);
    return newHex;
  }

  /**
   * Clears color caches to free memory
   */
  static clearCache() {
    this.#hexCache.clear();
    this.#rgbCache.clear();
  }
}

// ===========================
// CANVAS UTILITIES
// ===========================

/**
 * Professional canvas utility class with comprehensive error handling
 */
export class CanvasUtils {
  /**
   * Safely gets canvas context with validation
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @returns {CanvasRenderingContext2D} - 2D context
   * @throws {Error} - If canvas or context is invalid
   */
  static getContext(canvas) {
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
      throw new Error("Invalid canvas element provided");
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Unable to get 2D context from canvas");
    }

    return ctx;
  }

  /**
   * Resets canvas context to optimized default state
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   */
  static resetContext(ctx) {
    const defaults = {
      globalCompositeOperation: "source-over",
      globalAlpha: 1,
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowColor: "transparent",
      lineCap: "round",
      lineJoin: "round",
      lineWidth: 1,
      strokeStyle: "#000000",
      fillStyle: "#000000",
      imageSmoothingEnabled: true,
    };

    Object.assign(ctx, defaults);
  }

  /**
   * Efficiently clears canvas with background color
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {string} backgroundColor - Background color
   */
  static clear(canvas, backgroundColor = "#FFFFFF") {
    const ctx = this.getContext(canvas);

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  /**
   * Initializes canvas with optimal settings
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {string} backgroundColor - Background color
   */
  static initialize(
    canvas,
    width = DEFAULT_CANVAS_SIZE.width,
    height = DEFAULT_CANVAS_SIZE.height,
    backgroundColor = "#FFFFFF"
  ) {
    canvas.width = Math.max(1, Math.min(8192, width)); // Reasonable limits
    canvas.height = Math.max(1, Math.min(8192, height));

    this.clear(canvas, backgroundColor);
    this.resetContext(this.getContext(canvas));
  }

  /**
   * Gets accurate mouse coordinates with DPI scaling
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {number} clientX - Mouse X coordinate
   * @param {number} clientY - Mouse Y coordinate
   * @returns {Point} - Canvas coordinates
   */
  static getCoordinates(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: Math.round((clientX - rect.left) * scaleX),
      y: Math.round((clientY - rect.top) * scaleY),
    };
  }

  /**
   * Loads image with proper error handling and CORS support
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {string} imageUrl - Image URL
   * @returns {Promise<void>} - Promise that resolves when image is loaded
   */
  static async loadImage(canvas, imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Enable CORS

      img.onload = () => {
        try {
          const ctx = this.getContext(canvas);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve();
        } catch (error) {
          reject(new Error(`Failed to draw image: ${error.message}`));
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image from URL: ${imageUrl}`));
      };

      // Add timeout for network issues
      setTimeout(() => {
        reject(new Error("Image load timeout"));
      }, 10000);

      img.src = imageUrl;
    });
  }
}

// ===========================
// HISTORY MANAGEMENT
// ===========================

/**
 * Memory-efficient canvas history manager with compression
 */
export class HistoryManager {
  #history = [];
  #currentIndex = -1;
  #maxSize;

  /**
   * Creates new history manager
   * @param {number} maxSize - Maximum history entries
   */
  constructor(maxSize = PERFORMANCE.MAX_HISTORY_SIZE) {
    this.#maxSize = Math.max(1, maxSize);
  }

  /**
   * Saves current canvas state with memory optimization
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @returns {boolean} - True if saved successfully
   */
  save(canvas) {
    try {
      const dataUrl = canvas.toDataURL("image/png", 0.8); // Slight compression

      // Remove future history if we're not at the end
      this.#history = this.#history.slice(0, this.#currentIndex + 1);

      // Add new state
      this.#history.push(dataUrl);
      this.#currentIndex = this.#history.length - 1;

      // Trim history if it exceeds max size (FIFO)
      if (this.#history.length > this.#maxSize) {
        this.#history.shift();
        this.#currentIndex--;
      }

      return true;
    } catch (error) {
      console.error("Failed to save canvas state:", error);
      return false;
    }
  }

  /**
   * Undoes last action with error handling
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @returns {Promise<boolean>} - True if undo was successful
   */
  async undo(canvas) {
    if (!this.canUndo()) return false;

    this.#currentIndex--;
    return await this.#restoreState(canvas, this.#history[this.#currentIndex]);
  }

  /**
   * Redoes last undone action
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @returns {Promise<boolean>} - True if redo was successful
   */
  async redo(canvas) {
    if (!this.canRedo()) return false;

    this.#currentIndex++;
    return await this.#restoreState(canvas, this.#history[this.#currentIndex]);
  }

  /**
   * Checks if undo is possible
   * @returns {boolean} - True if can undo
   */
  canUndo() {
    return this.#currentIndex > 0;
  }

  /**
   * Checks if redo is possible
   * @returns {boolean} - True if can redo
   */
  canRedo() {
    return this.#currentIndex < this.#history.length - 1;
  }

  /**
   * Clears all history and frees memory
   */
  clear() {
    this.#history = [];
    this.#currentIndex = -1;
  }

  /**
   * Gets current history statistics
   * @returns {Object} - History statistics
   */
  getStats() {
    return {
      total: this.#history.length,
      current: this.#currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      memoryUsage: this.#calculateMemoryUsage(),
    };
  }

  /**
   * Estimates memory usage of history
   * @private
   * @returns {number} - Estimated bytes
   */
  #calculateMemoryUsage() {
    return this.#history.reduce(
      (total, dataUrl) => total + dataUrl.length * 2,
      0
    );
  }

  /**
   * Restores canvas state from data URL
   * @private
   * @param {HTMLCanvasElement} canvas - Canvas element
   * @param {string} dataUrl - Canvas data URL
   * @returns {Promise<boolean>} - True if restored successfully
   */
  #restoreState(canvas, dataUrl) {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => {
        try {
          const ctx = CanvasUtils.getContext(canvas);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(true);
        } catch (error) {
          console.error("Failed to restore canvas state:", error);
          resolve(false);
        }
      };

      img.onerror = () => {
        console.error("Failed to load history image");
        resolve(false);
      };

      img.src = dataUrl;
    });
  }
}

// ===========================
// BRUSH ENGINE
// ===========================

/**
 * High-performance brush engine with 46+ brush implementations
 */
export class BrushEngine {
  #canvas;
  #ctx;
  #settings = {
    type: "brush",
    color: "#000000",
    size: 15,
    opacity: 1,
  };

  /**
   * Creates new brush engine instance
   * @param {HTMLCanvasElement} canvas - Canvas element
   */
  constructor(canvas) {
    this.#canvas = canvas;
    this.#ctx = CanvasUtils.getContext(canvas);
  }

  /**
   * Updates brush settings with validation
   * @param {Partial<BrushSettings>} settings - New settings
   */
  configure(settings) {
    if (settings.size !== undefined) {
      settings.size = Math.max(
        PERFORMANCE.MIN_BRUSH_SIZE,
        Math.min(PERFORMANCE.MAX_BRUSH_SIZE, settings.size)
      );
    }

    if (settings.opacity !== undefined) {
      settings.opacity = Math.max(0, Math.min(1, settings.opacity));
    }

    if (
      settings.color !== undefined &&
      !ColorUtils.isValidHex(settings.color)
    ) {
      console.warn(`Invalid color: ${settings.color}, using default`);
      settings.color = "#000000";
    }

    this.#settings = { ...this.#settings, ...settings };
  }

  /**
   * Main drawing function with performance optimization
   * @param {Point} point - Current drawing point
   * @param {Point} [lastPoint] - Previous drawing point
   * @returns {boolean} - True if drawing was successful
   */
  draw(point, lastPoint = null) {
    try {
      if (!this.#isValidPoint(point)) {
        return false;
      }

      const { x, y } = point;
      const { type, color, size, opacity } = this.#settings;

      // Get brush implementation
      const brushImpl = this.#getBrushImplementation(type);
      if (!brushImpl) {
        console.warn(
          `⚠️ Pincel no implementado: "${type}". Usando pincel básico por defecto.`
        );
        this.#drawBasicBrush({ x, y, lastPoint, color, size });
        return true;
      }

      // Check if brush is using placeholder implementation
      if (this.#isPlaceholderBrush(type)) {
        console.warn(
          `⚠️ Pincel "${type}" usa implementación placeholder. Considera implementar lógica específica.`
        );
      }

      // Save context state
      this.#ctx.save();

      // Apply global settings
      this.#ctx.globalAlpha = opacity;

      // Execute brush-specific drawing
      brushImpl.call(this, { x, y, lastPoint, color, size });

      // Restore context state
      this.#ctx.restore();

      return true;
    } catch (error) {
      console.error("Drawing error:", error);
      this.#ctx.restore(); // Ensure context is restored
      return false;
    }
  }

  /**
   * Validates drawing point
   * @private
   */
  #isValidPoint(point) {
    return (
      point &&
      typeof point.x === "number" &&
      typeof point.y === "number" &&
      !isNaN(point.x) &&
      !isNaN(point.y) &&
      point.x >= 0 &&
      point.x <= this.#canvas.width &&
      point.y >= 0 &&
      point.y <= this.#canvas.height
    );
  }

  /**
   * Gets brush implementation function
   * @private
   */
  #getBrushImplementation(type) {
    const brushes = {
      // Basic brushes
      brush: this.#drawBasicBrush,
      eraser: this.#drawEraser,
      pencil: this.#drawPencil,
      shadow: this.#drawShadow,

      // Artistic brushes
      pen: this.#drawPen,
      pen2: this.#drawPen2,
      thick: this.#drawThick,
      sliced: this.#drawSliced,
      multi: this.#drawMulti,
      multi_opacity: this.#drawMultiOpacity,
      carboncillo: this.#drawCharcoal,
      acuarela: this.#drawWatercolor,
      tiza: this.#drawChalk,
      marcador: this.#drawMarker,
      oleo: this.#drawOil,
      pixel: this.#drawPixel,
      neon: this.#drawNeon,
      puntos: this.#drawDots,
      lineas: this.#drawLines,
      fuego: this.#drawFire,
      beads: this.#drawBeads,
      wiggle: this.#drawWiggle,

      // Stamp brushes
      stamp_circle: this.#drawStampCircle,
      stamp_star: this.#drawStampStar,

      // Pattern brushes
      pattern_dots: this.#drawPatternDots,
      pattern_lines: this.#drawPatternLines,
      pattern_rainbow: this.#drawPatternRainbow,
      pattern_image: this.#drawPatternImage,

      // Spray brushes
      aerosol: this.#drawAerosol,
      spray: this.#drawSpray,
      spray_time: this.#drawSprayTime,
      spray_speed: this.#drawSpraySpeed,

      // Sketch/Harmony brushes
      sketchy: this.#drawSketchy,
      neighbor: this.#drawNeighbor,
      fur_neighbor: this.#drawFurNeighbor,

      // Special brushes
      rainbow_dynamic: this.#drawRainbowDynamic,
      confetti: this.#drawConfetti,
      shooting_star: this.#drawShootingStar,
      glitch: this.#drawGlitch,
      heart_spray: this.#drawHeartSpray,
      lightning: this.#drawLightning,
      bubble: this.#drawBubble,
      ribbon: this.#drawRibbon,
      fire_realistic: this.#drawFireRealistic,
      particles: this.#drawParticles,

      // Effect brushes
      glow: this.#drawGlow,

      // Extended brushes (compatibilidad)
      splatter: this.#drawSplatter,
      textured: this.#drawTextured,
      sketch: this.#drawSketch,
      fabric: this.#drawFabric,
      fur: this.#drawFur,
      leaves: this.#drawLeaves,
      rain: this.#drawRain,
      snow: this.#drawSnow,
      stars: this.#drawStars,
      hearts: this.#drawHearts,
      flowers: this.#drawFlowers,
      bubbles: this.#drawBubbles,
      smoke: this.#drawSmoke,
      grass: this.#drawGrass,
      wood: this.#drawWood,
      metal: this.#drawMetal,
      glass: this.#drawGlass,
      water: this.#drawWater,
      sand: this.#drawSand,
      stone: this.#drawStone,
      cloud: this.#drawCloud,
      galaxy: this.#drawGalaxy,
      plasma: this.#drawPlasma,
      electric: this.#drawElectric,
      crystal: this.#drawCrystal,
      magic: this.#drawMagic,
      rainbow: this.#drawRainbow,
      gradient: this.#drawGradient,
      mosaic: this.#drawMosaic,
      kaleidoscope: this.#drawKaleidoscope,
      mandala: this.#drawMandala,
      celtic: this.#drawCeltic,
      tribal: this.#drawTribal,
      geometric: this.#drawGeometric,
      organic: this.#drawOrganic,
      fractal: this.#drawFractal,
      impressionist: this.#drawImpressionist,
      pointillist: this.#drawPointillist,
      abstract: this.#drawAbstract,
      surreal: this.#drawSurreal,
      minimalist: this.#drawMinimalist,
      vintage: this.#drawVintage,
      grunge: this.#drawGrunge,
      digital: this.#drawDigital,
    };

    return brushes[type] || null;
  }

  /**
   * Check if brush is using placeholder implementation
   * @private
   */
  #isPlaceholderBrush(type) {
    const placeholderBrushes = [
      "splatter",
      "spray",
      "textured",
      "sketch",
      "fabric",
      "fur",
      "leaves",
      "rain",
      "snow",
      "stars",
      "hearts",
      "flowers",
      "bubbles",
      "lightning",
      "smoke",
      "grass",
      "wood",
      "metal",
      "glass",
      "water",
      "sand",
      "stone",
      "cloud",
      "galaxy",
      "plasma",
      "electric",
      "crystal",
      "magic",
      "rainbow",
      "gradient",
      "mosaic",
      "kaleidoscope",
      "mandala",
      "celtic",
      "tribal",
      "geometric",
      "organic",
      "fractal",
      "impressionist",
      "pointillist",
      "abstract",
      "surreal",
      "minimalist",
      "vintage",
      "grunge",
      "digital",
    ];
    return placeholderBrushes.includes(type);
  }

  // ===========================
  // CORE BRUSH IMPLEMENTATIONS
  // ===========================

  /**
   * Pencil brush implementation (lápiz realista)
   * @private
   */
  #drawPencil({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    this.#ctx.shadowBlur = 0; // Sin blur para lápiz definido

    // Simula presión variable del lápiz
    const pressure = 0.4 + Math.random() * 0.6;
    const baseAlpha = 0.6 + pressure * 0.3; // Más opaco que smooth
    this.#ctx.globalAlpha = baseAlpha;

    // Trazo principal fino y definido
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = Math.max(0.8, size * 0.25); // Más definido

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }

    // Textura granular compacta del grafito (sin dispersión)
    const grainCount = Math.floor(size * 0.6);
    for (let i = 0; i < grainCount; i++) {
      const grainX = x + (Math.random() - 0.5) * size * 0.3; // Menos dispersión
      const grainY = y + (Math.random() - 0.5) * size * 0.3;
      const grainSize = Math.random() * 0.6; // Granos más pequeños
      const grainAlpha = (0.2 + Math.random() * 0.3) * pressure; // Más opaco

      this.#ctx.globalAlpha = grainAlpha;
      this.#ctx.fillStyle = color;
      this.#ctx.beginPath();
      this.#ctx.arc(grainX, grainY, grainSize, 0, Math.PI * 2);
      this.#ctx.fill();
    }

    // Efecto de desgaste de la punta (trazo secundario definido)
    if (Math.random() < 0.4) {
      this.#ctx.globalAlpha = 0.25 * pressure;
      this.#ctx.lineWidth = Math.max(0.5, size * 0.12);
      this.#ctx.strokeStyle = color;

      if (lastPoint) {
        const offsetX = (Math.random() - 0.5) * size * 0.25;
        const offsetY = (Math.random() - 0.5) * size * 0.25;
        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x + offsetX, lastPoint.y + offsetY);
        this.#ctx.lineTo(x + offsetX, y + offsetY);
        this.#ctx.stroke();
      }
    }
  }

  /**
   * Basic brush implementation mejorada (línea sólida, presión simulada)
   * @private
   */
  #drawBasicBrush({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    // Simula presión: leve variación de opacidad y grosor
    const baseAlpha = 0.92 + Math.random() * 0.08;
    this.#ctx.globalAlpha = baseAlpha;
    const widthJitter = size * (0.97 + Math.random() * 0.06);
    this.#ctx.lineWidth = widthJitter;
    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    } else {
      this.#ctx.beginPath();
      this.#ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      this.#ctx.fillStyle = color;
      this.#ctx.fill();
    }
  }

  /**
   * Eraser mejorado: difuso, centro fuerte y borde suave
   * @private
   */
  #drawEraser({ x, y, lastPoint, size }) {
    this.#ctx.globalCompositeOperation = "destination-out";
    this.#ctx.lineCap = "round";
    this.#ctx.shadowColor = "#000";
    this.#ctx.shadowBlur = size * 0.7;
    this.#ctx.globalAlpha = 0.7;
    this.#ctx.lineWidth = size * 1.1;
    // Trazo principal
    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }
    // Borrado difuso extra (borde atenuado)
    this.#ctx.save();
    const grad = this.#ctx.createRadialGradient(
      x,
      y,
      size * 0.2,
      x,
      y,
      size * 0.55
    );
    grad.addColorStop(0, "rgba(0,0,0,0.7)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    this.#ctx.globalAlpha = 0.25;
    this.#ctx.globalCompositeOperation = "destination-out";
    this.#ctx.beginPath();
    this.#ctx.arc(x, y, size * 0.55, 0, Math.PI * 2);
    this.#ctx.fillStyle = grad;
    this.#ctx.fill();
    this.#ctx.restore();
  }

  /**
   * Charcoal brush with realistic texture mejorado
   * @private
   */
  #drawCharcoal({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "multiply";

    // Múltiples trazos con variación de presión y dirección
    for (let offset = 0; offset < 6; offset++) {
      const offsetDist = offset * 0.8;
      const alpha = 0.25 - offset * 0.03;
      this.#ctx.strokeStyle = ColorUtils.hexToRgba(color, alpha);
      this.#ctx.lineWidth = Math.max(1, size - offset * 1.5);
      this.#ctx.lineCap = "round";

      if (lastPoint) {
        const angle =
          Math.atan2(y - lastPoint.y, x - lastPoint.x) + Math.PI / 2;
        const offsetX = Math.cos(angle) * offsetDist;
        const offsetY = Math.sin(angle) * offsetDist;

        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x + offsetX, lastPoint.y + offsetY);
        this.#ctx.lineTo(x + offsetX, y + offsetY);
        this.#ctx.stroke();
      }
    }

    // Textura granular realista del carboncillo
    const particleCount = Math.floor(size * 0.8);
    for (let i = 0; i < particleCount; i++) {
      const grainX = x + (Math.random() - 0.5) * size * 1.5;
      const grainY = y + (Math.random() - 0.5) * size * 1.5;
      this.#ctx.globalAlpha = 0.15 + Math.random() * 0.2;
      this.#ctx.fillStyle = color;
      this.#ctx.beginPath();
      this.#ctx.arc(grainX, grainY, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
      this.#ctx.fill();
    }

    // Efecto de presión variable
    if (Math.random() < 0.4) {
      this.#ctx.globalAlpha = 0.3;
      this.#ctx.strokeStyle = color;
      this.#ctx.lineWidth = size * 0.3;
      if (lastPoint) {
        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x, lastPoint.y);
        this.#ctx.lineTo(x, y);
        this.#ctx.stroke();
      }
    }
  }

  /**
   * Chalk brush mejorado (tiza realista)
   * @private
   */
  #drawChalk({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";

    // Trazo principal seco de tiza
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size * 0.9;
    this.#ctx.globalAlpha = 0.7 + Math.random() * 0.2;

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }

    // Efecto de polvo de tiza
    const dustCount = Math.floor(size * 1.2);
    for (let i = 0; i < dustCount; i++) {
      const dustX = x + (Math.random() - 0.5) * size * 2;
      const dustY = y + (Math.random() - 0.5) * size * 2;
      const dustSize = Math.random() * 2 + 0.5;
      const dustAlpha =
        (0.1 + Math.random() * 0.15) * (0.5 + Math.random() * 0.5);

      this.#ctx.globalAlpha = dustAlpha;
      this.#ctx.fillStyle = color;
      this.#ctx.beginPath();
      this.#ctx.arc(dustX, dustY, dustSize, 0, Math.PI * 2);
      this.#ctx.fill();
    }

    // Trazos secundarios para textura
    if (Math.random() < 0.6) {
      this.#ctx.globalAlpha = 0.3;
      this.#ctx.lineWidth = size * 0.4;
      if (lastPoint) {
        const offsetX = (Math.random() - 0.5) * size * 0.8;
        const offsetY = (Math.random() - 0.5) * size * 0.8;
        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x + offsetX, lastPoint.y + offsetY);
        this.#ctx.lineTo(x + offsetX, y + offsetY);
        this.#ctx.stroke();
      }
    }
  }

  /**
   * Marker brush mejorado (marcador realista)
   * @private
   */
  #drawMarker({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";

    // Trazo principal fluido del marcador
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size * 0.8;
    this.#ctx.globalAlpha = 0.9 + Math.random() * 0.1;

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }

    // Efecto de saturación alta (marcador intenso)
    this.#ctx.globalCompositeOperation = "lighter";
    this.#ctx.globalAlpha = 0.3;
    this.#ctx.lineWidth = size * 0.6;
    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }

    // Borde definido del marcador
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.globalAlpha = 0.4;
    this.#ctx.lineWidth = size * 0.3;
    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }
  }

  /**
   * Oil brush mejorado (óleo realista)
   * @private
   */
  #drawOil({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";

    // Pinceladas gruesas de óleo
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size * 1.2;
    this.#ctx.globalAlpha = 0.8 + Math.random() * 0.2;

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }

    // Textura de óleo con pinceladas
    for (let i = 0; i < 3; i++) {
      const offsetX = (Math.random() - 0.5) * size * 0.6;
      const offsetY = (Math.random() - 0.5) * size * 0.6;
      this.#ctx.globalAlpha = 0.3 + Math.random() * 0.2;
      this.#ctx.lineWidth = size * (0.4 + Math.random() * 0.3);

      if (lastPoint) {
        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x + offsetX, lastPoint.y + offsetY);
        this.#ctx.lineTo(x + offsetX, y + offsetY);
        this.#ctx.stroke();
      }
    }

    // Efecto de mezcla de colores
    if (Math.random() < 0.3) {
      const mixedColor = ColorUtils.shadeColor(color, Math.random() * 20 - 10);
      this.#ctx.strokeStyle = mixedColor;
      this.#ctx.globalAlpha = 0.4;
      this.#ctx.lineWidth = size * 0.5;
      if (lastPoint) {
        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x, lastPoint.y);
        this.#ctx.lineTo(x, y);
        this.#ctx.stroke();
      }
    }
  }

  /**
   * Watercolor brush with bleeding effect
   * @private
   */
  #drawWatercolor({ x, y, color, size }) {
    this.#ctx.globalCompositeOperation = "multiply";

    for (let ring = 0; ring < 4; ring++) {
      const ringRadius = size * (0.7 + ring * 0.5);
      const baseAlpha = 0.18 - ring * 0.03;

      const gradient = ColorUtils.createRadialGradient(
        this.#ctx,
        x,
        y,
        ringRadius,
        color,
        [baseAlpha, 0]
      );

      this.#ctx.fillStyle = gradient;
      this.#ctx.beginPath();
      this.#ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      this.#ctx.fill();
    }
  }

  // Additional brush implementations with placeholder logic
  // (In a real implementation, each would have unique algorithms)
  #drawGlow(params) {
    const { x, y, lastPoint, color, size } = params;
    this.#ctx.globalCompositeOperation = "source-over";

    // Múltiples capas de resplandor
    const glowLayers = [
      { blur: size * 3, alpha: 0.15, width: size * 1.5 },
      { blur: size * 2, alpha: 0.25, width: size * 1.2 },
      { blur: size * 1, alpha: 0.35, width: size * 0.9 },
      { blur: size * 0.5, alpha: 0.45, width: size * 0.7 },
    ];

    glowLayers.forEach((layer) => {
      this.#ctx.shadowColor = color;
      this.#ctx.shadowBlur = layer.blur;
      this.#ctx.globalAlpha = layer.alpha;
      this.#ctx.strokeStyle = color;
      this.#ctx.lineWidth = layer.width;
      this.#ctx.lineCap = "round";
      this.#ctx.lineJoin = "round";

      if (lastPoint) {
        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x, lastPoint.y);
        this.#ctx.lineTo(x, y);
        this.#ctx.stroke();
      } else {
        this.#ctx.beginPath();
        this.#ctx.arc(x, y, layer.width / 2, 0, Math.PI * 2);
        this.#ctx.fillStyle = color;
        this.#ctx.fill();
      }
    });
  }

  #drawNeon(params) {
    const { x, y, lastPoint, color, size } = params;
    this.#ctx.globalCompositeOperation = "source-over";

    // Borde exterior brillante
    this.#ctx.shadowColor = color;
    this.#ctx.shadowBlur = size * 2;
    this.#ctx.globalAlpha = 0.8;
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size * 1.3;
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }

    // Centro brillante
    this.#ctx.shadowBlur = size * 0.5;
    this.#ctx.globalAlpha = 1;
    this.#ctx.lineWidth = size * 0.7;
    this.#ctx.strokeStyle = "#ffffff";

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    } else {
      this.#ctx.beginPath();
      this.#ctx.arc(x, y, size * 0.35, 0, Math.PI * 2);
      this.#ctx.fillStyle = "#ffffff";
      this.#ctx.fill();
    }

    // Punto central intenso
    this.#ctx.shadowBlur = 0;
    this.#ctx.globalAlpha = 0.9;
    this.#ctx.beginPath();
    this.#ctx.arc(x, y, size * 0.2, 0, Math.PI * 2);
    this.#ctx.fillStyle = color;
    this.#ctx.fill();
  }
  #drawFire({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "lighter";

    // Llamas principales con gradientes
    const flameColors = ["#FF4500", "#FF8C00", "#FFD700", "#FFFF00"];
    const flameCount = Math.floor(size / 3);

    for (let i = 0; i < flameCount; i++) {
      const flameX = x + (Math.random() - 0.5) * size * 0.8;
      const flameY = y + (Math.random() - 0.5) * size * 0.8;
      const flameSize = size * (0.3 + Math.random() * 0.4);
      const flameColor =
        flameColors[Math.floor(Math.random() * flameColors.length)];

      // Gradiente radial para la llama
      const gradient = this.#ctx.createRadialGradient(
        flameX,
        flameY,
        0,
        flameX,
        flameY,
        flameSize
      );
      gradient.addColorStop(0, flameColor);
      gradient.addColorStop(0.7, ColorUtils.hexToRgba(flameColor, 0.6));
      gradient.addColorStop(1, "transparent");

      this.#ctx.fillStyle = gradient;
      this.#ctx.globalAlpha = 0.8 + Math.random() * 0.2;
      this.#ctx.beginPath();
      this.#ctx.arc(flameX, flameY, flameSize, 0, Math.PI * 2);
      this.#ctx.fill();
    }

    // Partículas de fuego
    const particleCount = Math.floor(size * 0.8);
    for (let i = 0; i < particleCount; i++) {
      const particleX = x + (Math.random() - 0.5) * size * 1.5;
      const particleY = y + (Math.random() - 0.5) * size * 1.5;
      const particleSize = Math.random() * 3 + 1;
      const particleColor =
        flameColors[Math.floor(Math.random() * flameColors.length)];

      this.#ctx.fillStyle = particleColor;
      this.#ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      this.#ctx.beginPath();
      this.#ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      this.#ctx.fill();
    }

    // Efecto de calor (glow)
    this.#ctx.shadowColor = "#FF4500";
    this.#ctx.shadowBlur = size * 1.5;
    this.#ctx.globalAlpha = 0.3;
    this.#ctx.fillStyle = "#FF4500";
    this.#ctx.beginPath();
    this.#ctx.arc(x, y, size * 0.8, 0, Math.PI * 2);
    this.#ctx.fill();
    this.#ctx.shadowBlur = 0;
  }
  #drawPixel({ x, y, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.imageSmoothingEnabled = false; // Desactivar anti-aliasing

    const pixelSize = Math.max(2, Math.floor(size / 4));
    const gridX = Math.floor(x / pixelSize) * pixelSize;
    const gridY = Math.floor(y / pixelSize) * pixelSize;

    // Píxel principal
    this.#ctx.fillStyle = color;
    this.#ctx.globalAlpha = 1;
    this.#ctx.fillRect(gridX, gridY, pixelSize, pixelSize);

    // Píxeles adyacentes para efecto de grosor
    const adjacentPixels = Math.floor(size / pixelSize / 2);
    for (let i = -adjacentPixels; i <= adjacentPixels; i++) {
      for (let j = -adjacentPixels; j <= adjacentPixels; j++) {
        if (Math.random() < 0.3) {
          const px = gridX + i * pixelSize;
          const py = gridY + j * pixelSize;
          this.#ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          this.#ctx.fillRect(px, py, pixelSize, pixelSize);
        }
      }
    }

    this.#ctx.imageSmoothingEnabled = true; // Reactivar anti-aliasing
  }
  #drawDots({ x, y, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";

    // Puntos principales con variación de tamaño
    const dotCount = Math.floor(size * 1.5);
    for (let i = 0; i < dotCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * size * 0.8;
      const dotX = x + Math.cos(angle) * radius;
      const dotY = y + Math.sin(angle) * radius;
      const dotSize = Math.max(1, size * (0.1 + Math.random() * 0.2));
      const dotAlpha = 0.6 + Math.random() * 0.4;

      this.#ctx.globalAlpha = dotAlpha;
      this.#ctx.fillStyle = color;
      this.#ctx.beginPath();
      this.#ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
      this.#ctx.fill();
    }

    // Puntos secundarios para densidad
    if (Math.random() < 0.7) {
      const extraDots = Math.floor(size * 0.8);
      for (let i = 0; i < extraDots; i++) {
        const dotX = x + (Math.random() - 0.5) * size * 1.2;
        const dotY = y + (Math.random() - 0.5) * size * 1.2;
        const dotSize = Math.max(0.5, size * (0.05 + Math.random() * 0.1));
        this.#ctx.globalAlpha = 0.4 + Math.random() * 0.3;
        this.#ctx.fillStyle = color;
        this.#ctx.beginPath();
        this.#ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
        this.#ctx.fill();
      }
    }
  }

  /**
   * Lines brush mejorado (grabado cruzado)
   * @private
   */
  #drawLines({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";

    // Líneas principales en múltiples direcciones
    const lineDirections = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];

    lineDirections.forEach((angle, index) => {
      this.#ctx.strokeStyle = color;
      this.#ctx.lineWidth = Math.max(1, size * (0.3 - index * 0.05));
      this.#ctx.globalAlpha = 0.6 + Math.random() * 0.3;

      const length = size * 0.8;
      const startX = x - (Math.cos(angle) * length) / 2;
      const startY = y - (Math.sin(angle) * length) / 2;
      const endX = x + (Math.cos(angle) * length) / 2;
      const endY = y + (Math.sin(angle) * length) / 2;

      this.#ctx.beginPath();
      this.#ctx.moveTo(startX, startY);
      this.#ctx.lineTo(endX, endY);
      this.#ctx.stroke();
    });

    // Líneas adicionales aleatorias
    if (Math.random() < 0.5) {
      const extraLines = Math.floor(size / 3);
      for (let i = 0; i < extraLines; i++) {
        const angle = Math.random() * Math.PI * 2;
        const length = size * (0.3 + Math.random() * 0.4);
        const startX = x - (Math.cos(angle) * length) / 2;
        const startY = y - (Math.sin(angle) * length) / 2;
        const endX = x + (Math.cos(angle) * length) / 2;
        const endY = y + (Math.sin(angle) * length) / 2;

        this.#ctx.strokeStyle = color;
        this.#ctx.lineWidth = Math.max(0.5, size * 0.15);
        this.#ctx.globalAlpha = 0.3 + Math.random() * 0.3;
        this.#ctx.beginPath();
        this.#ctx.moveTo(startX, startY);
        this.#ctx.lineTo(endX, endY);
        this.#ctx.stroke();
      }
    }
  }

  // Extended brush placeholders (would implement unique algorithms in production)
  #drawSplatter({ x, y, color, size }) {
    this.#drawDots({ x, y, color, size });
  }
  #drawSpray({ x, y, color, size }) {
    this.#drawDots({ x, y, color, size });
  }
  #drawTextured({ x, y, color, size }) {
    this.#drawCharcoal({ x, y, color, size });
  }
  #drawSketch({ x, y, color, size }) {
    this.#drawLines({ x, y, color, size });
  }
  #drawFabric({ x, y, color, size }) {
    this.#drawTextured({ x, y, color, size });
  }
  #drawFur({ x, y, color, size }) {
    this.#drawLines({ x, y, color, size });
  }
  #drawLeaves({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawRain({ x, y, color, size }) {
    this.#drawLines({ x, y, color, size });
  }
  #drawSnow({ x, y, color, size }) {
    this.#drawDots({ x, y, color, size });
  }
  #drawStars({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawHearts({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawFlowers({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawBubbles({ x, y, color, size }) {
    this.#drawDots({ x, y, color, size });
  }
  #drawLightning({ x, y, lastPoint, color, size }) {
    // Rayo zig-zag
    if (lastPoint) {
      const x1 = lastPoint.x;
      const y1 = lastPoint.y;
      const x2 = x;
      const y2 = y;
      const steps = 8;
      this.#ctx.save();
      this.#ctx.globalCompositeOperation = "lighter";
      for (let j = 0; j < 2; j++) {
        this.#ctx.beginPath();
        this.#ctx.moveTo(x1, y1);
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 12;
          const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 12;
          this.#ctx.lineTo(nx, ny);
        }
        this.#ctx.lineTo(x2, y2);
        this.#ctx.strokeStyle = j === 0 ? "#fff" : "yellow";
        this.#ctx.lineWidth = j === 0 ? size * 1.2 : size * 0.7;
        this.#ctx.shadowColor = "yellow";
        this.#ctx.shadowBlur = 8;
        this.#ctx.globalAlpha = j === 0 ? 0.7 : 0.5;
        this.#ctx.stroke();
      }
      this.#ctx.restore();
    }
  }
  #drawSmoke({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawGrass({ x, y, color, size }) {
    this.#drawLines({ x, y, color, size });
  }
  #drawWood({ x, y, color, size }) {
    this.#drawLines({ x, y, color, size });
  }
  #drawMetal({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawGlass({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawWater({ x, y, color, size }) {
    this.#drawWatercolor({ x, y, color, size });
  }
  #drawSand({ x, y, color, size }) {
    this.#drawDots({ x, y, color, size });
  }
  #drawStone({ x, y, color, size }) {
    this.#drawCharcoal({ x, y, color, size });
  }
  #drawCloud({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawGalaxy({ x, y, color, size }) {
    this.#drawGlow({ x, y, color, size });
  }
  #drawPlasma({ x, y, color, size }) {
    this.#drawGlow({ x, y, color, size });
  }
  #drawElectric({ x, y, color, size }) {
    this.#drawNeon({ x, y, color, size });
  }
  #drawCrystal({ x, y, color, size }) {
    this.#drawPixel({ x, y, color, size });
  }
  #drawMagic({ x, y, color, size }) {
    this.#drawGlow({ x, y, color, size });
  }
  #drawRainbow({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawGradient({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawMosaic({ x, y, color, size }) {
    this.#drawPixel({ x, y, color, size });
  }
  #drawKaleidoscope({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawMandala({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawCeltic({ x, y, color, size }) {
    this.#drawLines({ x, y, color, size });
  }
  #drawTribal({ x, y, color, size }) {
    this.#drawLines({ x, y, color, size });
  }
  #drawGeometric({ x, y, color, size }) {
    this.#drawPixel({ x, y, color, size });
  }
  #drawOrganic({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawFractal({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawImpressionist({ x, y, color, size }) {
    this.#drawDots({ x, y, color, size });
  }
  #drawPointillist({ x, y, color, size }) {
    this.#drawDots({ x, y, color, size });
  }
  #drawAbstract({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawSurreal({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawMinimalist({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }
  #drawVintage({ x, y, color, size }) {
    this.#drawCharcoal({ x, y, color, size });
  }
  #drawGrunge({ x, y, color, size }) {
    this.#drawCharcoal({ x, y, color, size });
  }
  #drawDigital({ x, y, color, size }) {
    this.#drawPixel({ x, y, color, size });
  }

  // ===========================
  // NEW BRUSH IMPLEMENTATIONS
  // ===========================

  // Basic brushes
  #drawShadow({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "lighter";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size;
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    this.#ctx.shadowColor = color;
    this.#ctx.shadowBlur = size * 2.5;
    this.#ctx.globalAlpha = 0.85;

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }

    this.#ctx.shadowBlur = 0;
    this.#ctx.globalAlpha = 1;
    this.#ctx.globalCompositeOperation = "source-over";
  }

  // Artistic brushes
  #drawPen({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size * (0.7 + Math.random() * 0.6);
    this.#ctx.lineCap = "round";
    this.#ctx.globalAlpha = 1;

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }
  }

  #drawPen2({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size * 0.7;
    this.#ctx.lineCap = "round";
    this.#ctx.globalAlpha = 1;

    if (lastPoint) {
      for (let i = 0; i < 3; i++) {
        const offsetX = (Math.random() - 0.5) * size * 0.7;
        const offsetY = (Math.random() - 0.5) * size * 0.7;
        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x + offsetX, lastPoint.y + offsetY);
        this.#ctx.lineTo(x + offsetX, y + offsetY);
        this.#ctx.stroke();
      }
    }
  }

  #drawThick({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = Math.max(2, size * 0.8);
    this.#ctx.globalAlpha = 0.7;

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }
  }

  #drawSliced({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "butt";
    this.#ctx.lineJoin = "miter";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = Math.max(1, size * 0.4);
    this.#ctx.globalAlpha = 0.8;

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }
  }

  #drawMulti({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineCap = "round";
    const numLines = 7;

    if (lastPoint) {
      for (let i = 0; i < numLines; i++) {
        // Offset aleatorio para cada línea
        const offsetX = (Math.random() - 0.5) * size * 1.5;
        const offsetY = (Math.random() - 0.5) * size * 1.5;
        this.#ctx.globalAlpha = 0.18 + Math.random() * 0.32;
        this.#ctx.lineWidth = size * (0.25 + Math.random() * 0.25);
        // Variar longitud (simula líneas más cortas/largas)
        const t1 = Math.random() * 0.2;
        const t2 = 0.8 + Math.random() * 0.2;
        this.#ctx.beginPath();
        this.#ctx.moveTo(
          lastPoint.x + offsetX * (1 - t1),
          lastPoint.y + offsetY * (1 - t1)
        );
        this.#ctx.lineTo(x + offsetX * (1 - t2), y + offsetY * (1 - t2));
        this.#ctx.stroke();
      }
      // Líneas cruzadas (diagonales)
      for (let i = 0; i < 3; i++) {
        const angle = Math.PI / 4 + ((Math.random() - 0.5) * Math.PI) / 2;
        const length = size * (2 + Math.random() * 2);
        this.#ctx.globalAlpha = 0.12 + Math.random() * 0.18;
        this.#ctx.lineWidth = size * (0.18 + Math.random() * 0.18);
        this.#ctx.beginPath();
        const midX = (lastPoint.x + x) / 2;
        const midY = (lastPoint.y + y) / 2;
        this.#ctx.moveTo(
          midX - (Math.cos(angle) * length) / 2,
          midY - (Math.sin(angle) * length) / 2
        );
        this.#ctx.lineTo(
          midX + (Math.cos(angle) * length) / 2,
          midY + (Math.sin(angle) * length) / 2
        );
        this.#ctx.stroke();
      }
    }
    this.#ctx.globalAlpha = 1;
  }

  #drawMultiOpacity({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    const numLines = 5;

    if (lastPoint) {
      for (let i = 0; i < numLines; i++) {
        const offsetX = (Math.random() - 0.5) * size * 1.1;
        const offsetY = (Math.random() - 0.5) * size * 1.1;
        this.#ctx.globalAlpha = 1 - i * 0.18 - Math.random() * 0.12;
        this.#ctx.lineWidth = size * (0.7 - i * 0.12 + Math.random() * 0.08);
        // Variar longitud de la línea
        const t1 = Math.random() * 0.15;
        const t2 = 0.85 + Math.random() * 0.15;
        this.#ctx.beginPath();
        this.#ctx.moveTo(
          lastPoint.x + offsetX * (1 - t1),
          lastPoint.y + offsetY * (1 - t1)
        );
        this.#ctx.lineTo(x + offsetX * (1 - t2), y + offsetY * (1 - t2));
        this.#ctx.stroke();
      }
    }
    this.#ctx.globalAlpha = 1;
  }

  #drawBeads({ x, y, lastPoint, color, size }) {
    if (lastPoint) {
      const x1 = lastPoint.x;
      const y1 = lastPoint.y;
      const x2 = x;
      const y2 = y;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const beadSize = Math.max(2, distance * 0.3);

      this.#ctx.fillStyle = color;
      this.#ctx.globalAlpha = 0.8;
      this.#ctx.beginPath();
      this.#ctx.arc(midX, midY, beadSize, 0, Math.PI * 2);
      this.#ctx.fill();
      this.#ctx.globalAlpha = 1;
    }
  }

  #drawWiggle({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = Math.max(1, size * 0.3);
    this.#ctx.globalAlpha = 0.8;

    if (lastPoint) {
      const points = 10;
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);

      for (let i = 1; i <= points; i++) {
        const t = i / points;
        const wiggleX =
          lastPoint.x + (x - lastPoint.x) * t + Math.sin(t * Math.PI * 3) * 3;
        const wiggleY =
          lastPoint.y + (y - lastPoint.y) * t + Math.cos(t * Math.PI * 2) * 2;
        this.#ctx.lineTo(wiggleX, wiggleY);
      }

      this.#ctx.stroke();
    }
  }

  // Stamp brushes
  #drawStampCircle({ x, y, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.fillStyle = color;
    this.#ctx.globalAlpha = 0.8;
    this.#ctx.beginPath();
    this.#ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    this.#ctx.fill();
  }

  #drawStampStar({ x, y, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.fillStyle = color;
    this.#ctx.globalAlpha = 0.8;

    const points = 5;
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.2;

    this.#ctx.beginPath();
    this.#ctx.moveTo(x, y - outerRadius);

    for (let i = 0; i < points * 2; i++) {
      const angle = (Math.PI / points) * i;
      const r = i % 2 === 0 ? outerRadius : innerRadius;
      this.#ctx.lineTo(x + Math.sin(angle) * r, y - Math.cos(angle) * r);
    }

    this.#ctx.closePath();
    this.#ctx.fill();
  }

  // Pattern brushes
  #drawPatternDots({ x, y, color, size }) {
    this.#drawDots({ x, y, color, size });
  }

  #drawPatternLines({ x, y, color, size }) {
    this.#drawLines({ x, y, color, size });
  }

  #drawPatternRainbow({ x, y, color, size }) {
    const colors = [
      "#FF0000",
      "#FF7F00",
      "#FFFF00",
      "#00FF00",
      "#0000FF",
      "#4B0082",
      "#9400D3",
    ];
    const colorIndex = Math.floor(Math.random() * colors.length);
    this.#drawBasicBrush({ x, y, color: colors[colorIndex], size });
  }

  #drawPatternImage({ x, y, color, size }) {
    this.#drawBasicBrush({ x, y, color, size });
  }

  // Spray brushes
  #drawAerosol({ x, y, color, size }) {
    this.#drawSpray({ x, y, color, size });
  }

  #drawSprayTime({ x, y, color, size }) {
    this.#drawSpray({ x, y, color, size });
  }

  #drawSpraySpeed({ x, y, color, size }) {
    this.#drawSpray({ x, y, color, size });
  }

  // Sketch/Harmony brushes
  #drawSketchy({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = Math.max(0.5, size * 0.2);
    this.#ctx.globalAlpha = 0.6;

    if (lastPoint) {
      const segments = 3;
      for (let i = 0; i < segments; i++) {
        const t1 = i / segments;
        const t2 = (i + 1) / segments;
        const x1 = lastPoint.x + (x - lastPoint.x) * t1;
        const y1 = lastPoint.y + (y - lastPoint.y) * t1;
        const x2 = lastPoint.x + (x - lastPoint.x) * t2;
        const y2 = lastPoint.y + (y - lastPoint.y) * t2;

        this.#ctx.beginPath();
        this.#ctx.moveTo(x1, y1);
        this.#ctx.lineTo(x2, y2);
        this.#ctx.stroke();
      }
    }
  }

  #drawNeighbor({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = Math.max(1, size * 0.3);
    this.#ctx.globalAlpha = 0.7;

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();

      // Línea vecina
      this.#ctx.globalAlpha = 0.4;
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x + 2, lastPoint.y + 2);
      this.#ctx.lineTo(x + 2, y + 2);
      this.#ctx.stroke();
    }
  }

  #drawFurNeighbor({ x, y, lastPoint, color, size }) {
    this.#drawFur({ x, y, lastPoint, color, size });
  }

  // Special brushes
  #drawRainbowDynamic({ x, y, lastPoint, color, size }) {
    const hue = (Date.now() / 10) % 360;
    this.#ctx.strokeStyle = `hsl(${hue}, 70%, 50%)`;
    this.#ctx.lineWidth = size;
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }
  }

  #drawConfetti({ x, y, color, size }) {
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * size * 2;
      const offsetY = (Math.random() - 0.5) * size * 2;
      this.#ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
      this.#ctx.fillRect(x + offsetX, y + offsetY, 2, 2);
    }
  }

  #drawShootingStar({ x, y, lastPoint, color, size }) {
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * size * 2;
      const offsetY = (Math.random() - 0.5) * size * 2;
      this.#ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
      this.#ctx.fillRect(x + offsetX, y + offsetY, 2, 2);
    }
  }

  #drawGlitch({ x, y, lastPoint, color, size }) {
    // Línea principal
    this.#ctx.save();
    this.#ctx.globalCompositeOperation = "lighter";

    if (lastPoint) {
      for (let i = 0; i < 3; i++) {
        const offset = (i - 1) * 2;
        this.#ctx.strokeStyle = ["#f00", "#0ff", "#fff"][i];
        this.#ctx.lineWidth = size + (i === 1 ? 2 : 0);
        this.#ctx.beginPath();
        this.#ctx.moveTo(lastPoint.x + offset, lastPoint.y + offset);
        this.#ctx.lineTo(x + offset, y + offset);
        this.#ctx.stroke();
      }
      // Saltos aleatorios
      for (let i = 0; i < 4; i++) {
        this.#ctx.strokeStyle = "#fff";
        this.#ctx.lineWidth = size * 0.7;
        const t = Math.random();
        const x1 =
          lastPoint.x + (x - lastPoint.x) * t + (Math.random() - 0.5) * 8;
        const y1 =
          lastPoint.y + (y - lastPoint.y) * t + (Math.random() - 0.5) * 8;
        const x2 = x1 + (Math.random() - 0.5) * 16;
        const y2 = y1 + (Math.random() - 0.5) * 16;
        this.#ctx.beginPath();
        this.#ctx.moveTo(x1, y1);
        this.#ctx.lineTo(x2, y2);
        this.#ctx.stroke();
      }
    }
    this.#ctx.restore();
  }

  #drawHeartSpray({ x, y, color, size }) {
    // Spray de corazones
    for (let i = 0; i < size * 1.2; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * size * 1.5;
      const heartX = x + Math.cos(angle) * radius;
      const heartY = y + Math.sin(angle) * radius;
      this.#ctx.save();
      this.#ctx.translate(heartX, heartY);
      this.#ctx.rotate(angle);
      this.#ctx.scale(0.7 + Math.random() * 0.7, 0.7 + Math.random() * 0.7);
      this.#ctx.beginPath();
      this.#ctx.moveTo(0, 0);
      this.#ctx.bezierCurveTo(
        0,
        -size * 0.4,
        -size * 0.5,
        -size * 0.4,
        -size * 0.5,
        0
      );
      this.#ctx.bezierCurveTo(
        -size * 0.5,
        size * 0.5,
        0,
        size * 0.7,
        0,
        size * 1.1
      );
      this.#ctx.bezierCurveTo(
        0,
        size * 0.7,
        size * 0.5,
        size * 0.5,
        size * 0.5,
        0
      );
      this.#ctx.bezierCurveTo(size * 0.5, -size * 0.4, 0, -size * 0.4, 0, 0);
      this.#ctx.closePath();
      this.#ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 60%)`;
      this.#ctx.globalAlpha = 0.7 + Math.random() * 0.3;
      this.#ctx.fill();
      this.#ctx.restore();
    }
  }

  #drawBubble({ x, y, color, size }) {
    // Burbujas translúcidas
    for (let i = 0; i < size * 1.2; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * size * 1.5;
      const bubbleX = x + Math.cos(angle) * radius;
      const bubbleY = y + Math.sin(angle) * radius;
      this.#ctx.beginPath();
      this.#ctx.arc(
        bubbleX,
        bubbleY,
        Math.max(3, size * 0.5 + Math.random() * size * 0.5),
        0,
        Math.PI * 2
      );
      this.#ctx.globalAlpha = 0.18 + Math.random() * 0.22;
      this.#ctx.fillStyle = `rgba(180,220,255,0.5)`;
      this.#ctx.fill();
      // Reflejo
      this.#ctx.globalAlpha = 0.12;
      this.#ctx.beginPath();
      this.#ctx.arc(
        bubbleX - size * 0.2,
        bubbleY - size * 0.2,
        Math.max(1, size * 0.18),
        0,
        Math.PI * 2
      );
      this.#ctx.fillStyle = "#fff";
      this.#ctx.fill();
    }
    this.#ctx.globalAlpha = 1;
  }

  #drawRibbon({ x, y, lastPoint, color, size }) {
    // Cinta ondulante
    if (lastPoint) {
      const x1 = lastPoint.x;
      const y1 = lastPoint.y;
      const x2 = x;
      const y2 = y;
      const steps = 16;
      this.#ctx.save();
      this.#ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const angle = Math.PI * 2 * t * 2 + Date.now() / 200;
        const r = Math.sin(angle) * size * 0.7;
        const ribbonX = x1 + (x2 - x1) * t + Math.cos(angle) * r;
        const ribbonY = y1 + (y2 - y1) * t + Math.sin(angle) * r;
        if (i === 0) this.#ctx.moveTo(ribbonX, ribbonY);
        else this.#ctx.lineTo(ribbonX, ribbonY);
      }
      this.#ctx.strokeStyle = color;
      this.#ctx.lineWidth = size * 0.9;
      this.#ctx.globalAlpha = 0.7;
      this.#ctx.stroke();
      this.#ctx.globalAlpha = 1;
      this.#ctx.restore();
    }
  }

  #drawFireRealistic({ x, y, color, size }) {
    // Llama realista
    for (let i = 0; i < 3; i++) {
      const flameColor = [
        "rgba(255, 200, 0, 0.18)",
        "rgba(255, 100, 0, 0.13)",
        "rgba(255, 255, 255, 0.08)",
      ][i];
      const flameSize = size * (1.2 + i * 0.5);
      this.#ctx.beginPath();
      this.#ctx.ellipse(
        x,
        y,
        flameSize,
        flameSize * (1.2 + Math.random() * 0.5),
        0,
        0,
        Math.PI * 2
      );
      this.#ctx.fillStyle = flameColor;
      this.#ctx.fill();
    }
    // Chispas
    for (let i = 0; i < Math.floor(size / 2); i++) {
      this.#ctx.globalAlpha = 0.7;
      this.#ctx.fillStyle = "yellow";
      this.#ctx.beginPath();
      this.#ctx.arc(
        x + (Math.random() - 0.5) * size * 2,
        y - Math.random() * size * 2,
        Math.random() * 2 + 1,
        0,
        Math.PI * 2
      );
      this.#ctx.fill();
    }
    this.#ctx.globalAlpha = 1;
  }

  #drawParticles({ x, y, color, size }) {
    // Partículas de colores
    for (let i = 0; i < size * 2; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * size * 1.2;
      const particleX = x + Math.cos(angle) * radius;
      const particleY = y + Math.sin(angle) * radius;
      this.#ctx.beginPath();
      this.#ctx.arc(
        particleX,
        particleY,
        Math.max(1, size * 0.18),
        0,
        Math.PI * 2
      );
      this.#ctx.globalAlpha = 0.5 + Math.random() * 0.5;
      this.#ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 60%)`;
      this.#ctx.fill();
    }
    this.#ctx.globalAlpha = 1;
  }
}

// ===========================
// LEGACY COMPATIBILITY LAYER
// ===========================

/**
 * Legacy compatibility functions for backward compatibility
 * @deprecated Use new class-based API instead
 */

export const drawAt = (x, y, canvas, ctx, type, color, size, lastPoint) => {
  console.warn("drawAt function is deprecated. Use BrushEngine class instead.");

  const engine = new BrushEngine(canvas);
  engine.configure({ type, color, size });
  return engine.draw({ x, y }, lastPoint);
};

export const hexToRgb = (hex) => {
  console.warn(
    "hexToRgb function is deprecated. Use ColorUtils.hexToRgb instead."
  );
  return ColorUtils.hexToRgb(hex);
};

export const hexToRgba = (hex, alpha) => {
  console.warn(
    "hexToRgba function is deprecated. Use ColorUtils.hexToRgba instead."
  );
  return ColorUtils.hexToRgba(hex, alpha);
};

export const clearCanvas = (canvas, backgroundColor) => {
  console.warn(
    "clearCanvas function is deprecated. Use CanvasUtils.clear instead."
  );
  return CanvasUtils.clear(canvas, backgroundColor);
};

export const saveCanvasToHistory = (canvas, history, historyIndex) => {
  console.warn(
    "saveCanvasToHistory function is deprecated. Use HistoryManager class instead."
  );

  try {
    const newHistory = [...history, canvas.toDataURL()];
    return {
      newHistory,
      newIndex: newHistory.length - 1,
    };
  } catch (e) {
    console.error("Error saving canvas to history:", e);
    return { newHistory: history, newIndex: historyIndex };
  }
};

export const undoCanvas = (canvas, history, historyIndex) => {
  console.warn(
    "undoCanvas function is deprecated. Use HistoryManager class instead."
  );

  if (historyIndex > 0) {
    const newIndex = historyIndex - 1;
    const ctx = CanvasUtils.getContext(canvas);
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    img.src = history[newIndex];

    return {
      newHistory: history,
      newIndex,
    };
  }

  return { newHistory: history, newIndex: historyIndex };
};

export const redoCanvas = (canvas, history, historyIndex) => {
  console.warn(
    "redoCanvas function is deprecated. Use HistoryManager class instead."
  );

  if (historyIndex < history.length - 1) {
    const newIndex = historyIndex + 1;
    const ctx = CanvasUtils.getContext(canvas);
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };

    img.src = history[newIndex];

    return {
      newHistory: history,
      newIndex,
    };
  }

  return { newHistory: history, newIndex: historyIndex };
};

export const resetCanvasContext = (ctx) => {
  console.warn(
    "resetCanvasContext function is deprecated. Use CanvasUtils.resetContext instead."
  );
  return CanvasUtils.resetContext(ctx);
};

/**
 * Star drawing utility function
 */
export const drawStar = (
  ctx,
  x,
  y,
  outerRadius,
  innerRadius,
  points,
  color
) => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - outerRadius);

  for (let i = 0; i < points * 2; i++) {
    const angle = (Math.PI / points) * i;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    ctx.lineTo(x + Math.sin(angle) * r, y - Math.cos(angle) * r);
  }

  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
};

// ===========================
// CONSTANTS & CONFIGURATIONS
// ===========================

export const BRUSH_TYPES = {
  // Basic brushes
  BRUSH: "brush",
  ERASER: "eraser",
  PENCIL: "pencil",

  // Artistic brushes
  CARBONCILLO: "carboncillo",
  ACUARELA: "acuarela",
  TIZA: "tiza",
  MARCADOR: "marcador",
  OLEO: "oleo",

  // Effect brushes
  GLOW: "glow",
  NEON: "neon",
  FUEGO: "fuego",

  // Pattern brushes
  PIXEL: "pixel",
  PUNTOS: "puntos",
  LINEAS: "lineas",

  // Extended brushes (33 additional from CrearObraModal.jsx)
  SPLATTER: "splatter",
  SPRAY: "spray",
  TEXTURED: "textured",
  SKETCH: "sketch",
  FABRIC: "fabric",
  FUR: "fur",
  LEAVES: "leaves",
  RAIN: "rain",
  SNOW: "snow",
  STARS: "stars",
  HEARTS: "hearts",
  FLOWERS: "flowers",
  BUBBLES: "bubbles",
  LIGHTNING: "lightning",
  SMOKE: "smoke",
  GRASS: "grass",
  WOOD: "wood",
  METAL: "metal",
  GLASS: "glass",
  WATER: "water",
  SAND: "sand",
  STONE: "stone",
  CLOUD: "cloud",
  GALAXY: "galaxy",
  PLASMA: "plasma",
  ELECTRIC: "electric",
  CRYSTAL: "crystal",
  MAGIC: "magic",
  RAINBOW: "rainbow",
  GRADIENT: "gradient",
  MOSAIC: "mosaic",
  KALEIDOSCOPE: "kaleidoscope",
  MANDALA: "mandala",
  CELTIC: "celtic",
  TRIBAL: "tribal",
  GEOMETRIC: "geometric",
  ORGANIC: "organic",
  FRACTAL: "fractal",
  IMPRESSIONIST: "impressionist",
  POINTILLIST: "pointillist",
  ABSTRACT: "abstract",
  SURREAL: "surreal",
  MINIMALIST: "minimalist",
  VINTAGE: "vintage",
  GRUNGE: "grunge",
  DIGITAL: "digital",
};

export const BRUSH_CONFIGS = [
  // Pinceles básicos
  { type: "pencil", name: "Lápiz", icon: "Pencil", category: "basic" },
  { type: "shadow", name: "Sombra", icon: "Brush", category: "basic" },
  { type: "brush", name: "Pincel", icon: "Brush", category: "basic" },
  { type: "eraser", name: "Borrador", icon: "Eraser", category: "basic" },

  // Pinceles artísticos
  { type: "pen", name: "Pluma", icon: "Brush", category: "artistic" },
  { type: "pen2", name: "Pluma Doble", icon: "Brush", category: "artistic" },
  { type: "thick", name: "Pincel Grueso", icon: "Brush", category: "artistic" },
  {
    type: "sliced",
    name: "Pincel Cortado",
    icon: "Brush",
    category: "artistic",
  },
  { type: "multi", name: "Multi-línea", icon: "Brush", category: "artistic" },
  {
    type: "multi_opacity",
    name: "Multi-opacidad",
    icon: "Brush",
    category: "artistic",
  },
  {
    type: "carboncillo",
    name: "Carboncillo",
    icon: "Brush",
    category: "artistic",
  },
  {
    type: "acuarela",
    name: "Acuarela",
    icon: "Droplets",
    category: "artistic",
  },
  { type: "tiza", name: "Tiza", icon: "Minus", category: "artistic" },
  { type: "marcador", name: "Marcador", icon: "Brush", category: "artistic" },
  { type: "oleo", name: "Óleo", icon: "Brush", category: "artistic" },
  { type: "pixel", name: "Pixel", icon: "Grid3X3", category: "artistic" },
  { type: "neon", name: "Neón", icon: "Zap", category: "artistic" },
  {
    type: "puntos",
    name: "Puntillismo",
    icon: "MoreHorizontal",
    category: "artistic",
  },
  { type: "lineas", name: "Líneas", icon: "Minus", category: "artistic" },
  { type: "fuego", name: "Fuego", icon: "Flame", category: "artistic" },
  { type: "beads", name: "Cuentas", icon: "Circle", category: "artistic" },
  { type: "wiggle", name: "Ondulado", icon: "Brush", category: "artistic" },

  // Pinceles de estampado
  {
    type: "stamp_circle",
    name: "Estampado Círculo",
    icon: "Circle",
    category: "stamp",
  },
  {
    type: "stamp_star",
    name: "Estampado Estrella",
    icon: "Sparkles",
    category: "stamp",
  },

  // Pinceles de patrón
  {
    type: "pattern_dots",
    name: "Patrón Puntos",
    icon: "MoreHorizontal",
    category: "pattern",
  },
  {
    type: "pattern_lines",
    name: "Patrón Líneas",
    icon: "Minus",
    category: "pattern",
  },
  {
    type: "pattern_rainbow",
    name: "Patrón Arcoíris",
    icon: "Circle",
    category: "pattern",
  },
  {
    type: "pattern_image",
    name: "Patrón Imagen",
    icon: "Square",
    category: "pattern",
  },

  // Pinceles de spray
  { type: "aerosol", name: "Aerosol", icon: "Circle", category: "spray" },
  { type: "spray", name: "Spray", icon: "Circle", category: "spray" },
  {
    type: "spray_time",
    name: "Spray Tiempo",
    icon: "Circle",
    category: "spray",
  },
  {
    type: "spray_speed",
    name: "Spray Velocidad",
    icon: "Circle",
    category: "spray",
  },

  // Pinceles de sketch/harmony
  { type: "sketchy", name: "Boceto", icon: "Brush", category: "sketch" },
  { type: "neighbor", name: "Vecino", icon: "Brush", category: "sketch" },
  {
    type: "fur_neighbor",
    name: "Vecino Peludo",
    icon: "Brush",
    category: "sketch",
  },

  // Pinceles especiales
  {
    type: "rainbow_dynamic",
    name: "Arcoíris Dinámico",
    icon: "Circle",
    category: "special",
  },
  { type: "confetti", name: "Confeti", icon: "Circle", category: "special" },
  {
    type: "shooting_star",
    name: "Estrella Fugaz",
    icon: "Sparkles",
    category: "special",
  },
  { type: "glitch", name: "Glitch", icon: "Grid3X3", category: "special" },
  {
    type: "heart_spray",
    name: "Spray Corazones",
    icon: "Circle",
    category: "special",
  },
  { type: "lightning", name: "Rayo", icon: "Zap", category: "special" },
  { type: "bubble", name: "Burbuja", icon: "Circle", category: "special" },
  { type: "ribbon", name: "Cinta", icon: "Brush", category: "special" },
  {
    type: "fire_realistic",
    name: "Fuego Realista",
    icon: "Flame",
    category: "special",
  },
  {
    type: "particles",
    name: "Partículas",
    icon: "Circle",
    category: "special",
  },

  // Pinceles adicionales del sistema anterior (mantener compatibilidad)
  { type: "glow", name: "Resplandor", icon: "Sparkles", category: "effects" },
  {
    type: "splatter",
    name: "Salpicadura",
    icon: "Droplets",
    category: "stamp",
  },
  { type: "textured", name: "Texturado", icon: "Square", category: "stamp" },
  { type: "sketch", name: "Boceto", icon: "Brush", category: "stamp" },
  { type: "fabric", name: "Tela", icon: "Square", category: "stamp" },
  { type: "fur", name: "Pelaje", icon: "Brush", category: "stamp" },
  { type: "leaves", name: "Hojas", icon: "Brush", category: "stamp" },
  { type: "rain", name: "Lluvia", icon: "Droplets", category: "stamp" },
  { type: "snow", name: "Nieve", icon: "Circle", category: "stamp" },
  { type: "stars", name: "Estrellas", icon: "Sparkles", category: "stamp" },
  { type: "hearts", name: "Corazones", icon: "Circle", category: "stamp" },
  { type: "flowers", name: "Flores", icon: "Circle", category: "stamp" },
  { type: "bubbles", name: "Burbujas", icon: "Circle", category: "stamp" },
  { type: "smoke", name: "Humo", icon: "Circle", category: "stamp" },
  { type: "grass", name: "Pasto", icon: "Brush", category: "stamp" },
  { type: "wood", name: "Madera", icon: "Square", category: "stamp" },
  { type: "metal", name: "Metal", icon: "Square", category: "stamp" },
  { type: "glass", name: "Cristal", icon: "Circle", category: "stamp" },
  { type: "water", name: "Agua", icon: "Waves", category: "stamp" },
  { type: "sand", name: "Arena", icon: "Circle", category: "stamp" },
  { type: "stone", name: "Piedra", icon: "Square", category: "stamp" },
  { type: "cloud", name: "Nube", icon: "Circle", category: "stamp" },
  { type: "galaxy", name: "Galaxia", icon: "Sparkles", category: "stamp" },
  { type: "plasma", name: "Plasma", icon: "Zap", category: "stamp" },
  { type: "electric", name: "Eléctrico", icon: "Zap", category: "stamp" },
  { type: "crystal", name: "Cristal", icon: "Grid3X3", category: "stamp" },
  { type: "magic", name: "Mágico", icon: "Sparkles", category: "stamp" },
  { type: "rainbow", name: "Arcoíris", icon: "Circle", category: "stamp" },
  { type: "gradient", name: "Degradado", icon: "Circle", category: "stamp" },
  { type: "mosaic", name: "Mosaico", icon: "Grid3X3", category: "stamp" },
  {
    type: "kaleidoscope",
    name: "Caleidoscopio",
    icon: "Sparkles",
    category: "stamp",
  },
  { type: "mandala", name: "Mandala", icon: "Target", category: "stamp" },
  { type: "celtic", name: "Celta", icon: "Circle", category: "stamp" },
  { type: "tribal", name: "Tribal", icon: "Brush", category: "stamp" },
  { type: "geometric", name: "Geométrico", icon: "Grid3X3", category: "stamp" },
  { type: "organic", name: "Orgánico", icon: "Circle", category: "stamp" },
  { type: "fractal", name: "Fractal", icon: "Sparkles", category: "stamp" },
  {
    type: "impressionist",
    name: "Impresionista",
    icon: "Brush",
    category: "stamp",
  },
  {
    type: "pointillist",
    name: "Puntillista",
    icon: "MoreHorizontal",
    category: "stamp",
  },
  { type: "abstract", name: "Abstracto", icon: "Brush", category: "stamp" },
  { type: "surreal", name: "Surrealista", icon: "Sparkles", category: "stamp" },
  { type: "minimalist", name: "Minimalista", icon: "Minus", category: "stamp" },
  { type: "vintage", name: "Vintage", icon: "Brush", category: "stamp" },
  { type: "grunge", name: "Grunge", icon: "Brush", category: "stamp" },
  { type: "digital", name: "Digital", icon: "Grid3X3", category: "stamp" },
];

export const BRUSH_CATEGORIES = {
  BASIC: {
    name: "Básicos",
    brushes: ["pencil", "shadow", "brush", "eraser"],
  },
  ARTISTIC: {
    name: "Artísticos",
    brushes: [
      "pen",
      "pen2",
      "thick",
      "sliced",
      "multi",
      "multi_opacity",
      "carboncillo",
      "acuarela",
      "tiza",
      "marcador",
      "oleo",
      "pixel",
      "neon",
      "puntos",
      "lineas",
      "fuego",
      "beads",
      "wiggle",
    ],
  },
  STAMP: {
    name: "Estampado",
    brushes: ["stamp_circle", "stamp_star"],
  },
  PATTERN: {
    name: "Patrón",
    brushes: [
      "pattern_dots",
      "pattern_lines",
      "pattern_rainbow",
      "pattern_image",
    ],
  },
  SPRAY: {
    name: "Spray",
    brushes: ["aerosol", "spray", "spray_time", "spray_speed"],
  },
  SKETCH: {
    name: "Sketch/Harmony",
    brushes: ["sketchy", "neighbor", "fur_neighbor"],
  },
  SPECIAL: {
    name: "Especiales",
    brushes: [
      "rainbow_dynamic",
      "confetti",
      "shooting_star",
      "glitch",
      "heart_spray",
      "lightning",
      "bubble",
      "ribbon",
      "fire_realistic",
      "particles",
    ],
  },
  EFFECTS: {
    name: "Efectos",
    brushes: ["glow", "neon", "fuego", "lightning", "magic"],
  },
  STAMP_EXTENDED: {
    name: "Estampado Extendido",
    brushes: [
      "splatter",
      "textured",
      "sketch",
      "fabric",
      "fur",
      "leaves",
      "rain",
      "snow",
      "stars",
      "hearts",
      "flowers",
      "bubbles",
      "smoke",
      "grass",
      "wood",
      "metal",
      "glass",
      "water",
      "sand",
      "stone",
      "cloud",
      "galaxy",
      "plasma",
      "electric",
      "crystal",
      "rainbow",
      "gradient",
      "mosaic",
      "kaleidoscope",
      "mandala",
      "celtic",
      "tribal",
      "geometric",
      "organic",
      "fractal",
      "impressionist",
      "pointillist",
      "abstract",
      "surreal",
      "minimalist",
      "vintage",
      "grunge",
      "digital",
    ],
  },
};

export const DEFAULT_COLORS = [
  "#000000",
  "#FFFFFF",
  "#FF0000",
  "#00FF00",
  "#0000FF",
  "#FFFF00",
  "#FF00FF",
  "#00FFFF",
  "#FFA500",
  "#800080",
  "#FFC0CB",
  "#A52A2A",
  "#808080",
  "#008000",
  "#000080",
  "#800000",
  "#808000",
  "#008080",
  "#C0C0C0",
  "#FFD700",
];

export const DEFAULT_BRUSH_CONFIG = {
  type: BRUSH_TYPES.BRUSH,
  color: "#000000",
  size: 15,
  opacity: 1,
};

// ===========================
// PERFORMANCE MONITORING
// ===========================

/**
 * Performance monitoring utilities for development
 */
export class PerformanceMonitor {
  static #metrics = new Map();

  static startTimer(name) {
    this.#metrics.set(name, performance.now());
  }

  static endTimer(name) {
    const start = this.#metrics.get(name);
    if (start) {
      const duration = performance.now() - start;
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      this.#metrics.delete(name);
      return duration;
    }
    return 0;
  }

  static getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
      };
    }
    return null;
  }
}
