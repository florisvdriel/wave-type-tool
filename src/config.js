// Simplified parameters - focused on staggered type compositions
export const PARAMS = {
  // Text
  text: 'hello world',
  mode: 'letter', // 'letter' | 'word'
  font: 'Space Mono',
  fontSize: 36,

  // Grid
  columns: 20,
  rows: 12,

  // Sequencing (the core feature)
  sequenceDelay: 0.03,
  sequencePattern: 'wave', // 'linear' | 'centerOut' | 'wave' | 'spiral' | 'random'
  globalSpeed: 1,

  // Scale Animation
  scaleEnabled: true,
  scaleMin: 0.3,
  scaleMax: 1.2,
  scaleCurve: 'bounce', // 'sine' | 'bounce' | 'elastic' | 'snap' | 'smooth'

  // Position Animation
  positionEnabled: true,
  positionAmplitudeX: 20,
  positionAmplitudeY: 0,
  positionCurve: 'sine', // 'sine' | 'bounce' | 'elastic' | 'snap' | 'smooth'
  containToCell: false, // prevent letters from overlapping

  // Colors
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',

  // Export
  exportWidth: 1920,
  exportHeight: 1080,
  exportFps: 30,
  exportDuration: 5,
  exportQuality: 0.8,
};

// Available fonts
export const FONTS = [
  'Space Mono',
  'Roboto Mono',
  'IBM Plex Mono',
  'Inter',
  'Space Grotesk',
  'Bebas Neue',
];

// Animation curves
export const CURVES = {
  sine: (t) => (Math.sin(t) + 1) / 2,
  bounce: (t) => {
    const x = (Math.sin(t) + 1) / 2;
    return Math.abs(Math.sin(x * Math.PI * 2.5)) * x;
  },
  elastic: (t) => {
    const x = (Math.sin(t) + 1) / 2;
    return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
  },
  snap: (t) => Math.sin(t) > 0 ? 1 : 0,
  smooth: (t) => {
    const x = (Math.sin(t) + 1) / 2;
    return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
  },
};

// Sequence patterns
export const PATTERNS = ['linear', 'centerOut', 'wave', 'spiral', 'random'];
