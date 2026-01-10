import { getWave } from '../waves/index.js';

export const rotationTransform = (item, index, time, params, p5Instance = null) => {
  if (!params.rotationEnabled) return 0;

  const wave = getWave(params.waveType);
  const { row, col } = item;

  // Calculate phase based on position
  const phase = (row * 0.7 + col * 0.3) * params.rotationPhase * 10;
  const t = time * params.rotationSpeed * params.globalSpeed;

  // Wave returns -1 to 1, map to rotation in degrees
  const waveValue = wave(t + phase, params.rotationFrequency, 1, p5Instance);

  // Convert amplitude from degrees to radians for p5
  const rotationDegrees = waveValue * params.rotationAmplitude;

  return rotationDegrees * (Math.PI / 180);
};
