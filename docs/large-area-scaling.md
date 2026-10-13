# Scaling the 3D map to larger areas (10–20 km)

Status: **rendering half shipped** (2026-10-13). Depth, ground layers, 1 km building batches, outline density and view-fitted shadows are in `map-assets` and this site's `src/scene.ts`. Streaming the map as separate tile files is still open (item 4).

## Background: the flicker fix in 6ca3a43

Bukit Jalil covers a much larger area than KLEC (about 5,168 outlined blocks seen from ~3.9 km, versus 329 blocks from ~1.4 km). Two problems showed up while the camera orbited. The camera itself was ruled out: field of view, aspect ratio, near/far and canvas size stayed constant on every frame.

1. **Building outlines aliasing.** At ~0.5 px per metre the 1 px `EdgesGeometry` lines pop on and off between frames. They caused about 82% of the blinking pixels in 00.
   *Fix:* outline opacity fades with on-screen density, from full strength at ≥1.3 px/m down to 35% at ≤0.6 px/m.
2. **Z-fighting between the flat ground layers.** Ground, green, roads and water sit 2–6 cm apart. With `near` fixed at 20 m, a 24-bit depth buffer resolves only about 5–20 cm at 3.5–6.7 km.
   *Fix:* `near` = 5% of the camera distance, clamped to 20–400 m.
3. Also, the shadow map is now redrawn only when the light or mode changes.

Pixels blinking per frame during the orbit (Mac GPU):

| View | Before | After |
|---|---:|---:|
| Desktop 00, light | 3,380 | 608 |
| Desktop 02, light | 10,200 | 840 |
| Mobile 00, light | 1,832 | 323 |

KLEC, for reference, measures 1,766.

## Why this fix will not hold at 10–20 km

| Limit today | What breaks |
|---|---|
| `far` fixed at 14 km | The far side of the map gets clipped. Raising `far` costs depth precision. |
| `near` capped at 400 m | Depth precision stops keeping up with the distance, so the ground layers z-fight again. |
| One mesh + outline per building | Tens of thousands of draw calls, a low frame rate, and outlines that shimmer even when faded. |
| Shadow camera ±760 m (hard-coded in map-assets for KLEC) | Most of the map has no shadows. |

## Approach (in priority order)

### 1. Depth buffer that holds precision at any distance (map-assets, quick)
- Use `logarithmicDepthBuffer: true` on the renderer, or reversed-Z depth (a float depth buffer with `reverseDepthBuffer`, where supported).
- That removes the need for the near-plane trick, and `far` can grow with the area (for example 3× its diagonal).
- Check the cost: log depth disables early-z, so measure the frame rate with 5k+ meshes.

### 2. Flat layers that cannot z-fight (map-assets, quick)
- Either separate the layers by real heights scaled to the area (for example 0.5–1 m at a 20 km scale)...
- ...or draw the flat layers with `depthWrite: false` and a fixed `renderOrder` (ground → green → water → roads), plus `polygonOffset` where they meet buildings.
- With either option the problem is independent of camera distance.

### 3. Level of detail for buildings
- When zoomed out, show only key and tall buildings and no outlines. Bring in context blocks and outlines as the screen density rises (extending the current px/m fade).
- Merge buildings per zone and per material into a few `BufferGeometry` meshes, or use `InstancedMesh` for boxes. That takes draw calls from thousands down to tens.
- Make outlines one merged `LineSegments` per LOD level, or replace them with a screen-space edge pass.

### 4. Tiles
- Split the area into tiles (for example 1 km squares) in map-assets, and load or unload them by camera distance and view frustum.
- Fetch the data per tile, so the first load stays small.

### 5. Shadows that follow the view
- Fit the directional light's shadow camera to the visible ground each frame, or use cascaded shadow maps (`three/examples/jsm/csm`).
- Turn shadows off entirely when the view is far out, where they read as noise anyway.

## Where the work goes
- Items 1, 2, 5 and the merging in item 3 belong in **map-assets**, so every site (KLEC, Bukit Jalil, future areas) gets them. Release them as a new tag, then re-pin each website. Not tagged yet: the edits are local in this site's `map-assets` submodule.
- Once item 1 ships, the website-side outline fade and near-plane workaround in `src/scene.ts` can be simplified. Done: the near-plane nudge is gone, and outline opacity is `MapModel.setScreenDensity`.
- Re-run the flicker probe (pixels blinking per frame during the 00 orbit, on a real GPU) before and after each step, and keep every site at or below KLEC's level. Not re-run here. What was checked is below.

## What shipped

| Plan item | Where | Behaviour |
|---|---|---|
| 1. Depth | `src/scene.ts`, `examples/basic/main.ts` | `logarithmicDepthBuffer: true`. `clipPlanes(halfSizeM)` sets near = 1 m and far = max(14 km, 3× the study-square diagonal). Bukit Jalil is 15.3 km. |
| 2. Flat layers | `map-assets` `model.ts` | Green, roads, water and footways do not write depth. Draw order is ground → green → roads → major roads → water, then footways. The small height offsets stay, so a close view still stacks the same way. |
| 3. Buildings | `map-assets` `model.ts` | One merged mesh (and one outline mesh) per 1 km tile, material and key/context. Shade rays still hit the original blocks. `setScreenDensity` keeps the 35 % outline floor at ≤0.6 px/m and full outlines from 1.3 px/m. Below 0.12 px/m (a ~20 km square framed like this site, not the current chapters) outlines and context blocks turn off. |
| 4. Tiles | not done | Batches are 1 km squares, so off-screen blocks are frustum-culled, but the site still downloads one area file. |
| 5. Shadows | `MapModel.fitShadows` | The shadow box follows the orbit target and stays put while the camera only turns, so the 00 orbit does not redraw the 4096² map. Shadows turn off when that box would be coarser than 2.5 m per texel. The old ±760 m box remains the floor for a 500 m study square (KLEC) until a site calls `fitShadows`. |

Checked in the browser on the running dev server (light theme, chapter 00 and a closer chapter):

- Logarithmic depth on, near 1 m, far 15,274 m. Chapter 00 desktop is 0.55 px/m and outline fade 0.35, same floor as the flicker fix.
- About 70 draw calls and ~120k triangles for the whole model (was one mesh per block, 5,168 of them). A phone-width chapter 03 (0.23 px/m) still shows context blocks.
- Turning the camera through a full circle marks the shadow map dirty once, not every frame. Steady frames on chapter 00 sat around 8 ms (p95 17.5 ms) in that browser.
- Roads stay on the ground, water and green read as separate layers, and building outlines are on at a close chapter (1.7 px/m, fade 1). No WebGL errors.
