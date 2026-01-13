/**
 * FontManager - Handles font loading for vector export
 *
 * Manages p5.Font objects needed for textToPoints().
 * Google Fonts via CSS don't work with textToPoints - we need actual font files.
 *
 * Strategy:
 * - Uploaded fonts: Load from dataUrl using p5.loadFont()
 * - Google Fonts: Fetch TTF from googleapis and load
 */

import { uploadedFonts } from '../config.js';

// Google Fonts API base URL for fetching actual font files
const GOOGLE_FONTS_CSS_URL = 'https://fonts.googleapis.com/css2?family=';

class FontManager {
  constructor() {
    this.loadedFonts = new Map(); // fontName -> p5.Font object
    this.loadingPromises = new Map(); // fontName -> Promise (prevent duplicate loads)
    this.p5Instance = null;
  }

  /**
   * Set the p5 instance (required for loadFont)
   */
  setP5Instance(p5) {
    this.p5Instance = p5;
  }

  /**
   * Check if a font is loaded and ready
   */
  isLoaded(fontName) {
    return this.loadedFonts.has(fontName);
  }

  /**
   * Get a loaded font (returns null if not loaded)
   */
  getFont(fontName) {
    return this.loadedFonts.get(fontName) || null;
  }

  /**
   * Load a font for vector export
   * Returns a Promise that resolves to the p5.Font object
   */
  async loadFont(fontName) {
    // Already loaded
    if (this.loadedFonts.has(fontName)) {
      return this.loadedFonts.get(fontName);
    }

    // Already loading - return existing promise
    if (this.loadingPromises.has(fontName)) {
      return this.loadingPromises.get(fontName);
    }

    // Start loading
    const loadPromise = this._loadFontInternal(fontName);
    this.loadingPromises.set(fontName, loadPromise);

    try {
      const font = await loadPromise;
      this.loadedFonts.set(fontName, font);
      return font;
    } catch (error) {
      console.error(`Failed to load font "${fontName}":`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(fontName);
    }
  }

  /**
   * Internal font loading logic
   */
  async _loadFontInternal(fontName) {
    if (!this.p5Instance) {
      throw new Error('FontManager: p5 instance not set. Call setP5Instance() first.');
    }

    // Check if it's an uploaded font
    const uploadedFont = uploadedFonts.find(f => f.name === fontName);
    if (uploadedFont) {
      return this._loadFromDataUrl(fontName, uploadedFont.dataUrl);
    }

    // Try to load as Google Font
    return this._loadGoogleFont(fontName);
  }

  /**
   * Load font from dataUrl (for uploaded fonts)
   */
  async _loadFromDataUrl(fontName, dataUrl) {
    return new Promise((resolve, reject) => {
      this.p5Instance.loadFont(
        dataUrl,
        (font) => {
          console.log(`FontManager: Loaded uploaded font "${fontName}"`);
          resolve(font);
        },
        (error) => {
          reject(new Error(`Failed to load font "${fontName}" from dataUrl: ${error}`));
        }
      );
    });
  }

  /**
   * Load Google Font by fetching the TTF file
   *
   * Google Fonts CSS contains URLs to actual font files.
   * We need to parse the CSS and extract the TTF URL.
   */
  async _loadGoogleFont(fontName) {
    try {
      // Fetch the CSS that contains the font file URL
      const cssUrl = `${GOOGLE_FONTS_CSS_URL}${encodeURIComponent(fontName)}&display=swap`;

      // Need to request with a user-agent that gets TTF (not WOFF2)
      // Use a simple approach: fetch CSS and parse for url()
      const response = await fetch(cssUrl, {
        headers: {
          // Request TTF format by using an older user-agent
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; rv:40.0) Gecko/20100101 Firefox/40.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Google Fonts CSS fetch failed: ${response.status}`);
      }

      const css = await response.text();

      // Parse CSS to find font URL
      // Look for: src: url(https://fonts.gstatic.com/...) format('truetype')
      // or just any url() in the CSS
      const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/);

      if (!urlMatch) {
        throw new Error(`Could not find font URL in Google Fonts CSS for "${fontName}"`);
      }

      const fontUrl = urlMatch[1];
      console.log(`FontManager: Found Google Font URL for "${fontName}": ${fontUrl}`);

      // Load the font file using p5
      return new Promise((resolve, reject) => {
        this.p5Instance.loadFont(
          fontUrl,
          (font) => {
            console.log(`FontManager: Loaded Google Font "${fontName}"`);
            resolve(font);
          },
          (error) => {
            reject(new Error(`Failed to load Google Font "${fontName}": ${error}`));
          }
        );
      });
    } catch (error) {
      console.error(`FontManager: Google Font loading failed for "${fontName}":`, error);
      throw error;
    }
  }

  /**
   * Preload multiple fonts
   */
  async preloadFonts(fontNames) {
    const results = await Promise.allSettled(
      fontNames.map(name => this.loadFont(name))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`FontManager: Preloaded ${successful} fonts, ${failed} failed`);
    return { successful, failed };
  }

  /**
   * Clear all loaded fonts (for memory management)
   */
  clear() {
    this.loadedFonts.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get list of loaded font names
   */
  getLoadedFontNames() {
    return Array.from(this.loadedFonts.keys());
  }
}

// Singleton instance
export const fontManager = new FontManager();
export default fontManager;
