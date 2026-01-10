export const spiralDistribution = (chars, params, canvasWidth, canvasHeight) => {
  const items = [];
  const centerX = canvasWidth * params.centerX;
  const centerY = canvasHeight * params.centerY;
  const { radius, spiralTightness, columns, rows } = params;

  const totalItems = columns * rows;
  const maxAngle = Math.PI * 2 * (totalItems / 10) * (1 + spiralTightness);

  for (let i = 0; i < totalItems; i++) {
    const progress = i / totalItems;
    const angle = progress * maxAngle;
    const currentRadius = progress * radius;

    const x = centerX + Math.cos(angle) * currentRadius;
    const y = centerY + Math.sin(angle) * currentRadius;

    // Calculate virtual row/col for wave calculations
    const virtualRow = Math.floor(i / columns);
    const virtualCol = i % columns;

    items.push({
      char: chars[i % chars.length],
      x,
      y,
      row: virtualRow,
      col: virtualCol,
      index: i,
      totalRows: rows,
      totalCols: columns,
      angle,
      radius: currentRadius,
    });
  }

  return items;
};
