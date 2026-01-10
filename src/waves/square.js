export const square = (t, frequency = 1, amplitude = 1) => {
  const x = t * frequency;
  return Math.sign(Math.sin(x)) * amplitude;
};

export const smoothSquare = (t, frequency = 1, amplitude = 1, smoothness = 10) => {
  // Smoother square wave using tanh
  const x = Math.sin(t * frequency);
  return Math.tanh(x * smoothness) * amplitude;
};
