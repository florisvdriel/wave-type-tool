export const circularDistribution = (chars, params, canvasWidth, canvasHeight) => {
  const items = [];
  const centerX = canvasWidth * params.centerX;
  const centerY = canvasHeight * params.centerY;
  const { radius, rows } = params;

  // Number of rings
  const rings = rows;
  // Characters distributed across rings
  const charsPerRing = Math.ceil(chars.length / rings) || params.columns;

  let charIndex = 0;

  for (let ring = 0; ring < rings; ring++) {
    const ringRadius = (radius / rings) * (ring + 1);
    const itemsInRing = Math.max(4, Math.floor(charsPerRing * (ring + 1) / rings * 2));

    for (let i = 0; i < itemsInRing; i++) {
      const angle = (i / itemsInRing) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * ringRadius;
      const y = centerY + Math.sin(angle) * ringRadius;

      items.push({
        char: chars[charIndex % chars.length],
        x,
        y,
        row: ring,
        col: i,
        index: charIndex,
        totalRows: rings,
        totalCols: itemsInRing,
        angle,
        ringRadius,
      });

      charIndex++;
    }
  }

  return items;
};
