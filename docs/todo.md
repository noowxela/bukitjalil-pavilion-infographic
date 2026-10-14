# Todo

- Stream map data per tile (item 4 in `docs/large-area-scaling.md`). Batches are already 1 km squares; the download is still one area file.
- Release the map-assets model changes and re-pin this site, then KLEC, so the other sites pick up `clipPlanes`, `setScreenDensity` and `fitShadows`.
- Re-run the orbit flicker probe (pixels that change between frames on chapter 00) and compare with KLEC's 1,766.
- If close-up shadows are too soft (~2 m per texel on the overview), consider cascaded shadow maps.
- Sports chapter 02: skatepark still needs OSM geometry or a cited outline; Car Park E may need checking after latest fetch. map-assets `halfSizeM` 1950 + pitch/track fetch + `excludeCloserTo` is local until the submodule is committed/re-pinned.
