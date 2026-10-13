# Risks

- Logarithmic depth disables early-z. Chapter 00 in one browser was about 8 ms median, 17.5 ms at the 95th percentile. A heavier GPU or a much larger extract could miss 60 fps.
- The overview shadow is soft (about 2–2.7 m per texel) because the box covers the visible ground. Contact shadows are less sharp than KLEC's old ±760 m box.
- Building geometries are stored twice: the originals (shade rays, re-batching when the colour mode changes) and up to three merged copies. A much larger extract will cost memory at startup.
- Context blocks and outlines disappear below 0.12 px/m. That is meant for a ~20 km overview. An unusually small phone on the widest chapter can get close to that line.
