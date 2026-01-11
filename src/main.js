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
 * Create grid layout
 */
function createGrid(chars, params, width, height) {
  const items = [];
  const { columns, rows } = params;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  let charIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      items.push({
        char: chars[charIndex % chars.length],
        x: col * cellWidth + cellWidth / 2,
        y: row * cellHeight + cellHeight / 2,
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

    p.background(PARAMS.backgroundColor);
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
    items[i].transformed = applyTransforms(items[i], i, t, PARAMS);
  }

  currentItems = items;
  p.textFont(PARAMS.font);

  // Render
  for (const item of items) {
    const { char, transformed } = item;
    if (!transformed) continue;

    let { x, y, scale, opacity } = transformed;
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    if (!isFinite(opacity)) opacity = 1;

    p.push();
    p.translate(x, y);
    p.scale(scale);
    p.fill(PARAMS.textColor);
    p.textSize(PARAMS.fontSize);
    p.text(char, 0, 0);
    p.pop();
  }
}

// Render to canvas (for export)
async function renderFrameToCanvas(ctx, canvas, t, params) {
  const width = canvas.width;
  const height = canvas.height;

  ctx.fillStyle = params.backgroundColor;
  ctx.fillRect(0, 0, width, height);

  const chars = parseText(params.text, params.mode);
  if (chars.length === 0) return;

  const items = createGrid(chars, params, width, height);

  for (let i = 0; i < items.length; i++) {
    items[i].transformed = applyTransforms(items[i], i, t, params);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const item of items) {
    const { char, transformed } = item;
    if (!transformed) continue;

    let { x, y, scale, opacity } = transformed;
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(scale) || scale <= 0) scale = 1;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.font = `${params.fontSize}px "${params.font}"`;
    ctx.fillStyle = params.textColor;
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
}

// Export handler
async function handleExport(type, onProgress) {
  if (type === 'png') {
    exportPNG(p5Instance, 'wave-type');
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
        renderFrameToCanvas,
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
  p5Instance = new p5(sketch);
  initControls(document.getElementById('controls'), handleExport);
});

window.PARAMS = PARAMS;
