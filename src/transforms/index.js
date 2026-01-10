import { positionTransform } from './position.js';
import { scaleTransform } from './scale.js';
import { rotationTransform } from './rotation.js';
import { opacityTransform } from './opacity.js';
import { depthTransform, sortByDepth } from './depth.js';

export const applyTransforms = (item, index, time, params, p5Instance = null) => {
  const position = positionTransform(item, index, time, params, p5Instance);
  const scale = scaleTransform(item, index, time, params, p5Instance);
  const rotation = rotationTransform(item, index, time, params, p5Instance);
  const opacity = opacityTransform(item, index, time, params, p5Instance);
  const depth = depthTransform(item, index, time, params, p5Instance);

  // Combine depth effects with other transforms
  let finalScale = scale;
  let finalOpacity = opacity;

  if (params.depthEnabled) {
    if (params.depthScaleEffect) {
      finalScale *= depth.scale;
    }
    if (params.depthOpacityEffect) {
      finalOpacity *= depth.opacity;
    }
  }

  return {
    x: item.x + position.x,
    y: item.y + position.y,
    z: depth.z,
    scale: finalScale,
    rotation,
    opacity: finalOpacity,
    depth,
  };
};

export { sortByDepth };

export {
  positionTransform,
  scaleTransform,
  rotationTransform,
  opacityTransform,
  depthTransform,
};
