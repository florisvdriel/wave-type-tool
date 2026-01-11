import p5 from 'p5';
import { PARAMS } from './config.js';
import { applyTransforms } from './transforms/index.js';
import { initControls } from './controls.js';
import { exportPNG } from './export/png.js';
import { exportSVG } from './export/svg.js';
import { recordMP4, downloadBlob, setProgressCallback } from './export/mp4.js';

let time = 0;
let p5Instance = null;
let currentItems = [];
let isExporting = false;
let canvasContainer = null;

/**
 * Parse text into characters or words
 */
function parseText(text, mode) {
  if (mode === 'word') {
    return text.split(/\s+/).filter(w => w.length > 0);
  }
  return text.split('');
}

/**
 * Create grid layout with spacing adjustments
 */
function createGrid(chars, params, width, height) {
  const items = [];
  const { columns, rows, tracking, lineSpacing } = params;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  let charIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      items.push({
        char: chars[charIndex % chars.length],
        x: col * cellWidth + cellWidth / 2 + tracking,
        y: row * cellHeight + cellHeight / 2 + lineSpacing,
        row,
        col,
        totalRows: rows,
        totalCols: columns,
        cellWidth,
        cellHeight,
      });
      charIndex++;
    }
  }
  return items;
}

/**
 * Handle transparency change
 */
function handleTransparencyChange(isTransparent) {
  if (canvasContainer) {
    if (isTransparent) {
      canvasContainer.classList.add('transparent-bg');
    } else {
      canvasContainer.classList.remove('transparent-bg');
    }
  }
}

// p5.js sketch
const sketch = (p) => {
  p.setup = () => {
    const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('canvas-container');
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();
  };

  p.draw = () => {
    if (isExporting) return;

    // Handle transparent background
    if (PARAMS.backgroundTransparent) {
      p.clear();
    } else {
      p.background(PARAMS.backgroundColor);
    }

    renderFrame(p, time);
    time += PARAMS.globalSpeed;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
};

// Render frame
function renderFrame(p, t) {
  const chars = parseText(PARAMS.text, PARAMS.mode);
  if (chars.length === 0) return;

  const items = createGrid(chars, PARAMS, p.width, p.height);

  for (let i = 0; i < items.length; i++) {
    items[i].transformed = applyTransforms(items[i], i, t, PARAMS, p);
  }

  currentItems = items;
  p.textFont(PARAMS.font);

  // Render
  for (const item of items) {
    const { char, transformed } = item;
    if (!transformed) continue;

    let { x, y, scale, opacity, rotation } = transformed;
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    if (!isFinite(opacity)) opacity = 1;
    if (!isFinite(rotation)) rotation = 0;

    p.push();
    p.translate(x, y);
    p.rotate(p.radians(rotation));
    p.scale(scale);

    // Apply opacity
    const color = p.color(PARAMS.textColor);
    color.setAlpha(opacity * 255);
    p.fill(color);

    p.textSize(PARAMS.fontSize);
    p.text(char, 0, 0);
    p.pop();
  }
}

// Render to canvas (for export)
async function renderFrameToCanvas(ctx, canvas, t, params, p5Ref) {
  const width = canvas.width;
  const height = canvas.height;

  // Handle transparent background
  if (params.backgroundTransparent) {
    ctx.clearRect(0, 0, width, height);
  } else {
    ctx.fillStyle = params.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const chars = parseText(params.text, params.mode);
  if (chars.length === 0) return;

  const items = createGrid(chars, params, width, height);

  for (let i = 0; i < items.length; i++) {
    items[i].transformed = applyTransforms(items[i], i, t, params, p5Ref);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const item of items) {
    const { char, transformed } = item;
    if (!transformed) continue;

    let { x, y, scale, opacity, rotation } = transformed;
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    if (!isFinite(opacity)) opacity = 1;
    if (!isFinite(rotation)) rotation = 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(scale, scale);
    ctx.font = `${params.fontSize}px "${params.font}"`;

    // Apply opacity
    ctx.globalAlpha = opacity;
    ctx.fillStyle = params.textColor;
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
}

// Export handler
async function handleExport(type, onProgress) {
  if (type === 'png') {
    exportPNG(p5Instance, 'wave-type', PARAMS.backgroundTransparent);
  } else if (type === 'svg') {
    exportSVG(currentItems, PARAMS, p5Instance.width, p5Instance.height, 'wave-type');
  } else if (type === 'mp4') {
    isExporting = true;
    if (onProgress) setProgressCallback(onProgress);

    try {
      const blob = await recordMP4(
        {
          width: PARAMS.exportWidth,
          height: PARAMS.exportHeight,
          fps: PARAMS.exportFps,
          duration: PARAMS.exportDuration,
          quality: PARAMS.exportQuality,
        },
        (ctx, canvas, t, params) => renderFrameToCanvas(ctx, canvas, t, params, p5Instance),
        { ...PARAMS }
      );
      downloadBlob(blob, 'wave-type.mp4');
    } catch (error) {
      console.error('MP4 export failed:', error);
      alert('MP4 export failed: ' + error.message);
    } finally {
      isExporting = false;
      if (onProgress) onProgress(null);
    }
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  canvasContainer = document.getElementById('canvas-container');
  p5Instance = new p5(sketch);
  initControls(
    document.getElementById('controls'),
    handleExport,
    handleTransparencyChange
  );
});

window.PARAMS = PARAMS;
