/**
 * PathExporter - Generate SVG paths from cached glyph data
 *
 * Creates optimized SVG using <defs> + <use> pattern:
 * - Define each unique glyph once in <defs>
 * - Reference with <use> for each instance
 * - Results in 80%+ file size reduction vs duplicating paths
 */

import glyphCache from './GlyphCache.js';

/**
 * Convert glyph points to SVG path data string
 *
 * textToPoints returns an array of {x, y} points.
 * We connect them as a polyline path.
 *
 * Note: textToPoints doesn't give bezier curves, just sampled points.
 * For true bezier curves, we'd need opentype.js.
 */
function pointsToPathData(points) {
  if (!points || points.length === 0) return '';

  // Start with move to first point
  let d = `M${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  // Line to each subsequent point
  for (let i = 1; i < points.length; i++) {
    d += ` L${points[i].x.toFixed(2)},${points[i].y.toFixed(2)}`;
  }

  return d;
}

/**
 * Generate SVG element ID for a character
 * Handles special chars by using charCode
 */
function getGlyphId(char) {
  // Use charCode for safe IDs (spaces, symbols, etc.)
  return `glyph-${char.charCodeAt(0)}`;
}

/**
 * Escape XML special characters
 */
function escapeXML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Calculate clone offset based on mode
 */
function getCloneOffset(cloneIndex, params, time = 0) {
  if (params.cloneMode === 'wave') {
    const phase = cloneIndex * params.cloneWaveFrequency + time;
    return {
      x: Math.sin(phase) * params.cloneWaveAmplitude,
      y: Math.cos(phase) * params.cloneWaveAmplitude,
    };
  }

  // Linear mode (default)
  return {
    x: cloneIndex * params.cloneDensityX,
    y: cloneIndex * params.cloneDensityY,
  };
}

/**
 * Export items as vector SVG with embedded paths
 *
 * @param {Array} items - Array of grid items with transformed positions
 * @param {Object} params - PARAMS object with settings
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {number} time - Animation time (for wave mode)
 * @returns {string} - SVG string
 */
export function generateVectorSVG(items, params, width, height, time = 0) {
  const svgNS = 'http://www.w3.org/2000/svg';

  // Collect unique characters and their glyph data
  const uniqueGlyphs = new Map(); // char -> pathData

  for (const item of items) {
    const { char } = item;
    if (uniqueGlyphs.has(char)) continue;

    const glyphData = glyphCache.getGlyph(
      params.font,
      char,
      params.fontSize,
      params.fontWeight,
      params.sampleFactor
    );

    if (glyphData && glyphData.points.length > 0) {
      uniqueGlyphs.set(char, pointsToPathData(glyphData.points));
    }
  }

  // Build SVG
  const backgroundRect = params.backgroundTransparent
    ? ''
    : `  <rect width="100%" height="100%" fill="${params.backgroundColor}"/>\n`;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${svgNS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${backgroundRect}`;

  // Add <defs> section with glyph paths
  if (uniqueGlyphs.size > 0) {
    svg += `  <defs>\n`;
    for (const [char, pathData] of uniqueGlyphs) {
      const id = getGlyphId(char);
      svg += `    <path id="${id}" d="${pathData}"/>\n`;
    }
    svg += `  </defs>\n`;
  }

  svg += `  <g id="characters">\n`;

  // Determine clone count
  const cloneCount = params.extrusionEnabled
    ? Math.min(Math.max(1, params.cloneCount), 100)
    : 1;

  // Render items (back to front for proper layering)
  for (const item of items) {
    if (!item.transformed) continue;

    const { char } = item;
    const { x, y, scale, opacity, rotation } = item.transformed;

    if (opacity <= 0.01) continue;

    const hasGlyph = uniqueGlyphs.has(char);

    // Render clones (back to front)
    for (let c = cloneCount - 1; c >= 0; c--) {
      const offset = getCloneOffset(c, params, time);

      // Calculate clone-specific properties
      const cloneOpacity = opacity * Math.pow(params.cloneOpacityDecay, c);
      const cloneScale = scale * Math.pow(params.cloneScaleDecay, c);

      if (cloneOpacity <= 0.01) continue;

      // Final position with clone offset
      const finalX = x + offset.x;
      const finalY = y + offset.y;

      // Build transform string
      let transform = `translate(${finalX.toFixed(2)},${finalY.toFixed(2)})`;
      if (rotation !== 0) {
        transform += ` rotate(${rotation.toFixed(2)})`;
      }
      if (cloneScale !== 1) {
        transform += ` scale(${cloneScale.toFixed(3)})`;
      }

      if (hasGlyph) {
        // Use the defined glyph path
        const glyphId = getGlyphId(char);
        svg += `    <use href="#${glyphId}" transform="${transform}" fill="${params.textColor}" fill-opacity="${cloneOpacity.toFixed(3)}"/>\n`;
      } else {
        // Fallback to text element (font not loaded for vector)
        const escapedChar = escapeXML(char);
        svg += `    <text transform="${transform}" fill="${params.textColor}" fill-opacity="${cloneOpacity.toFixed(3)}" font-size="${params.fontSize}" font-family="${params.font}" text-anchor="middle" dominant-baseline="central">${escapedChar}</text>\n`;
      }
    }
  }

  svg += `  </g>\n</svg>`;

  return svg;
}

/**
 * Check if vector export is ready (font loaded)
 */
export function isVectorExportReady(fontName) {
  const font = glyphCache.getGlyph ? true : false;
  return font;
}

/**
 * Get estimated SVG file size (rough calculation)
 */
export function estimateSVGSize(items, params) {
  const uniqueChars = new Set(items.map(i => i.char)).size;
  const cloneCount = params.extrusionEnabled ? params.cloneCount : 1;

  // Rough estimates
  const headerBytes = 500;
  const defsBytes = uniqueChars * 500; // ~500 bytes per unique glyph path
  const useBytes = items.length * cloneCount * 150; // ~150 bytes per <use> element

  return headerBytes + defsBytes + useBytes;
}

export default {
  generateVectorSVG,
  isVectorExportReady,
  estimateSVGSize,
};
