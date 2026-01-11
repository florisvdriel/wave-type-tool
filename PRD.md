# Wave Type Tool v2 - Comprehensive PRD

Owner: Frank van Driel  
Target branch: `main`  
Doc version: 2026-01-11  

This PRD is written to be executable by a coding agent (Claude Code OPUS 4.5). It includes explicit requirements, file-level guidance, and acceptance criteria. The priority order below matches the user's stated order.

---

## 0) Summary

Upgrade the Wave Type Tool into a professional-grade generative typography tool with:
1) Custom font upload + expanded Google Fonts list  
2) Transparent background option  
3) Richer transforms (animation + layout controls)  
4) Presets (built-ins + save/load/import/export)  
5) Vector engine (glyph-to-path pipeline)  
6) Export parity (PNG/WebP sequences, improved MP4, SVG paths)  
7) UX polish (panel layout, clarity, shortcuts)

The current stack is `p5.js` + `tweakpane` with a `PARAMS` object. Keep this structure but expand capabilities.

---

## 1) Goals

- Enable creators to use any font (upload) and a larger, curated Google Fonts list.
- Add export-quality options: transparent background and proper vector output.
- Expand transform controls to match modern generative typography tools.
- Provide a fast preset workflow (built-ins + JSON).
- Keep performance smooth on desktop (60fps target in preview).

---

## 2) Non-Goals

- No mobile optimization in this phase.
- No multi-layer composition UI (single layer of grid).
- No timeline editor; we remain parametric (controls-driven).
- No server-side rendering; everything stays client-side.

---

## 3) Target Users & Use Cases

- Designers making looping typographic patterns for posters, album art, motion graphics.
- Creators needing export-ready frames or SVGs for further editing.

Key flows:
1) Load/enter text → choose font → adjust transforms → export.
2) Try presets → tweak → save custom preset → export.

---

## 4) Priority Roadmap (in order)

P0:
1. Custom font upload + expanded Google Fonts list
2. Transparent background option

P1:
3. Richer transforms
4. Presets

P2:
5. Vector engine (glyph-to-path)
6. Export parity (PNG/WebP sequences, improved MP4, SVG paths)

P3:
7. UX polish

Each item below includes requirements and acceptance criteria.

---

## 5) Requirements by Priority

### 5.1 Custom Font Upload + Expanded Google Fonts (P0)

#### Functional Requirements
- Allow users to upload font files via:
  - Drag-and-drop onto a dedicated drop zone in the controls panel.
  - File input button.
- Supported formats: `.ttf`, `.otf`, `.woff`, `.woff2`.
- Uploaded fonts appear in the font dropdown immediately with a label (filename).
- Persist uploaded fonts in session (in-memory) and optionally in `localStorage` via base64 (opt-in).
- Expand Google Fonts list from 6 to at least 30 curated fonts.

#### UX Requirements
- Dedicated "Fonts" section with:
  - Search/filter input for the Google Fonts list.
  - Separate "Uploaded" subsection.
- Drop zone feedback (hover/drag state, small helper text).
- If font fails to load, show a visible toast/alert in the UI panel.

#### Implementation Notes
- Use `@font-face` injection for uploaded fonts.
- Keep a simple `FONTS` array for Google Fonts, plus `uploadedFonts` for runtime.
- Add a `fontSource` toggle? Not necessary if dropdown merges both lists.

#### Acceptance Criteria
- User can drag a TTF file onto the panel, select it from dropdown, and see text render in preview.
- Refreshing the page retains uploaded fonts if persistence is enabled.
- Google Fonts list is longer and filterable.

---

### 5.2 Transparent Background (P0)

#### Functional Requirements
- Add a boolean `backgroundTransparent` parameter.
- If enabled:
  - Canvas preview renders with checkered UI background or CSS checker.
  - Exported PNG/MP4/SVG uses alpha background instead of solid fill.
- If disabled: use `backgroundColor` as currently.

#### Implementation Notes
- Update `renderFrame` and `renderFrameToCanvas` to conditionally skip `backgroundColor` fill.
- Update `exportSVG` to omit background `<rect>` when transparent.
- For preview: apply a CSS checker pattern behind canvas.

#### Acceptance Criteria
- Exported PNG has alpha transparency (verified by opening in a transparent-aware viewer).
- Preview indicates transparency clearly.

---

### 5.3 Richer Transforms (P1)

#### Functional Requirements
Add parameters and transforms:
- Rotation animation:
  - `rotationEnabled`, `rotationMin`, `rotationMax`, `rotationCurve`.
- Opacity animation:
  - `opacityEnabled`, `opacityMin`, `opacityMax`, `opacityCurve`.
- Tracking / spacing:
  - `tracking` (x spacing adjustment within cell).
  - `lineSpacing` (y spacing adjustment within cell).
- Per-row / per-column phase offsets:
  - `rowPhase`, `colPhase`.
- Noise-based jitter:
  - `jitterEnabled`, `jitterAmount`, `jitterSpeed`.
- Wave direction control:
  - `positionPhaseOffset` or `positionDirection` (X/Y bias).

#### UX Requirements
- Group transforms into subfolders: Scale, Position, Rotation, Opacity, Jitter, Spacing.
- Each transform group has enable toggle and key sliders.

#### Implementation Notes
- Extend `applyTransforms` to compute rotation, opacity, jitter.
- Use a consistent curve system (existing `CURVES`).
- Add `noise` helper or use `p5.noise` for jitter; if using p5, ensure deterministic per item + time.
- Update SVG export to include rotation and opacity values.

#### Acceptance Criteria
- Users can animate rotation and opacity and see it in preview and exports.
- Per-row/col phase offsets affect sequence timing.

---

### 5.4 Presets (P1)

#### Functional Requirements
- Built-in presets (at least 6) covering distinct looks.
- Preset picker dropdown.
- "Save Preset" button that stores current `PARAMS` to `localStorage`.
- "Export Preset" button that downloads a JSON file.
- "Import Preset" that loads JSON and applies it.
- "Reset to Default" button.

#### UX Requirements
- Preset section at top of panel.
- Import uses file input; export uses download.
- Confirmation on overwrite if name already exists.

#### Implementation Notes
- Store presets as `{ name, params }`.
- Validate params against schema (consider `zod` which already exists).
- Preserve unknown keys for forward compatibility.

#### Acceptance Criteria
- User can save a preset, reload page, select it, and get same look.
- Invalid JSON import shows error and does not break app.

---

### 5.5 Vector Engine (P2)

#### Functional Requirements
- Render text as vector paths, not `<text>` nodes, for SVG export.
- Preview may remain canvas-based but uses vector outlines for export.

#### Implementation Notes
- Use `opentype.js` or `fontkit` to parse font files and generate path data.
- Implement a glyph cache keyed by `{fontId, char, fontSize}`.
- For Google Fonts, fetch font files or rely on CSS `@import` and use a font loader to obtain actual font data.
- Ensure path output matches current transforms (position, scale, rotation, opacity).

#### Acceptance Criteria
- Exported SVG is self-contained and preserves appearance even without font installed.

---

### 5.6 Export Parity (P2)

#### Functional Requirements
- Add PNG and WebP image sequence export (frame-by-frame).
- MP4 improvements:
  - Keep transparency? If not possible with current encoder, document limitation.
  - Allow higher bitrates at 4K.
- SVG uses vector paths (from 5.5).

#### UX Requirements
- Export panel includes:
  - Format selection (PNG sequence, WebP sequence, MP4, SVG, PNG still).
  - Output options: frame count, fps, duration.

#### Implementation Notes
- For sequences, zip outputs or use file-saving chunked downloads.
- Avoid blocking UI; use async batching.

#### Acceptance Criteria
- Users can export 2s / 30fps PNG sequence without crashing the tab.

---

### 5.7 UX Polish (P3)

#### Requirements
- Add keyboard shortcut to hide/show controls (`H`).
- Display FPS or performance warning if frame time > 25ms.
- Improve panel layout with collapsible sections and a consistent typographic scale.
- Add "Reset section" buttons for transform groups.

#### Acceptance Criteria
- Controls can be hidden and restored; app remains functional.

---

## 6) UX and Visual Design

- Maintain minimalist aesthetic.
- Add a checkerboard background behind canvas when transparency is enabled.
- Use a clean label system and consistent slider ranges.
- Avoid clutter; each section should have 6-8 controls max; use subfolders when necessary.

---

## 7) Data Model

Extend `PARAMS` (in `src/config.js`) with new fields:
- `backgroundTransparent` (bool)
- Transform additions (rotation, opacity, jitter, spacing, phase offsets)
- Preset metadata (optional): `presetName`

Add `PRESETS` structure (new `src/presets.js`):
```
{
  builtin: [{ name, params }],
  custom: [{ name, params }]
}
```

---

## 8) File-Level Implementation Guide

Likely changes:
- `src/config.js`  
  Add new params, expand `FONTS`, add default preset.
- `src/controls.js`  
  Add Font upload UI, transparency toggle, new transform sections, preset section.
- `src/main.js`  
  Apply transparency logic, expand render for rotation/opacity/jitter.
- `src/transforms/index.js`  
  Add new transform calculations.
- `src/export/svg.js`  
  Respect transparency, add rotation/opacity, use path engine when ready.
- `src/export/png.js` + new `src/export/webp.js`  
  Add sequence export when P2.
- `index.html` + `src/style.css`  
  Add drop zone styling, checker background.
- `src/presets.js`  
  New module for presets.

---

## 9) Technical Decisions

- Keep p5 for preview; introduce a lightweight vector pipeline for export only.
- Use `localStorage` for custom presets and uploaded font persistence (optional toggle).
- Use `zod` for validating imported presets.

---

## 10) Risks & Mitigations

- **Font parsing complexity**: limit vector engine to export-only first.
- **Memory usage for uploads**: cap font file size (e.g., 5MB).
- **Sequence export performance**: use batching and yield to UI.

---

## 11) Milestones

M1 (P0):
- Custom font upload + expanded Google Fonts
- Transparent background

M2 (P1):
- Richer transforms
- Presets

M3 (P2):
- Vector engine
- Export parity

M4 (P3):
- UX polish

---

## 12) QA Checklist / Acceptance Tests

- Upload font and render text correctly.
- Transparent background is visible in preview and exported PNG/SVG.
- Rotation + opacity transforms visible in preview and exports.
- Preset import/export works with JSON validation.
- SVG export uses vector paths and looks identical to preview.
- PNG/WebP sequence export completes without crash for 60 frames.

---

## 13) Out of Scope (Explicit)

- Video input, webcam input, image sampling.
- Mobile UX and touch-first controls.
- Multi-layer/multi-artboard composition.

---

## 14) Next Steps (for Claude Code OPUS 4.5)

1) Implement P0 in this order:
   - Expand `FONTS` in `src/config.js`.
   - Add font upload UI in `src/controls.js`.
   - Inject `@font-face` for uploaded fonts.
   - Add `backgroundTransparent` param and update render/export functions.

2) Implement P1:
   - Extend `PARAMS` and `applyTransforms`.
   - Add UI controls for new transforms.
   - Create `src/presets.js` with built-in + localStorage.

3) Implement P2:
   - Integrate vector font parser and SVG path export.
   - Add WebP/PNG sequence export.

4) Implement P3:
   - Keyboard shortcuts, reset buttons, minor layout polish.

---

End of PRD.
