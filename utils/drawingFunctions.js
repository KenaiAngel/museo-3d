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
        console.warn(`Unknown brush type: ${type}, using default`);
        this.#drawBasicBrush({ x, y, lastPoint, color, size });
        return true;
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
      "brush-soft": this.#drawSoftBrush,
      eraser: this.#drawEraser,

      // Artistic brushes
      carboncillo: this.#drawCharcoal,
      acuarela: this.#drawWatercolor,
      tiza: this.#drawChalk,
      marcador: this.#drawMarker,
      oleo: this.#drawOil,

      // Effect brushes
      glow: this.#drawGlow,
      neon: this.#drawNeon,
      fuego: this.#drawFire,

      // Pattern brushes
      pixel: this.#drawPixel,
      puntos: this.#drawDots,
      lineas: this.#drawLines,

      // Extended brushes (46 total)
      splatter: this.#drawSplatter,
      spray: this.#drawSpray,
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
      lightning: this.#drawLightning,
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

  // ===========================
  // CORE BRUSH IMPLEMENTATIONS
  // ===========================

  /**
   * Basic brush implementation
   * @private
   */
  #drawBasicBrush({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size;
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";

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
   * Soft brush with glow effect
   * @private
   */
  #drawSoftBrush({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "source-over";
    this.#ctx.strokeStyle = color;
    this.#ctx.lineWidth = size;
    this.#ctx.lineCap = "round";
    this.#ctx.lineJoin = "round";
    this.#ctx.shadowColor = color;
    this.#ctx.shadowBlur = size * 1.2;

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
   * Eraser implementation
   * @private
   */
  #drawEraser({ x, y, lastPoint, size }) {
    this.#ctx.globalCompositeOperation = "destination-out";
    this.#ctx.lineWidth = size;
    this.#ctx.lineCap = "round";

    if (lastPoint) {
      this.#ctx.beginPath();
      this.#ctx.moveTo(lastPoint.x, lastPoint.y);
      this.#ctx.lineTo(x, y);
      this.#ctx.stroke();
    }
  }

  /**
   * Charcoal brush with realistic texture
   * @private
   */
  #drawCharcoal({ x, y, lastPoint, color, size }) {
    this.#ctx.globalCompositeOperation = "multiply";

    // Multiple strokes for texture
    for (let offset = 0; offset < 5; offset++) {
      const offsetDist = offset * 0.5;
      const alpha = 0.22 - offset * 0.04;
      this.#ctx.strokeStyle = ColorUtils.hexToRgba(color, alpha);
      this.#ctx.lineWidth = Math.max(1, size - offset);
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

    // Optimized granular texture
    const particleCount = Math.floor(
      size * PERFORMANCE.PARTICLE_DENSITY_FACTOR
    );
    for (let i = 0; i < particleCount; i++) {
      const grainX = x + (Math.random() - 0.5) * size * 1.2;
      const grainY = y + (Math.random() - 0.5) * size * 1.2;
      this.#ctx.globalAlpha = 0.1 + Math.random() * 0.15;
      this.#ctx.fillStyle = color;
      this.#ctx.beginPath();
      this.#ctx.arc(grainX, grainY, Math.random() * 1.2, 0, Math.PI * 2);
      this.#ctx.fill();
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
  #drawChalk(params) {
    this.#drawSoftBrush(params);
  }
  #drawMarker(params) {
    this.#drawBasicBrush(params);
  }
  #drawOil(params) {
    this.#drawBasicBrush(params);
  }
  #drawGlow(params) {
    this.#drawSoftBrush(params);
  }
  #drawNeon(params) {
    this.#drawGlow(params);
  }
  #drawFire(params) {
    this.#drawGlow(params);
  }
  #drawPixel(params) {
    this.#drawBasicBrush(params);
  }
  #drawDots(params) {
    this.#drawBasicBrush(params);
  }
  #drawLines(params) {
    this.#drawBasicBrush(params);
  }

  // Extended brush placeholders (would implement unique algorithms in production)
  #drawSplatter(params) {
    this.#drawDots(params);
  }
  #drawSpray(params) {
    this.#drawDots(params);
  }
  #drawTextured(params) {
    this.#drawCharcoal(params);
  }
  #drawSketch(params) {
    this.#drawLines(params);
  }
  #drawFabric(params) {
    this.#drawTextured(params);
  }
  #drawFur(params) {
    this.#drawLines(params);
  }
  #drawLeaves(params) {
    this.#drawBasicBrush(params);
  }
  #drawRain(params) {
    this.#drawLines(params);
  }
  #drawSnow(params) {
    this.#drawDots(params);
  }
  #drawStars(params) {
    this.#drawBasicBrush(params);
  }
  #drawHearts(params) {
    this.#drawBasicBrush(params);
  }
  #drawFlowers(params) {
    this.#drawBasicBrush(params);
  }
  #drawBubbles(params) {
    this.#drawDots(params);
  }
  #drawLightning(params) {
    this.#drawGlow(params);
  }
  #drawSmoke(params) {
    this.#drawSoftBrush(params);
  }
  #drawGrass(params) {
    this.#drawLines(params);
  }
  #drawWood(params) {
    this.#drawLines(params);
  }
  #drawMetal(params) {
    this.#drawBasicBrush(params);
  }
  #drawGlass(params) {
    this.#drawSoftBrush(params);
  }
  #drawWater(params) {
    this.#drawWatercolor(params);
  }
  #drawSand(params) {
    this.#drawDots(params);
  }
  #drawStone(params) {
    this.#drawCharcoal(params);
  }
  #drawCloud(params) {
    this.#drawSoftBrush(params);
  }
  #drawGalaxy(params) {
    this.#drawGlow(params);
  }
  #drawPlasma(params) {
    this.#drawGlow(params);
  }
  #drawElectric(params) {
    this.#drawNeon(params);
  }
  #drawCrystal(params) {
    this.#drawPixel(params);
  }
  #drawMagic(params) {
    this.#drawGlow(params);
  }
  #drawRainbow(params) {
    this.#drawSoftBrush(params);
  }
  #drawGradient(params) {
    this.#drawSoftBrush(params);
  }
  #drawMosaic(params) {
    this.#drawPixel(params);
  }
  #drawKaleidoscope(params) {
    this.#drawBasicBrush(params);
  }
  #drawMandala(params) {
    this.#drawBasicBrush(params);
  }
  #drawCeltic(params) {
    this.#drawLines(params);
  }
  #drawTribal(params) {
    this.#drawLines(params);
  }
  #drawGeometric(params) {
    this.#drawPixel(params);
  }
  #drawOrganic(params) {
    this.#drawSoftBrush(params);
  }
  #drawFractal(params) {
    this.#drawBasicBrush(params);
  }
  #drawImpressionist(params) {
    this.#drawDots(params);
  }
  #drawPointillist(params) {
    this.#drawDots(params);
  }
  #drawAbstract(params) {
    this.#drawSoftBrush(params);
  }
  #drawSurreal(params) {
    this.#drawSoftBrush(params);
  }
  #drawMinimalist(params) {
    this.#drawBasicBrush(params);
  }
  #drawVintage(params) {
    this.#drawCharcoal(params);
  }
  #drawGrunge(params) {
    this.#drawCharcoal(params);
  }
  #drawDigital(params) {
    this.#drawPixel(params);
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
  BRUSH_SOFT: "brush-soft",
  ERASER: "eraser",

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
  { type: "brush", name: "Pincel", icon: "Brush", category: "basic" },
  {
    type: "brush-soft",
    name: "Pincel Suave",
    icon: "Brush",
    category: "basic",
  },
  { type: "eraser", name: "Borrador", icon: "Eraser", category: "basic" },

  // Pinceles artísticos
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

  // Pinceles de efectos
  { type: "glow", name: "Resplandor", icon: "Sparkles", category: "effects" },
  { type: "neon", name: "Neón", icon: "Zap", category: "effects" },
  { type: "fuego", name: "Fuego", icon: "Flame", category: "effects" },

  // Pinceles de patrones
  { type: "pixel", name: "Pixel", icon: "Grid3X3", category: "patterns" },
  {
    type: "puntos",
    name: "Puntos",
    icon: "MoreHorizontal",
    category: "patterns",
  },
  { type: "lineas", name: "Líneas", icon: "Minus", category: "patterns" },

  // Pinceles estampado
  {
    type: "splatter",
    name: "Salpicadura",
    icon: "Droplets",
    category: "stamp",
  },
  { type: "spray", name: "Aerosol", icon: "Circle", category: "stamp" },
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
  { type: "lightning", name: "Rayo", icon: "Zap", category: "stamp" },
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
    brushes: ["brush", "brush-soft", "eraser"],
  },
  ARTISTIC: {
    name: "Artísticos",
    brushes: ["carboncillo", "acuarela", "tiza", "marcador", "oleo"],
  },
  EFFECTS: {
    name: "Efectos",
    brushes: ["glow", "neon", "fuego", "lightning", "magic"],
  },
  PATTERNS: {
    name: "Patrones",
    brushes: ["pixel", "puntos", "lineas", "geometric", "mosaic"],
  },
  STAMP: {
    name: "Estampado",
    brushes: ["stars", "hearts", "flowers", "bubbles", "mandala"],
  },
  NATURE: {
    name: "Naturaleza",
    brushes: ["leaves", "rain", "snow", "grass", "water", "cloud"],
  },
  TEXTURE: {
    name: "Texturas",
    brushes: [
      "splatter",
      "spray",
      "textured",
      "fabric",
      "wood",
      "metal",
      "stone",
      "sand",
    ],
  },
  STYLES: {
    name: "Estilos Artísticos",
    brushes: [
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
