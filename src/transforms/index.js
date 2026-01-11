import { CURVES } from '../config.js';

/**
 * Calculate sequence delay based on pattern
 */
const getSequenceDelay = (item, params) => {
  const { row, col, totalRows, totalCols } = item;
  const { sequencePattern, sequenceDelay } = params;

  let index = 0;

  switch (sequencePattern) {
    case 'linear':
      index = row * totalCols + col;
      break;

    case 'centerOut': {
      const centerRow = totalRows / 2;
      const centerCol = totalCols / 2;
      index = Math.sqrt(
        Math.pow(col - centerCol, 2) +
        Math.pow(row - centerRow, 2)
      );
      break;
    }

    case 'wave':
      index = row + col;
      break;

    case 'spiral': {
      const centerRow = totalRows / 2;
      const centerCol = totalCols / 2;
      const angle = Math.atan2(row - centerRow, col - centerCol);
      const radius = Math.sqrt(
        Math.pow(col - centerCol, 2) +
        Math.pow(row - centerRow, 2)
      );
      index = angle + radius * 2;
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

  return index * sequenceDelay;
};

/**
 * Apply all transforms to a single item
 */
export const applyTransforms = (item, index, time, params) => {
  // Get local time with sequence delay
  const delay = getSequenceDelay(item, params);
  const localTime = time - delay * 60; // Convert to frames

  // Base values
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  // Scale transform
  if (params.scaleEnabled) {
    const curve = CURVES[params.scaleCurve] || CURVES.sine;
    const t = localTime * 0.05 * params.globalSpeed;
    const normalized = curve(t);
    scale = params.scaleMin + normalized * (params.scaleMax - params.scaleMin);
    scale = Math.max(0.01, scale);
  }

  // Position transform
  if (params.positionEnabled) {
    const curve = CURVES[params.positionCurve] || CURVES.sine;
    const t = localTime * 0.05 * params.globalSpeed;

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

  return {
    x: item.x + offsetX,
    y: item.y + offsetY,
    scale,
    opacity: 1,
    rotation: 0,
  };
};
