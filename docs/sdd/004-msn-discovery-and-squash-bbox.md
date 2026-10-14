# SDD: MSN building discovery labels + include National Squash Centre outline

- **Repo:** `87_undefined/bukitjalil-pavilion-infographic` (map-assets submodule `areas/bukit-jalil`)
- **Status:** `implemented`
- **Date:** 2026-10-14
- **Related:** [architecture.md](../architecture.md), [003-sports-complex-facilities.md](003-sports-complex-facilities.md)

## 1. Context / current architecture

Chapter **02 Sports** colours the sports zone and pins named venues plus curated labels (aquatic, track, Gym 3, squash). The map comes from map-assets `loadArea('bukit-jalil')` with `halfSizeM: 1800` around `3.056, 101.678` → east edge ≈ **101.694193**.

OSM already has a named building **National Squash Centre** (`way/104732878`, ~3.0520° N, 101.6944° E; Nominatim). It is **outside** the current bbox, so it is missing from `raw/overpass.json` / `buildings.json`. `rules.json` already lists that name under the sports zone and would colour it once present.

Beside MSN HQ, dozens of unnamed `building=roof` pieces are sports-zone highlighted with no labels. Gym 1 / 2 / 3 and other MSN halls (KBS / NSC lists) have no per-hall coordinates in OSM.

## 2. Problem and non-goals

**Problem:** (1) Unnamed highlighted roofs near Gymnasium 3 cannot be identified, so permanent names cannot be assigned yet. (2) The National Squash Centre has a real OSM outline but is clipped out of the study square, so chapter 02 only has a curated coordinate pin with no massing.

**Non-goals:** Inventing OSM names or footprints; permanent Gym 1/2/other MSN labels before the user identifies buildings; skatepark; shifting the study centre west/east in a way that drops Muhibbah or Pavilion; committing/pushing map-assets until asked.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Which buildings near Gym 3 — only MSN roofs, or further east too? | **Highlight all the buildings first** so the user can see which is which, then they will say what each is. |
| Separate Gym 1/2 pins vs one cluster label? | Deferred until after discovery labels. |
| Squash visibility? | **Extend the OSM building outline / study area** so the National Squash Centre outline is included and visible. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

1. **Expand study area** in `map-assets/areas/bukit-jalil/area.json`: raise `halfSizeM` enough that the squash building bbox (≈101.69423–101.69455) and a small margin sit inside the square (target east ≥ ~101.6955). Keep the same centre so Muhibbah / Pavilion stay in. Re-run `npm run data:fetch -- bukit-jalil` and `npm run data:process -- bukit-jalil`. Confirm `National Squash Centre` lands in `buildings.json` / `named-outlines.json` and in the sports zone.
2. **Chapter 02:** once the outline exists, use a normal **place pin** on `National Squash Centre` (OSM name) instead of (or replacing) the curated lat/lon-only pin; side panel can say OSM building rather than pin-only.
3. **Discovery labels (temporary):** on chapter 02, add numbered text pins on sports-zone buildings in the MSN–arena band (centroid within ~400 m of MSN HQ, or area ≥ a threshold such as ~400 m² so hundreds of tiny roof shards do not flood the view). Label as `#01`, `#02`, … plus OSM id in the tip / side-panel list so the user can point at “#12 is Gym 1”. Keep existing venue pins. Mark the discovery block clearly (i18n note: temporary / for identification); remove or gate it after naming is decided in a follow-up SDD.
4. **Follow-up (out of this SDD):** after the user maps numbers → names, add permanent curated/i18n labels for Gym 1, Gym 2, etc., and drop discovery pins.

**Pros:**
- Squash gets real OSM massing already named in rules — no invented geometry.
- Numbered discovery lets the user identify halls without guessing lat/lon.
- Expansion is a small half-size bump, not a centre shift.

**Cons / risks:**
- Larger `halfSizeM` pulls more OSM (block count, fetch time, payload) and slightly widens the clip/shadow box.
- Discovery pins still need an area/radius filter or the map becomes unreadable.
- Number → name mapping is only as good as the user’s read of the 3D massing vs satellite.

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Guess Gym 1/2 labels on the three largest roofs now | User asked to identify visually first; wrong hall names are worse than none |
| Shift centre east instead of growing halfSize | Risks clipping Muhibbah / west margin |
| Edit OSM remotely or invent a squash footprint | Against project rules; the named way already exists outside the bbox |

## 5. Acceptance criteria and verification

- [x] After re-fetch/process, `buildings.json` (or named outlines) contains `National Squash Centre` with a ring inside the study square
- [x] Chapter 02 shows that building as sports-zone massing and an OSM place pin (not pin-only)
- [x] Chapter 02 shows numbered discovery pins on the filtered sports-zone buildings near MSN, with a panel/list the user can read
- [x] Browser: `?chapter=2` — squash listed as OSM estimate height; discovery `#01`–`#36` in side panel
- [x] Typecheck passes; no invented building rings

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-14 | draft | User: highlight all buildings for ID; extend OSM so National Squash Centre outline is visible |
| 2026-10-14 | approved | User: yes |
| 2026-10-14 | implemented | halfSize 1950 + re-fetch; place pin for squash; temporary #01–#36 near MSN |
