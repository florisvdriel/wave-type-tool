// Default parameters
export const PARAMS = {
  // Text
  text: 'hello world',
  mode: 'letter', // 'letter' | 'word'
  font: 'Space Mono',
  fontSize: 36,
  letterSpacing: 0,

  // Distribution
  distribution: 'grid', // 'grid' | 'circular' | 'spiral' | 'random' | 'wave'
  columns: 20,
  rows: 12,
  centerX: 0.5,
  centerY: 0.5,
  radius: 300,
  spiralTightness: 0.5,
  randomSeed: 42,

  // Wave
  waveType: 'sine', // 'sine' | 'triangle' | 'noise' | 'bounce' | 'square'
  waveDirection: 'horizontal', // 'horizontal' | 'vertical' | 'radial' | 'both'

  // Transforms - Position
  positionEnabled: true,
  positionAmplitudeX: 30,
  positionAmplitudeY: 0,
  positionFrequency: 0.15,
  positionSpeed: 0.03,
  positionPhase: 0.5,

  // Transforms - Scale
  scaleEnabled: false,
  scaleMin: 0.2,
  scaleMax: 2.0,
  scaleFrequency: 0.1,
  scaleSpeed: 0.02,
  scalePhase: 0.3,
  scaleMode: 'sine', // 'sine' | 'doubleSine' | 'pulse' | 'bounce' | 'steps' | 'random' | 'breathe'
  scaleDirection: 'radial', // 'horizontal' | 'vertical' | 'radial' | 'diagonal'

  // Transforms - Rotation
  rotationEnabled: false,
  rotationAmplitude: 45, // degrees
  rotationFrequency: 0.1,
  rotationSpeed: 0.02,
  rotationPhase: 0.4,

  // Transforms - Opacity
  opacityEnabled: false,
  opacityAmplitude: 0.5,
  opacityFrequency: 0.1,
  opacitySpeed: 0.02,
  opacityPhase: 0.2,
  opacityBase: 1,
  opacityMin: 0.1,

  // Transforms - Depth (Z)
  depthEnabled: false,
  depthAmplitude: 200,
  depthFrequency: 0.1,
  depthSpeed: 0.02,
  depthPhase: 0.3,
  depthPerspective: 800, // perspective distance
  depthScaleEffect: true, // scale based on Z
  depthOpacityEffect: true, // fade based on Z

  // ASCII Density
  asciiMode: false,
  asciiChars: ' .:-=+*#%@',
  asciiDensityWave: false,

  // Colors
  backgroundColor: '#0a0a0a',
  textColor: '#ffffff',
  colorMode: 'solid', // 'solid' | 'rainbow' | 'gradient' | 'depth'
  gradientStart: '#ff0000',
  gradientEnd: '#0000ff',

  // Global
  globalSpeed: 1,
  paused: false,

  // Export
  exportWidth: 1920,
  exportHeight: 1080,
  exportFps: 30,
  exportDuration: 5, // seconds
  exportQuality: 0.8, // 0-1
};

// Available fonts
export const FONTS = [
  'Space Mono',
  'Roboto Mono',
  'IBM Plex Mono',
  'Inter',
  'Space Grotesk',
  'Bebas Neue',
  'Playfair Display',
];

// ASCII character sets
export const ASCII_SETS = {
  'Standard': ' .:-=+*#%@',
  'Blocks': ' ░▒▓█',
  'Dots': ' ·•●',
  'Lines': ' |-/\\+',
  'Numbers': '0123456789',
  'Binary': '01',
};
