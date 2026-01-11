// Parameters for staggered type compositions
export const PARAMS = {
  // Text
  text: 'HELLO WORLD',
  mode: 'letter', // 'letter' | 'word'
  font: 'Inter',
  fontSize: 36,

  // Grid
  columns: 20,
  rows: 12,

  // Sequencing (the core feature)
  sequenceDelay: 0.03,
  sequencePattern: 'wave', // 'linear' | 'centerOut' | 'wave' | 'spiral' | 'random'
  linearDirection: 'horizontal', // 'horizontal' | 'vertical' | 'diagonal' (used for linear, centerOut, wave)
  spiralDensity: 2, // Controls spiral tightness (higher = tighter spiral)
  globalSpeed: 1,

  // Scale Animation
  scaleEnabled: true,
  scaleMin: 0.3,
  scaleMax: 1.0,
  scaleCurve: 'sine', // 'sine' | 'bounce' | 'elastic' | 'snap' | 'smooth'

  // Position Animation
  positionEnabled: true,
  positionAmplitudeX: 20,
  positionAmplitudeY: 0,
  positionCurve: 'sine', // 'sine' | 'bounce' | 'elastic' | 'snap' | 'smooth'
  containToCell: false, // prevent letters from overlapping

  // Opacity Animation
  opacityEnabled: false,
  opacityMin: 0.2,
  opacityMax: 1.0,
  opacityCurve: 'sine',

  // Jitter (Simplex Noise)
  jitterEnabled: false,
  jitterAmount: 10,
  jitterSpeed: 0.5,

  // Spacing
  tracking: 0,
  lineSpacing: 0,

  // Phase Offsets
  rowPhaseOffset: 0,
  colPhaseOffset: 0,

  // Colors
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',
  backgroundTransparent: false,

  // Export
  exportWidth: 1920,
  exportHeight: 1080,
  exportFps: 30,
  exportDuration: 5,
  exportQuality: 0.8,
};

// Available fonts - curated for generative typography
export const FONTS = [
  // Monospace (good for grids)
  'Space Mono',
  'Roboto Mono',
  'IBM Plex Mono',
  'JetBrains Mono',
  'Fira Code',
  'Source Code Pro',
  'Inconsolata',
  'Ubuntu Mono',
  // Display/Impact (bold statements)
  'Bebas Neue',
  'Anton',
  'Oswald',
  'Archivo Black',
  'Russo One',
  'Black Ops One',
  'Bungee',
  'Monoton',
  // Geometric Sans (clean, modern)
  'Inter',
  'Space Grotesk',
  'Poppins',
  'Montserrat',
  'Raleway',
  'Work Sans',
  'Outfit',
  'DM Sans',
  // Serif/Contrast
  'Playfair Display',
  'Lora',
  'Merriweather',
  'Cormorant Garamond',
  // Experimental/Variable
  'Recursive',
  'Anybody',
  'Fraunces',
];

// Runtime storage for uploaded fonts
export const uploadedFonts = [];

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
