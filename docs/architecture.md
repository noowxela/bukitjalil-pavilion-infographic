# Architecture

Vite, TypeScript and Three.js. The page is a 1920×1080 stage (`src/main.ts`, `src/chapters.ts`) scaled to the window; a narrow viewport uses the real screen size and pulls the camera back. Eleven chapters (00–10): after Landmarks, **02 Sports** flies into the National Sports Complex with zone colouring (named venues + stadium roof pieces; east unlabelled MSN roofs are not sports-highlighted), OSM car-park footprints (A–D, F), curated pins for the aquatic centre, stadium athletics track, Gimnasium 3 and MSN training field, the OSM MSN **running track** / soccer pitch (map-assets now fetches `leisure=pitch|track`), and the OSM **National Squash Centre** outline (study `halfSizeM` 1950). Skatepark remains an OSM gap.

`src/scene.ts` (`World`) owns the renderer, camera, orbit controls, chapter flights and the turntable. It turns on `logarithmicDepthBuffer` and takes near/far from `clipPlanes` in map-assets. Each frame it reports pixels-per-metre (`setScreenDensity`) and refits the sun shadow (`fitShadows`), and redraws the shadow map only when that returns true.

The map is `MapModel` from the `map-assets` submodule (`loadArea('bukit-jalil')`). Blocks are merged per 1 km tile and material. Green, roads and water do not write depth. Shade tests still raycast the original blocks. Planned towers are ghost meshes drawn by this site, not by map-assets.

Colours come from CSS variables into a `Palette`. The sun shadow map is 4096² and is not updated every frame.
