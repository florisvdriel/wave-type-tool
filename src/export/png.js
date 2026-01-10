export const exportPNG = (p5Instance, filename = 'wave-type') => {
  if (!p5Instance) {
    console.error('No p5 instance available for PNG export');
    return false;
  }

  p5Instance.saveCanvas(filename, 'png');
  return true;
};
