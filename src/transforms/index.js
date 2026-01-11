import { CURVES } from '../config.js';

/**
 * Simple noise function (Simplex-like)
 * Uses p5's noise if available, otherwise falls back to deterministic pseudo-noise
 */
const noise = (x, y, z, p5Instance) => {
  if (p5Instance && typeof p5Instance.noise === 'function') {
    return p5Instance.noise(x, y, z);
  }
  // Fallback pseudo-noise based on sin
  const n = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return (n - Math.floor(n));
};

/**
 * Calculate sequence delay based on pattern with phase offsets
 */
const getSequenceDelay = (item, params) => {
  const { row, col, totalRows, totalCols } = item;
  const { sequencePattern, sequenceDelay, rowPhaseOffset, colPhaseOffset, linearDirection, spiralDensity } = params;

  let index = 0;

  switch (sequencePattern) {
    case 'linear':
      // Apply direction: horizontal (by column), vertical (by row), or diagonal (both)
      switch (linearDirection) {
        case 'vertical':
          index = col * totalRows + row;
          break;
        case 'diagonal':
          index = row + col;
          break;
        case 'horizontal':
        default:
          index = row * totalCols + col;
          break;
      }
      break;

    case 'centerOut': {
      const centerRow = totalRows / 2;
      const centerCol = totalCols / 2;

      // Apply direction: horizontal (x-axis), vertical (y-axis), or diagonal (both)
      switch (linearDirection) {
        case 'horizontal':
          index = Math.abs(col - centerCol);
          break;
        case 'vertical':
          index = Math.abs(row - centerRow);
          break;
        case 'diagonal':
        default:
          index = Math.sqrt(
            Math.pow(col - centerCol, 2) +
            Math.pow(row - centerRow, 2)
          );
          break;
      }
      break;
    }

    case 'wave':
      // Apply direction: horizontal (by column), vertical (by row), or diagonal (both)
      switch (linearDirection) {
        case 'horizontal':
          index = col;
          break;
        case 'vertical':
          index = row;
          break;
        case 'diagonal':
        default:
          index = row + col;
          break;
      }
      break;

    case 'spiral': {
      const centerRow = totalRows / 2;
      const centerCol = totalCols / 2;
      const angle = Math.atan2(row - centerRow, col - centerCol);
      const radius = Math.sqrt(
        Math.pow(col - centerCol, 2) +
        Math.pow(row - centerRow, 2)
      );

      // spiralDensity controls how tight the spiral is (higher = tighter)
      index = angle + radius * spiralDensity;
      break;
    }

    case 'random': {
      const seed = row * 127.1 + col * 311.7;
      const random = Math.sin(seed) * 43758.5453;
      index = (random - Math.floor(random)) * (totalRows * totalCols);
      break;
    }

    default:
      index = row * totalCols + col;
  }

  // Apply row and column phase offsets
  const rowOffset = row * (rowPhaseOffset || 0) * 10;
  const colOffset = col * (colPhaseOffset || 0) * 10;

  return index * sequenceDelay + rowOffset + colOffset;
};

/**
 * Apply all transforms to a single item
 */
export const applyTransforms = (item, index, time, params, p5Instance) => {
  // Get local time with sequence delay
  const delay = getSequenceDelay(item, params);
  const localTime = time - delay * 60; // Convert to frames

  // Base values
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let opacity = 1;

  // Speed multiplier
  const speed = params.globalSpeed;

  // Scale transform
  if (params.scaleEnabled) {
    const curve = CURVES[params.scaleCurve] || CURVES.sine;
    const t = localTime * 0.05 * speed;
    const normalized = curve(t);
    scale = params.scaleMin + normalized * (params.scaleMax - params.scaleMin);
    scale = Math.max(0.01, scale);
  }

  // Position transform
  if (params.positionEnabled) {
    const curve = CURVES[params.positionCurve] || CURVES.sine;
    const t = localTime * 0.05 * speed;

    // Get curve value (0 to 1) and convert to -1 to 1 range
    const normalized = curve(t);
    const wave = normalized * 2 - 1;

    let ampX = params.positionAmplitudeX;
    let ampY = params.positionAmplitudeY;

    // Contain to cell - limit amplitude to half cell size
    if (params.containToCell && item.cellWidth && item.cellHeight) {
      const maxAmpX = (item.cellWidth / 2) - (params.fontSize / 2);
      const maxAmpY = (item.cellHeight / 2) - (params.fontSize / 2);
      ampX = Math.min(ampX, Math.max(0, maxAmpX));
      ampY = Math.min(ampY, Math.max(0, maxAmpY));
    }

    offsetX = wave * ampX;
    offsetY = wave * ampY;
  }

  // Opacity transform
  if (params.opacityEnabled) {
    const curve = CURVES[params.opacityCurve] || CURVES.sine;
    const t = localTime * 0.05 * speed;
    const normalized = curve(t);
    // Map 0-1 to opacityMin-opacityMax
    opacity = params.opacityMin + normalized * (params.opacityMax - params.opacityMin);
    opacity = Math.max(0, Math.min(1, opacity));
  }

  // Jitter transform (noise-based)
  if (params.jitterEnabled) {
    const jitterTime = time * params.jitterSpeed * 0.01;
    const noiseX = noise(item.col * 0.5, item.row * 0.5, jitterTime, p5Instance);
    const noiseY = noise(item.col * 0.5 + 100, item.row * 0.5 + 100, jitterTime, p5Instance);

    // Convert 0-1 noise to -1 to 1 range
    offsetX += (noiseX * 2 - 1) * params.jitterAmount;
    offsetY += (noiseY * 2 - 1) * params.jitterAmount;
  }

  return {
    x: item.x + offsetX,
    y: item.y + offsetY,
    scale,
    opacity,
  };
};
