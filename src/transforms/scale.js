/**
 * Scale Transform with multiple animation modes
 */

// Animation mode functions - all return value from 0 to 1
const scaleModes = {
  // Standard sine wave
  sine: (t) => (Math.sin(t) + 1) / 2,

  // Double sine - two peaks per cycle
  doubleSine: (t) => (Math.sin(t * 2) + 1) / 2,

  // Triple sine - three peaks per cycle
  tripleSine: (t) => (Math.sin(t * 3) + 1) / 2,

  // Pulse - sharp peaks
  pulse: (t) => Math.pow((Math.sin(t) + 1) / 2, 3),

  // Inverse pulse - sharp valleys
  inversePulse: (t) => 1 - Math.pow((Math.sin(t) + 1) / 2, 3),

  // Bounce - elastic effect
  bounce: (t) => {
    const x = (Math.sin(t) + 1) / 2;
    return Math.abs(Math.sin(x * Math.PI * 2.5)) * x;
  },

  // Steps - quantized levels
  steps: (t, steps = 4) => {
    const raw = (Math.sin(t) + 1) / 2;
    return Math.floor(raw * steps) / (steps - 1);
  },

  // Breathe - slow in, slow out (ease-in-out)
  breathe: (t) => {
    const x = (Math.sin(t) + 1) / 2;
    return x < 0.5
      ? 2 * x * x
      : 1 - Math.pow(-2 * x + 2, 2) / 2;
  },

  // Heartbeat - double pulse pattern
  heartbeat: (t) => {
    const cycle = t % (Math.PI * 2);
    const normalized = cycle / (Math.PI * 2);
    if (normalized < 0.15) {
      return Math.sin(normalized / 0.15 * Math.PI);
    } else if (normalized < 0.3) {
      return Math.sin((normalized - 0.15) / 0.15 * Math.PI) * 0.6;
    }
    return 0;
  },

  // Sawtooth - linear ramp
  sawtooth: (t) => {
    const cycle = t % (Math.PI * 2);
    return cycle / (Math.PI * 2);
  },

  // Triangle wave
  triangle: (t) => {
    const cycle = t % (Math.PI * 2);
    const normalized = cycle / (Math.PI * 2);
    return normalized < 0.5
      ? normalized * 2
      : 2 - normalized * 2;
  },

  // Random (seeded by position)
  random: (t, seed = 0) => {
    const x = Math.sin(t * 0.1 + seed * 127.1) * 43758.5453;
    return (x - Math.floor(x));
  },

  // Exponential pulse
  exponential: (t) => {
    const x = (Math.sin(t) + 1) / 2;
    return Math.pow(x, 2);
  },

  // Square wave
  square: (t) => Math.sin(t) > 0 ? 1 : 0,

  // Smooth square (soft edges)
  smoothSquare: (t) => {
    const x = Math.sin(t);
    return (Math.tanh(x * 5) + 1) / 2;
  },
};

// Direction functions - calculate phase based on position
const getPhaseForDirection = (item, params) => {
  const { row, col, totalRows, totalCols } = item;
  const normalizedRow = row / (totalRows - 1 || 1);
  const normalizedCol = col / (totalCols - 1 || 1);
  const centerRow = 0.5;
  const centerCol = 0.5;

  switch (params.scaleDirection) {
    case 'horizontal':
      return normalizedCol * params.scalePhase * Math.PI * 4;

    case 'vertical':
      return normalizedRow * params.scalePhase * Math.PI * 4;

    case 'diagonal':
      return (normalizedCol + normalizedRow) * params.scalePhase * Math.PI * 2;

    case 'diagonalAlt':
      return (normalizedCol - normalizedRow + 1) * params.scalePhase * Math.PI * 2;

    case 'radial':
    default:
      const distFromCenter = Math.sqrt(
        Math.pow(normalizedCol - centerCol, 2) +
        Math.pow(normalizedRow - centerRow, 2)
      );
      return distFromCenter * params.scalePhase * Math.PI * 8;

    case 'radialInverse':
      const dist = Math.sqrt(
        Math.pow(normalizedCol - centerCol, 2) +
        Math.pow(normalizedRow - centerRow, 2)
      );
      return (1 - dist) * params.scalePhase * Math.PI * 8;

    case 'checkerboard':
      return ((row + col) % 2) * Math.PI;

    case 'spiral':
      const angle = Math.atan2(normalizedRow - centerRow, normalizedCol - centerCol);
      const radius = Math.sqrt(
        Math.pow(normalizedCol - centerCol, 2) +
        Math.pow(normalizedRow - centerRow, 2)
      );
      return (angle + radius * 10) * params.scalePhase;
  }
};

export const scaleTransform = (item, index, time, params, p5Instance = null) => {
  if (!params.scaleEnabled) return 1;

  const { scaleMin, scaleMax, scaleFrequency, scaleSpeed, scaleMode } = params;

  // Get the animation function
  const animFn = scaleModes[scaleMode] || scaleModes.sine;

  // Calculate phase based on direction
  const phase = getPhaseForDirection(item, params);

  // Calculate time value
  const t = time * scaleSpeed * params.globalSpeed * scaleFrequency * 20 + phase;

  // Get normalized value (0 to 1)
  let normalizedValue;
  if (scaleMode === 'random') {
    normalizedValue = animFn(t, index);
  } else if (scaleMode === 'steps') {
    normalizedValue = animFn(t, 4); // 4 steps
  } else {
    normalizedValue = animFn(t);
  }

  // Map to min/max range
  const scale = scaleMin + normalizedValue * (scaleMax - scaleMin);

  // Ensure scale doesn't go negative
  return Math.max(0.01, scale);
};

export const getScaleModes = () => Object.keys(scaleModes);
