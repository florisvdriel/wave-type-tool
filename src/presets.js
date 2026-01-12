import { z } from 'zod';
import { PARAMS } from './config.js';

// Store default params for reset
const DEFAULT_PARAMS = { ...PARAMS };

// Zod schema for preset validation
const PresetParamsSchema = z.object({
  textDistribution: z.enum(['repeat', 'split-letter', 'split-word']).optional(),
  sequencePattern: z.enum(['linear', 'centerOut', 'wave', 'spiral', 'random']).optional(),
  linearDirection: z.enum(['horizontal', 'vertical', 'diagonal']).optional(),
  spiralDensity: z.number().min(0.1).max(20).optional(),
  waveCycles: z.number().min(1).max(15).optional(),
  globalSpeed: z.number().min(0.1).max(5).optional(),
  scaleEnabled: z.boolean().optional(),
  scaleMin: z.number().min(0).max(3).optional(),
  scaleMax: z.number().min(0).max(5).optional(),
  scaleCurve: z.enum(['sine', 'bounce', 'elastic', 'snap', 'smooth']).optional(),
  positionEnabled: z.boolean().optional(),
  positionMode: z.enum(['oscillate', 'travel']).optional(),
  positionOrigin: z.enum(['off', 'center', 'edges', 'side0to1', 'side1to0']).optional(),
  positionAmplitudeX: z.number().min(0).max(200).optional(),
  positionAmplitudeY: z.number().min(0).max(200).optional(),
  positionFrequency: z.number().min(0.1).max(10).optional(),
  positionCurve: z.enum(['sine', 'doubleSinusoid', 'bounce', 'elastic', 'snap', 'smooth', 'noise']).optional(),
  positionNoiseIntensity: z.number().min(0).max(1).optional(),
  positionEasing: z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 'easeInQuart', 'easeOutQuart', 'easeInOutQuart']).optional(),
  containToCell: z.boolean().optional(),
  opacityEnabled: z.boolean().optional(),
  opacityMin: z.number().min(0).max(1).optional(),
  opacityMax: z.number().min(0).max(1).optional(),
  opacityCurve: z.enum(['sine', 'bounce', 'elastic', 'snap', 'smooth']).optional(),
  jitterEnabled: z.boolean().optional(),
  jitterAmount: z.number().min(0).max(100).optional(),
  jitterSpeed: z.number().min(0).max(5).optional(),
  tracking: z.number().min(-100).max(100).optional(),
  lineSpacing: z.number().min(-100).max(100).optional(),
  rowPhaseOffset: z.number().min(-5).max(5).optional(),
  colPhaseOffset: z.number().min(-5).max(5).optional(),
}).passthrough(); // Allow unknown keys for forward compatibility

const PresetSchema = z.object({
  name: z.string().min(1).max(100),
  params: PresetParamsSchema,
});

// Built-in presets (10 distinct looks)
export const BUILTIN_PRESETS = [
  {
    name: 'Wave Pulse',
    params: {
      sequencePattern: 'wave',
      waveCycles: 3,
      globalSpeed: 1,
      scaleEnabled: true,
      scaleMin: 0.4,
      scaleMax: 1.2,
      scaleCurve: 'sine',
      positionEnabled: false,
      opacityEnabled: false,
      jitterEnabled: false,
    },
  },
  {
    name: 'Spiral Fade',
    params: {
      sequencePattern: 'spiral',
      waveCycles: 2,
      globalSpeed: 0.8,
      scaleEnabled: true,
      scaleMin: 0.5,
      scaleMax: 1.0,
      scaleCurve: 'smooth',
      positionEnabled: false,
      opacityEnabled: true,
      opacityMin: 0.2,
      opacityMax: 1.0,
      opacityCurve: 'sine',
      jitterEnabled: false,
    },
  },
  {
    name: 'Jitter Grid',
    params: {
      sequencePattern: 'linear',
      waveCycles: 1,
      globalSpeed: 1.2,
      scaleEnabled: false,
      positionEnabled: false,
      opacityEnabled: false,
      jitterEnabled: true,
      jitterAmount: 15,
      jitterSpeed: 0.8,
    },
  },
  {
    name: 'Rotation Cascade',
    params: {
      sequencePattern: 'wave',
      waveCycles: 4,
      globalSpeed: 0.7,
      scaleEnabled: false,
      positionEnabled: false,
      opacityEnabled: false,
      jitterEnabled: false,
    },
  },
  {
    name: 'Bounce Scale',
    params: {
      sequencePattern: 'centerOut',
      waveCycles: 2,
      globalSpeed: 1.5,
      scaleEnabled: true,
      scaleMin: 0.1,
      scaleMax: 1.5,
      scaleCurve: 'bounce',
      positionEnabled: false,
      opacityEnabled: false,
      jitterEnabled: false,
    },
  },
  {
    name: 'Elastic Type',
    params: {
      sequencePattern: 'linear',
      waveCycles: 3,
      globalSpeed: 1,
      scaleEnabled: true,
      scaleMin: 0.3,
      scaleMax: 1.3,
      scaleCurve: 'elastic',
      positionEnabled: true,
      positionAmplitudeX: 10,
      positionAmplitudeY: 0,
      positionCurve: 'elastic',
      opacityEnabled: false,
      jitterEnabled: false,
    },
  },
  {
    name: 'Center Burst',
    params: {
      sequencePattern: 'centerOut',
      waveCycles: 4,
      globalSpeed: 1.2,
      scaleEnabled: true,
      scaleMin: 0,
      scaleMax: 1.4,
      scaleCurve: 'smooth',
      positionEnabled: false,
      opacityEnabled: true,
      opacityMin: 0.3,
      opacityMax: 1.0,
      opacityCurve: 'smooth',
      jitterEnabled: false,
    },
  },
  {
    name: 'Random Chaos',
    params: {
      sequencePattern: 'random',
      waveCycles: 5,
      globalSpeed: 2,
      scaleEnabled: true,
      scaleMin: 0.2,
      scaleMax: 1.8,
      scaleCurve: 'snap',
      positionEnabled: true,
      positionAmplitudeX: 20,
      positionAmplitudeY: 0,
      positionCurve: 'snap',
      opacityEnabled: false,
      jitterEnabled: true,
      jitterAmount: 8,
      jitterSpeed: 1.5,
    },
  },
  {
    name: 'Subtle Drift',
    params: {
      sequencePattern: 'wave',
      waveCycles: 1,
      globalSpeed: 0.5,
      scaleEnabled: false,
      positionEnabled: true,
      positionAmplitudeX: 5,
      positionAmplitudeY: 0,
      positionCurve: 'smooth',
      opacityEnabled: false,
      jitterEnabled: true,
      jitterAmount: 3,
      jitterSpeed: 0.3,
    },
  },
  {
    name: 'Bold Statement',
    params: {
      sequencePattern: 'linear',
      waveCycles: 1,
      globalSpeed: 0.8,
      scaleEnabled: true,
      scaleMin: 0.8,
      scaleMax: 1.2,
      scaleCurve: 'sine',
      positionEnabled: false,
      opacityEnabled: true,
      opacityMin: 0.6,
      opacityMax: 1.0,
      opacityCurve: 'sine',
      jitterEnabled: false,
      rowPhaseOffset: 0.2,
      colPhaseOffset: 0,
    },
  },
];

// Session storage for custom presets (not persisted)
let customPresets = [];

/**
 * Get all presets (built-in + custom)
 */
export function getAllPresets() {
  return {
    builtin: BUILTIN_PRESETS,
    custom: customPresets,
  };
}

/**
 * Get preset by name
 */
export function getPreset(name) {
  const builtin = BUILTIN_PRESETS.find((p) => p.name === name);
  if (builtin) return builtin;
  return customPresets.find((p) => p.name === name);
}

/**
 * Apply preset to PARAMS
 */
export function applyPreset(name, targetParams) {
  const preset = getPreset(name);
  if (!preset) return false;

  // Apply preset params, keeping non-preset params unchanged
  Object.keys(preset.params).forEach((key) => {
    if (key in targetParams) {
      targetParams[key] = preset.params[key];
    }
  });

  return true;
}

/**
 * Save current params as custom preset
 */
export function saveCustomPreset(name, currentParams) {
  // Remove existing preset with same name
  customPresets = customPresets.filter((p) => p.name !== name);

  // Create preset from current params (only animation-related)
  const presetParams = {
    textDistribution: currentParams.textDistribution,
    sequencePattern: currentParams.sequencePattern,
    linearDirection: currentParams.linearDirection,
    spiralDensity: currentParams.spiralDensity,
    waveCycles: currentParams.waveCycles,
    globalSpeed: currentParams.globalSpeed,
    scaleEnabled: currentParams.scaleEnabled,
    scaleMin: currentParams.scaleMin,
    scaleMax: currentParams.scaleMax,
    scaleCurve: currentParams.scaleCurve,
    positionEnabled: currentParams.positionEnabled,
    positionMode: currentParams.positionMode,
    positionOrigin: currentParams.positionOrigin,
    positionAmplitudeX: currentParams.positionAmplitudeX,
    positionAmplitudeY: currentParams.positionAmplitudeY,
    positionFrequency: currentParams.positionFrequency,
    positionCurve: currentParams.positionCurve,
    positionNoiseIntensity: currentParams.positionNoiseIntensity,
    positionEasing: currentParams.positionEasing,
    containToCell: currentParams.containToCell,
    opacityEnabled: currentParams.opacityEnabled,
    opacityMin: currentParams.opacityMin,
    opacityMax: currentParams.opacityMax,
    opacityCurve: currentParams.opacityCurve,
    jitterEnabled: currentParams.jitterEnabled,
    jitterAmount: currentParams.jitterAmount,
    jitterSpeed: currentParams.jitterSpeed,
    tracking: currentParams.tracking,
    lineSpacing: currentParams.lineSpacing,
    rowPhaseOffset: currentParams.rowPhaseOffset,
    colPhaseOffset: currentParams.colPhaseOffset,
  };

  customPresets.push({ name, params: presetParams });
  return true;
}

/**
 * Delete custom preset
 */
export function deleteCustomPreset(name) {
  const index = customPresets.findIndex((p) => p.name === name);
  if (index === -1) return false;
  customPresets.splice(index, 1);
  return true;
}

/**
 * Export preset as JSON
 */
export function exportPresetJSON(name) {
  const preset = getPreset(name);
  if (!preset) return null;
  return JSON.stringify(preset, null, 2);
}

/**
 * Export all custom presets as JSON
 */
export function exportAllPresetsJSON() {
  return JSON.stringify(customPresets, null, 2);
}

/**
 * Import preset from JSON string
 * Returns { success: boolean, error?: string, preset?: object }
 */
export function importPresetJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    // Validate using zod schema
    const result = PresetSchema.safeParse(data);

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: `Invalid preset: ${errors.join(', ')}` };
    }

    // Add to custom presets
    customPresets = customPresets.filter((p) => p.name !== result.data.name);
    customPresets.push(result.data);

    return { success: true, preset: result.data };
  } catch (error) {
    return { success: false, error: `Invalid JSON: ${error.message}` };
  }
}

/**
 * Reset params to defaults
 */
export function resetToDefaults(targetParams) {
  Object.keys(DEFAULT_PARAMS).forEach((key) => {
    targetParams[key] = DEFAULT_PARAMS[key];
  });
}

/**
 * Get preset names for dropdown
 */
export function getPresetOptions() {
  const options = {};

  // Add separator label
  options['--- Built-in ---'] = '';

  // Add built-in presets
  BUILTIN_PRESETS.forEach((p) => {
    options[p.name] = p.name;
  });

  // Add custom presets if any
  if (customPresets.length > 0) {
    options['--- Custom ---'] = '';
    customPresets.forEach((p) => {
      options[`${p.name} (custom)`] = p.name;
    });
  }

  return options;
}
