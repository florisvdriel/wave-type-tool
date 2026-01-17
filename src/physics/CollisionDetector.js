import { SpatialHash } from './SpatialHash.js';

/**
 * Collision detector for letters and words.
 * Uses spatial hashing for efficient broad-phase collision detection.
 */
export class CollisionDetector {
  constructor() {
    this.spatialHash = null;
    this.lastCellSize = 0;
    this.lastCanvasWidth = 0;
    this.lastCanvasHeight = 0;
  }

  /**
   * Initialize or update spatial hash based on current parameters
   */
  ensureSpatialHash(canvasWidth, canvasHeight, fontSize) {
    const cellSize = fontSize * 3;

    if (
      !this.spatialHash ||
      this.lastCellSize !== cellSize ||
      this.lastCanvasWidth !== canvasWidth ||
      this.lastCanvasHeight !== canvasHeight
    ) {
      this.spatialHash = new SpatialHash(cellSize, canvasWidth, canvasHeight);
      this.lastCellSize = cellSize;
      this.lastCanvasWidth = canvasWidth;
      this.lastCanvasHeight = canvasHeight;
    }
  }

  /**
   * Get bounding radius for an item based on mode
   */
  getItemRadius(item, params) {
    // For letters, use fontSize-based radius
    // Scale affects the visual size, so factor it in
    const scale = item.transformed?.scale || 1;
    return (params.fontSize * 0.45) * scale;
  }

  /**
   * Detect all collisions between items and with walls
   * Returns array of collision objects
   */
  detectCollisions(items, params, canvasWidth, canvasHeight) {
    const collisions = [];
    const fontSize = params.fontSize;

    this.ensureSpatialHash(canvasWidth, canvasHeight, fontSize);
    this.spatialHash.clear();

    // Insert all items into spatial hash using transformed positions
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.transformed) continue;

      const { x, y } = item.transformed;
      const radius = this.getItemRadius(item, params);
      this.spatialHash.insert(i, x, y, radius);
    }

    // Check collisions between items
    for (let i = 0; i < items.length; i++) {
      const itemA = items[i];
      if (!itemA.transformed) continue;

      const posA = itemA.transformed;
      const radiusA = this.getItemRadius(itemA, params);

      // Query nearby items
      const candidates = this.spatialHash.query(posA.x, posA.y, radiusA * 2);

      for (const j of candidates) {
        if (j <= i) continue; // Avoid duplicate checks

        const itemB = items[j];
        if (!itemB.transformed) continue;

        const collision = this.checkCircleCollision(
          itemA, itemB, i, j, params
        );

        if (collision) {
          collisions.push(collision);
        }
      }

      // Check wall collisions
      if (params.wallBounce) {
        const wallCollisions = this.checkWallCollisions(
          itemA, i, params, canvasWidth, canvasHeight
        );
        collisions.push(...wallCollisions);
      }
    }

    return collisions;
  }

  /**
   * Check circle-circle collision between two items
   */
  checkCircleCollision(itemA, itemB, indexA, indexB, params) {
    const posA = itemA.transformed;
    const posB = itemB.transformed;
    const radiusA = this.getItemRadius(itemA, params);
    const radiusB = this.getItemRadius(itemB, params);

    const dx = posB.x - posA.x;
    const dy = posB.y - posA.y;
    const distSq = dx * dx + dy * dy;
    const minDist = radiusA + radiusB;

    if (distSq < minDist * minDist && distSq > 0) {
      const dist = Math.sqrt(distSq);
      const penetration = minDist - dist;

      // Collision normal (from A to B)
      const nx = dx / dist;
      const ny = dy / dist;

      return {
        type: 'item',
        indexA,
        indexB,
        normal: { x: nx, y: ny },
        penetration,
        contactPoint: {
          x: posA.x + nx * radiusA,
          y: posA.y + ny * radiusA,
        },
      };
    }

    return null;
  }

  /**
   * Check collisions with canvas walls
   */
  checkWallCollisions(item, index, params, canvasWidth, canvasHeight) {
    const collisions = [];
    const pos = item.transformed;
    const radius = this.getItemRadius(item, params);

    // Left wall
    if (pos.x - radius < 0) {
      collisions.push({
        type: 'wall',
        indexA: index,
        indexB: 'left',
        normal: { x: 1, y: 0 },
        penetration: radius - pos.x,
        contactPoint: { x: 0, y: pos.y },
      });
    }

    // Right wall
    if (pos.x + radius > canvasWidth) {
      collisions.push({
        type: 'wall',
        indexA: index,
        indexB: 'right',
        normal: { x: -1, y: 0 },
        penetration: (pos.x + radius) - canvasWidth,
        contactPoint: { x: canvasWidth, y: pos.y },
      });
    }

    // Top wall
    if (pos.y - radius < 0) {
      collisions.push({
        type: 'wall',
        indexA: index,
        indexB: 'top',
        normal: { x: 0, y: 1 },
        penetration: radius - pos.y,
        contactPoint: { x: pos.x, y: 0 },
      });
    }

    // Bottom wall
    if (pos.y + radius > canvasHeight) {
      collisions.push({
        type: 'wall',
        indexA: index,
        indexB: 'bottom',
        normal: { x: 0, y: -1 },
        penetration: (pos.y + radius) - canvasHeight,
        contactPoint: { x: pos.x, y: canvasHeight },
      });
    }

    return collisions;
  }
}
