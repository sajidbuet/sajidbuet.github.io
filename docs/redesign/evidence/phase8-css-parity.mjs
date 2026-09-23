/* Phase 8 item 8.23 — did merging the stylesheets change any computed style?

   Concatenating the Tailwind build, the community blox styles and the project
   CSS into one request means the CASCADE is now determined by concatenation
   order instead of <link> order. Those two orders were made identical on
   purpose, but "on purpose" is not evidence. This snapshots the computed value
   of the properties that carry the design — colour, background, type, spacing,
   borders, layout — for a wide set of elements on a wide set of routes, in both
   themes, and diffs two snapshots.

     node docs/redesign/evidence/phase8-css-parity.mjs capture before.json
     …rebuild…
     node docs/redesign/evidence/phase8-css-parity.mjs capture after.json
     node docs/redesign/evidence/phase8-css-parity.mjs diff before.json after.json
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, HERE, BASE } from './phase7-cdp.mjs';

const MODE = process.argv[2] || 'capture';

const ROUTES = ['/', '/research/', '/publication/', '/publication/j-029/', '/teaching/',
  '/teaching/jul2025_eee303/', '/authors/', '/authors/me/', '/news/', '/resources/',
  '/projects/', '/research/photonics/'];

const PROPS = ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight',
  'letterSpacing', 'margin', 'padding', 'borderRadius', 'borderTopWidth', 'borderTopColor',
  'display', 'flexDirection', 'gridTemplateColumns', 'gap', 'textAlign', 'textDecorationLine',
  'boxShadow', 'opacity', 'position', 'zIndex', 'width', 'height', 'maxWidth'];

const SNAP = (props) => `(() => {
  const props = ${JSON.stringify(props)};
  const out = {};
  const seen = new Map();
  const take = (el, key) => {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const rec = {};
    for (const p of props) rec[p] = cs[p];
    rec._box = [Math.round(r.width), Math.round(r.height)];
    out[key] = rec;
  };
  // A stable, layout-independent key: tag + class, first occurrence of each.
  for (const el of document.querySelectorAll('body *')) {
    const cls = (el.getAttribute('class') || '').trim().split(/\\s+/).slice(0, 3).join('.');
    const key = el.tagName.toLowerCase() + (cls ? '.' + cls : '');
    const n = (seen.get(key) || 0);
    if (n >= 2) continue;          // at most two samples per shape
    seen.set(key, n + 1);
    take(el, key + '#' + n);
  }
  out['__page'] = {
    scrollHeight: document.documentElement.scrollHeight,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    sheets: [...document.styleSheets].length,
    links: [...document.querySelectorAll('link[rel=stylesheet]')].length,
  };
  return out;
})()`;

if (MODE === 'diff') {
  const a = JSON.parse(readFileSync(process.argv[3], 'utf8'));
  const b = JSON.parse(readFileSync(process.argv[4], 'utf8'));
  let compared = 0, diffs = [];
  for (const scene of Object.keys(a.scenes)) {
    const A = a.scenes[scene], B = b.scenes[scene] || {};
    for (const key of Object.keys(A)) {
      const ra = A[key], rb = B[key];
      if (!rb) { diffs.push({ scene, key, prop: '(element missing)', a: 'present', b: 'absent' }); continue; }
      for (const p of Object.keys(ra)) {
        compared++;
        const va = JSON.stringify(ra[p]), vb = JSON.stringify(rb[p]);
        if (va !== vb) diffs.push({ scene, key, prop: p, a: va, b: vb });
      }
    }
  }
  console.log(`compared ${compared} computed values across ${Object.keys(a.scenes).length} scenes`);
  console.log(`differences: ${diffs.length}`);
  for (const d of diffs.slice(0, 60)) console.log(`   ${d.scene}  ${d.key}  ${d.prop}:  ${d.a}  ->  ${d.b}`);
  if (diffs.length > 60) console.log(`   … and ${diffs.length - 60} more`);
  process.exit(diffs.length ? 1 : 0);
}

const out = resolve(HERE, process.argv[3] || 'phase8-css-parity.json');
const b = await launch();
const s = await attach(b.port);
const scenes = {};
for (const route of ROUTES) {
  for (const theme of ['light', 'dark']) {
    await go(s, route, { w: 1280, h: 900, theme, settle: 1200 });
    scenes[`${route} ${theme}`] = await s.ev(SNAP(PROPS));
  }
}
writeFileSync(out, JSON.stringify({ base: BASE, when: new Date().toISOString(), scenes }, null, 0));
const n = Object.values(scenes).reduce((t, x) => t + Object.keys(x).length, 0);
console.log(`captured ${Object.keys(scenes).length} scenes, ${n} elements -> ${out}`);
s.ws.close(); b.proc.kill();
