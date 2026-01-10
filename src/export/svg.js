/**
 * SVG Export Module
 * Creates SVG from current canvas state
 */

export const exportSVG = (items, params, width, height, filename = 'wave-type') => {
  const svgNS = 'http://www.w3.org/2000/svg';

  // Create SVG element
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="${svgNS}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${params.backgroundColor}"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=${params.font.replace(/ /g, '+')}:wght@400;700&amp;display=swap');
    text { font-family: '${params.font}', monospace; }
  </style>
  <g id="characters">
`;

  // Sort items by depth if enabled
  let sortedItems = items;
  if (params.depthEnabled) {
    sortedItems = [...items].sort((a, b) => {
      const zA = a.transformed?.z || 0;
      const zB = b.transformed?.z || 0;
      return zA - zB;
    });
  }

  // Add each character as a text element
  for (const item of sortedItems) {
    if (!item.transformed) continue;

    const { x, y, scale, rotation, opacity } = item.transformed;
    const { char } = item;

    if (opacity <= 0.01) continue;

    // Get color
    const color = getColorForSVG(item, params);
    const rotationDeg = (rotation || 0) * (180 / Math.PI);

    // Build transform string
    let transform = `translate(${x.toFixed(2)}, ${y.toFixed(2)})`;
    if (rotationDeg !== 0) {
      transform += ` rotate(${rotationDeg.toFixed(2)})`;
    }
    if (scale !== 1) {
      transform += ` scale(${scale.toFixed(3)})`;
    }

    // Escape special characters for XML
    const escapedChar = escapeXML(char);

    svg += `    <text transform="${transform}" fill="${color}" fill-opacity="${opacity.toFixed(3)}" font-size="${params.fontSize}" text-anchor="middle" dominant-baseline="central">${escapedChar}</text>\n`;
  }

  svg += `  </g>
</svg>`;

  // Download the SVG
  downloadSVG(svg, filename);

  return true;
};

const getColorForSVG = (item, params) => {
  const { row, col, totalRows, totalCols, transformed } = item;

  switch (params.colorMode) {
    case 'rainbow': {
      const hue = ((col / totalCols + row / totalRows) % 1) * 360;
      return `hsl(${hue.toFixed(0)}, 80%, 50%)`;
    }

    case 'gradient':
    case 'depth': {
      // Simple linear interpolation for gradient
      let t = (col / totalCols + row / totalRows) / 2;

      if (params.colorMode === 'depth' && transformed?.depth) {
        const z = transformed.depth.z;
        t = (z + params.depthAmplitude) / (params.depthAmplitude * 2);
      }

      return interpolateColor(params.gradientStart, params.gradientEnd, t);
    }

    case 'position': {
      const hue = (col / totalCols) * 360;
      return `hsl(${hue.toFixed(0)}, 70%, 50%)`;
    }

    case 'solid':
    default:
      return params.textColor;
  }
};

const interpolateColor = (color1, color2, t) => {
  // Parse hex colors
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);

  if (!c1 || !c2) return color1;

  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);

  return rgbToHex(r, g, b);
};

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
};

const rgbToHex = (r, g, b) => {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

const escapeXML = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const downloadSVG = (svgContent, filename) => {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
