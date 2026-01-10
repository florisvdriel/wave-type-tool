export const sine = (t, frequency = 1, amplitude = 1) => {
  return Math.sin(t * frequency) * amplitude;
};
