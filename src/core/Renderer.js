import { sortByDepth } from '../transforms/index.js';
import { TextEngine } from './TextEngine.js';

export class Renderer {
  constructor(p5Instance) {
    this.p = p5Instance;
  }

  /**
   * Render all items with transforms applied
   */
  render(items, params) {
    const p = this.p;

    // Sort by depth if depth is enabled (back to front)
    let sortedItems = items;
    if (params.depthEnabled) {
      sortedItems = sortByDepth(items);
    }

    for (const item of sortedItems) {
      this.renderItem(item, params);
    }
  }

  /**
   * Render a single item
   */
  renderItem(item, params) {
    const p = this.p;
    const { char, transformed } = item;

    if (!transformed) return;

    let { x, y, scale, rotation, opacity } = transformed;

    // Safeguard against NaN/Infinity
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(scale) || scale <= 0) scale = 1;
    if (!isFinite(opacity)) opacity = 1;
    if (!isFinite(rotation)) rotation = 0;

    // Clamp values
    opacity = Math.max(0, Math.min(1, opacity));
    scale = Math.max(0.01, Math.min(10, scale));

    // Skip if fully transparent
    if (opacity <= 0.01) return;

    p.push();

    // Move to position
    p.translate(x, y);

    // Apply rotation
    if (rotation !== 0) {
      p.rotate(rotation);
    }

    // Apply scale
    if (scale !== 1) {
      p.scale(scale);
    }

    // Set color with opacity
    const color = this.getColor(item, params);
    p.fill(p.red(color), p.green(color), p.blue(color), opacity * 255);

    // Handle ASCII mode
    let displayChar = char;
    if (params.asciiMode && params.asciiDensityWave) {
      // Use opacity/depth as density value
      const density = opacity;
      displayChar = TextEngine.getAsciiChar(density, params.asciiChars);
    }

    // Draw character
    p.textSize(params.fontSize);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(displayChar, 0, 0);

    p.pop();
  }

  /**
   * Get color for item based on color mode
   */
  getColor(item, params) {
    const p = this.p;
    const { row, col, totalRows, totalCols, transformed } = item;

    switch (params.colorMode) {
      case 'rainbow': {
        const hue = (col / totalCols + row / totalRows) % 1;
        p.colorMode(p.HSB, 1);
        const c = p.color(hue, 0.8, 1);
        p.colorMode(p.RGB, 255);
        return c;
      }

      case 'gradient': {
        const t = (col / totalCols + row / totalRows) / 2;
        const startColor = p.color(params.gradientStart);
        const endColor = p.color(params.gradientEnd);
        return p.lerpColor(startColor, endColor, t);
      }

      case 'depth': {
        if (transformed && transformed.depth) {
          const z = transformed.depth.z;
          const normalizedZ = (z + params.depthAmplitude) / (params.depthAmplitude * 2);
          const startColor = p.color(params.gradientStart);
          const endColor = p.color(params.gradientEnd);
          return p.lerpColor(startColor, endColor, normalizedZ);
        }
        return p.color(params.textColor);
      }

      case 'position': {
        const hue = col / totalCols;
        p.colorMode(p.HSB, 1);
        const c = p.color(hue, 0.7, 1);
        p.colorMode(p.RGB, 255);
        return c;
      }

      case 'solid':
      default:
        return p.color(params.textColor);
    }
  }

  /**
   * Clear canvas with background color
   */
  clear(params) {
    this.p.background(params.backgroundColor);
  }
}

export default Renderer;
