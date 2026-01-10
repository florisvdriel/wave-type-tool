import { getWave } from '../waves/index.js';

export const positionTransform = (item, index, time, params, p5Instance = null) => {
  if (!params.positionEnabled) return { x: 0, y: 0 };

  const wave = getWave(params.waveType);
  const { row, col, totalRows, totalCols } = item;

  let xOffset = 0;
  let yOffset = 0;

  // Calculate phase based on position
  const rowPhase = row * params.positionPhase * 10;
  const colPhase = col * params.positionPhase * 10;
  const radialPhase = Math.sqrt(
    Math.pow(col - totalCols / 2, 2) + Math.pow(row - totalRows / 2, 2)
  ) * params.positionPhase;

  const t = time * params.positionSpeed * params.globalSpeed;

  switch (params.waveDirection) {
    case 'horizontal':
      xOffset = wave(t + rowPhase, params.positionFrequency, params.positionAmplitudeX, p5Instance);
      yOffset = wave(t + rowPhase, params.positionFrequency, params.positionAmplitudeY, p5Instance);
      break;

    case 'vertical':
      xOffset = wave(t + colPhase, params.positionFrequency, params.positionAmplitudeX, p5Instance);
      yOffset = wave(t + colPhase, params.positionFrequency, params.positionAmplitudeY, p5Instance);
      break;

    case 'radial':
      xOffset = wave(t + radialPhase, params.positionFrequency, params.positionAmplitudeX, p5Instance);
      yOffset = wave(t + radialPhase, params.positionFrequency, params.positionAmplitudeY, p5Instance);
      break;

    case 'both':
    default:
      xOffset = wave(t + rowPhase, params.positionFrequency, params.positionAmplitudeX, p5Instance);
      yOffset = wave(t + colPhase, params.positionFrequency, params.positionAmplitudeY, p5Instance);
      break;
  }

  return { x: xOffset, y: yOffset };
};
