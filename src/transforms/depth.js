import { getWave } from '../waves/index.js';

export const depthTransform = (item, index, time, params, p5Instance = null) => {
  if (!params.depthEnabled) {
    return {
      z: 0,
      scale: 1,
      opacity: 1,
      blur: 0,
    };
  }

  const wave = getWave(params.waveType);
  const { row, col, totalRows, totalCols } = item;

  // Calculate phase based on position
  const centerX = totalCols / 2;
  const centerY = totalRows / 2;
  const distFromCenter = Math.sqrt(
    Math.pow(col - centerX, 2) + Math.pow(row - centerY, 2)
  );

  const phase = distFromCenter * params.depthPhase * 2;
  const t = time * params.depthSpeed * params.globalSpeed;

  // Calculate Z depth
  const waveValue = wave(t + phase, params.depthFrequency, 1, p5Instance);
  const z = waveValue * params.depthAmplitude;

  // Calculate perspective effects
  const perspective = params.depthPerspective;
  // Clamp z to prevent division issues (z should not exceed perspective)
  const clampedZ = Math.max(-perspective * 0.9, Math.min(perspective * 0.9, z));
  const perspectiveFactor = perspective / (perspective + clampedZ);

  // Scale based on Z (closer = bigger)
  let scale = 1;
  if (params.depthScaleEffect) {
    scale = Math.max(0.1, Math.min(3, perspectiveFactor));
  }

  // Opacity based on Z (further = more faded)
  let opacity = 1;
  if (params.depthOpacityEffect) {
    // Map z from -amplitude to +amplitude to opacity range
    const normalizedZ = (z + params.depthAmplitude) / (params.depthAmplitude * 2);
    opacity = 0.3 + normalizedZ * 0.7; // Range from 0.3 to 1.0
  }

  // Optional blur for depth of field effect (not directly supported in p5, but useful for future)
  const blur = Math.abs(z) / params.depthAmplitude * 2;

  return {
    z,
    scale: Math.max(0.1, scale),
    opacity: Math.max(0.1, Math.min(1, opacity)),
    blur,
    perspectiveFactor,
  };
};

// Sort items by Z depth for proper rendering order (back to front)
export const sortByDepth = (items) => {
  return [...items].sort((a, b) => {
    const zA = a.transformed?.z ?? 0;
    const zB = b.transformed?.z ?? 0;
    return zA - zB;
  });
};
