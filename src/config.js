// Parameters for staggered type compositions
export const PARAMS = {
  // Canvas
  aspectRatio: '1:1',

  // Text
  text: 'HELLO WORLD',
  mode: 'letter', // 'letter' | 'word'
  textDistribution: 'repeat', // 'repeat' | 'split-letter' | 'split-word'
  font: 'Inter',
  fontSize: 36,

  // Grid
  columns: 20,
  rows: 12,

  // Sequencing (the core feature)
  waveCycles: 2, // Number of wave cycles across the grid (1-15)
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
  positionMode: 'oscillate', // 'oscillate' | 'travel'
  positionOrigin: 'off', // 'off' | 'center' | 'edges' | 'side0to1' | 'side1to0'
  positionAmplitudeX: 20, // X amplitude (oscillate: pixels, travel: % of canvas)
  positionAmplitudeY: 0, // Y amplitude (oscillate: pixels, travel: % of canvas)
  positionFrequency: 1, // Wave frequency - higher = more wave cycles
  positionCurve: 'sine', // 'sine' | 'bounce' | 'elastic' | 'snap' | 'smooth'
  positionNoiseIntensity: 0.3, // Controls noise curve intensity (0-1)
  positionEasing: 'linear', // 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInQuart' | 'easeOutQuart' | 'easeInOutQuart'
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

  // Vector Export (for SVG with embedded paths)
  useVectorExport: true, // Feature flag: export as vector paths vs text elements

  // Extrusion (Clone Stack Effect)
  extrusionEnabled: false,
  cloneCount: 20, // 1-100, hard limit 100
  cloneMode: 'linear', // 'linear' | 'wave'
  cloneDensityX: 1, // px offset per clone (linear mode)
  cloneDensityY: 1,
  cloneWaveAmplitude: 20, // px (wave mode)
  cloneWaveFrequency: 0.2, // radians per clone (wave mode)
  cloneOpacityDecay: 0.95, // multiplier per clone (0.9 = 90% of previous)
  cloneScaleDecay: 1.0, // multiplier per clone (1.0 = no change)

  // Vector rendering detail
  sampleFactor: 0.5, // 0.1 (low detail) to 1.0 (high detail) for textToPoints
};

// Aspect ratio presets
export const ASPECT_RATIOS = {
  '2:1': 2 / 1,
  '16:9': 16 / 9,
  '3:2': 3 / 2,
  '4:3': 4 / 3,
  '5:4': 5 / 4,
  '1:1': 1,
  '4:5': 4 / 5,
  '3:4': 3 / 4,
  '2:3': 2 / 3,
  '9:16': 9 / 16,
  '1:2': 1 / 2,
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
  doubleSinusoid: (t) => {
    // Combines two sine waves at different frequencies for a more complex wave pattern
    const primary = Math.sin(t);
    const secondary = Math.sin(t * 2.3) * 0.3;
    return (primary + secondary + 1) / 2;
  },
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
  noise: (t, intensity = 0.3) => {
    // Pseudo-random noise based on sine functions
    // Lower frequency and amplitude for subtler noise
    const n = Math.sin(t * 5.9898 + t * 38.233) * 43758.5453;
    const raw = (n - Math.floor(n));
    // Blend between 0.5 (centered) and raw noise based on intensity
    return 0.5 + (raw - 0.5) * intensity;
  },
};

// Easing functions (applied to time before passing to curve)
export const EASINGS = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
};

// Sequence patterns
export const PATTERNS = ['linear', 'centerOut', 'wave', 'spiral', 'random'];
