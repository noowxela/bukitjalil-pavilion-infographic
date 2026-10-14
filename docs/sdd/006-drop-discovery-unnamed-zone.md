# SDD: Drop discovery pins / un-highlight east unnamed roofs; training field as OSM

- **Repo:** `87_undefined/bukitjalil-pavilion-infographic` (+ map-assets `bukit-jalil` rules)
- **Status:** `implemented` (training-field outline still pending paste)
- **Date:** 2026-10-14
- **Related:** [004-msn-discovery-and-squash-bbox.md](004-msn-discovery-and-squash-bbox.md), [005-msn-training-field-pin.md](005-msn-training-field-pin.md)

## 1. Context / current architecture

Chapter 02 had temporary discovery `#nn` pins. Sports-zone colour came from named venues plus every `building=roof` within 460 m of the National Stadium centre. East MSN roofs fell inside that radius with no labels. The MSN training field is still a curated pin only until a cited outline is pasted.

## 2. Problem and non-goals

**Problem:** Discovery numbers and sports highlight on east unlabelled roofs cluttered the view. The training field should eventually read as ground geometry from a cited outline.

**Non-goals:** Un-highlighting National Stadium roofs; inventing a field ring without a citation.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Remove all `#xx` discovery labels? | **Yes** |
| Un-highlight scope? | **Only east unlabelled blocks** — keep stadium roof sports colour |
| Training field as OSM? | User **has a cited outline** — ring + publisher/URL **not yet pasted**; curated pin kept |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:**

1. Removed discovery pins/panel/i18n from chapter 02.
2. Extended `zone.near` with optional `excludeCloserTo` in `process-osm.mjs`. Bukit Jalil sports near-rule excludes roofs closer to MSN HQ (3.051588, 101.689363) than to the stadium centre. Re-processed: east nearer-MSN roofs → 0 sports; stadium-nearer roofs stay sports.
3. Training field: keep curated pin (005) until the cited outline is provided.

**Pros / cons:** as planned. Stadium bowl stays highlighted.

## 5. Acceptance criteria and verification

- [x] No `#nn` pins or discovery panel on chapter 02
- [x] East unlabelled MSN roofs no longer sports-zone coloured; stadium roofs still are
- [ ] Training field ground massing from cited outline (blocked — paste still needed)
- [x] Typecheck passes; process-osm bukit-jalil ok (sports blocks 419 → 328)

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-14 | draft | User: OSM training field; drop `#xx` and unlabelled highlights |
| 2026-10-14 | approved | User: only clear east unlabelled; has cited outline; then “yes” |
| 2026-10-14 | implemented | Discovery removed; excludeCloserTo MSN; field outline still awaiting paste |
