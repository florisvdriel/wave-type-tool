import { Pane } from 'tweakpane';
import { PARAMS, FONTS, ASCII_SETS } from './config.js';
import { getWaveTypes } from './waves/index.js';
import { getDistributionTypes } from './distributions/index.js';
import { loadPreset, getPresetNames } from './presets.js';

let pane = null;

export const initControls = (container, onExport, onPresetLoad) => {
  pane = new Pane({
    container,
    title: 'Wave Type',
  });

  // ===== TEXT =====
  const textFolder = pane.addFolder({ title: 'Text', expanded: true });
  textFolder.addBinding(PARAMS, 'text', { label: 'Text' });
  textFolder.addBinding(PARAMS, 'mode', {
    label: 'Mode',
    options: { 'Letters': 'letter', 'Words': 'word' },
  });
  textFolder.addBinding(PARAMS, 'font', {
    label: 'Font',
    options: FONTS.reduce((acc, f) => ({ ...acc, [f]: f }), {}),
  });
  textFolder.addBinding(PARAMS, 'fontSize', { label: 'Size', min: 8, max: 120, step: 1 });
  textFolder.addBinding(PARAMS, 'letterSpacing', { label: 'Spacing', min: -20, max: 50, step: 1 });

  // ===== DISTRIBUTION =====
  const distFolder = pane.addFolder({ title: 'Distribution', expanded: false });
  distFolder.addBinding(PARAMS, 'distribution', {
    label: 'Type',
    options: getDistributionTypes().reduce((acc, d) => ({ ...acc, [d]: d }), {}),
  });
  distFolder.addBinding(PARAMS, 'columns', { label: 'Columns', min: 3, max: 50, step: 1 });
  distFolder.addBinding(PARAMS, 'rows', { label: 'Rows', min: 2, max: 30, step: 1 });
  distFolder.addBinding(PARAMS, 'radius', { label: 'Radius', min: 50, max: 600, step: 10 });
  distFolder.addBinding(PARAMS, 'spiralTightness', { label: 'Spiral Tight', min: 0.1, max: 2, step: 0.1 });
  distFolder.addBinding(PARAMS, 'randomSeed', { label: 'Random Seed', min: 1, max: 1000, step: 1 });

  // ===== WAVE =====
  const waveFolder = pane.addFolder({ title: 'Wave Type', expanded: false });
  waveFolder.addBinding(PARAMS, 'waveType', {
    label: 'Type',
    options: getWaveTypes().reduce((acc, w) => ({ ...acc, [w]: w }), {}),
  });
  waveFolder.addBinding(PARAMS, 'waveDirection', {
    label: 'Direction',
    options: {
      'Horizontal': 'horizontal',
      'Vertical': 'vertical',
      'Radial': 'radial',
      'Both': 'both',
    },
  });
  waveFolder.addBinding(PARAMS, 'globalSpeed', { label: 'Global Speed', min: 0, max: 3, step: 0.1 });
  waveFolder.addBinding(PARAMS, 'paused', { label: 'Paused' });

  // ===== POSITION TRANSFORM =====
  const posFolder = pane.addFolder({ title: 'Position', expanded: false });
  posFolder.addBinding(PARAMS, 'positionEnabled', { label: 'Enabled' });
  posFolder.addBinding(PARAMS, 'positionAmplitudeX', { label: 'Amplitude X', min: 0, max: 150, step: 1 });
  posFolder.addBinding(PARAMS, 'positionAmplitudeY', { label: 'Amplitude Y', min: 0, max: 150, step: 1 });
  posFolder.addBinding(PARAMS, 'positionFrequency', { label: 'Frequency', min: 0.01, max: 0.5, step: 0.01 });
  posFolder.addBinding(PARAMS, 'positionSpeed', { label: 'Speed', min: 0, max: 0.1, step: 0.005 });
  posFolder.addBinding(PARAMS, 'positionPhase', { label: 'Phase', min: 0, max: 2, step: 0.05 });

  // ===== SCALE TRANSFORM =====
  const scaleFolder = pane.addFolder({ title: 'Scale', expanded: false });
  scaleFolder.addBinding(PARAMS, 'scaleEnabled', { label: 'Enabled' });
  scaleFolder.addBinding(PARAMS, 'scaleMin', { label: 'Min Scale', min: 0.01, max: 2, step: 0.05 });
  scaleFolder.addBinding(PARAMS, 'scaleMax', { label: 'Max Scale', min: 0.1, max: 5, step: 0.1 });
  scaleFolder.addBinding(PARAMS, 'scaleMode', {
    label: 'Mode',
    options: {
      'Sine': 'sine',
      'Double Sine': 'doubleSine',
      'Triple Sine': 'tripleSine',
      'Pulse': 'pulse',
      'Inverse Pulse': 'inversePulse',
      'Bounce': 'bounce',
      'Breathe': 'breathe',
      'Heartbeat': 'heartbeat',
      'Steps': 'steps',
      'Triangle': 'triangle',
      'Sawtooth': 'sawtooth',
      'Square': 'square',
      'Smooth Square': 'smoothSquare',
      'Exponential': 'exponential',
      'Random': 'random',
    },
  });
  scaleFolder.addBinding(PARAMS, 'scaleDirection', {
    label: 'Direction',
    options: {
      'Horizontal': 'horizontal',
      'Vertical': 'vertical',
      'Radial': 'radial',
      'Radial Inverse': 'radialInverse',
      'Diagonal': 'diagonal',
      'Diagonal Alt': 'diagonalAlt',
      'Checkerboard': 'checkerboard',
      'Spiral': 'spiral',
    },
  });
  scaleFolder.addBinding(PARAMS, 'scaleFrequency', { label: 'Frequency', min: 0.01, max: 1, step: 0.01 });
  scaleFolder.addBinding(PARAMS, 'scaleSpeed', { label: 'Speed', min: 0, max: 0.2, step: 0.005 });
  scaleFolder.addBinding(PARAMS, 'scalePhase', { label: 'Phase', min: 0, max: 2, step: 0.05 });

  // ===== ROTATION TRANSFORM =====
  const rotFolder = pane.addFolder({ title: 'Rotation', expanded: false });
  rotFolder.addBinding(PARAMS, 'rotationEnabled', { label: 'Enabled' });
  rotFolder.addBinding(PARAMS, 'rotationAmplitude', { label: 'Amplitude (deg)', min: 0, max: 180, step: 5 });
  rotFolder.addBinding(PARAMS, 'rotationFrequency', { label: 'Frequency', min: 0.01, max: 0.5, step: 0.01 });
  rotFolder.addBinding(PARAMS, 'rotationSpeed', { label: 'Speed', min: 0, max: 0.1, step: 0.005 });
  rotFolder.addBinding(PARAMS, 'rotationPhase', { label: 'Phase', min: 0, max: 2, step: 0.05 });

  // ===== OPACITY TRANSFORM =====
  const opacityFolder = pane.addFolder({ title: 'Opacity', expanded: false });
  opacityFolder.addBinding(PARAMS, 'opacityEnabled', { label: 'Enabled' });
  opacityFolder.addBinding(PARAMS, 'opacityBase', { label: 'Base', min: 0, max: 1, step: 0.05 });
  opacityFolder.addBinding(PARAMS, 'opacityAmplitude', { label: 'Amplitude', min: 0, max: 1, step: 0.05 });
  opacityFolder.addBinding(PARAMS, 'opacityMin', { label: 'Minimum', min: 0, max: 1, step: 0.05 });
  opacityFolder.addBinding(PARAMS, 'opacityFrequency', { label: 'Frequency', min: 0.01, max: 0.5, step: 0.01 });
  opacityFolder.addBinding(PARAMS, 'opacitySpeed', { label: 'Speed', min: 0, max: 0.1, step: 0.005 });
  opacityFolder.addBinding(PARAMS, 'opacityPhase', { label: 'Phase', min: 0, max: 2, step: 0.05 });

  // ===== DEPTH TRANSFORM =====
  const depthFolder = pane.addFolder({ title: 'Depth (3D)', expanded: false });
  depthFolder.addBinding(PARAMS, 'depthEnabled', { label: 'Enabled' });
  depthFolder.addBinding(PARAMS, 'depthAmplitude', { label: 'Amplitude', min: 0, max: 500, step: 10 });
  depthFolder.addBinding(PARAMS, 'depthPerspective', { label: 'Perspective', min: 200, max: 2000, step: 50 });
  depthFolder.addBinding(PARAMS, 'depthScaleEffect', { label: 'Scale Effect' });
  depthFolder.addBinding(PARAMS, 'depthOpacityEffect', { label: 'Opacity Effect' });
  depthFolder.addBinding(PARAMS, 'depthFrequency', { label: 'Frequency', min: 0.01, max: 0.5, step: 0.01 });
  depthFolder.addBinding(PARAMS, 'depthSpeed', { label: 'Speed', min: 0, max: 0.1, step: 0.005 });
  depthFolder.addBinding(PARAMS, 'depthPhase', { label: 'Phase', min: 0, max: 2, step: 0.05 });

  // ===== ASCII MODE =====
  const asciiFolder = pane.addFolder({ title: 'ASCII', expanded: false });
  asciiFolder.addBinding(PARAMS, 'asciiMode', { label: 'Enabled' });
  asciiFolder.addBinding(PARAMS, 'asciiChars', {
    label: 'Charset',
    options: Object.keys(ASCII_SETS).reduce((acc, k) => ({ ...acc, [k]: ASCII_SETS[k] }), {}),
  });
  asciiFolder.addBinding(PARAMS, 'asciiDensityWave', { label: 'Density Wave' });

  // ===== COLORS =====
  const colorFolder = pane.addFolder({ title: 'Colors', expanded: false });
  colorFolder.addBinding(PARAMS, 'backgroundColor', { label: 'Background' });
  colorFolder.addBinding(PARAMS, 'textColor', { label: 'Text' });
  colorFolder.addBinding(PARAMS, 'colorMode', {
    label: 'Mode',
    options: {
      'Solid': 'solid',
      'Rainbow': 'rainbow',
      'Gradient': 'gradient',
      'Depth': 'depth',
      'Position': 'position',
    },
  });
  colorFolder.addBinding(PARAMS, 'gradientStart', { label: 'Gradient Start' });
  colorFolder.addBinding(PARAMS, 'gradientEnd', { label: 'Gradient End' });

  // ===== PRESETS =====
  const presetFolder = pane.addFolder({ title: 'Presets', expanded: true });
  const presetState = { preset: 'Default' };
  presetFolder.addBinding(presetState, 'preset', {
    label: 'Load',
    options: getPresetNames().reduce((acc, p) => ({ ...acc, [p]: p }), {}),
  }).on('change', (ev) => {
    loadPreset(ev.value);
    pane.refresh();
    if (onPresetLoad) onPresetLoad();
  });

  // ===== EXPORT =====
  const exportFolder = pane.addFolder({ title: 'Export', expanded: true });

  // Quick exports
  exportFolder.addButton({ title: 'Save PNG' }).on('click', () => {
    if (onExport) onExport('png');
  });
  exportFolder.addButton({ title: 'Save SVG' }).on('click', () => {
    if (onExport) onExport('svg');
  });

  // MP4 Export settings
  const mp4Folder = exportFolder.addFolder({ title: 'MP4 Settings', expanded: false });
  mp4Folder.addBinding(PARAMS, 'exportWidth', {
    label: 'Width',
    options: {
      '1280 (720p)': 1280,
      '1920 (1080p)': 1920,
      '2560 (1440p)': 2560,
      '3840 (4K)': 3840,
    },
  });
  mp4Folder.addBinding(PARAMS, 'exportHeight', {
    label: 'Height',
    options: {
      '720': 720,
      '1080': 1080,
      '1440': 1440,
      '2160 (4K)': 2160,
    },
  });
  mp4Folder.addBinding(PARAMS, 'exportFps', {
    label: 'FPS',
    options: {
      '24': 24,
      '30': 30,
      '60': 60,
    },
  });
  mp4Folder.addBinding(PARAMS, 'exportDuration', { label: 'Duration (sec)', min: 1, max: 30, step: 1 });
  mp4Folder.addBinding(PARAMS, 'exportQuality', { label: 'Quality', min: 0.3, max: 1, step: 0.1 });

  // Export progress state
  const exportState = { progress: 0, isExporting: false };
  const progressBinding = mp4Folder.addBinding(exportState, 'progress', {
    label: 'Progress',
    readonly: true,
    format: (v) => `${Math.round(v * 100)}%`,
    view: 'slider',
    min: 0,
    max: 1,
  });

  // MP4 Export button
  const mp4Button = mp4Folder.addButton({ title: 'Export MP4' });
  mp4Button.on('click', async () => {
    if (exportState.isExporting) return;

    exportState.isExporting = true;
    mp4Button.title = 'Exporting...';

    const onProgress = (progress) => {
      if (progress === null) {
        // Export complete
        exportState.isExporting = false;
        exportState.progress = 0;
        mp4Button.title = 'Export MP4';
        pane.refresh();
      } else {
        exportState.progress = progress;
        pane.refresh();
      }
    };

    if (onExport) {
      await onExport('mp4', onProgress);
    }
  });

  return pane;
};

export const refreshControls = () => {
  if (pane) pane.refresh();
};

export { pane };
