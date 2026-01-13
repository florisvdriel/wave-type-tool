# Refactoring Analysis: Wave Type Tool Vector Engine

## Executive Summary

The proposed refactoring from raster-based (`text()`) to vector-based (`textToPoints()` or opentype.js) rendering is **architecturally sound** but requires careful implementation. The current codebase already has strong foundations (grid caching, spatial phase precomputation, performance optimizations), which will work well with the proposed changes.

**Overall Assessment: PROCEED WITH CAUTION - Good approach with notable caveats**

---

## 1. Architectural Soundness Analysis

### Strengths of Proposed Approach

#### 1.1 Vector-Based Rendering is the Right Direction
- **Current Issue**: SVG exports use `<text>` elements that require font installation on viewer's system
- **Solution**: Converting glyphs to paths creates self-contained SVGs
- **Benefit**: Professional-grade export quality, works everywhere

#### 1.2 Performance Considerations are Solid
- Caching `textToPoints()` results when text/font changes ✅ CRITICAL
- Max 100 clone limit to prevent crashes ✅ SENSIBLE
- Current grid caching infrastructure (lines 15-33 in main.js) provides foundation

#### 1.3 Phased Implementation Approach
- Separating vector engine from display is pragmatic
- Canvas preview can remain raster while exports use vector
- Allows incremental migration without breaking existing functionality

### Architectural Concerns

#### 1.1 Performance Cliff with Vector Rendering
**Issue**: `textToPoints()` returns hundreds/thousands of points per glyph
- Simple "A" = ~30-50 points
- Complex "W" = ~100-200 points
- 240 grid items × 50 points avg = **12,000 points to transform per frame**
- With 100 clones: **1.2 million points** to process

**Current State**:
```javascript
// main.js lines 239-241
for (let i = 0; i < items.length; i++) {
    items[i].transformed = applyTransforms(items[i], i, t, PARAMS, p);
}
```
This currently transforms ~240 items. With vector paths, you'll be transforming points, not just positions.

**Mitigation Required**:
- Pre-transform paths at glyph cache level (not per-frame)
- Use transformation matrices, not per-point calculations
- Keep preview as raster; only use vectors for export

#### 1.2 Memory Pressure from Glyph Cache
**Issue**: Each unique `{font, char, fontSize}` tuple requires caching
- 30 fonts × 26 letters × 10 common sizes = 7,800 cached glyphs
- Each glyph = array of point objects with {x, y, type} properties
- Estimated: 50 points × 16 bytes = 800 bytes per glyph
- Total: ~6MB for full cache

**Current State**: No glyph caching exists yet

**Mitigation Required**:
- Implement LRU cache with size limit (suggested: 100-200 glyphs)
- Cache at current fontSize only (don't pre-cache all sizes)
- Clear cache on font change

#### 1.3 SVG Complexity Explosion
**Issue**: Current SVG export (svg.js lines 34-55) creates one `<text>` element per character
```xml
<text transform="..." fill="..." font-size="36">A</text>
```

With vector paths:
```xml
<path d="M10,20 L30,40 Q50,60,70,80..." transform="..." fill="..."/>
```
- Path `d` attribute can be 500-2000 characters per glyph
- 240 items × 1000 chars avg = 240KB SVG file (vs 20KB currently)
- Nested transforms with clones: exponentially larger

**Mitigation Required**:
- Use `<defs>` and `<use>` for repeated glyphs (define once, reference many times)
- Simplify paths (consider tolerance parameter for `textToPoints`)
- Offer "optimize for file size" export option

---

## 2. Potential Pitfalls & Risks

### High Priority Risks

#### 2.1 Font Loading Complexity
**Problem**: Google Fonts vs Custom Fonts have different APIs
- Google Fonts: CSS `@import` → no access to font data for parsing
- Custom Fonts: Uploaded files → need opentype.js to parse
- p5.js `textToPoints()`: Requires font to be loaded in p5 font object

**Current State**:
```javascript
// config.js lines 89-127: 30 Google Fonts defined
// main.js line 244: p.textFont(PARAMS.font) - string reference only
```

**Risk**: `textToPoints()` won't work with Google Fonts loaded via CSS. You'll need actual font files.

**Solution Required**:
1. **Option A**: Fetch Google Font files from googleapis.com and load as opentype.js objects
2. **Option B**: Require users to upload custom fonts for vector export (limit to uploaded fonts only)
3. **Option C**: Hybrid - raster for Google Fonts, vector only for uploaded

**Recommended**: Option A - fetch Google Font files at runtime when vector export requested

#### 2.2 Clone Loop Implementation Ambiguity
**Problem**: "Clone loop that draws text paths multiple times with offsets" is underspecified

**Questions**:
- Are clones layered (extrusion effect) or scattered (noise effect)?
- Do clones inherit transforms or have fixed offsets?
- Are clones rendered as separate paths or merged?
- What's the z-ordering of clones?

**Example Needed**:
```javascript
// Option 1: Layered Extrusion (TEXTR-style)
for (let i = 0; i < cloneCount; i++) {
  const offset = i * cloneSpacing;
  drawPath(path, x + offset, y + offset, opacity * (1 - i/cloneCount));
}

// Option 2: Scattered Clones
for (let i = 0; i < cloneCount; i++) {
  const angle = (i / cloneCount) * Math.PI * 2;
  const radius = cloneRadius;
  drawPath(path, x + cos(angle)*radius, y + sin(angle)*radius);
}
```

**Recommendation**: Start with Option 1 (layered extrusion) - simpler and more performant

#### 2.3 Sine Wave Distortion on Paths
**Problem**: "Per-letter displacement" could mean:
1. Displace entire path (same as current)
2. Displace individual points in path (much more complex)

**Current State**: Transforms operate at item level (transforms/index.js lines 122-280)

**Risk**: Per-point distortion requires:
- Iterating through all points in path
- Applying different transform to each point based on position
- Regenerating path `d` attribute every frame

**Performance Impact**:
- Current: 240 transforms/frame
- Per-point: 12,000+ transforms/frame (50× slower)

**Recommendation**: Keep transforms at glyph level, not point level. If per-point distortion needed, do it at export time only, not in preview.

### Medium Priority Risks

#### 2.4 Transform Parity Between Canvas and SVG
**Problem**: Canvas (ctx.transform) and SVG (transform attribute) handle transforms differently

**Current Discrepancy**:
```javascript
// main.js lines 258-261 (Canvas rendering)
p.translate(x, y);
p.rotate(p.radians(rotation));  // Rotation exists but not implemented yet
p.scale(scale);

// svg.js lines 46-49 (SVG export)
let transform = `translate(${x}, ${y})`;
if (scale !== 1) {
  transform += ` scale(${scale})`;
}
// Missing rotation in SVG export!
```

**Risk**: Adding rotation (from PRD section 5.3) will work in preview but fail in SVG unless both code paths updated

**Mitigation**: Create shared transform calculation utility

#### 2.5 Tweakpane Control Explosion
**Problem**: PRD requests controls in folders: Geometry, Extrusion, Motion, Style
- Current: 40+ parameters in PARAMS (config.js lines 1-72)
- Adding: Clone count, clone spacing, clone opacity, extrusion direction, etc.
- Result: 60+ parameters

**Risk**: UI becomes overwhelming, especially with nested folders

**Mitigation**:
- Use Tweakpane tabs (not just folders)
- Implement presets system (PRD section 5.4) early
- Hide advanced controls by default

---

## 3. Recommended Code Organization

### Class Structure (New Architecture)

```
src/
├── config.js                    # Parameters, fonts (existing)
├── main.js                      # p5 sketch, render loop (existing)
├── controls.js                  # Tweakpane UI (existing)
├── transforms/
│   └── index.js                 # Transform calculations (existing)
├── vector/                      # NEW MODULE
│   ├── FontManager.js          # Font loading + caching
│   ├── GlyphCache.js           # textToPoints() caching
│   ├── PathRenderer.js         # Canvas path rendering
│   └── PathExporter.js         # SVG path generation
└── export/
    ├── png.js                   # Raster export (existing)
    ├── mp4.js                   # Video export (existing)
    └── svg.js                   # Vector export (REFACTOR)
```

### Module Responsibilities

#### FontManager.js (NEW)
```javascript
class FontManager {
  constructor() {
    this.loadedFonts = new Map(); // fontName → Font object
  }

  async loadGoogleFont(fontName) {
    // Fetch font file from googleapis.com
    // Parse with opentype.js
    // Return Font object
  }

  async loadCustomFont(file) {
    // Parse uploaded file with opentype.js
    // Return Font object
  }

  getFont(fontName) {
    // Return cached Font object or null
  }
}
```

#### GlyphCache.js (NEW)
```javascript
class GlyphCache {
  constructor(maxSize = 200) {
    this.cache = new Map(); // key → {points, bounds}
    this.maxSize = maxSize;
  }

  getCacheKey(fontName, char, fontSize) {
    return `${fontName}|${char}|${fontSize}`;
  }

  getGlyph(fontName, char, fontSize, fontManager) {
    const key = this.getCacheKey(fontName, char, fontSize);

    if (!this.cache.has(key)) {
      const font = fontManager.getFont(fontName);
      if (!font) return null;

      // Use opentype.js to get path
      const path = font.getPath(char, 0, 0, fontSize);
      const points = path.commands.map(cmd => ({
        type: cmd.type,
        x: cmd.x || 0,
        y: cmd.y || 0,
        x1: cmd.x1, y1: cmd.y1, // For curves
        x2: cmd.x2, y2: cmd.y2
      }));

      this.cache.set(key, { points, bounds: path.getBoundingBox() });

      // LRU eviction
      if (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    }

    return this.cache.get(key);
  }
}
```

#### PathRenderer.js (NEW)
```javascript
class PathRenderer {
  constructor(glyphCache, fontManager) {
    this.glyphCache = glyphCache;
    this.fontManager = fontManager;
  }

  renderToCanvas(ctx, item, params) {
    const glyph = this.glyphCache.getGlyph(
      params.font,
      item.char,
      params.fontSize,
      this.fontManager
    );

    if (!glyph) {
      // Fallback to raster text
      ctx.fillText(item.char, 0, 0);
      return;
    }

    // Render path with clones if enabled
    if (params.extrusionEnabled) {
      this.renderWithClones(ctx, glyph, item, params);
    } else {
      this.renderSinglePath(ctx, glyph, item, params);
    }
  }

  renderWithClones(ctx, glyph, item, params) {
    const cloneCount = Math.min(params.cloneCount || 1, 100);

    for (let i = 0; i < cloneCount; i++) {
      const cloneOffset = i * params.cloneSpacing;
      const cloneOpacity = item.transformed.opacity * (1 - i / cloneCount);

      ctx.save();
      ctx.translate(cloneOffset, cloneOffset);
      ctx.globalAlpha = cloneOpacity;
      this.drawPath(ctx, glyph.points);
      ctx.restore();
    }
  }

  drawPath(ctx, points) {
    ctx.beginPath();
    for (const point of points) {
      if (point.type === 'M') {
        ctx.moveTo(point.x, point.y);
      } else if (point.type === 'L') {
        ctx.lineTo(point.x, point.y);
      } else if (point.type === 'Q') {
        ctx.quadraticCurveTo(point.x1, point.y1, point.x, point.y);
      } else if (point.type === 'C') {
        ctx.bezierCurveTo(point.x1, point.y1, point.x2, point.y2, point.x, point.y);
      } else if (point.type === 'Z') {
        ctx.closePath();
      }
    }
    ctx.fill();
  }
}
```

#### PathExporter.js (NEW)
```javascript
class PathExporter {
  constructor(glyphCache, fontManager) {
    this.glyphCache = glyphCache;
    this.fontManager = fontManager;
  }

  generateSVGPath(item, params) {
    const glyph = this.glyphCache.getGlyph(
      params.font,
      item.char,
      params.fontSize,
      this.fontManager
    );

    if (!glyph) return null;

    // Convert points to SVG path commands
    let d = '';
    for (const point of glyph.points) {
      if (point.type === 'M') {
        d += `M${point.x},${point.y} `;
      } else if (point.type === 'L') {
        d += `L${point.x},${point.y} `;
      } else if (point.type === 'Q') {
        d += `Q${point.x1},${point.y1} ${point.x},${point.y} `;
      } else if (point.type === 'C') {
        d += `C${point.x1},${point.y1} ${point.x2},${point.y2} ${point.x},${point.y} `;
      } else if (point.type === 'Z') {
        d += 'Z ';
      }
    }

    return d.trim();
  }

  exportSVG(items, params, width, height) {
    // Use <defs> for reusable glyphs
    const uniqueGlyphs = new Map(); // char → path data

    for (const item of items) {
      if (!uniqueGlyphs.has(item.char)) {
        const pathData = this.generateSVGPath(item, params);
        if (pathData) {
          uniqueGlyphs.set(item.char, pathData);
        }
      }
    }

    // Build SVG with <defs> and <use> references
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n`;
    svg += `  <defs>\n`;

    for (const [char, pathData] of uniqueGlyphs) {
      svg += `    <path id="glyph-${char.charCodeAt(0)}" d="${pathData}"/>\n`;
    }

    svg += `  </defs>\n  <g>\n`;

    for (const item of items) {
      const t = item.transformed;
      const transform = `translate(${t.x},${t.y}) scale(${t.scale}) rotate(${t.rotation})`;
      svg += `    <use href="#glyph-${item.char.charCodeAt(0)}" transform="${transform}" fill="${params.textColor}" opacity="${t.opacity}"/>\n`;
    }

    svg += `  </g>\n</svg>`;

    return svg;
  }
}
```

---

## 4. Implementation Phase Recommendations

### Phase 1: Foundation (Week 1)
**Goal**: Get basic vector rendering working without breaking existing functionality

**Tasks**:
1. Add opentype.js dependency
2. Create FontManager.js and GlyphCache.js
3. Implement font loading for ONE Google Font (Inter as test case)
4. Add feature flag: `PARAMS.useVectorRendering = false` (default off)
5. Test vector rendering in isolation (separate test page)

**Success Criteria**:
- Can load Inter font and convert "A" to path points
- Cache works (second call doesn't re-parse)
- No impact on existing raster rendering

**Estimated Effort**: 2-3 days

### Phase 2: Clone Loop + Basic Extrusion (Week 2)
**Goal**: Add extrusion effect with clones

**Tasks**:
1. Create PathRenderer.js
2. Implement `renderWithClones()` method
3. Add Tweakpane controls:
   - Extrusion folder
   - Clone count (1-100)
   - Clone spacing (0-10px)
   - Clone opacity falloff (0-1)
4. Toggle between raster and vector rendering in preview

**Success Criteria**:
- Can see layered extrusion effect in preview
- Performance remains >30fps with 50 clones
- Can toggle back to raster without issues

**Estimated Effort**: 3-4 days

### Phase 3: SVG Export Refactor (Week 3)
**Goal**: Export vector SVGs with proper path data

**Tasks**:
1. Create PathExporter.js
2. Refactor svg.js to use PathExporter when vector mode enabled
3. Implement `<defs>` + `<use>` optimization
4. Add rotation support in SVG export (currently missing)
5. Test with complex glyphs (W, M, @, etc.)

**Success Criteria**:
- SVG exports work in all browsers without fonts installed
- File size is reasonable (<500KB for 240 items)
- Visual output matches canvas preview

**Estimated Effort**: 3-4 days

### Phase 4: Tweakpane Reorganization (Week 4)
**Goal**: Organize controls into folders/tabs

**Tasks**:
1. Create folder structure:
   - Geometry (text, grid, spacing)
   - Motion (scale, position, opacity, jitter)
   - Extrusion (clones, spacing, falloff)
   - Style (colors, background)
   - Export (resolution, format, duration)
2. Add rotation controls (from PRD 5.3)
3. Add sine wave distortion controls (if per-glyph, not per-point)

**Success Criteria**:
- Controls are logically organized
- No more than 8-10 controls visible per folder
- Advanced controls are collapsed by default

**Estimated Effort**: 2-3 days

### Phase 5: Polish + Optimization (Week 5)
**Goal**: Performance tuning and edge case handling

**Tasks**:
1. Add loading states for font loading
2. Implement proper error handling (font load failures)
3. Optimize glyph cache eviction strategy
4. Add "Export Quality" toggle (low/medium/high affects clone count and path simplification)
5. Memory profiling and leak detection

**Success Criteria**:
- No memory leaks after 5 minutes of continuous use
- Graceful degradation when fonts fail to load
- Performance warnings when settings are too complex

**Estimated Effort**: 3-4 days

### Phase 6 (Optional): Advanced Features
**Goal**: Per-letter displacement and advanced distortion

**Tasks**:
1. Implement per-letter wave displacement (NOT per-point)
2. Add noise-based path distortion (at export time only)
3. Depth-based extrusion (z-axis effects)

**Success Criteria**:
- Wave distortion affects entire glyphs, not individual points
- Export remains performant (<30 seconds for 240 items)

**Estimated Effort**: 1 week (only if time permits)

---

## 5. Simplifications & Alternatives

### Alternative 1: Hybrid Approach (RECOMMENDED)
**Description**: Keep preview as raster, use vectors ONLY for SVG export

**Pros**:
- No performance impact on preview
- Simpler implementation
- Users see results instantly

**Cons**:
- Preview doesn't exactly match export (slight rendering differences)

**Implementation**:
```javascript
// In main.js renderFrame()
if (PARAMS.useVectorPreview) {
  renderVectorToCanvas(p, items); // Slow but accurate
} else {
  renderRasterToCanvas(p, items); // Fast preview
}

// In svg.js export
exportVectorSVG(items); // Always vector for export
```

### Alternative 2: Limit Vector Rendering to Exports Only
**Description**: Never render vectors in canvas preview, only in SVG/PNG export

**Pros**:
- Maximum performance in preview
- Simpler codebase (no dual rendering paths)

**Cons**:
- "What you see is what you get" is compromised
- Harder to debug vector rendering issues

**Recommendation**: Start with this approach, add vector preview later if needed

### Alternative 3: Use `canvas.toBlob()` Instead of SVG
**Description**: Skip vector SVG entirely, export high-res raster PNGs

**Pros**:
- Much simpler implementation
- No font parsing needed
- Guaranteed visual fidelity

**Cons**:
- SVGs aren't truly scalable
- File sizes larger
- Can't edit paths in Illustrator/Figma

**Recommendation**: NOT RECOMMENDED - defeats purpose of vector refactor

### Simplification 1: Start with Single Clone
**Description**: Implement full vector pipeline with cloneCount = 1, add loop later

**Benefit**: Reduces complexity by 50%, allows testing core vector rendering first

### Simplification 2: Use p5.js `textToPoints()` Instead of opentype.js
**Description**: p5 has built-in `textToPoints()` method

**Pros**:
- No additional dependency
- Integrates seamlessly with existing p5 setup
- Simpler API

**Cons**:
- Requires p5 Font objects (not string font names)
- Less control over path generation
- May not support all font formats

**Example**:
```javascript
// In p5 setup
const font = loadFont('path/to/font.otf');

// In render
const points = font.textToPoints('A', 0, 0, 72);
// points = [{x, y}, {x, y}, ...]

// Problem: No curve information (only points, not bezier commands)
```

**Recommendation**: Try p5 `textToPoints()` FIRST. If insufficient, switch to opentype.js.

---

## 6. Critical Success Factors

### Must-Have for Success

1. **Font Loading Must Be Bulletproof**
   - Handle CORS issues with Google Fonts
   - Graceful fallback when fonts fail
   - Clear error messages to users

2. **Performance Must Not Degrade**
   - Preview frame rate must stay >30fps
   - Export should complete in <60 seconds for standard settings
   - Memory usage must be bounded (<200MB)

3. **Visual Parity Between Preview and Export**
   - What users see in preview must match SVG export
   - Transforms must be identical (especially rotation)
   - Color handling must be consistent

4. **Cache Invalidation Must Be Correct**
   - Glyph cache invalidates on font/size change
   - Grid cache invalidates on structure change
   - No stale data bugs

5. **Progressive Enhancement**
   - Existing raster mode must continue working
   - Vector mode is opt-in (feature flag)
   - Can roll back if issues arise

### Warning Signs to Watch For

1. **Frame Rate Drops Below 20fps**: Vector rendering too expensive
2. **Memory Usage Grows Over Time**: Cache not evicting properly
3. **SVG Files Exceed 1MB**: Path data not optimized
4. **Export Takes >2 Minutes**: Too many clones or complex paths
5. **Fonts Don't Load 50% of Time**: CORS or parsing issues

---

## 7. Final Recommendations

### Do This

1. **Start with p5.js `textToPoints()`** - Try the simpler approach first
2. **Implement hybrid rendering** - Raster preview, vector export
3. **Add feature flag immediately** - `PARAMS.useVectorRendering = false`
4. **Cache aggressively** - Font objects, glyph paths, transformed paths
5. **Use SVG `<defs>` + `<use>`** - Massively reduces file size
6. **Limit clones to 50 default, 100 max** - More is diminishing returns
7. **Add loading indicators** - Font loading can take 1-2 seconds
8. **Implement graceful degradation** - Fall back to raster if vector fails

### Don't Do This

1. **Don't implement per-point distortion** - Too slow, not worth it
2. **Don't cache all font sizes** - Cache only current fontSize
3. **Don't try to support all fonts** - Start with subset (uploaded + 5 Google Fonts)
4. **Don't refactor everything at once** - Incremental changes only
5. **Don't skip the performance budget** - Set hard limits (100 clones, 200 glyphs)
6. **Don't forget rotation in SVG export** - Already missing, must add

### Questions to Answer Before Starting

1. **Should vector preview be optional or always-on?**
   - Recommendation: Optional toggle in Tweakpane (default: OFF)

2. **Should clones inherit transforms or have fixed offsets?**
   - Recommendation: Fixed offsets (simpler, more predictable)

3. **Should extrusion be Z-axis (depth) or XY-offset?**
   - Recommendation: XY-offset initially, Z-axis in Phase 6

4. **Should SVG export include animation data (SMIL/CSS)?**
   - Recommendation: No - static frame only. MP4 for animation.

5. **Maximum acceptable SVG file size?**
   - Recommendation: Set 500KB soft limit, 2MB hard limit (warn user)

---

## 8. Risk Mitigation Checklist

Before merging each phase:

- [ ] Feature flag allows toggling back to raster
- [ ] No performance regression in raster mode
- [ ] Memory usage profiled (no leaks)
- [ ] Font loading errors handled gracefully
- [ ] Cache invalidation tested with 20+ parameter changes
- [ ] Export visual quality verified in 3+ browsers
- [ ] SVG file size measured (<500KB for standard settings)
- [ ] Clone count enforced (max 100)
- [ ] Glyph cache size limited (max 200)
- [ ] Loading states added for async operations

---

## Conclusion

**The proposed refactoring is architecturally sound**, but success depends on:

1. **Phased implementation** - Don't try to do everything at once
2. **Performance discipline** - Cache everything, measure constantly
3. **Graceful degradation** - Always have a fallback
4. **Clear scope boundaries** - Know what NOT to implement

**Biggest Risk**: Attempting per-point distortion. This will destroy performance and provide minimal visual benefit. Keep transforms at the glyph level.

**Biggest Opportunity**: Using `<defs>` + `<use>` in SVG export can reduce file sizes by 80% compared to naive path duplication.

**Recommended First Step**: Create a proof-of-concept with p5.js `textToPoints()` rendering a single character with 3 clones. If that works smoothly, proceed with full implementation.

**Estimated Total Effort**: 4-5 weeks for Phases 1-5, plus 1 week for Phase 6 if needed.

**Go/No-Go Decision Point**: After Phase 1, measure:
- Font loading success rate (must be >95%)
- Glyph cache hit rate (should be >80%)
- Preview frame rate with vector rendering (must be >30fps)

If these metrics don't meet thresholds, reconsider the vector approach and stick with high-resolution raster exports instead.
