// Line 4 (Sri Petaling) trains: present on 02, moving (map-assets generic LRT sets, illustrative), toggle works, static under reduced motion;
// rail colour is the KVITS maroon #721422. Exits 1 on a failure or a console error/warning.
// Usage: npm run build && npx vite preview --port 4173 &  then  node scripts/trains-check.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
const base = process.argv[2] || 'http://127.0.0.1:4173/';
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--ignore-gpu-blocklist', '--enable-webgl', '--use-angle=metal', '--hide-scrollbars'] });
const errors = []; const bad = []; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function open(name, q, { rm = false } = {}) {
  const p = await browser.newPage();
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${name}] console.${m.type()}: ${m.text()}`); });
  p.on('pageerror', (e) => errors.push(`[${name}] pageerror: ${e.message}`));
  if (rm) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.setViewport({ width: 1600, height: 900 });
  await p.goto(`${base}?${q}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await p.waitForFunction(() => window.__mv?.world?.trains, { timeout: 120000 }); await sleep(1500); return p;
}
const p = await open('02', 'chapter=2&lang=en');
const r = await p.evaluate(async () => {
  const tr = window.__mv.world.trains; const c0 = tr.clock; const s0 = JSON.stringify(tr.state());
  await new Promise((res) => setTimeout(res, 2500));
  const st = tr.state();
  return { advanced: tr.clock - c0, moved: JSON.stringify(st) !== s0, visible: tr.group.visible, n: st.length, cars: [...new Set(st.map((x) => x.cars))],
    lrt: getComputedStyle(document.documentElement).getPropertyValue('--c-lrt').trim().toLowerCase(),
    codes: ['SP17', 'SP19', 'SP20'].filter((c) => document.body.innerText.includes(c)) };
});
console.log('02 trains', JSON.stringify(r));
if (!(r.advanced > 0.5 && r.moved && r.visible && r.n > 0)) bad.push('trains not running / shown in 02');
if (r.lrt !== '#721422') bad.push(`--c-lrt ${r.lrt}`);
if (r.codes.length !== 3) bad.push(`station codes on screen: ${r.codes}`);
const t = await p.evaluate(async () => { const b = document.getElementById('btn-trains'); b?.click(); await new Promise((r) => setTimeout(r, 300)); const off = window.__mv.world.trains.group.visible; b?.click(); await new Promise((r) => setTimeout(r, 300)); return { found: !!b, off, on: window.__mv.world.trains.group.visible }; });
console.log('toggle', JSON.stringify(t)); if (!t.found || t.off || !t.on) bad.push('trains toggle');
const q = await open('rm', 'chapter=2&lang=en', { rm: true });
const rm = await q.evaluate(async () => { const tr = window.__mv.world.trains; const a = JSON.stringify(tr.state()); await new Promise((r) => setTimeout(r, 1200)); return { same: a === JSON.stringify(tr.state()) }; });
console.log('reduced motion', JSON.stringify(rm)); if (!rm.same) bad.push('trains move under reduced motion');
await browser.close();
console.log(bad.length ? 'BAD\n' + bad.join('\n') : 'trains OK');
console.log(errors.length ? errors.join('\n') : 'No console errors or warnings (trains check).');
process.exit(bad.length || errors.length ? 1 : 0);
