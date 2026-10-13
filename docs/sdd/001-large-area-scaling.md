# SDD: Large-area map scaling

- **Repo:** `87_undefined/bukitjalil-pavilion-infographic` (model changes in the `map-assets` submodule)
- **Status:** `implemented`
- **Date:** 2026-10-13
- **Related:** [docs/large-area-scaling.md](../large-area-scaling.md), [docs/architecture.md](../architecture.md)

## 1. Context / current architecture

The site owns the renderer, camera and chapter UI (`src/scene.ts`). The massing, ground layers and sun live in `MapModel` (`map-assets/src/model/model.ts`). Before this change each building was its own mesh and outline, the shadow box was ±760 m, and `scene.ts` moved the near plane every frame so the ground layers would not z-fight at ~4 km.

## 2. Problem and non-goals

**Problem:** Those fixes stop working once the study area is 10–20 km across: the far plane clips the map, depth precision runs out, one mesh per building does not hold frame rate, and the shadow box covers only the middle.

**Non-goals:** Splitting OSM data into files that load per tile. Re-running the pixel-flicker probe. Tagging map-assets or moving the KLEC site's submodule.

## 3. Questions asked and answers

| Question | Answer |
|---|---|
| Do the whole plan, or stop after a design note? | The user pointed at `docs/large-area-scaling.md` and said to do it. |
| Stream tiles now? | No. There is still one study square and one data file. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Logarithmic depth on the renderer, flat layers that do not write depth, buildings merged per 1 km tile and material, outlines driven by screen density, and a shadow box fitted to the view that does not redraw during a pure orbit.

**Pros:** Draw calls fall from thousands to tens. Ground layers cannot z-fight as the camera pulls back. KLEC's ±760 m shadow box is unchanged until a site calls `fitShadows`. Current Bukit Jalil chapters stay above the density where context blocks disappear.

**Cons / risks:** Logarithmic depth turns off early-z. The shadow map on the overview is about 2 m per texel, so shadows are soft. Merged copies sit in memory beside the original block geometries (needed for shade rays and mode changes). The flicker probe was not re-run.

**Rejected alternatives:**

| Alternative | Why not |
|---|---|
| Keep moving the near plane, and raise `far` | Depth precision still collapses once `near` is capped. |
| Hide context blocks at 0.25 px/m | A phone on the widest current chapter is about 0.23 px/m, so the city would vanish. Cutoff is 0.12 px/m. |
| Cascaded shadow maps | A fitted box covers this site; CSM is a later option if close-up shadows are too soft. |

## 5. Acceptance criteria and verification

- [x] Renderer uses a logarithmic depth buffer; near is 1 m; far grows with the study square (15,274 m here).
- [x] Chapter 00 on a desktop stage stays at the 35 % outline floor (measured 0.55 px/m).
- [x] The model draws in tens of calls, not one call per building (about 70 calls, ~120k triangles).
- [x] A full orbit dirties the shadow map once.
- [x] Roads, water, green and building outlines still read correctly on chapter 00 and a closer chapter (browser, light theme). Steady frames on chapter 00 were about 8 ms median in that browser.
- [ ] Pixel-flicker probe (blinking pixels per orbit frame) re-run on a real GPU.

## 6. Status history

| Date | Status | Note |
|---|---|---|
| 2026-10-13 | implemented | User asked to carry out `docs/large-area-scaling.md`. |
