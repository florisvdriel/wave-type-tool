export const triangle = (t, frequency = 1, amplitude = 1) => {
  const period = (2 * Math.PI) / frequency;
  const phase = ((t % period) + period) % period;
  const normalized = phase / period;

  // Triangle wave: goes from -1 to 1 to -1
  let value;
  if (normalized < 0.5) {
    value = 4 * normalized - 1;
  } else {
    value = -4 * normalized + 3;
  }

  return value * amplitude;
};
