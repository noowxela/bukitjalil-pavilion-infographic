# bukitjalil-pavilion-infographic

**Live (after the first deploy):** [noowxela.github.io/bukitjalil-pavilion-infographic](https://noowxela.github.io/bukitjalil-pavilion-infographic/) · **Repo:** [noowxela/bukitjalil-pavilion-infographic](https://github.com/noowxela/bukitjalil-pavilion-infographic)

A 3D scrollytelling infographic of Bukit Jalil Sports City, Kuala Lumpur: Pavilion Bukit Jalil, the National Sports Complex (Bukit Jalil National Stadium, Axiata Arena), Bukit Jalil City and Bukit Jalil Recreational Park, with LRT Line 4 (Sri Petaling) stations SP17, SP19 and SP20. Built with Vite, TypeScript and Three.js. The map (OSM data, pipeline, model) is the `bukit-jalil` spot in [map-assets](https://github.com/spacingouty09/map-assets), a git submodule.

> **map-assets pin:** the submodule is pinned to the PR branch commit `8241283` (spacingouty09/map-assets#1). After that PR is merged and tagged, re-pin to the release tag **v0.2.1**: `cd map-assets && git fetch --tags && git checkout v0.2.1 && cd .. && git add map-assets`.

## Set up

You need Node 22+ and git. This repo and the map, [map-assets](https://github.com/spacingouty09/map-assets), are both public, so anyone can clone them. Pushing needs write access to each repo; without it, open pull requests from a fork.

### Quick start with an AI agent

Copy this into your AI coding agent (Cursor, Grok, Claude Code, Codex…). It clones the site with the map inside it, sets everything up, starts the site and explains how to contribute:

```text
Set me up to contribute to the Bukit Jalil Sports City infographic (public GitHub repo noowxela/bukitjalil-pavilion-infographic, with the public spacingouty09/map-assets as a submodule). 1) Check that I have git and Node 22+; if not, stop and tell me exactly what to install. 2) Ask me which folder to use, then run `git clone --recurse-submodules https://github.com/noowxela/bukitjalil-pavilion-infographic.git` there. 3) Open the bukitjalil-pavilion-infographic folder and follow the "First-time setup" section of its AGENTS.md. If you can't run commands yourself, give them to me one at a time and wait for the output. If I don't have write access to a repo, my pull requests go through a fork; help me set that up when I'm ready. Don't commit, push or open pull requests without asking me.
```

### By hand

**1. Let git sign in to GitHub once.** Only pushing needs it; cloning works without:

```bash
gh auth login        # GitHub CLI; choose HTTPS
gh auth setup-git    # lets git use that login
```

No GitHub CLI? Use a personal access token as the password when git asks.

**2. Clone with the submodule:**

```bash
git clone --recurse-submodules https://github.com/noowxela/bukitjalil-pavilion-infographic.git
cd bukitjalil-pavilion-infographic
git config submodule.recurse true   # pull / checkout keep map-assets/ in step from now on
npm ci
npm run doctor                      # checks the setup and prints the fix for anything wrong
npm run dev                         # http://127.0.0.1:5173/
```

Already cloned without `--recurse-submodules` (an empty `map-assets/` folder)? Run `git submodule update --init`.

**3. Day to day:**

| You want to… | Do this |
|---|---|
| Work on the website | see **Contributing to the website** below |
| Get the latest website changes | `git pull` (with `submodule.recurse` set, `map-assets/` follows the pointer) |
| Move to a newer map release | see **Updating the map** below |
| Change the map itself | see **Changing the map from here** below |
| Check your setup | `npm run doctor` |

### Contributing to the website

Edit `src/`, `index.html` or `scripts/` on a branch; `npm run build` type-checks the map code too. UI text goes in `src/i18n/` (en, zh and ms together).

```bash
git switch main && git pull
git switch -c feat/short-name
# edit, then:
npm run build                        # plus the checks that cover your change (see Checks)
git add -A && git commit -m "…"
git push -u origin feat/short-name   # open the pull request on this repo; CI must pass
```

No write access to this repo? Push to a fork instead: `gh repo fork --remote --remote-name fork`, then `git push -u fork feat/short-name` and `gh pr create --repo noowxela/bukitjalil-pavilion-infographic`.

### Updating the map

The website pins a map-assets **release tag**, so map changes never land here by surprise. To move to a newer one, pick it from [map-assets/CHANGELOG.md](https://github.com/spacingouty09/map-assets/blob/main/CHANGELOG.md) and use it in place of `vX.Y.Z`:

```bash
git -C map-assets fetch --tags
git -C map-assets checkout vX.Y.Z        # the release you want
npm run doctor && npm run build          # then the checks below
git add map-assets
git commit -m "map-assets vX.Y.Z"
git push
```

### Changing the map from here

`map-assets/` is a full clone of the [map repo](https://github.com/spacingouty09/map-assets). You can work in it, but treat it as **that** repo. It is public, so you can always fetch it; pushing to it needs write access there, which is separate from your access to this repo.

```bash
cd map-assets
git switch main && git pull              # it normally sits on a detached tag; get on a branch first
git switch -c data/my-change
# edit sources/ or pipeline/ (never data/ by hand), then:
npm run data:process && npm run data:check
git add -A && git commit -m "…"
git push -u origin data/my-change        # with write access to map-assets; then open the PR there
cd ..
```

No write access to map-assets? Push to your own fork instead (the GitHub CLI creates it and adds it as the `fork` remote) and open the pull request from it:

```bash
cd map-assets
gh repo fork --remote --remote-name fork
git push -u fork data/my-change
gh pr create --repo spacingouty09/map-assets   # or open the link that git push prints
cd ..
```

Once the PR is merged and released as a tag, move the pointer as in **Updating the map**. Until then, don't commit the website pointing at your branch: other people can't build a website that points at a commit they can't fetch (`npm run doctor` warns about it).

### Common mistakes

| Symptom | Cause and fix |
|---|---|
| Build fails with `Cannot find module '@map-assets'`, or `map-assets/` is empty | The submodule isn't checked out: `git submodule update --init` |
| `git status` shows `modified: map-assets (new commits)` | The submodule moved. To keep the recorded version: `git submodule update`. To adopt the new one on purpose: `git add map-assets` and commit. |
| Type errors about two different `three` types, or a "Multiple instances of Three.js" warning | Someone ran `npm install` inside `map-assets/`: `rm -rf map-assets/node_modules` |
| Edits in `map-assets/` vanished after `git pull` | It was on a detached HEAD. Always `git switch -c …` inside `map-assets/` before editing (see above) |
| `git push` in this repo is refused (403, "Permission denied") | You have no write access here: ask for it, or push to a fork (see **Contributing to the website**) |
| `git push` inside `map-assets/` is refused (403, "Permission denied") | You have no write access to map-assets: push to a fork instead (see **Changing the map from here**) |

## Chapters

| # | Chapter | What it shows |
|---|---|---|
| 00 | Overview | Whole study area, slow 360° orbit, four zones coloured (Pavilion, Sports Complex, Bukit Jalil City, park); OSM credit |
| 01 | Landmarks | Stadium, arena, Pavilion and towers, with cited heights and facts |
| 02 | Transit | LRT Line 4 (KVITS maroon #721422): stations SP17, SP19, SP20 (codes per Wikipedia); animated trains; tagged bus routes |
| 03 | Roads | Lebuhraya Bukit Jalil, KESAS, MEX; Sungai Besi Expressway as a direction (outside the area); parking |
| 04 | Massing | Height sources; planned towers (Park Green, The Vividz, Veladaz) as ghost massing |
| 05 | Connections | Shortest OSM pedestrian paths from the stations |
| 06 | Event day | Crowd flow from SP17 to the stadium: **illustrative**, adjustable assumptions |
| 07 | Walking routes | Walks between the stations, Pavilion and the stadium, by cover |
| 08 | Green & shade | Park and green areas (OSM), sun path and shade |
| 09 | Rain & monsoon | Monthly rainfall (WMO normals, Subang) and covered vs open walking |

## Data and sources

- Map data © OpenStreetMap contributors (ODbL), via map-assets.
- Cited heights (7 buildings) and facts: `map-assets/sources/height-sources.json`, `facts.json`, `areas/bukit-jalil/height-sources.md`. Every other block height is an estimate.
- Event-day shares and people per train are illustrative assumptions and labelled as such.

## Tech stack

Vite 8, TypeScript 7 (vanilla, no framework), Three.js 0.186 (OrbitControls). The 3D model is `MapModel` from map-assets; `src/scene.ts` wraps it with the renderer, camera flights, the 00 turntable and the theme (CSS variables → model palette). IBM Plex Sans/Mono and Noto Sans SC (zh only, loaded on demand) are bundled via @fontsource, so the page makes no external font requests. Checks use puppeteer-core with the local Google Chrome.

```bash
npm run dev          # http://127.0.0.1:5173/
npm run typecheck    # tsc --noEmit (includes the map-assets code)
npm run build        # typecheck + production build into dist/
npm run preview      # serve dist/ on http://127.0.0.1:4173/
npm run doctor       # setup check
```

## Checks

```sh
npm run typecheck && npm run build
npx vite preview --port 4173 &
node scripts/credit-check.mjs     # OSM credit on 00 only, source line on 00
node scripts/bar-check.mjs        # chapter bar fits EN/zh/ms
node scripts/compass-check.mjs    # compass + reset view
node scripts/orbit-check.mjs      # 00 orbit, pause/resume, reduced motion
node scripts/mobile-check.mjs     # 390×844 and landscape
node scripts/trains-check.mjs     # Line 4 trains, colour, toggle, reduced motion
node scripts/firstload.mjs        # first-load timing
npm run doctor                    # Node 22, submodule pin
```

The checks need a real GPU (Chrome with Metal on macOS); software rendering is too slow for the timing checks.

## CI and deployment

- **CI** (`.github/workflows/ci.yml`): typecheck and build on every push and PR.
- **Deploy** (`.github/workflows/deploy.yml`) publishes `dist/` to GitHub Pages. Not deployed yet.

## Licence

No licence yet: all rights reserved by the authors. Map data © OpenStreetMap contributors (ODbL), via map-assets.

