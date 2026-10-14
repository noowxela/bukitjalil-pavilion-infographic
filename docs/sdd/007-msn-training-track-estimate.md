# SDD: Approximate MSN training track oval (estimate)

- **Repo:** `87_undefined/bukitjalil-pavilion-infographic`
- **Status:** `superseded`
- **Date:** 2026-10-14
- **Related:** [005-msn-training-field-pin.md](005-msn-training-field-pin.md), [006-drop-discovery-unnamed-zone.md](006-drop-discovery-unnamed-zone.md)

## 1. Context

OSM has no `leisure=track` east of MSN Mini Stadium / Gym 2–3. User’s Google Maps satellite screenshot (2026-10-14) shows a N–S athletics oval there. Mini Stadium place: 3.052251, 101.689728. No downloadable GeoJSON found.

## 2. Problem / non-goals

**Problem:** Need the training field visible as ground massing, not only a pin.  
**Non-goals:** Claiming OSM geometry; inventing a surveyed survey ring.

## 3. Q&A

| Question | Answer |
| --- | --- |
| Draw approximate oval cited to Maps screenshot + Mini Stadium place + standard track size? | **Yes** |

## 4. Approach

Site-drawn stadium oval (estimate): centre ~90 m east of Mini Stadium place (3.05230, 101.69058), outer ≈ standard 400 m / 8-lane envelope, infield hole, always on the stage. Pin moves to that centre; i18n marks **estimate**. Citation recorded in `src/msnTrainingTrack.ts`.

## 5. Acceptance

- [x] Oval visible between MSN halls and east roofs on chapter 02
- [x] Labelled estimate in panel / pin note
- [x] Typecheck

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-14 | approved | User: yes to approximate oval |
| 2026-10-14 | implemented | Site-side estimate track + pin update |
| 2026-10-14 | superseded | OSM already had relation/9074520 + way/618954828; fetch now includes pitch/track — estimate removed |
