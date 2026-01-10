import { ASCII_SETS } from '../config.js';

export class TextEngine {
  /**
   * Parse text into array of units (letters or words)
   */
  static parse(text, mode = 'letter') {
    if (!text || text.length === 0) {
      return ['?'];
    }

    switch (mode) {
      case 'word':
        return text.split(/\s+/).filter(word => word.length > 0);

      case 'letter':
      default:
        // Remove spaces and split into characters
        return text.replace(/\s/g, '').split('');
    }
  }

  /**
   * Parse text keeping spaces as units
   */
  static parseWithSpaces(text, mode = 'letter') {
    if (!text || text.length === 0) {
      return ['?'];
    }

    switch (mode) {
      case 'word':
        return text.split(/(\s+)/).filter(Boolean);

      case 'letter':
      default:
        return text.split('');
    }
  }

  /**
   * Get ASCII character based on density/value
   * @param value - normalized value 0-1
   * @param charset - character set to use
   */
  static getAsciiChar(value, charset = ' .:-=+*#%@') {
    const chars = typeof charset === 'string' ? charset : ASCII_SETS[charset] || ASCII_SETS['Standard'];
    const index = Math.floor(value * (chars.length - 1));
    return chars[Math.max(0, Math.min(chars.length - 1, index))];
  }

  /**
   * Convert text to repeated pattern for grid
   */
  static repeatToFill(chars, count) {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(chars[i % chars.length]);
    }
    return result;
  }

  /**
   * Measure text for layout purposes (returns array of widths)
   */
  static measureText(chars, p5Instance, fontSize) {
    if (!p5Instance) return chars.map(() => fontSize * 0.6);

    p5Instance.textSize(fontSize);
    return chars.map(char => p5Instance.textWidth(char));
  }
}

export default TextEngine;
