import { Pane } from 'tweakpane';
import { PARAMS, FONTS, PATTERNS, uploadedFonts, ASPECT_RATIOS } from './config.js';

// Calculate export height based on width and aspect ratio
// Round to even number (required by H.264 encoder)
function getExportHeight() {
  const aspectRatio = ASPECT_RATIOS[PARAMS.aspectRatio] || 1;
  return Math.round(PARAMS.exportWidth / aspectRatio / 2) * 2;
}
import {
  BUILTIN_PRESETS,
  applyPreset,
  saveCustomPreset,
  exportPresetJSON,
  importPresetJSON,
  resetToDefaults,
  getPresetOptions,
  getAllPresets,
} from './presets.js';

let pane = null;
let fontBinding = null;
let presetState = { selected: '' };

// Show toast notification
function showToast(message, isError = true) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.style.background = isError ? '#ff4444' : '#44aa44';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Get all available fonts (Google + uploaded)
function getAllFonts() {
  const fonts = {};
  FONTS.forEach(f => fonts[f] = f);
  uploadedFonts.forEach(f => fonts[`${f.name} (uploaded)`] = f.name);
  return fonts;
}

// Inject @font-face for uploaded font
function injectFontFace(name, dataUrl) {
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: "${name}";
      src: url("${dataUrl}");
    }
  `;
  document.head.appendChild(style);
}

// Handle font file upload
async function handleFontUpload(file) {
  const validExtensions = ['.ttf', '.otf', '.woff', '.woff2'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!validExtensions.includes(ext)) {
    showToast(`Invalid font format. Supported: ${validExtensions.join(', ')}`);
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast('Font file too large (max 5MB)');
    return;
  }

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const fontName = file.name.replace(/\.[^/.]+$/, '');
    injectFontFace(fontName, dataUrl);

    // Wait for font to load
    await document.fonts.load(`16px "${fontName}"`);

    uploadedFonts.push({ name: fontName, dataUrl });

    // Update font dropdown
    if (fontBinding) {
      fontBinding.dispose();
      fontBinding = pane.children[0].children.find(c => c.label === 'Font');
      if (!fontBinding) {
        // Re-add binding with updated options
        const textFolder = pane.children[0];
        fontBinding = textFolder.addBinding(PARAMS, 'font', {
          label: 'Font',
          options: getAllFonts(),
        });
      }
    }

    // Select the uploaded font
    PARAMS.font = fontName;
    pane.refresh();

    showToast(`Font "${fontName}" loaded`, false);
  } catch (error) {
    console.error('Font upload failed:', error);
    showToast('Failed to load font');
  }
}

// Create font drop zone
function createFontDropZone(container) {
  const dropZone = document.createElement('div');
  dropZone.className = 'font-drop-zone';
  dropZone.innerHTML = `
    <span>Drop font file here or click to upload</span>
    <input type="file" accept=".ttf,.otf,.woff,.woff2">
  `;

  const fileInput = dropZone.querySelector('input');

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFontUpload(file);
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFontUpload(file);
  });

  // Insert after the pane element
  container.appendChild(dropZone);
}

export const initControls = (container, onExport, onTransparencyChange, onRedraw, onAspectRatioChange) => {
  pane = new Pane({
    container,
    title: 'Wave Type',
  });

  // Performance: Trigger redraw on any parameter change
  if (onRedraw) {
    pane.on('change', () => {
      onRedraw();
    });
  }


  // ===== PRESETS =====
  const presetFolder = pane.addFolder({ title: 'Presets', expanded: true });

  // Preset dropdown
  const presetBinding = presetFolder.addBinding(presetState, 'selected', {
    label: 'Preset',
    options: getPresetOptions(),
  });

  presetBinding.on('change', (ev) => {
    if (ev.value && !ev.value.startsWith('---')) {
      applyPreset(ev.value, PARAMS);
      pane.refresh();
    }
  });

  // Save preset button
  presetFolder.addButton({ title: 'Save Preset' }).on('click', () => {
    const name = prompt('Enter preset name:');
    if (name && name.trim()) {
      saveCustomPreset(name.trim(), PARAMS);
      // Update dropdown options
      presetBinding.dispose();
      presetFolder.children[0] = presetFolder.addBinding(presetState, 'selected', {
        label: 'Preset',
        options: getPresetOptions(),
      });
      showToast(`Preset "${name.trim()}" saved`, false);
    }
  });

  // Export/Import row
  presetFolder.addButton({ title: 'Export JSON' }).on('click', () => {
    if (!presetState.selected || presetState.selected.startsWith('---')) {
      showToast('Select a preset first');
      return;
    }
    const json = exportPresetJSON(presetState.selected);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${presetState.selected.replace(/\s+/g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Preset exported', false);
    }
  });

  // Import preset (hidden file input)
  const importInput = document.createElement('input');
  importInput.type = 'file';
  importInput.accept = '.json';
  importInput.style.display = 'none';
  container.appendChild(importInput);

  presetFolder.addButton({ title: 'Import JSON' }).on('click', () => {
    importInput.click();
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = importPresetJSON(event.target.result);
      if (result.success) {
        // Update dropdown and apply
        presetState.selected = result.preset.name;
        applyPreset(result.preset.name, PARAMS);
        pane.refresh();
        showToast(`Preset "${result.preset.name}" imported`, false);
      } else {
        showToast(result.error);
      }
    };
    reader.readAsText(file);
    importInput.value = ''; // Reset for next import
  });

  // Reset button
  presetFolder.addButton({ title: 'Reset to Default' }).on('click', () => {
    resetToDefaults(PARAMS);
    presetState.selected = '';
    pane.refresh();
    showToast('Reset to defaults', false);
  });

  // ===== CANVAS =====
  const canvasFolder = pane.addFolder({ title: 'Canvas', expanded: true });

  // Build aspect ratio options object
  const aspectRatioOptions = {};
  Object.keys(ASPECT_RATIOS).forEach(key => {
    aspectRatioOptions[key] = key;
  });

  const aspectRatioBinding = canvasFolder.addBinding(PARAMS, 'aspectRatio', {
    label: 'Aspect Ratio',
    options: aspectRatioOptions,
  });
  aspectRatioBinding.on('change', () => {
    if (onAspectRatioChange) onAspectRatioChange();
  });

  // ===== TEXT =====
  const textFolder = pane.addFolder({ title: 'Text', expanded: true });
  textFolder.addBinding(PARAMS, 'text', { label: 'Text' });

  const textModeBinding = textFolder.addBinding(PARAMS, 'textMode', {
    label: 'Mode',
    options: {
      'Repeat by Letter': 'repeat-letter',
      'Repeat by Word': 'repeat-word',
      'Split by Letter': 'split-letter',
      'Split by Word': 'split-word',
    },
  });

  const repeatPatternBinding = textFolder.addBinding(PARAMS, 'repeatPattern', {
    label: 'Pattern',
    options: {
      'Sequential': 'sequential',
      'Mirror': 'mirror',
      'Alternating': 'alternating',
    },
  });

  fontBinding = textFolder.addBinding(PARAMS, 'font', {
    label: 'Font',
    options: getAllFonts(),
  });
  textFolder.addBinding(PARAMS, 'fontSize', { label: 'Size', min: 12, max: 120, step: 1 });

  // Create font drop zone after pane
  createFontDropZone(container);

  // ===== GRID =====
  const gridFolder = pane.addFolder({ title: 'Grid', expanded: true });
  gridFolder.addBinding(PARAMS, 'columns', { label: 'Columns', min: 3, max: 150, step: 1 });
  gridFolder.addBinding(PARAMS, 'rows', { label: 'Rows', min: 2, max: 150, step: 1 });
  gridFolder.addBinding(PARAMS, 'gridMode', {
    label: 'Size Mode',
    options: {
      'Fill Canvas': 'fill',
      'Fixed Size': 'fixed',
    },
  });
  gridFolder.addBinding(PARAMS, 'tracking', { label: 'Column Gap', min: -50, max: 100, step: 1 });
  gridFolder.addBinding(PARAMS, 'lineSpacing', { label: 'Row Gap', min: -50, max: 100, step: 1 });

  // ===== SEQUENCE =====
  const seqFolder = pane.addFolder({ title: 'Sequence', expanded: true });

  const patternBinding = seqFolder.addBinding(PARAMS, 'sequencePattern', {
    label: 'Pattern',
    options: {
      'Linear': 'linear',
      'Center Out': 'centerOut',
      'Wave': 'wave',
      'Spiral': 'spiral',
      'Random': 'random',
    },
  });

  const directionBinding = seqFolder.addBinding(PARAMS, 'linearDirection', {
    label: 'Direction',
    options: {
      'Horizontal': 'horizontal',
      'Vertical': 'vertical',
      'Diagonal': 'diagonal',
    },
  });

  const spiralDensityBinding = seqFolder.addBinding(PARAMS, 'spiralDensity', {
    label: 'Spiral Density',
    min: 0.5,
    max: 10,
    step: 0.5,
    hidden: PARAMS.sequencePattern !== 'spiral',
  });

  // Update visibility based on pattern
  const updateSequenceControls = () => {
    const isSpiral = PARAMS.sequencePattern === 'spiral';
    const isRandom = PARAMS.sequencePattern === 'random';

    directionBinding.hidden = isSpiral || isRandom;
    spiralDensityBinding.hidden = !isSpiral;
    pane.refresh();
  };

  patternBinding.on('change', updateSequenceControls);
  updateSequenceControls(); // Initialize visibility

  seqFolder.addBinding(PARAMS, 'waveCycles', { label: 'Wave Cycles', min: 1, max: 15, step: 1 });
  seqFolder.addBinding(PARAMS, 'globalSpeed', { label: 'Speed', min: 0.1, max: 3, step: 0.1 });

  // ===== SCALE =====
  const scaleFolder = pane.addFolder({ title: 'Scale', expanded: true });
  scaleFolder.addBinding(PARAMS, 'scaleEnabled', { label: 'Enabled' });
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
  scaleFolder.addBinding(PARAMS, 'scaleMin', { label: 'Min', min: 0, max: 1, step: 0.01 });
  scaleFolder.addBinding(PARAMS, 'scaleMax', { label: 'Max', min: 0, max: 1, step: 0.01 });

  // ===== POSITION =====
  const posFolder = pane.addFolder({ title: 'Position', expanded: false });
  posFolder.addBinding(PARAMS, 'positionEnabled', { label: 'Enabled' });

  const positionModeBinding = posFolder.addBinding(PARAMS, 'positionMode', {
    label: 'Mode',
    options: {
      'Oscillate': 'oscillate',
      'Travel': 'travel',
    },
  });

  const positionOriginBinding = posFolder.addBinding(PARAMS, 'positionOrigin', {
    label: 'Amplitude Mode',
    options: {
      'Off': 'off',
      'From Center': 'center',
      'From Edges': 'edges',
      'Left → Right': 'side0to1',
      'Right → Left': 'side1to0',
    },
  });

  const positionCurveBinding = posFolder.addBinding(PARAMS, 'positionCurve', {
    label: 'Curve',
    options: {
      'Sine': 'sine',
      'Double Sinusoid': 'doubleSinusoid',
      'Bounce': 'bounce',
      'Elastic': 'elastic',
      'Snap': 'snap',
      'Smooth': 'smooth',
      'Noise': 'noise',
    },
  });

  const noiseIntensityBinding = posFolder.addBinding(PARAMS, 'positionNoiseIntensity', {
    label: 'Noise Intensity',
    min: 0,
    max: 1,
    step: 0.05,
    hidden: PARAMS.positionCurve !== 'noise',
  });

  const positionEasingBinding = posFolder.addBinding(PARAMS, 'positionEasing', {
    label: 'Easing',
    options: {
      'Linear': 'linear',
      'Ease In': 'easeIn',
      'Ease Out': 'easeOut',
      'Ease In Out': 'easeInOut',
      'Ease In Quad': 'easeInQuad',
      'Ease Out Quad': 'easeOutQuad',
      'Ease In Out Quad': 'easeInOutQuad',
      'Ease In Cubic': 'easeInCubic',
      'Ease Out Cubic': 'easeOutCubic',
      'Ease In Out Cubic': 'easeInOutCubic',
      'Ease In Quart': 'easeInQuart',
      'Ease Out Quart': 'easeOutQuart',
      'Ease In Out Quart': 'easeInOutQuart',
    },
  });

  const positionAmplitudeXBinding = posFolder.addBinding(PARAMS, 'positionAmplitudeX', {
    label: PARAMS.positionMode === 'travel' ? 'X Travel %' : 'X Amplitude',
    min: 0,
    max: PARAMS.positionMode === 'travel' ? 200 : 100,
    step: 1,
  });

  const positionAmplitudeYBinding = posFolder.addBinding(PARAMS, 'positionAmplitudeY', {
    label: PARAMS.positionMode === 'travel' ? 'Y Travel %' : 'Y Amplitude',
    min: 0,
    max: PARAMS.positionMode === 'travel' ? 200 : 100,
    step: 1,
  });

  const positionFrequencyBinding = posFolder.addBinding(PARAMS, 'positionFrequency', {
    label: 'Frequency',
    min: 0.1,
    max: 5,
    step: 0.1,
  });

  posFolder.addBinding(PARAMS, 'containToCell', {
    label: 'Contain to Cell',
  });

  // Update position controls visibility based on mode and curve selection
  const updatePositionControls = () => {
    const isTravel = PARAMS.positionMode === 'travel';
    const isNoise = PARAMS.positionCurve === 'noise';

    // Noise intensity only shown when noise curve selected
    noiseIntensityBinding.hidden = !isNoise;

    // Update amplitude labels based on mode
    positionAmplitudeXBinding.label = isTravel ? 'X Travel %' : 'X Amplitude';
    positionAmplitudeYBinding.label = isTravel ? 'Y Travel %' : 'Y Amplitude';

    pane.refresh();
  };

  positionModeBinding.on('change', updatePositionControls);
  positionCurveBinding.on('change', updatePositionControls);
  updatePositionControls(); // Initialize visibility

  // ===== COLLISION =====
  const collisionFolder = pane.addFolder({ title: 'Collision', expanded: false });
  collisionFolder.addBinding(PARAMS, 'collisionEnabled', { label: 'Enabled' });
  collisionFolder.addBinding(PARAMS, 'collisionStrength', {
    label: 'Strength',
    min: 0.1,
    max: 3.0,
    step: 0.1,
  });
  collisionFolder.addBinding(PARAMS, 'collisionDuration', {
    label: 'Duration',
    min: 0.1,
    max: 2.0,
    step: 0.1,
  });
  collisionFolder.addBinding(PARAMS, 'wallBounce', { label: 'Wall Bounce' });

  // ===== OPACITY =====
  const opacityFolder = pane.addFolder({ title: 'Opacity', expanded: false });
  opacityFolder.addBinding(PARAMS, 'opacityEnabled', { label: 'Enabled' });
  opacityFolder.addBinding(PARAMS, 'opacityMin', { label: 'Min', min: 0, max: 1, step: 0.05 });
  opacityFolder.addBinding(PARAMS, 'opacityMax', { label: 'Max', min: 0, max: 1, step: 0.05 });
  opacityFolder.addBinding(PARAMS, 'opacityCurve', {
    label: 'Curve',
    options: {
      'Sine': 'sine',
      'Bounce': 'bounce',
      'Elastic': 'elastic',
      'Snap': 'snap',
      'Smooth': 'smooth',
    },
  });

  // ===== JITTER =====
  const jitterFolder = pane.addFolder({ title: 'Jitter', expanded: false });
  jitterFolder.addBinding(PARAMS, 'jitterEnabled', { label: 'Enabled' });
  jitterFolder.addBinding(PARAMS, 'jitterAmount', { label: 'Amount', min: 0, max: 50, step: 1 });
  jitterFolder.addBinding(PARAMS, 'jitterSpeed', { label: 'Speed', min: 0.01, max: 2, step: 0.01 });

  // ===== EXTRUSION (Clone Stack Effect) =====
  const extrusionFolder = pane.addFolder({ title: 'Extrusion', expanded: false });
  extrusionFolder.addBinding(PARAMS, 'extrusionEnabled', { label: 'Enabled' });
  extrusionFolder.addBinding(PARAMS, 'cloneCount', {
    label: 'Clone Count',
    min: 1,
    max: 100,
    step: 1,
  });

  const cloneModeBinding = extrusionFolder.addBinding(PARAMS, 'cloneMode', {
    label: 'Mode',
    options: {
      'Linear': 'linear',
      'Wave': 'wave',
    },
  });

  // Linear mode controls
  const cloneDensityXBinding = extrusionFolder.addBinding(PARAMS, 'cloneDensityX', {
    label: 'Density X',
    min: -10,
    max: 10,
    step: 0.5,
    hidden: PARAMS.cloneMode !== 'linear',
  });

  const cloneDensityYBinding = extrusionFolder.addBinding(PARAMS, 'cloneDensityY', {
    label: 'Density Y',
    min: -10,
    max: 10,
    step: 0.5,
    hidden: PARAMS.cloneMode !== 'linear',
  });

  // Wave mode controls
  const cloneWaveAmplitudeBinding = extrusionFolder.addBinding(PARAMS, 'cloneWaveAmplitude', {
    label: 'Wave Amplitude',
    min: 0,
    max: 100,
    step: 1,
    hidden: PARAMS.cloneMode !== 'wave',
  });

  const cloneWaveFrequencyBinding = extrusionFolder.addBinding(PARAMS, 'cloneWaveFrequency', {
    label: 'Wave Frequency',
    min: 0.01,
    max: 1,
    step: 0.01,
    hidden: PARAMS.cloneMode !== 'wave',
  });

  // Common extrusion controls
  extrusionFolder.addBinding(PARAMS, 'cloneOpacityDecay', {
    label: 'Opacity Decay',
    min: 0.5,
    max: 1,
    step: 0.01,
  });

  extrusionFolder.addBinding(PARAMS, 'cloneScaleDecay', {
    label: 'Scale Decay',
    min: 0.9,
    max: 1.1,
    step: 0.01,
  });

  // Update extrusion controls visibility based on mode
  const updateExtrusionControls = () => {
    const isLinear = PARAMS.cloneMode === 'linear';

    cloneDensityXBinding.hidden = !isLinear;
    cloneDensityYBinding.hidden = !isLinear;
    cloneWaveAmplitudeBinding.hidden = isLinear;
    cloneWaveFrequencyBinding.hidden = isLinear;

    pane.refresh();
  };

  cloneModeBinding.on('change', updateExtrusionControls);
  updateExtrusionControls(); // Initialize visibility

  // ===== PHASE OFFSETS =====
  const phaseFolder = pane.addFolder({ title: 'Phase Offsets', expanded: false });
  phaseFolder.addBinding(PARAMS, 'rowPhaseOffset', { label: 'Row Phase', min: -1, max: 1, step: 0.05 });
  phaseFolder.addBinding(PARAMS, 'colPhaseOffset', { label: 'Col Phase', min: -1, max: 1, step: 0.05 });

  // ===== COLORS =====
  const colorFolder = pane.addFolder({ title: 'Colors', expanded: false });
  colorFolder.addBinding(PARAMS, 'backgroundColor', { label: 'Background' });
  colorFolder.addBinding(PARAMS, 'textColor', { label: 'Text' });
  colorFolder.addBinding(PARAMS, 'backgroundTransparent', { label: 'Transparent' })
    .on('change', (ev) => {
      if (onTransparencyChange) onTransparencyChange(ev.value);
    });

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

  // Export height display state (computed from width + aspect ratio)
  const exportHeightState = { height: getExportHeight() };

  const exportWidthBinding = mp4Folder.addBinding(PARAMS, 'exportWidth', {
    label: 'Width',
    options: { '1280': 1280, '1920': 1920, '2560': 2560, '3840': 3840 },
  });

  const exportHeightBinding = mp4Folder.addBinding(exportHeightState, 'height', {
    label: 'Height',
    readonly: true,
    format: (v) => `${v}px (auto)`,
  });

  // Update height when width or aspect ratio changes
  const updateExportHeight = () => {
    exportHeightState.height = getExportHeight();
    pane.refresh();
  };

  exportWidthBinding.on('change', updateExportHeight);
  aspectRatioBinding.on('change', updateExportHeight);

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

  // Trigger initial transparency state
  if (onTransparencyChange) onTransparencyChange(PARAMS.backgroundTransparent);

  return pane;
};

export const refreshControls = () => {
  if (pane) pane.refresh();
};

// Update font dropdown when fonts change
export const updateFontOptions = () => {
  if (fontBinding) {
    pane.refresh();
  }
};

export { pane };
