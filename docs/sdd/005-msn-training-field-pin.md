# SDD: MSN training field / runway pin

- **Repo:** `87_undefined/bukitjalil-pavilion-infographic`
- **Status:** `implemented`
- **Date:** 2026-10-14
- **Related:** [003-sports-complex-facilities.md](003-sports-complex-facilities.md), [004-msn-discovery-and-squash-bbox.md](004-msn-discovery-and-squash-bbox.md)

## 1. Context / current architecture

Chapter 02 pins the National Stadium 400 m track, Gymnasium 3, and temporary discovery roofs east of MSN. Between Gym 3 and those roofs is open ground; NSC/KBS list a **trek olahraga** (and training pitches) at Kompleks MSN. OSM has no `leisure=track` / `pitch` in that gap.

## 2. Problem and non-goals

**Problem:** The MSN training field/runway between Gymnasium 3 and the east roof strip is invisible on chapter 02.

**Non-goals:** Inventing OSM geometry; renaming discovery `#01`–`#08`; National Stadium track changes.

## 3. Questions asked and answers

| Question | Answer |
| --- | --- |
| Add a curated “MSN training track / field” pin in that strip? | **Yes** |

## 4. Proposed approach, pros / cons, rejected alternatives

**Approach:** Curated text pin on chapter 02 at the midpoint between the Gym 3 pin and the centroid of discovery roofs `#01`–`#07` (~3.05211° N, 101.69063° E). Label as MSN training field / runway; cite NSC/KBS Kompleks MSN (trek olahraga). Side panel: pin-only. No massing.

**Pros:** Makes the gap readable; matches stadium track pin pattern.  
**Cons / risks:** Approximate centroid only — not a surveyed outline.  
**Rejected:** Drawing a fake pitch ring — invents geometry.

## 5. Acceptance criteria and verification

- [x] Chapter 02 shows the new pin between Gym 3 and the east roof cluster
- [x] Side panel lists it as pin-only with source note
- [x] Typecheck passes

## 6. Status history

| Date | Status | Note |
| --- | --- | --- |
| 2026-10-14 | draft | Offered curated MSN field pin |
| 2026-10-14 | approved | User: yes |
| 2026-10-14 | implemented | Curated pin + i18n on chapter 02 |
