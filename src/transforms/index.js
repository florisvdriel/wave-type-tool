import { CURVES, EASINGS } from '../config.js';

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
 * Calculate spatial phase based on pattern
 * Returns phase offset in radians (0 to waveCycles * 2π)
 * This creates the flowing wave effect where all letters animate together
 * but at different points in the wave based on their grid position
 */
export const getSpatialPhase = (item, params) => {
  const { row, col, totalRows, totalCols } = item;
  const { sequencePattern, waveCycles, linearDirection, spiralDensity, rowPhaseOffset, colPhaseOffset } = params;

  let normalizedPosition = 0;

  switch (sequencePattern) {
    case 'linear':
      switch (linearDirection) {
        case 'vertical':
          normalizedPosition = row / (totalRows - 1 || 1);
          break;
        case 'diagonal':
          normalizedPosition = (row + col) / ((totalRows - 1) + (totalCols - 1) || 1);
          break;
        case 'horizontal':
        default:
          normalizedPosition = col / (totalCols - 1 || 1);
          break;
      }
      break;

    case 'centerOut': {
      const centerRow = (totalRows - 1) / 2;
      const centerCol = (totalCols - 1) / 2;
      const maxDist = Math.sqrt(centerRow * centerRow + centerCol * centerCol) || 1;

      switch (linearDirection) {
        case 'horizontal':
          normalizedPosition = Math.abs(col - centerCol) / (centerCol || 1);
          break;
        case 'vertical':
          normalizedPosition = Math.abs(row - centerRow) / (centerRow || 1);
          break;
        case 'diagonal':
        default:
          const dist = Math.sqrt(
            Math.pow(row - centerRow, 2) +
            Math.pow(col - centerCol, 2)
          );
          normalizedPosition = dist / maxDist;
          break;
      }
      break;
    }

    case 'wave':
      switch (linearDirection) {
        case 'vertical':
          normalizedPosition = row / (totalRows - 1 || 1);
          break;
        case 'diagonal':
          normalizedPosition = (row + col) / ((totalRows - 1) + (totalCols - 1) || 1);
          break;
        case 'horizontal':
        default:
          normalizedPosition = col / (totalCols - 1 || 1);
          break;
      }
      break;

    case 'spiral': {
      const centerRow = (totalRows - 1) / 2;
      const centerCol = (totalCols - 1) / 2;
      const angle = Math.atan2(row - centerRow, col - centerCol);
      const maxRadius = Math.sqrt(centerRow * centerRow + centerCol * centerCol) || 1;
      const radius = Math.sqrt(
        Math.pow(col - centerCol, 2) +
        Math.pow(row - centerRow, 2)
      );
      // Combine angle and radius for spiral phase
      const normalizedAngle = (angle / Math.PI + 1) / 2; // 0 to 1
      const normalizedRadius = radius / maxRadius;
      normalizedPosition = (normalizedAngle + normalizedRadius * spiralDensity * 0.5) % 1;
      break;
    }

    case 'random': {
      const seed = row * 127.1 + col * 311.7;
      const random = Math.sin(seed) * 43758.5453;
      normalizedPosition = random - Math.floor(random);
      break;
    }

    default:
      normalizedPosition = col / (totalCols - 1 || 1);
  }

  // Apply row and column phase offsets (additional fine-tuning)
  const rowOffset = (row / (totalRows - 1 || 1)) * (rowPhaseOffset || 0);
  const colOffset = (col / (totalCols - 1 || 1)) * (colPhaseOffset || 0);
  normalizedPosition += rowOffset + colOffset;

  // Convert to radians with wave cycles
  return normalizedPosition * waveCycles * 2 * Math.PI;
};

/**
 * Apply all transforms to a single item
 */
export const applyTransforms = (item, index, time, params, p5Instance) => {
  // Use precomputed spatial phase if available (performance optimization)
  const spatialPhase = item.spatialPhase ?? getSpatialPhase(item, params);

  // Use global time (all letters animate together, phase creates the wave)
  const t = time * 0.05 * params.globalSpeed;

  // Base values
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;
  let opacity = 1;

  // Scale transform - apply spatial phase
  if (params.scaleEnabled) {
    const curve = CURVES[params.scaleCurve] || CURVES.sine;
    const normalized = curve(t + spatialPhase);
    scale = params.scaleMin + normalized * (params.scaleMax - params.scaleMin);
    scale = Math.max(0.01, scale);
  }

  // Position transform - apply spatial phase
  if (params.positionEnabled) {
    const curve = CURVES[params.positionCurve] || CURVES.sine;
    const easing = EASINGS[params.positionEasing] || EASINGS.linear;
    const frequency = params.positionFrequency || 1;

    // Calculate wave values with spatial phase
    const tWithPhase = t + spatialPhase;

    // Apply easing to normalized time
    const normalizedTime = (Math.sin(tWithPhase) + 1) / 2;
    const easedTime = easing(normalizedTime);
    const easedT = (easedTime * 2 - 1) * Math.PI;

    // Primary wave for X axis
    const normalizedX = params.positionCurve === 'noise'
      ? curve(easedT, params.positionNoiseIntensity)
      : curve(easedT);
    const waveX = normalizedX * 2 - 1;

    // Secondary wave for Y axis with frequency multiplier
    const tY = tWithPhase * frequency;
    const normalizedTimeY = (Math.sin(tY) + 1) / 2;
    const easedTimeY = easing(normalizedTimeY);
    const easedTY = (easedTimeY * 2 - 1) * Math.PI;
    const normalizedY = params.positionCurve === 'noise'
      ? curve(easedTY, params.positionNoiseIntensity)
      : curve(easedTY);
    const waveY = normalizedY * 2 - 1;

    // Calculate canvas dimensions for amplitude modulation
    const canvasWidth = item.totalCols * item.cellWidth;
    const canvasHeight = item.totalRows * item.cellHeight;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Calculate amplitude multiplier based on origin (TEXTR-style amplitude modulation)
    // This modulates HOW MUCH each letter moves, not WHICH DIRECTION
    let amplitudeMultiplier = 1;

    if (params.positionOrigin !== 'off') {
      // Normalize distance from center (0 = center, 1 = furthest corner)
      const distFromCenterX = (item.x - centerX) / centerX;
      const distFromCenterY = (item.y - centerY) / centerY;
      const distFromCenter = Math.sqrt(
        distFromCenterX * distFromCenterX +
        distFromCenterY * distFromCenterY
      );
      const normalizedDist = Math.min(distFromCenter / Math.sqrt(2), 1); // 0 to 1

      switch (params.positionOrigin) {
        case 'center':
          // Amplitude increases FROM center (center=0 amplitude, edges=full amplitude)
          amplitudeMultiplier = normalizedDist;
          break;

        case 'edges':
          // Amplitude increases FROM edges (edges=0 amplitude, center=full amplitude)
          amplitudeMultiplier = 1 - normalizedDist;
          break;

        case 'side0to1':
          // Progressive left-to-right (left=0 amplitude, right=full amplitude)
          amplitudeMultiplier = item.x / canvasWidth;
          break;

        case 'side1to0':
          // Progressive right-to-left (right=0 amplitude, left=full amplitude)
          amplitudeMultiplier = 1 - (item.x / canvasWidth);
          break;
      }

      // Apply easing to the amplitude multiplier for smoother falloff
      amplitudeMultiplier = easing(amplitudeMultiplier);
    }

    if (params.positionMode === 'travel') {
      // TRAVEL MODE: Amplitude is percentage of canvas size
      let amplitudeX = (params.positionAmplitudeX / 100) * canvasWidth * amplitudeMultiplier;
      let amplitudeY = (params.positionAmplitudeY / 100) * canvasHeight * amplitudeMultiplier;

      // Contain to cell - limit amplitude to half cell size
      if (params.containToCell && item.cellWidth && item.cellHeight) {
        const maxAmpX = (item.cellWidth / 2) - (params.fontSize / 2);
        const maxAmpY = (item.cellHeight / 2) - (params.fontSize / 2);
        amplitudeX = Math.min(amplitudeX, Math.max(0, maxAmpX));
        amplitudeY = Math.min(amplitudeY, Math.max(0, maxAmpY));
      }

      // All letters oscillate in X and Y independently
      offsetX = waveX * amplitudeX;
      offsetY = waveY * amplitudeY;
    } else {
      // OSCILLATE MODE: Amplitude is fixed pixels
      let amplitudeX = params.positionAmplitudeX * amplitudeMultiplier;
      let amplitudeY = params.positionAmplitudeY * amplitudeMultiplier;

      // Contain to cell - limit amplitude to half cell size
      if (params.containToCell && item.cellWidth && item.cellHeight) {
        const maxAmpX = (item.cellWidth / 2) - (params.fontSize / 2);
        const maxAmpY = (item.cellHeight / 2) - (params.fontSize / 2);
        amplitudeX = Math.min(amplitudeX, Math.max(0, maxAmpX));
        amplitudeY = Math.min(amplitudeY, Math.max(0, maxAmpY));
      }

      // All letters oscillate in X and Y independently
      offsetX = waveX * amplitudeX;
      offsetY = waveY * amplitudeY;
    }
  }

  // Opacity transform - apply spatial phase
  if (params.opacityEnabled) {
    const curve = CURVES[params.opacityCurve] || CURVES.sine;
    const normalized = curve(t + spatialPhase);
    // Map 0-1 to opacityMin-opacityMax
    opacity = params.opacityMin + normalized * (params.opacityMax - params.opacityMin);
    opacity = Math.max(0, Math.min(1, opacity));
  }

  // Jitter transform (noise-based, uses global time only)
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
