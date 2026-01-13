/**
 * Vector Module
 *
 * Exports for vector-based rendering and export:
 * - FontManager: Load fonts for textToPoints
 * - GlyphCache: Cache extracted glyph points
 * - PathExporter: Generate SVG with vector paths
 */

export { fontManager } from './FontManager.js';
export { glyphCache } from './GlyphCache.js';
export { generateVectorSVG, estimateSVGSize } from './PathExporter.js';
