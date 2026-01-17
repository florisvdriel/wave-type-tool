/**
 * Grid-based spatial hash for efficient collision detection.
 * Divides canvas into cells and only checks collisions between items in the same/adjacent cells.
 * Reduces complexity from O(n²) to approximately O(n) for uniform distributions.
 */
export class SpatialHash {
  constructor(cellSize, canvasWidth, canvasHeight) {
    this.cellSize = cellSize;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.cols = Math.ceil(canvasWidth / cellSize);
    this.rows = Math.ceil(canvasHeight / cellSize);
    this.cells = new Map();
  }

  /**
   * Get cell key for a position
   */
  getCellKey(x, y) {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    return `${col},${row}`;
  }

  /**
   * Get all cell keys that an item might touch (for items near cell boundaries)
   */
  getCellKeys(x, y, radius) {
    const keys = new Set();
    const minCol = Math.floor((x - radius) / this.cellSize);
    const maxCol = Math.floor((x + radius) / this.cellSize);
    const minRow = Math.floor((y - radius) / this.cellSize);
    const maxRow = Math.floor((y + radius) / this.cellSize);

    for (let col = minCol; col <= maxCol; col++) {
      for (let row = minRow; row <= maxRow; row++) {
        keys.add(`${col},${row}`);
      }
    }
    return keys;
  }

  /**
   * Insert an item into the spatial hash
   */
  insert(index, x, y, radius) {
    const keys = this.getCellKeys(x, y, radius);
    for (const key of keys) {
      if (!this.cells.has(key)) {
        this.cells.set(key, new Set());
      }
      this.cells.get(key).add(index);
    }
  }

  /**
   * Query for potential collision candidates near a position
   */
  query(x, y, radius) {
    const candidates = new Set();
    const keys = this.getCellKeys(x, y, radius);

    for (const key of keys) {
      const cell = this.cells.get(key);
      if (cell) {
        for (const index of cell) {
          candidates.add(index);
        }
      }
    }

    return candidates;
  }

  /**
   * Clear all cells for next frame
   */
  clear() {
    this.cells.clear();
  }

  /**
   * Update dimensions (call when canvas resizes)
   */
  resize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.cols = Math.ceil(canvasWidth / this.cellSize);
    this.rows = Math.ceil(canvasHeight / this.cellSize);
    this.clear();
  }
}
