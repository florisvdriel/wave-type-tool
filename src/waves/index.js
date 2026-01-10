import { sine } from './sine.js';
import { triangle } from './triangle.js';
import { noise, setNoiseOffset } from './noise.js';
import { bounce, elastic } from './bounce.js';
import { square, smoothSquare } from './square.js';

const waves = {
  sine,
  triangle,
  noise,
  bounce,
  elastic,
  square,
  smoothSquare,
};

export const getWave = (type) => {
  return waves[type] || waves.sine;
};

export const getWaveTypes = () => Object.keys(waves);

export { setNoiseOffset };

// Composite wave - combine multiple waves
export const composite = (t, frequency, amplitude, types = ['sine', 'noise'], weights = [0.7, 0.3], p5Instance = null) => {
  let result = 0;
  for (let i = 0; i < types.length; i++) {
    const wave = getWave(types[i]);
    const weight = weights[i] || 1 / types.length;
    if (types[i] === 'noise') {
      result += wave(t, frequency, amplitude, p5Instance) * weight;
    } else {
      result += wave(t, frequency, amplitude) * weight;
    }
  }
  return result;
};
