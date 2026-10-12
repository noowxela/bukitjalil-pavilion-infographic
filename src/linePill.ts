// Rail line pill: a fully rounded line-coloured pill with the line number in bold white on the left and a white
// front-facing train on the right (after the official Rapid KL line icons). Inline SVG so it stays crisp at any scale
// and in both themes. Colour = the official KVITS line colour (styles.css --c-lrt: Line 4, Sri Petaling Line, maroon),
// the same colour as the tracks, legend and code badges. The pill identifies the line; the SP17 badge the station.
export type RailLine = 4; // 4 = LRT Sri Petaling Line
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
/** Shared train glyph (front view of a streamlined Komuter EMU, after the reference icons), drawn in the pill's
 *  46 × 24 viewBox; `bg` (the line colour) cuts the windscreen, headlights and the body/skirt seam. */
const train = (bg: string) =>
  `<g transform="translate(0 1.4)">` +
  `<path d="M27.3 8.2a3.7 3.7 0 0 1 3.7-3.7h3.1a3.7 3.7 0 0 1 3.7 3.7v5.6a1.1 1.1 0 0 1-1.1 1.1h-8.3a1.1 1.1 0 0 1-1.1-1.1z" fill="#fff"/>` +
  `<path d="M28.7 6.9q0-.5.5-.5h6.7q.5 0 .5.5q-.3 1.9-1.6 3.1q-1.2 1-2.25 1t-2.25-1q-1.3-1.2-1.6-3.1z" style="fill:${bg}"/>` +
  `<path d="M28.2 12l1.7.5-.2.75-1.5-.45z" style="fill:${bg}"/><path d="M36.9 12l-1.7.5.2.75 1.5-.45z" style="fill:${bg}"/>` +
  `<path d="M27.9 14.6h9.3l2.1 2.4h-13.5z" fill="#fff"/><path d="M28.6 15.25h7.9" style="stroke:${bg}" stroke-width="0.55"/>` +
  `</g>`;
// Rapid KL LRT lines: two thin lighter rings, one round the number and one round the train, overlapping in the middle.
export function linePill(line: RailLine, label: string, cls = ''): string {
  const bg = 'var(--c-lrt)';
  const rings = `<g fill="none" stroke="#fff" stroke-opacity="0.38" stroke-width="0.45"><circle cx="12.5" cy="12" r="10.6"/><circle cx="33.5" cy="12" r="10.6"/></g>`;
  return `<svg class="line-pill${cls ? ` ${cls}` : ''}" viewBox="0 0 46 24" role="img" aria-label="${esc(label)}" focusable="false">` +
    `<title>${esc(label)}</title><rect x="0.5" y="0.5" width="45" height="23" rx="11.5" style="fill:${bg}" class="lp-bg"/>` +
    `${rings}<text x="12.8" y="17.3" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="15" fill="#fff">${line}</text>` +
    train(bg) + `</svg>`;
}
