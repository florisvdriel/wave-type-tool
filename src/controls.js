import { Pane } from 'tweakpane';
import { PARAMS, FONTS, PATTERNS } from './config.js';

let pane = null;

export const initControls = (container, onExport) => {
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
  textFolder.addBinding(PARAMS, 'fontSize', { label: 'Size', min: 12, max: 120, step: 1 });

  // ===== GRID =====
  const gridFolder = pane.addFolder({ title: 'Grid', expanded: true });
  gridFolder.addBinding(PARAMS, 'columns', { label: 'Columns', min: 3, max: 40, step: 1 });
  gridFolder.addBinding(PARAMS, 'rows', { label: 'Rows', min: 2, max: 20, step: 1 });

  // ===== SEQUENCE =====
  const seqFolder = pane.addFolder({ title: 'Sequence', expanded: true });
  seqFolder.addBinding(PARAMS, 'sequencePattern', {
    label: 'Pattern',
    options: {
      'Linear': 'linear',
      'Center Out': 'centerOut',
      'Wave': 'wave',
      'Spiral': 'spiral',
      'Random': 'random',
    },
  });
  seqFolder.addBinding(PARAMS, 'sequenceDelay', { label: 'Delay', min: 0, max: 0.15, step: 0.005 });
  seqFolder.addBinding(PARAMS, 'globalSpeed', { label: 'Speed', min: 0.1, max: 3, step: 0.1 });

  // ===== SCALE =====
  const scaleFolder = pane.addFolder({ title: 'Scale', expanded: true });
  scaleFolder.addBinding(PARAMS, 'scaleEnabled', { label: 'Enabled' });
  scaleFolder.addBinding(PARAMS, 'scaleMin', { label: 'Min', min: 0, max: 1, step: 0.05 });
  scaleFolder.addBinding(PARAMS, 'scaleMax', { label: 'Max', min: 0.5, max: 3, step: 0.1 });
  scaleFolder.addBinding(PARAMS, 'scaleCurve', {
    label: 'Curve',
    options: {
      'Sine': 'sine',
      'Bounce': 'bounce',
      'Elastic': 'elastic',
      'Snap': 'snap',
      'Smooth': 'smooth',
    },
  });

  // ===== POSITION =====
  const posFolder = pane.addFolder({ title: 'Position', expanded: false });
  posFolder.addBinding(PARAMS, 'positionEnabled', { label: 'Enabled' });
  posFolder.addBinding(PARAMS, 'positionAmplitudeX', { label: 'X', min: 0, max: 100, step: 1 });
  posFolder.addBinding(PARAMS, 'positionAmplitudeY', { label: 'Y', min: 0, max: 100, step: 1 });
  posFolder.addBinding(PARAMS, 'positionCurve', {
    label: 'Curve',
    options: {
      'Sine': 'sine',
      'Bounce': 'bounce',
      'Elastic': 'elastic',
      'Snap': 'snap',
      'Smooth': 'smooth',
    },
  });
  posFolder.addBinding(PARAMS, 'containToCell', { label: 'Contain to Cell' });

  // ===== COLORS =====
  const colorFolder = pane.addFolder({ title: 'Colors', expanded: false });
  colorFolder.addBinding(PARAMS, 'backgroundColor', { label: 'Background' });
  colorFolder.addBinding(PARAMS, 'textColor', { label: 'Text' });

  // ===== EXPORT =====
  const exportFolder = pane.addFolder({ title: 'Export', expanded: false });
  exportFolder.addButton({ title: 'Save PNG' }).on('click', () => {
    if (onExport) onExport('png');
  });
  exportFolder.addButton({ title: 'Save SVG' }).on('click', () => {
    if (onExport) onExport('svg');
  });

  // MP4 settings
  const mp4Folder = exportFolder.addFolder({ title: 'MP4', expanded: false });
  mp4Folder.addBinding(PARAMS, 'exportWidth', {
    label: 'Width',
    options: { '1280': 1280, '1920': 1920, '2560': 2560, '3840': 3840 },
  });
  mp4Folder.addBinding(PARAMS, 'exportHeight', {
    label: 'Height',
    options: { '720': 720, '1080': 1080, '1440': 1440, '2160': 2160 },
  });
  mp4Folder.addBinding(PARAMS, 'exportDuration', { label: 'Duration', min: 1, max: 30, step: 1 });

  const exportState = { progress: 0, isExporting: false };
  mp4Folder.addBinding(exportState, 'progress', {
    label: 'Progress',
    readonly: true,
    format: (v) => `${Math.round(v * 100)}%`,
    view: 'slider',
    min: 0,
    max: 1,
  });

  const mp4Button = mp4Folder.addButton({ title: 'Export MP4' });
  mp4Button.on('click', async () => {
    if (exportState.isExporting) return;
    exportState.isExporting = true;
    mp4Button.title = 'Exporting...';

    const onProgress = (progress) => {
      if (progress === null) {
        exportState.isExporting = false;
        exportState.progress = 0;
        mp4Button.title = 'Export MP4';
        pane.refresh();
      } else {
        exportState.progress = progress;
        pane.refresh();
      }
    };

    if (onExport) await onExport('mp4', onProgress);
  });

  return pane;
};

export const refreshControls = () => {
  if (pane) pane.refresh();
};

export { pane };
