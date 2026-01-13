/**
 * GlyphCache - LRU cache for textToPoints results
 *
 * Caches the vector points extracted from characters to avoid
 * expensive textToPoints() calls on every frame/export.
 *
 * Key: `${fontName}|${char}|${fontSize}|${sampleFactor}`
 * Value: { points: Array<{x, y}>, bounds: {x, y, w, h} }
 *
 * Performance considerations:
 * - Max 200 glyphs cached (configurable)
 * - LRU eviction when limit reached
 * - Only cache at current fontSize (don't pre-cache all sizes)
 */

import fontManager from './FontManager.js';

class GlyphCache {
  constructor(maxSize = 200) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.stats = {
      hits: 0,
      misses: 0,
    };
  }

  /**
   * Generate cache key for a glyph
   */
  getCacheKey(fontName, char, fontSize, sampleFactor = 0.5) {
    return `${fontName}|${char}|${fontSize}|${sampleFactor}`;
  }

  /**
   * Get glyph points from cache or generate them
   *
   * @param {string} fontName - Name of the font
   * @param {string} char - Single character to get points for
   * @param {number} fontSize - Font size in pixels
   * @param {number} sampleFactor - Detail level (0.1 = low, 1.0 = high)
   * @returns {Object|null} - { points: Array<{x,y}>, bounds: {x,y,w,h} } or null if font not loaded
   */
  getGlyph(fontName, char, fontSize, sampleFactor = 0.5) {
    const key = this.getCacheKey(fontName, char, fontSize, sampleFactor);

    // Cache hit
    if (this.cache.has(key)) {
      this.stats.hits++;
      // Move to end for LRU (delete and re-add)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }

    // Cache miss - need to generate
    this.stats.misses++;

    const font = fontManager.getFont(fontName);
    if (!font) {
      console.warn(`GlyphCache: Font "${fontName}" not loaded`);
      return null;
    }

    // Generate points using p5's textToPoints
    try {
      const points = font.textToPoints(char, 0, 0, fontSize, {
        sampleFactor: sampleFactor,
        simplifyThreshold: 0,
      });

      // Calculate bounds
      const bounds = this._calculateBounds(points);

      const glyphData = { points, bounds };

      // Add to cache
      this.cache.set(key, glyphData);

      // LRU eviction if over limit
      if (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }

      return glyphData;
    } catch (error) {
      console.error(`GlyphCache: Failed to get points for "${char}":`, error);
      return null;
    }
  }

  /**
   * Calculate bounding box for a set of points
   */
  _calculateBounds(points) {
    if (!points || points.length === 0) {
      return { x: 0, y: 0, w: 0, h: 0 };
    }

    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const point of points) {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    }

    return {
      x: minX,
      y: minY,
      w: maxX - minX,
      h: maxY - minY,
    };
  }

  /**
   * Batch get glyphs for a string
   * Returns array of glyph data (null entries for failed chars)
   */
  getGlyphsForString(fontName, text, fontSize, sampleFactor = 0.5) {
    return text.split('').map(char =>
      this.getGlyph(fontName, char, fontSize, sampleFactor)
    );
  }

  /**
   * Check if a glyph is cached
   */
  has(fontName, char, fontSize, sampleFactor = 0.5) {
    const key = this.getCacheKey(fontName, char, fontSize, sampleFactor);
    return this.cache.has(key);
  }

  /**
   * Invalidate cache for a specific font (e.g., when font changes)
   */
  invalidateFont(fontName) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${fontName}|`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`GlyphCache: Invalidated ${keysToDelete.length} entries for font "${fontName}"`);
  }

  /**
   * Invalidate cache for a specific font size
   */
  invalidateFontSize(fontSize) {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      const parts = key.split('|');
      if (parts[2] === String(fontSize)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`GlyphCache: Invalidated ${keysToDelete.length} entries for fontSize ${fontSize}`);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.log('GlyphCache: Cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(1)
      : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Preload glyphs for common characters
   */
  preloadCommonGlyphs(fontName, fontSize, sampleFactor = 0.5) {
    const commonChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
    let loaded = 0;

    for (const char of commonChars) {
      const glyph = this.getGlyph(fontName, char, fontSize, sampleFactor);
      if (glyph) loaded++;
    }

    console.log(`GlyphCache: Preloaded ${loaded}/${commonChars.length} common glyphs for "${fontName}"`);
    return loaded;
  }
}

// Singleton instance
export const glyphCache = new GlyphCache(200);
export default glyphCache;
