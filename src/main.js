import p5 from 'p5';
import { PARAMS, FONTS } from './config.js';
import { TextEngine } from './core/TextEngine.js';
import { Renderer } from './core/Renderer.js';
import { getDistribution } from './distributions/index.js';
import { applyTransforms } from './transforms/index.js';
import { initControls, refreshControls } from './controls.js';
import { exportPNG } from './export/png.js';
import { exportSVG } from './export/svg.js';
import { recordMP4, downloadBlob, setProgressCallback } from './export/mp4.js';

let time = 0;
let p5Instance = null;
let renderer = null;
let currentItems = [];
let isExporting = false;

// p5.js sketch
const sketch = (p) => {
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('canvas-container');
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();

    // Initialize renderer
    renderer = new Renderer(p);

    // Set noise seed for reproducible results
    p.noiseSeed(42);
  };

  p.draw = () => {
    // Don't update main canvas while exporting
    if (isExporting) {
      return;
    }

    // Clear background
    p.background(PARAMS.backgroundColor);

    // Skip if paused
    if (PARAMS.paused) {
      // Still render, just don't update time
      renderFrameP5(p, time);
      return;
    }

    renderFrameP5(p, time);

    // Update time
    time += PARAMS.globalSpeed;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

// Render frame using p5.js (for live preview)
function renderFrameP5(p, t) {
  const chars = TextEngine.parse(PARAMS.text, PARAMS.mode);
  if (chars.length === 0) return;

  const distributionFn = getDistribution(PARAMS.distribution);
  const items = distributionFn(chars, PARAMS, p.width, p.height);

  for (let i = 0; i < items.length; i++) {
    items[i].transformed = applyTransforms(items[i], i, t, PARAMS, p);
  }

  currentItems = items;
  p.textFont(PARAMS.font);
  renderer.render(items, PARAMS);
}

// Render frame to native canvas (for MP4 export)
async function renderFrameToCanvas(ctx, canvas, t, params) {
  const width = canvas.width;
  const height = canvas.height;

  // Clear with background color
  ctx.fillStyle = params.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Parse text
  const chars = TextEngine.parse(params.text, params.mode);
  if (chars.length === 0) return;

  // Get distribution
  const distributionFn = getDistribution(params.distribution);
  const items = distributionFn(chars, params, width, height);

  // Apply transforms (using a mock p5 for noise - simplified)
  for (let i = 0; i < items.length; i++) {
    items[i].transformed = applyTransforms(items[i], i, t, params, null);
  }

  // Sort by depth if enabled
  let sortedItems = items;
  if (params.depthEnabled) {
    sortedItems = [...items].sort((a, b) => {
      const zA = a.transformed?.z ?? 0;
      const zB = b.transformed?.z ?? 0;
      return zA - zB;
    });
  }

  // Setup text rendering
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Render each item
  for (const item of sortedItems) {
    const { char, transformed, row, col, totalRows, totalCols } = item;
    if (!transformed) continue;

    let { x, y, scale, rotation, opacity } = transformed;

    // Safeguards
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    if (!isFinite(opacity)) opacity = 1;
    if (!isFinite(rotation)) rotation = 0;

    opacity = Math.max(0, Math.min(1, opacity));
    scale = Math.max(0.01, Math.min(10, scale));

    if (opacity <= 0.01) continue;

    // Get color
    const color = getColorForCanvas(item, params, ctx);

    ctx.save();
    ctx.translate(x, y);
    if (rotation !== 0) {
      ctx.rotate(rotation);
    }
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }

    ctx.font = `${params.fontSize}px "${params.font}"`;
    ctx.globalAlpha = opacity;
    ctx.fillStyle = color;
    ctx.fillText(char, 0, 0);

    ctx.restore();
  }
}

// Get color for canvas rendering
function getColorForCanvas(item, params, ctx) {
  const { row, col, totalRows, totalCols, transformed } = item;

  switch (params.colorMode) {
    case 'rainbow': {
      const hue = ((col / totalCols + row / totalRows) % 1) * 360;
      return `hsl(${hue}, 80%, 50%)`;
    }

    case 'gradient':
    case 'depth': {
      let t = (col / totalCols + row / totalRows) / 2;
      if (params.colorMode === 'depth' && transformed?.depth) {
        const z = transformed.depth.z;
        t = (z + params.depthAmplitude) / (params.depthAmplitude * 2);
      }
      return interpolateColor(params.gradientStart, params.gradientEnd, t);
    }

    case 'position': {
      const hue = (col / totalCols) * 360;
      return `hsl(${hue}, 70%, 50%)`;
    }

    case 'solid':
    default:
      return params.textColor;
  }
}

// Color interpolation helper
function interpolateColor(color1, color2, t) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

// Export handler
async function handleExport(type, onProgress) {
  if (type === 'png') {
    exportPNG(p5Instance, 'wave-type');
  } else if (type === 'svg') {
    exportSVG(currentItems, PARAMS, p5Instance.width, p5Instance.height, 'wave-type');
  } else if (type === 'mp4') {
    await handleMP4Export(onProgress);
  }
}

// MP4 Export handler
async function handleMP4Export(onProgress) {
  isExporting = true;

  // Set up progress callback
  if (onProgress) {
    setProgressCallback(onProgress);
  }

  try {
    const blob = await recordMP4(
      {
        width: PARAMS.exportWidth,
        height: PARAMS.exportHeight,
        fps: PARAMS.exportFps,
        duration: PARAMS.exportDuration,
        quality: PARAMS.exportQuality,
      },
      renderFrameToCanvas,
      { ...PARAMS }
    );

    downloadBlob(blob, 'wave-type.mp4');
  } catch (error) {
    console.error('MP4 export failed:', error);
    alert('MP4 export failed: ' + error.message);
  } finally {
    isExporting = false;
    if (onProgress) {
      onProgress(null); // Signal completion
    }
  }
}

// Preset load handler
function handlePresetLoad() {
  time = 0;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  p5Instance = new p5(sketch);

  initControls(
    document.getElementById('controls'),
    handleExport,
    handlePresetLoad
  );
});

// Export for debugging
window.PARAMS = PARAMS;
window.getTime = () => time;
