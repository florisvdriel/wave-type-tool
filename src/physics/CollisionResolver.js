import { CURVES } from '../config.js';

/**
 * Collision response curves - how the deflection animates after collision.
 * These shape the "feel" of the bounce.
 */
const COLLISION_CURVES = {
  // Smooth push away then return
  sine: (progress) => {
    return Math.sin(progress * Math.PI);
  },

  // Multiple diminishing bounces
  bounce: (progress) => {
    const t = 1 - progress;
    if (t < 1 / 2.75) {
      return 1 - 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
      const t2 = t - 1.5 / 2.75;
      return 1 - (7.5625 * t2 * t2 + 0.75);
    } else if (t < 2.5 / 2.75) {
      const t2 = t - 2.25 / 2.75;
      return 1 - (7.5625 * t2 * t2 + 0.9375);
    }
    const t2 = t - 2.625 / 2.75;
    return 1 - (7.5625 * t2 * t2 + 0.984375);
  },

  // Overshoot then settle
  elastic: (progress) => {
    if (progress === 0 || progress === 1) return 1 - progress;
    const p = 0.3;
    const s = p / 4;
    return Math.pow(2, -10 * progress) * Math.sin((progress - s) * (2 * Math.PI) / p) + (1 - progress) * 0.5;
  },

  // Instant deflection that fades
  snap: (progress) => {
    return progress < 0.1 ? 1 : Math.max(0, 1 - (progress - 0.1) / 0.9);
  },

  // Smooth ease-in-out
  smooth: (progress) => {
    // Bell curve - starts at 0, peaks at middle, returns to 0
    return Math.sin(progress * Math.PI);
  },

  // Noise-modulated deflection
  noise: (progress) => {
    const base = Math.sin(progress * Math.PI);
    const noise = Math.sin(progress * 47.123) * 0.2;
    return Math.max(0, base + noise);
  },
};

/**
 * Collision resolver with curve-shaped response.
 * Manages collision state and calculates deflection offsets.
 */
export class CollisionResolver {
  constructor() {
    // Map of item index -> collision state
    this.collisionStates = new Map();
  }

  /**
   * Process new collisions and start collision animations
   */
  resolveCollisions(collisions, items, time, params) {
    for (const collision of collisions) {
      this.startCollisionResponse(collision, items, time, params);
    }
  }

  /**
   * Start a collision response animation for an item
   */
  startCollisionResponse(collision, items, time, params) {
    const { indexA, indexB, normal, penetration, type } = collision;
    const itemA = items[indexA];

    // Initialize collision state for item A
    const existingStateA = this.collisionStates.get(indexA);

    // Only start new collision if not already colliding or if new collision is stronger
    if (!existingStateA || !existingStateA.active || penetration > existingStateA.penetration) {
      this.collisionStates.set(indexA, {
        active: true,
        startTime: time,
        duration: params.collisionDuration * 60, // Convert seconds to frames (assuming 60fps base)
        normal: { x: normal.x, y: normal.y },
        penetration,
        strength: params.collisionStrength,
        collidedWith: indexB,
        type,
      });
    }

    // For item-item collisions, also affect item B
    if (type === 'item' && typeof indexB === 'number') {
      const itemB = items[indexB];
      const existingStateB = this.collisionStates.get(indexB);

      if (!existingStateB || !existingStateB.active || penetration > existingStateB.penetration) {
        this.collisionStates.set(indexB, {
          active: true,
          startTime: time,
          duration: params.collisionDuration * 60,
          normal: { x: -normal.x, y: -normal.y }, // Opposite direction
          penetration,
          strength: params.collisionStrength,
          collidedWith: indexA,
          type,
        });
      }
    }
  }

  /**
   * Update all active collision responses and calculate deflection offsets
   */
  updateCollisionResponses(items, time, params) {
    // Get the appropriate collision curve based on position curve
    const curveName = params.positionCurve || 'sine';
    const curve = COLLISION_CURVES[curveName] || COLLISION_CURVES.sine;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const state = this.collisionStates.get(i);

      if (!state || !state.active) {
        // No active collision - clear any offset
        item.collisionOffset = { x: 0, y: 0 };
        continue;
      }

      const elapsed = time - state.startTime;
      const progress = Math.min(elapsed / state.duration, 1);

      if (progress >= 1) {
        // Collision animation complete
        state.active = false;
        item.collisionOffset = { x: 0, y: 0 };
        continue;
      }

      // Apply curve-shaped deflection
      const curveValue = curve(progress);

      // Base deflection distance - scales with penetration and strength
      const baseDeflection = (state.penetration + params.fontSize * 0.3) * state.strength;

      item.collisionOffset = {
        x: state.normal.x * baseDeflection * curveValue,
        y: state.normal.y * baseDeflection * curveValue,
      };
    }
  }

  /**
   * Clear all collision states (call when collision is disabled or grid changes)
   */
  clear() {
    this.collisionStates.clear();
  }
}
