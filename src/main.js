import p5 from 'p5';
import { PARAMS, ASPECT_RATIOS } from './config.js';
import { applyTransforms, getSpatialPhase } from './transforms/index.js';
import { initControls } from './controls.js';
import { exportPNG } from './export/png.js';
import { exportSVG } from './export/svg.js';
import { recordMP4, downloadBlob, setProgressCallback } from './export/mp4.js';
import { fontManager, glyphCache } from './vector/index.js';
import { CollisionDetector, CollisionResolver } from './physics/index.js';

let time = 0;
let p5Instance = null;
let currentItems = [];
let isExporting = false;
let canvasContainer = null;

// Performance optimization: Grid caching
let gridCache = null;
let gridCacheKey = null;
let spatialPhaseCacheKey = null;
let needsRedraw = true;

// Vector rendering cache
let glyphPointsCache = new Map(); // char -> points array
let glyphCacheKey = null; // cache key for glyph invalidation

// Collision physics
const collisionDetector = new CollisionDetector();
const collisionResolver = new CollisionResolver();

/**
 * Generate cache key for grid (invalidates when grid structure changes)
 */
function getGridCacheKey(params, width, height) {
  return `${params.text}|${params.mode}|${params.textDistribution}|${params.columns}|${params.rows}|${params.tracking}|${params.lineSpacing}|${width}|${height}`;
}

/**
 * Generate cache key for glyph points (invalidates when font or size changes)
 */
function getGlyphCacheKey(params) {
  return `${params.font}|${params.fontSize}|${params.sampleFactor}`;
}

/**
 * Generate cache key for spatial phases (invalidates when sequence params change)
 */
function getSpatialPhaseCacheKey(params) {
  return `${params.sequencePattern}|${params.waveCycles}|${params.linearDirection}|${params.spiralDensity}|${params.rowPhaseOffset}|${params.colPhaseOffset}`;
}

/**
 * Calculate canvas dimensions based on aspect ratio and window size
 */
function calculateCanvasDimensions(windowWidth, windowHeight, aspectRatio) {
  const ratio = ASPECT_RATIOS[aspectRatio] || 1;

  // Account for controls panel width
  const CONTROLS_WIDTH = 312; // 280px panel + 32px padding
  const CANVAS_PADDING = 40;

  // Calculate available space (viewport minus controls)
  const availableWidth = windowWidth - CONTROLS_WIDTH;
  const availableHeight = windowHeight;

  // Apply padding within canvas area
  const maxWidth = availableWidth - CANVAS_PADDING * 2;
  const maxHeight = availableHeight - CANVAS_PADDING * 2;

  let width, height;
  if (maxWidth / maxHeight > ratio) {
    height = maxHeight;
    width = height * ratio;
  } else {
    width = maxWidth;
    height = width / ratio;
  }

  return { width: Math.floor(width), height: Math.floor(height) };
}

/**
 * Precompute spatial phases for all items (avoids per-frame trig calculations)
 */
function precomputeSpatialPhases(items, params) {
  for (const item of items) {
    item.spatialPhase = getSpatialPhase(item, params);
  }
}

/**
 * Mark canvas as needing redraw (called from controls)
 */
export function markNeedsRedraw() {
  needsRedraw = true;
}

/**
 * Invalidate grid cache (called when structure changes)
 */
export function invalidateGridCache() {
  gridCacheKey = null;
  spatialPhaseCacheKey = null;
  needsRedraw = true;
  // Clear collision states when grid changes
  collisionResolver.clear();
}

/**
 * Handle aspect ratio change (resize canvas)
 */
function handleAspectRatioChange() {
  if (p5Instance) {
    const { width, height } = calculateCanvasDimensions(
      p5Instance.windowWidth, p5Instance.windowHeight, PARAMS.aspectRatio
    );
    gridCacheKey = null;
    needsRedraw = true;
    p5Instance.resizeCanvas(width, height);
  }
}

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
  const { columns, rows, tracking, lineSpacing, textDistribution } = params;
  const cellWidth = width / columns;
  const cellHeight = height / rows;

  let charIndex = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      let char = '';

      if (textDistribution === 'split-letter') {
        // Each cell gets one letter from input (empty if not enough chars)
        char = charIndex < chars.length ? chars[charIndex] : '';
      } else if (textDistribution === 'split-word') {
        // Each row gets one word from input (first column only)
        if (col === 0 && row < chars.length) {
          char = chars[row];
        }
      } else {
        // Default 'repeat': Text repeats to fill all grid cells
        char = chars[charIndex % chars.length];
      }

      // Only add item if there's a character to display
      if (char) {
        items.push({
          char,
          x: col * cellWidth + cellWidth / 2 + tracking,
          y: row * cellHeight + cellHeight / 2 + lineSpacing,
          row,
          col,
          totalRows: rows,
          totalCols: columns,
          cellWidth,
          cellHeight,
        });
      }
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
    const { width, height } = calculateCanvasDimensions(
      p.windowWidth, p.windowHeight, PARAMS.aspectRatio
    );
    const canvas = p.createCanvas(width, height);
    canvas.parent('canvas-container');
    p.textAlign(p.CENTER, p.CENTER);
    p.noStroke();

    // Initialize FontManager with p5 instance for vector export
    fontManager.setP5Instance(p);
  };

  p.draw = () => {
    if (isExporting) return;

    // Performance: Skip frame if nothing changed and no animation enabled
    const isAnimating = PARAMS.scaleEnabled || PARAMS.positionEnabled ||
                        PARAMS.opacityEnabled || PARAMS.jitterEnabled;
    if (!needsRedraw && !isAnimating) return;
    needsRedraw = false;

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
    const { width, height } = calculateCanvasDimensions(
      p.windowWidth, p.windowHeight, PARAMS.aspectRatio
    );
    gridCacheKey = null; // Invalidate cache on resize
    needsRedraw = true;
    p.resizeCanvas(width, height);
  };
};

// Render frame
function renderFrame(p, t) {
  const chars = parseText(PARAMS.text, PARAMS.mode);
  if (chars.length === 0) return;

  // Performance: Cache grid - only recreate when structure changes
  const newGridKey = getGridCacheKey(PARAMS, p.width, p.height);
  const newPhaseKey = getSpatialPhaseCacheKey(PARAMS);

  if (gridCacheKey !== newGridKey) {
    gridCache = createGrid(chars, PARAMS, p.width, p.height);
    gridCacheKey = newGridKey;
    // Also recompute spatial phases when grid changes
    precomputeSpatialPhases(gridCache, PARAMS);
    spatialPhaseCacheKey = newPhaseKey;
  } else if (spatialPhaseCacheKey !== newPhaseKey) {
    // Grid unchanged but sequence params changed - recompute phases only
    precomputeSpatialPhases(gridCache, PARAMS);
    spatialPhaseCacheKey = newPhaseKey;
  }

  const items = gridCache;

  for (let i = 0; i < items.length; i++) {
    items[i].transformed = applyTransforms(items[i], i, t, PARAMS, p);
  }

  // Collision detection and response
  if (PARAMS.collisionEnabled) {
    // Detect collisions
    const collisions = collisionDetector.detectCollisions(
      items, PARAMS, p.width, p.height
    );

    // Resolve new collisions (start collision animations)
    collisionResolver.resolveCollisions(collisions, items, t, PARAMS);

    // Update ongoing collision responses (calculate offsets)
    collisionResolver.updateCollisionResponses(items, t, PARAMS);

    // Apply collision offsets to transformed positions
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.collisionOffset && item.transformed) {
        item.transformed.x += item.collisionOffset.x;
        item.transformed.y += item.collisionOffset.y;
      }
    }
  } else {
    // Clear collision state when disabled
    collisionResolver.clear();
  }

  currentItems = items;
  p.textFont(PARAMS.font);

  // Determine clone count
  const cloneCount = PARAMS.extrusionEnabled
    ? Math.min(Math.max(1, PARAMS.cloneCount), 100)
    : 1;

  // Render (with optional extrusion clones)
  for (const item of items) {
    const { char, transformed } = item;
    if (!transformed) continue;

    let { x, y, scale, opacity, rotation } = transformed;
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    if (!isFinite(opacity)) opacity = 1;
    if (!isFinite(rotation)) rotation = 0;

    // Render clones back-to-front (furthest clone first)
    for (let c = cloneCount - 1; c >= 0; c--) {
      // Calculate clone offset based on mode
      let offsetX = 0, offsetY = 0;
      if (PARAMS.cloneMode === 'wave') {
        const phase = c * PARAMS.cloneWaveFrequency + time * 0.05;
        offsetX = Math.sin(phase) * PARAMS.cloneWaveAmplitude;
        offsetY = Math.cos(phase) * PARAMS.cloneWaveAmplitude;
      } else {
        // Linear mode
        offsetX = c * PARAMS.cloneDensityX;
        offsetY = c * PARAMS.cloneDensityY;
      }

      // Calculate clone-specific properties
      const cloneOpacity = opacity * Math.pow(PARAMS.cloneOpacityDecay, c);
      const cloneScale = scale * Math.pow(PARAMS.cloneScaleDecay, c);

      if (cloneOpacity <= 0.01) continue;

      p.push();
      p.translate(x + offsetX, y + offsetY);
      p.rotate(p.radians(rotation));
      p.scale(cloneScale);

      // Apply opacity
      const color = p.color(PARAMS.textColor);
      color.setAlpha(cloneOpacity * 255);
      p.fill(color);

      p.textSize(PARAMS.fontSize);
      p.text(char, 0, 0);
      p.pop();
    }
  }
}

// Render to canvas (for export)
async function renderFrameToCanvas(ctx, canvas, t, params, p5Ref, exportScale = 1) {
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

  // Collision detection and response (for export)
  if (params.collisionEnabled) {
    const collisions = collisionDetector.detectCollisions(items, params, width, height);
    collisionResolver.resolveCollisions(collisions, items, t, params);
    collisionResolver.updateCollisionResponses(items, t, params);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.collisionOffset && item.transformed) {
        item.transformed.x += item.collisionOffset.x;
        item.transformed.y += item.collisionOffset.y;
      }
    }
  }

  // Text rendering optimizations for crisp export
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Scale fontSize proportionally to export resolution
  const scaledFontSize = params.fontSize * exportScale;

  // Determine clone count
  const cloneCount = params.extrusionEnabled
    ? Math.min(Math.max(1, params.cloneCount), 100)
    : 1;

  for (const item of items) {
    const { char, transformed } = item;
    if (!transformed) continue;

    let { x, y, scale, opacity, rotation } = transformed;
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    if (!isFinite(opacity)) opacity = 1;
    if (!isFinite(rotation)) rotation = 0;

    // Render clones back-to-front
    for (let c = cloneCount - 1; c >= 0; c--) {
      // Calculate clone offset based on mode
      let offsetX = 0, offsetY = 0;
      if (params.cloneMode === 'wave') {
        const phase = c * params.cloneWaveFrequency + t * 0.05;
        offsetX = Math.sin(phase) * params.cloneWaveAmplitude;
        offsetY = Math.cos(phase) * params.cloneWaveAmplitude;
      } else {
        // Linear mode
        offsetX = c * params.cloneDensityX;
        offsetY = c * params.cloneDensityY;
      }

      // Calculate clone-specific properties
      const cloneOpacity = opacity * Math.pow(params.cloneOpacityDecay, c);
      const cloneScale = scale * Math.pow(params.cloneScaleDecay, c);

      if (cloneOpacity <= 0.01) continue;

      ctx.save();
      ctx.translate(x + offsetX, y + offsetY);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.scale(cloneScale, cloneScale);
      ctx.font = `${scaledFontSize}px "${params.font}"`;

      // Apply opacity
      ctx.globalAlpha = cloneOpacity;
      ctx.fillStyle = params.textColor;
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  }
}

// Export handler
async function handleExport(type, onProgress) {
  if (type === 'png') {
    exportPNG(p5Instance, 'wave-type', PARAMS.backgroundTransparent);
  } else if (type === 'svg') {
    // SVG export is now async (loads fonts for vector export)
    try {
      await exportSVG(currentItems, PARAMS, p5Instance.width, p5Instance.height, 'wave-type');
    } catch (error) {
      console.error('SVG export failed:', error);
      alert('SVG export failed: ' + error.message);
    }
  } else if (type === 'mp4') {
    isExporting = true;
    if (onProgress) setProgressCallback(onProgress);

    // Reset collision state for clean export
    collisionResolver.clear();

    // Get current preview width for scale calculation
    const previewWidth = p5Instance.width;

    // Calculate export dimensions respecting aspect ratio
    // Ensure dimensions are even (required by H.264 encoder)
    const aspectRatio = ASPECT_RATIOS[PARAMS.aspectRatio] || 1;
    const exportWidth = PARAMS.exportWidth;
    const exportHeight = Math.round(exportWidth / aspectRatio / 2) * 2; // Round to even

    try {
      const blob = await recordMP4(
        {
          width: exportWidth,
          height: exportHeight,
          fps: PARAMS.exportFps,
          duration: PARAMS.exportDuration,
          quality: PARAMS.exportQuality,
        },
        (ctx, canvas, t, params, exportScale) => renderFrameToCanvas(ctx, canvas, t, params, p5Instance, exportScale),
        { ...PARAMS },
        previewWidth
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
    handleTransparencyChange,
    markNeedsRedraw,
    handleAspectRatioChange
  );
});

window.PARAMS = PARAMS;
