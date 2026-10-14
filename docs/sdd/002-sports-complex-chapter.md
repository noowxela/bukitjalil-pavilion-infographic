# SDD: National Sports Complex chapter

- **Repo:** `87_undefined/bukitjalil-pavilion-infographic`
- **Status:** `implemented`
- **Date:** 2026-10-14
- **Related:** [architecture.md](../architecture.md), [001-large-area-scaling.md](001-large-area-scaling.md), map-assets `areas/bukit-jalil/rules.json`

## 1. Context / current architecture

Chapters are built in `src/chapters.ts` from map-assets data (`loadArea('bukit-jalil')`) and copy in `src/i18n/{en,zh,ms}.ts`. The rail shows `pad(c.id)` (00–09 today). `World.setMode` drives zone colour, landmark pins, x-ray, routes and facilities.

**01 Landmarks** already mentions the National Stadium and Unifi Arena, and pins stadium, arena, hockey stadium, Pavilion, The Park and the recreational park together — a city-wide landmarks sweep, not a sports-complex close-up.

The **sports** zone in map-assets (`rules.json`) covers Unifi Arena, National Squash Centre, Stadium Hoki Nasional Malaysia, Majlis Sukan Negara, plus unnamed `building=roof` pieces within 460 m of the National Stadium centre (the stadium itself has no building outline in OSM). Facts for stadium and arena live in `sources/facts.json`.

In the current OSM pull there are **no named runway / athletics track or skatepark features**. Aquatic centre canopies are unnamed roof pieces mixed into the stadium roof cluster.

## 2. Problem and non-goals

**Problem:** Visitors need a chapter that sits on the National Sports Complex and names the venues around it (National Stadium, National Hockey Stadium, Unifi Arena, and nearby facilities such as squash / aquatic roofs, runway, skatepark) instead of mixing them into the city-wide landmarks chapter.

**Non-goals:**

- Replacing or deleting 01 Landmarks
- Editing KLEC or other map-assets spots
- Inventing building footprints for runway / skatepark when OSM has none (unless approval chooses curated pins — see §3)
- New camera / rendering features beyond an ordinary chapter view + mode + pins + side panel
- Streaming tiles or further large-area work (001)

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| New chapter vs narrow/replace 01 Landmarks? | **New chapter** (do not replace 01). |
| Where in the rail? | **After 01 Landmarks** (default unless overridden on approve): Overview → Landmarks → **Sports complex** → Transit → … |
| Runway + skatepark (not in OSM today)? | **Open on approve** — default in this draft: ship with mapped venues (stadium, hockey, Unifi, squash, sports-zone roofs) and name gaps in the side panel; no invented footprints. Optional follow-up: curated text pins with cited lat/lon in map-assets if you want them visible in v1. |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

1. Insert a new chapter in `src/chapters.ts` with `id: 2`, and renumber every later chapter’s `id` (+1) so the on-screen numbers stay sequential (02…10). Update any hard-coded id checks, screenshot names, or copy that say “chapter 04” for massing if they assume the old numbering.
2. Camera: fly to a close sports-complex framing (target near the STADIUM / ARENA anchors, distance ~1200–1800 m — tune in browser). Zone style on, LRT context or highlight for SP17, footways/routes off (Connections / Event day already own walks).
3. Pins: `STADIUM` (anchor), Unifi Arena, Stadium Hoki Nasional Malaysia; add National Squash Centre and SP17 if they resolve from data; parking only if useful and not noisy.
4. Side panel: short venue list (capacity / opened from `facts.json` where present; height notes for estimates; “not in OSM” for runway / skatepark under the default).
5. i18n: new block in en / zh / ms (label, tab, title, lead, stats, sources). Keep 01’s copy city-wide; this chapter owns the complex deep-dive.
6. map-assets: **no rebuild required** for the default. If approve chooses curated runway/skatepark pins, add anchors (or a small facilities list) with publisher + URL in the bukit-jalil spot and re-pin after a map-assets commit on `area/bukit-jalil`.

**Pros:**

- Clear story beat without weakening 01
- Reuses sports zone colouring, existing anchors and facts
- Stays mostly website-side (fast iterate)

**Cons / risks:**

- Rail grows to 11 chapters; mobile tab overflow already watched in screenshots
- Stadium massing remains estimated roof pieces — copy must say so
- Renumbering shifts deep links (`?chapter=N` / `#NN`) for chapters after the insert
- Runway / skatepark stay absent unless curated pins are approved

**Rejected alternatives:**

| Alternative | Why not |
| --- | --- |
| Narrow 01 to sports-only | User asked for a **new** chapter; Pavilion / City / park still need a landmarks beat |
| Place after Event day | Sports complex is identity, not a sequel to crowd flow; after 01 matches the overview → landmarks → deep-dive arc |
| Invent runway / skatepark footprints without sources | Breaks the OSM / cited-source rule used everywhere else |

## 5. Acceptance criteria and verification

- [x] New tab appears after Landmarks; chapter numbers are contiguous; EN / 中文 / BM strings load
- [x] Camera settles on the sports complex; National Stadium, Unifi Arena and hockey stadium pins are visible and readable
- [x] Mode keeps sports zone colouring; Pavilion / City do not steal the story (context massing OK)
- [x] Side panel lists the complex venues with sourced capacities where available; stadium height caveat preserved
- [x] Under default: runway / skatepark are not drawn as fake buildings; if mentioned, copy says they are not in the OSM pull
- [x] `npm run typecheck` passes; browser check on chapter 02 (light, EN + 中文)
- [x] Evidence: `?chapter=2` → tab **02 Sports**, pins SP17 / Stadium / Unifi / Hockey / MSN; stats 87,500 / 16,000 / 1.2 km²; side panel lists venues + “Not drawn as named blocks” for runway, skatepark, squash, aquatic roofs. 中文 tab **体育**, headline 国家体育中心的场馆. Rail ids 00–10.

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-14 | draft | After user chose a new chapter; placement after 01; runway/skatepark default = mapped venues only |
| 2026-10-14 | approved | User: do it |
| 2026-10-14 | implemented | Chapter 02 Sports complex; later ids +1; i18n en/zh/ms; trains-check → chapter 3 |
