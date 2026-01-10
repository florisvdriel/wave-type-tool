import { PARAMS } from './config.js';

export const PRESETS = {
  'Default': {
    text: 'hello world',
    mode: 'letter',
    distribution: 'grid',
    columns: 20,
    rows: 12,
    waveType: 'sine',
    waveDirection: 'horizontal',
    positionEnabled: true,
    positionAmplitudeX: 30,
    positionAmplitudeY: 0,
    positionFrequency: 0.15,
    positionSpeed: 0.03,
    scaleEnabled: false,
    rotationEnabled: false,
    opacityEnabled: false,
    depthEnabled: false,
    colorMode: 'solid',
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
  },

  'Ocean Wave': {
    distribution: 'grid',
    waveType: 'sine',
    waveDirection: 'horizontal',
    positionEnabled: true,
    positionAmplitudeX: 50,
    positionAmplitudeY: 20,
    positionFrequency: 0.12,
    positionSpeed: 0.025,
    positionPhase: 0.6,
    scaleEnabled: true,
    scaleMin: 0.5,
    scaleMax: 1.5,
    scaleMode: 'sine',
    scaleDirection: 'horizontal',
    scaleFrequency: 0.1,
    colorMode: 'gradient',
    gradientStart: '#0066cc',
    gradientEnd: '#00ccff',
    backgroundColor: '#001122',
  },

  'Pulsing Grid': {
    distribution: 'grid',
    columns: 15,
    rows: 10,
    positionEnabled: false,
    scaleEnabled: true,
    scaleMin: 0.1,
    scaleMax: 2.5,
    scaleMode: 'pulse',
    scaleDirection: 'radial',
    scaleFrequency: 0.15,
    scaleSpeed: 0.04,
    scalePhase: 0.8,
    colorMode: 'rainbow',
    backgroundColor: '#0a0a0a',
  },

  'Heartbeat': {
    text: 'LOVE',
    mode: 'letter',
    distribution: 'grid',
    columns: 12,
    rows: 8,
    fontSize: 48,
    positionEnabled: false,
    scaleEnabled: true,
    scaleMin: 0.8,
    scaleMax: 1.8,
    scaleMode: 'heartbeat',
    scaleDirection: 'radial',
    scaleFrequency: 0.3,
    scaleSpeed: 0.08,
    colorMode: 'solid',
    textColor: '#ff3366',
    backgroundColor: '#1a0a10',
  },

  'Breathing': {
    distribution: 'grid',
    columns: 20,
    rows: 12,
    positionEnabled: false,
    scaleEnabled: true,
    scaleMin: 0.3,
    scaleMax: 1.2,
    scaleMode: 'breathe',
    scaleDirection: 'radialInverse',
    scaleFrequency: 0.08,
    scaleSpeed: 0.015,
    scalePhase: 1.5,
    colorMode: 'gradient',
    gradientStart: '#6600ff',
    gradientEnd: '#00ffcc',
    backgroundColor: '#050510',
  },

  'Matrix Rain': {
    text: '01',
    mode: 'letter',
    distribution: 'grid',
    columns: 30,
    rows: 20,
    waveType: 'noise',
    waveDirection: 'vertical',
    positionEnabled: true,
    positionAmplitudeX: 0,
    positionAmplitudeY: 40,
    positionSpeed: 0.04,
    opacityEnabled: true,
    opacityAmplitude: 0.6,
    opacityMin: 0.1,
    colorMode: 'solid',
    textColor: '#00ff00',
    backgroundColor: '#000000',
    fontSize: 24,
  },

  'Depth Tunnel': {
    distribution: 'circular',
    radius: 350,
    waveType: 'sine',
    positionEnabled: false,
    depthEnabled: true,
    depthAmplitude: 300,
    depthPerspective: 600,
    depthScaleEffect: true,
    depthOpacityEffect: true,
    depthFrequency: 0.15,
    depthSpeed: 0.03,
    colorMode: 'depth',
    gradientStart: '#ff0066',
    gradientEnd: '#6600ff',
    backgroundColor: '#0a0a0a',
  },

  'Spiral Galaxy': {
    distribution: 'spiral',
    spiralTightness: 1.2,
    radius: 400,
    columns: 25,
    rows: 15,
    waveType: 'sine',
    positionEnabled: true,
    positionAmplitudeX: 20,
    positionAmplitudeY: 20,
    scaleEnabled: true,
    scaleAmplitude: 0.5,
    colorMode: 'rainbow',
    backgroundColor: '#0a0010',
  },

  'Bouncy Text': {
    waveType: 'bounce',
    waveDirection: 'horizontal',
    positionEnabled: true,
    positionAmplitudeX: 0,
    positionAmplitudeY: 60,
    positionFrequency: 0.2,
    positionSpeed: 0.05,
    positionPhase: 0.3,
    scaleEnabled: true,
    scaleAmplitude: 0.4,
    scalePhase: 0.3,
    colorMode: 'position',
    backgroundColor: '#1a1a2e',
  },

  'ASCII Art': {
    asciiMode: true,
    asciiChars: ' .:-=+*#%@',
    asciiDensityWave: true,
    distribution: 'grid',
    columns: 40,
    rows: 25,
    fontSize: 16,
    waveType: 'noise',
    positionEnabled: false,
    opacityEnabled: true,
    opacityAmplitude: 0.8,
    opacitySpeed: 0.02,
    colorMode: 'solid',
    textColor: '#00ff88',
    backgroundColor: '#000000',
  },

  'Chaos': {
    distribution: 'random',
    randomSeed: 42,
    waveType: 'noise',
    waveDirection: 'both',
    positionEnabled: true,
    positionAmplitudeX: 80,
    positionAmplitudeY: 80,
    positionFrequency: 0.3,
    positionSpeed: 0.06,
    scaleEnabled: true,
    scaleAmplitude: 0.8,
    rotationEnabled: true,
    rotationAmplitude: 90,
    rotationSpeed: 0.04,
    colorMode: 'rainbow',
    backgroundColor: '#0f0f0f',
  },

  'Gentle Ripple': {
    distribution: 'grid',
    waveType: 'sine',
    waveDirection: 'radial',
    positionEnabled: true,
    positionAmplitudeX: 15,
    positionAmplitudeY: 15,
    positionFrequency: 0.08,
    positionSpeed: 0.015,
    positionPhase: 0.3,
    opacityEnabled: true,
    opacityAmplitude: 0.3,
    opacityBase: 0.8,
    colorMode: 'solid',
    textColor: '#aaaaaa',
    backgroundColor: '#111111',
  },

  '3D Wave': {
    distribution: 'grid',
    columns: 25,
    rows: 15,
    waveType: 'sine',
    waveDirection: 'both',
    positionEnabled: true,
    positionAmplitudeX: 30,
    positionAmplitudeY: 0,
    depthEnabled: true,
    depthAmplitude: 200,
    depthPerspective: 800,
    depthScaleEffect: true,
    depthOpacityEffect: true,
    depthFrequency: 0.12,
    depthSpeed: 0.025,
    depthPhase: 0.4,
    colorMode: 'depth',
    gradientStart: '#ff6600',
    gradientEnd: '#0066ff',
    backgroundColor: '#0a0a0a',
  },
};

export const loadPreset = (name) => {
  const preset = PRESETS[name];
  if (!preset) return false;

  // Merge preset into PARAMS
  Object.assign(PARAMS, preset);
  return true;
};

export const getPresetNames = () => Object.keys(PRESETS);

export const savePreset = (name) => {
  // Create a copy of current params
  const preset = { ...PARAMS };
  PRESETS[name] = preset;
  return preset;
};

export const exportPreset = (name) => {
  const preset = PRESETS[name] || PARAMS;
  return JSON.stringify(preset, null, 2);
};

export const importPreset = (jsonString) => {
  try {
    const preset = JSON.parse(jsonString);
    Object.assign(PARAMS, preset);
    return true;
  } catch (e) {
    console.error('Failed to import preset:', e);
    return false;
  }
};
