# Wave Type Tool v2 - Execution Checklist

This is a concise, agent-executable task list aligned to the PRD priorities. Each box is a concrete, testable deliverable.

---

## Milestone M1 (P0) — Fonts + Transparency

- [ ] Expand Google Fonts list to 30+ curated options in `src/config.js`.
- [ ] Add font search/filter input in controls panel (`src/controls.js`).
- [ ] Add font upload UI (drag-and-drop + file input) in `src/controls.js`.
- [ ] Inject `@font-face` for uploaded fonts and merge into font dropdown.
- [ ] Persist uploaded fonts in session; add optional localStorage toggle.
- [ ] Add `backgroundTransparent` param to `src/config.js`.
- [ ] Update preview render to skip background fill when transparent.
- [ ] Add checkerboard background in `src/style.css` for transparency preview.
- [ ] Update PNG/SVG/MP4 export paths to respect transparency.
- [ ] QA: upload font renders correctly; PNG export has alpha; SVG omits background rect.

---

## Milestone M2 (P1) — Richer Transforms + Presets

- [ ] Add rotation controls + curve to `PARAMS` + UI.
- [ ] Add opacity controls + curve to `PARAMS` + UI.
- [ ] Add jitter controls (amount + speed) to `PARAMS` + UI.
- [ ] Add tracking + line spacing to `PARAMS` + layout logic.
- [ ] Add row/col phase offsets to sequencing logic.
- [ ] Update `applyTransforms` to compute rotation, opacity, jitter.
- [ ] Update SVG export to apply rotation + opacity.
- [ ] Create `src/presets.js` with built-in presets (min 6).
- [ ] Add preset dropdown + save/load/import/export UI in `src/controls.js`.
- [ ] Add preset JSON validation (use `zod`).
- [ ] QA: save/load preset round-trip works; invalid JSON handled gracefully.

---

## Milestone M3 (P2) — Vector Engine + Export Parity

- [ ] Choose font parser (e.g., `opentype.js`) and add dependency.
- [ ] Implement glyph path cache (`fontId + char + size`).
- [ ] Implement SVG path export for glyphs (no `<text>` nodes).
- [ ] Ensure vector output respects transforms (scale/rotate/opacity).
- [ ] Add PNG sequence export (frame-by-frame).
- [ ] Add WebP sequence export (frame-by-frame).
- [ ] Add export UI for sequences (fps, duration, frame count).
- [ ] QA: SVG renders without installed font; 60-frame PNG sequence completes.

---

## Milestone M4 (P3) — UX Polish

- [ ] Add shortcut `H` to hide/show controls.
- [ ] Add FPS/perf warning if avg frame time > 25ms.
- [ ] Add “Reset section” buttons for transform groups.
- [ ] Clean up spacing/typography in controls panel.
- [ ] QA: shortcut works; controls hide/show reliably.

---

## Optional/Follow-up

- [ ] Export preset bundle (zip) with assets (fonts) if persistence enabled.
- [ ] Add “Randomize” button for quick variations.

