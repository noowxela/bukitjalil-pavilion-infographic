# SDD: Sports complex facilities (aquatic, gymnastics, runway, car parks)

- **Repo:** `87_undefined/bukitjalil-pavilion-infographic`
- **Status:** `implemented`
- **Date:** 2026-10-14
- **Related:** [002-sports-complex-chapter.md](002-sports-complex-chapter.md), [architecture.md](../architecture.md), map-assets `areas/bukit-jalil`

## 1. Context / current architecture

Chapter **02 Sports** (`src/chapters.ts`, i18n `sc`) flies to the National Sports Complex with zone colouring and pins for SP17, National Stadium, Unifi Arena, hockey stadium, and Majlis Sukan Negara. The side panel already says the athletics runway, skatepark, squash outline and aquatic roofs are missing or unnamed.

In the current OSM / processed data:

| Wanted | In data today |
| --- | --- |
| Buildings around the National Stadium | **Yes** — ~383 `zone=sports` blocks (mostly unnamed `building=roof` within 460 m of the stadium centre; these are the stadium membrane + aquatic canopies). They already draw in zone style. |
| Car parks | **Yes** — OSM named **Car Park A–D, F** (capacities tagged) near the complex; drawn when `mode.facilities.parking` is true (location chapter already uses this). Car Park E is in raw OSM but not in `facilities.json`. |
| Swimming / National Aquatic Centre | **No named building** — only unnamed roof pieces in the sports zone. |
| Gymnastics hall | **Not in OSM** as a named feature in this pull. |
| Athletics runway / track | **Not in OSM** as a named leisure/track feature in this pull. |

Facilities rendering lives in map-assets (`MapModel` parking footprints + entrance pins). Chapter modes toggle `facilities.parking`.

## 2. Problem and non-goals

**Problem:** Chapter 02 does not make the surrounding complex readable enough: car parks are off, and swimming, gymnastics and the runway are not labelled, so the stadium cluster reads as one anonymous roof field.

**Non-goals:**

- Inventing building footprints or a painted athletics oval without a cited source or OSM geometry
- Rebuilding the whole Overpass extract unless we choose map-assets enrichment for Car Park E or new named objects
- Changing other chapters’ parking defaults
- Skatepark (still absent; stays a gap unless a later SDD)

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Show car parks on chapter 02? | **Yes** (user asked). Turn on parking layer; pin A–D and F with capacities where tagged. |
| Swimming, gymnastics, runway not in OSM — how to show? | **Curated text pins** (lat/lon + publisher/URL), **no invented massing**. User: yes. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

1. **Chapter 02 mode:** `facilities: { … parking: true }`. Side-panel toggle to hide parking (same pattern as location chapter).
2. **Pins:** keep venue pins; add text/facility pins for **Car Park A, B, C, D, F** (label + capacity from `facilities.json` when present). Drop or soften the “gaps only” tone once labels exist for what we can show.
3. **Massing:** keep `buildingStyle: 'zone'` so all sports-zone roofs stay coloured; optionally nudge the camera slightly wider so A–D lots and the roof field read together. Do **not** hide Pavilion/City — they stay context grey.
4. **Aquatic / gymnastics / runway (if curated pins approved):** add map-assets anchors (or website-only XY from cited coordinates) with English/Malay/Chinese labels in i18n; list them in the side panel under “Venues” with “pin only · not a building outline in OSM”. Cite Wikipedia / NSC pages (or equivalent) in `facts.json` / source line. If a reliable lat/lon cannot be found for one of them, leave it in the gaps note.
5. **Car Park E:** optional follow-up in map-assets pipeline if it was dropped; not blocking this SDD if A–D/F are enough.

**Pros:**

- Car parks ship from existing data with no inventing
- Labels for aquatic / gymnastics / runway match user intent without fake geometry
- Stays mostly website + thin map-assets anchor edits

**Cons / risks:**

- Curated pins can drift if the map is wrong; must cite a source
- Unnamed roofs still cannot be told apart (stadium vs aquatic) without better OSM tagging
- More pins on a dense chapter — risk of clutter on mobile

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Draw a fake runway oval / pool mass | Breaks the OSM / cited-source rule used everywhere else |
| Only turn parking on and leave swimming/gymnastics/runway unnamed | Does not meet the user’s ask for those venues |
| Full OSM remapping of the complex in this change | Correct long-term, too large for this chapter pass |

## 5. Acceptance criteria and verification

- [x] Chapter 02 shows parking footprints for the complex; pins for Car Park A–D and F with capacities when tagged
- [x] Sports-zone buildings around the stadium remain visible (zone colour)
- [x] Curated pins: aquatic, gymnastics (Gimnasium 3), athletics track; side panel marks pin-only vs OSM building
- [x] EN / 中文 / BM updated; typecheck passes
- [x] Browser: `?chapter=2` shows 13 pins including track, aquatic, gym, A–D/F; parking layer on; side panel lists venues + car parks + gaps

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-14 | draft | User: show swimming, gymnastics, buildings around stadium, runway, car parks |
| 2026-10-14 | approved | User: yes (curated pins) |
| 2026-10-14 | implemented | Parking A–D/F + curated aquatic/gym/track pins on chapter 02 |
