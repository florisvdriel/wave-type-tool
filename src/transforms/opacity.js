import { getWave } from '../waves/index.js';

export const opacityTransform = (item, index, time, params, p5Instance = null) => {
  if (!params.opacityEnabled) return params.opacityBase || 1;

  const wave = getWave(params.waveType);
  const { row, col } = item;

  // Calculate phase based on position
  const phase = (row + col * 1.3) * params.opacityPhase * 10;
  const t = time * params.opacitySpeed * params.globalSpeed;

  // Wave returns -1 to 1, map to 0-1 range
  const waveValue = wave(t + phase, params.opacityFrequency, 1, p5Instance);

  // Map wave to opacity range
  const opacity = params.opacityBase + waveValue * params.opacityAmplitude;

  // Clamp between min and 1
  return Math.max(params.opacityMin, Math.min(1, opacity));
};
