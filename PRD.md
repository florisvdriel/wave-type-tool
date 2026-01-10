# Wave Type Experiment - Product Requirements Document

## Overview

A browser-based generative visual tool inspired by DIA Studio's Accordion effect. The tool creates animated wave distortion patterns using typography or shapes arranged in a grid, with support for multiple input sources.

---

## Goals

1. Create an interactive web tool that generates undulating wave patterns from text/shapes
2. Support multiple input sources (image, video, webcam)
3. Provide real-time parameter controls for customization
4. Enable export of static images and animated outputs

---

## Core Features

### 1. Wave Distortion Engine
- Grid-based layout system (configurable rows/columns)
- Sine/cosine wave displacement along X and Y axes
- Per-row and per-column phase offsets for ripple effects
- Adjustable amplitude, frequency, and speed

### 2. Input Sources
| Source | Description |
|--------|-------------|
| **Text** | Custom text input rendered as grid elements |
| **Image** | Upload image, sample colors for grid |
| **Video** | Upload video file as color source |
| **Webcam** | Live camera feed for real-time interaction |

### 3. Parameter Controls
- **Grid**: columns, rows, cell size
- **Wave**: amplitude, frequency, speed, direction
- **Offset**: row offset, column offset, phase shift
- **Color**: palette selection, color sampling mode
- **Typography**: Google Fonts selection, user text input

### 4. Text Input
- Text input field for custom text
- Default value: "hello world"
- Characters repeat/tile across the grid

### 5. Font Selection
Google Fonts integration with curated selection:
- Space Mono
- Roboto Mono
- IBM Plex Mono
- Inter
- Space Grotesk
- Bebas Neue
- Playfair Display
- (expandable list)

### 6. Export Options
- PNG snapshot
- GIF animation
- MP4 video (if feasible)
- SVG (static frame)

---

## Technical Stack

| Component | Technology |
|-----------|------------|
| Framework | p5.js |
| UI Controls | dat.GUI or Tweakpane |
| Build | Vite (for fast dev) |
| Hosting | Static files (Vercel/Netlify ready) |

---

## File Structure

```
wave-type-experiment/
├── index.html
├── style.css
├── src/
│   ├── main.js          # Entry point
│   ├── wave.js          # Wave distortion logic
│   ├── grid.js          # Grid layout system
│   ├── inputs.js        # Input source handlers
│   └── controls.js      # UI parameter controls
├── assets/
│   └── fonts/
└── README.md
```

---

## MVP Scope (Phase 1)

- [ ] Basic grid rendering with text characters
- [ ] Text input field (default: "hello world")
- [ ] Google Fonts dropdown selection
- [ ] Wave distortion animation (sine-based)
- [ ] Adjustable parameters: amplitude, frequency, speed, grid size
- [ ] UI controls panel (Tweakpane)
- [ ] Built-in presets for quick starting points
- [ ] PNG export
- [ ] Desktop only (no mobile)

## Phase 2 (Future)

- [ ] Image/video input sources
- [ ] Webcam support
- [ ] GIF/video export
- [ ] Additional presets
- [ ] Color palette controls
- [ ] Mobile support

---

## Success Criteria

1. Smooth 60fps animation in modern browsers
2. Intuitive controls for non-technical users
3. Visually compelling output similar to DIA's Accordion effect
4. Works on desktop Chrome, Firefox, Safari

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Typography | Curated selection of Google Fonts |
| Text input | User-defined text box, default: "hello world" |
| Mobile support | Deferred to Phase 2 |
| Presets | Yes, include built-in presets in MVP |

---

*Updated with decisions. Ready for final approval to begin implementation.*
