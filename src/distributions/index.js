import { gridDistribution } from './grid.js';
import { circularDistribution } from './circular.js';
import { spiralDistribution } from './spiral.js';
import { randomDistribution, scatteredDistribution } from './random.js';
import { waveDistribution } from './wave.js';

const distributions = {
  grid: gridDistribution,
  circular: circularDistribution,
  spiral: spiralDistribution,
  random: randomDistribution,
  scattered: scatteredDistribution,
  wave: waveDistribution,
};

export const getDistribution = (type) => {
  return distributions[type] || distributions.grid;
};

export const getDistributionTypes = () => Object.keys(distributions);

export {
  gridDistribution,
  circularDistribution,
  spiralDistribution,
  randomDistribution,
  scatteredDistribution,
  waveDistribution,
};
