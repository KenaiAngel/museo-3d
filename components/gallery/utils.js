import { GALLERY_CONFIG } from "./config.js";

const {
  HALL_WIDTH,
  WALL_HEIGHT,
  PICTURE_SPACING,
  PICTURE_WIDTH,
  WALL_MARGIN_INITIAL,
  WALL_MARGIN_FINAL,
} = GALLERY_CONFIG;

/**
 * Calcula las posiciones de las obras en el pasillo
 * @param {Array} images - Array de imágenes/murales
 * @param {number} firstX - Posición X inicial
 * @param {number} pictureSpacing - Espaciado entre cuadros
 * @param {number} contentLength - Longitud total del contenido para distribución
 * @returns {Array} Array de obras con posiciones calculadas
 */
export function calculateArtworkPositions(
  images,
  firstX,
  pictureSpacing,
  contentLength = null
) {
  const positions = [];
  const pairs = Math.ceil(images.length / 2);

  // Si se proporciona contentLength, distribuir uniformemente pero con límites
  let actualSpacing = pictureSpacing;
  let startX = firstX;

  if (contentLength && pairs > 1) {
    // Distribuir uniformemente a lo largo de toda la longitud disponible
    const calculatedSpacing = (contentLength - PICTURE_WIDTH) / (pairs - 1);
    // Limitar el espaciado máximo para evitar separación excesiva
    const maxSpacing = pictureSpacing * 1.5; // Aumentado de 1.2 a 1.5 (50% más que el espaciado base)
    actualSpacing = Math.min(calculatedSpacing, maxSpacing);
  }

  // Para salas con pocos cuadros (menos de 4), centrarlos más en la sala
  if (images.length < 4 && contentLength) {
    const totalArtworkWidth = (pairs - 1) * actualSpacing + PICTURE_WIDTH;
    const extraSpace = contentLength - totalArtworkWidth;
    // Agregar espacio extra al inicio para centrar mejor
    startX = firstX + extraSpace * 0.3; // Usar 30% del espacio extra como offset inicial
  }

  for (let i = 0; i < images.length; i++) {
    const side = i % 2 === 0 ? 1 : -1; // Alternar entre paredes
    const index = Math.floor(i / 2);
    const x = startX + index * actualSpacing;
    const cuadroProfundidad = 0.15;

    // Calcular posición Z según la pared
    const z =
      side === 1
        ? HALL_WIDTH / 2 - cuadroProfundidad / 2
        : -(HALL_WIDTH / 2 - cuadroProfundidad / 2);

    // Rotación según la pared
    const rotation = [0, side === 1 ? 0 : Math.PI, 0];

    positions.push({
      ...images[i],
      position: [x, WALL_HEIGHT, z],
      rotation,
    });
  }

  return positions;
}

/**
 * Calcula las dimensiones dinámicas de la galería basadas en el número de obras
 * @param {Array} artworks - Array de obras de arte
 * @returns {Object} Objeto con dimensiones calculadas
 */
export function calculateGalleryDimensions(artworks) {
  const pairs = Math.ceil(artworks.length / 2);
  const spacingTotal = (pairs - 1) * PICTURE_SPACING;
  const contentLength = spacingTotal + PICTURE_WIDTH;

  // Para salas pequeñas (menos de 8 obras), usar un largo mínimo balanceado
  const MIN_GALLERY_LENGTH = 25; // Aumentado de 20 a 25 para salas más cómodas
  const MIN_PAIRS = 4; // Aumentado de 3 a 4 pares (8 obras mínimo)

  let adjustedContentLength = contentLength;
  let adjustedSpacingTotal = spacingTotal;

  if (artworks.length < MIN_PAIRS * 2) {
    // Usar dimensiones mínimas para salas pequeñas
    const minPairs = Math.max(MIN_PAIRS, pairs);
    adjustedSpacingTotal = (minPairs - 1) * PICTURE_SPACING;
    adjustedContentLength = Math.max(
      MIN_GALLERY_LENGTH,
      adjustedSpacingTotal + PICTURE_WIDTH
    );
  }

  const firstX = -adjustedContentLength / 2;
  const lastX = firstX + adjustedSpacingTotal;
  const dynamicLength =
    adjustedContentLength + WALL_MARGIN_INITIAL + WALL_MARGIN_FINAL;

  return {
    pairs,
    spacingTotal: adjustedSpacingTotal,
    contentLength: adjustedContentLength,
    firstX,
    lastX,
    dynamicLength,
    dynamicCenterX: 0,
    wallMarginInitial: WALL_MARGIN_INITIAL,
    wallMarginFinal: WALL_MARGIN_FINAL,
  };
}

export function parseAutores(autorString) {
  return autorString
    ? autorString
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
    : [];
}

export function parseColaboradores(colabString) {
  return colabString
    ? colabString
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    : [];
}

export function normalizeTecnica(tecnica) {
  if (!tecnica) return tecnica;
  const normalized = tecnica.toLowerCase();
  if (
    normalized.includes("acrílico") ||
    normalized.includes("acrilico") ||
    normalized.includes("acrílica") ||
    normalized.includes("acrilica")
  ) {
    return "Acrílico";
  }
  if (
    normalized.includes("vinílica") ||
    normalized.includes("vinilica") ||
    normalized.includes("vinil")
  ) {
    return "Pintura vinílica";
  }
  if (normalized.includes("óleo") || normalized.includes("oleo")) {
    return "Óleo";
  }
  if (normalized.includes("acuarela")) {
    return "Acuarela";
  }
  return tecnica.charAt(0).toUpperCase() + tecnica.slice(1).toLowerCase();
}
