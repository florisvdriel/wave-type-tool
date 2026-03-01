# Wave Type Tool — Claude Instructions

## What This Tool Is

Wave Type Tool is a browser-based generative typography platform. It renders animated, staggered text grids using configurable sequence patterns and transforms, and exports them as PNG, SVG, or MP4. It is a creative/design tool, not an application framework.

## Stack

- **Rendering**: p5.js v2 (Canvas 2D — not WebGL, not p5.js v1)
- **UI controls**: Tweakpane v4 — vanilla JS only, no framework
- **Build**: Vite
- **Validation**: Zod (preset schema only)
- **Video export**: mp4-muxer (H.264)
- **No frontend framework** — do not introduce React, Vue, or Svelte

## Key Files

| File | Role |
|------|------|
| `src/main.js` | p5 sketch, render loop, grid building, export orchestration |
| `src/config.js` | `PARAMS` object — single source of truth for all parameters |
| `src/controls.js` | Tweakpane UI bindings, font upload handling |
| `src/presets.js` | 10 built-in presets, save/load/import/export, Zod validation |
| `src/transforms/index.js` | Spatial phase calculation, per-item transform application |
| `src/physics/index.js` | Collision detection and resolution (SpatialHash) |
| `src/export/png.js` | Single-frame PNG export |
| `src/export/svg.js` | SVG export, vector path support, font-face injection |
| `src/export/mp4.js` | MP4 encoding via mp4-muxer, progress tracking |
| `src/vector/FontManager.js` | Loads Google Fonts and uploaded fonts, caches p5.Font objects |
| `src/vector/GlyphCache.js` | Caches `textToPoints()` results by font/char/size |
| `src/vector/PathExporter.js` | Generates SVG with embedded vector paths |

## Architecture Rules — Do Not Break These

### Grid caching
The grid is rebuilt only when layout-relevant params change (text, mode, columns, rows, canvas size). It is cached with a key. **Never call `buildGrid()` on every frame.** Rebuilding 240+ items every frame kills performance.

### PARAMS is the only state
All parameters live in `PARAMS` (src/config.js). Do not store duplicate or shadow state in other variables. Tweakpane binds directly to `PARAMS`.

### Triggers for redraw
Use `markNeedsRedraw()` to signal that a frame should be redrawn. Do not call `redraw()` directly from UI callbacks. Lazy redraw (skipping frames when nothing has changed and animation is off) must be preserved.

### Export uses an offscreen canvas
Exports render to a separate offscreen canvas at the export resolution. Never use the preview canvas for export.

### Tweakpane API only
Add UI controls via the Tweakpane API (`.addBinding()`, `.addButton()`, etc.). Do not manipulate the Tweakpane DOM with `innerHTML` or `querySelector`.

### p5.js v2
This uses p5.js v2. The API differs from v1. Check p5.js v2 docs when in doubt. Instance mode (`new p5(sketch)`) is used — do not assume global mode.

## Performance Rules

- **GlyphCache**: `textToPoints()` is expensive. All calls must go through `GlyphCache`. Never call it directly outside the cache.
- **Clone count cap**: Hard-capped at 100. Do not raise this limit — it causes memory pressure with large grids.
- **Spatial phase**: Phase values (0–1) are precomputed per grid item and cached. Recalculate only when sequence params change.
- **SpatialHash**: Used by the collision system. Don't rebuild it more than once per frame.

## Rendering Pipeline Order

1. Compute spatial phase per grid item (from sequence pattern)
2. Apply transforms (scale, position, opacity, jitter, rotation) using phase
3. Run physics (collision detection + resolution) — after transforms, before render
4. Render: draw clones first (extrusion offsets), then the main glyph

## Preset System

- Presets are validated with a Zod schema in `src/presets.js`
- The schema uses `.passthrough()` — unknown keys are preserved for forward compatibility
- **When adding a new PARAMS field, add it to the Zod schema too.** Omitting it will cause preset imports to strip the field.
- Custom presets are stored in `localStorage`

## Text Modes

| Mode | Behaviour |
|------|-----------|
| `repeat-letter` | Single character fills all cells |
| `repeat-word` | Words repeat in sequence direction |
| `split-letter` | Letters split across sequence direction, repeat on other axis |
| `split-word` | Words split across sequence direction, repeat on other axis |

## Sequence Patterns

Patterns assign a 0–1 phase to each grid cell. All animation is driven by this phase value. Available: `linear`, `wave`, `spiral`, `centerOut`, `random`.

## Current Milestone Status

- **M1 (P0) — Done**: 30+ Google Fonts, variable font weights, custom font upload, transparent background, PNG/SVG/MP4 export
- **M2 (P1) — In progress**: Rotation transform, collision physics, presets system
- **M3–M4 — Planned**: Vector engine maturation, PNG/WebP sequence export, keyboard shortcuts, UX polish

Reference `PRD.md` for full milestone breakdown and feature specs.

## Common Mistakes to Avoid

- Rebuilding the grid on every frame
- Calling `textToPoints()` outside of GlyphCache
- Calling the Google Fonts API directly instead of going through FontManager
- Adding PARAMS fields without updating the Zod preset schema
- Inserting Tweakpane controls via DOM manipulation
- Exporting from the live preview canvas
- Assuming p5.js v1 API conventions
