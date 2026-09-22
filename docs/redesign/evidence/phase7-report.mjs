/* Phase 7 — roll the raw matrix JSON up into pass/fail per criterion.
   node docs/redesign/evidence/phase7-report.mjs [tag]
*/
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { HERE } from './phase7-cdp.mjs';

const TAG = process.argv[2] || 'chromium';
const f = resolve(HERE, `phase7-matrix-${TAG}.json`);
if (!existsSync(f)) { console.error('missing ' + f); process.exit(1); }
const M = JSON.parse(readFileSync(f, 'utf8'));
const cells = Object.entries(M.cells);

const out = (k, v) => console.log(k.padEnd(34) + ' ' + v);
console.log(`\n=== Phase 7 matrix: ${TAG} ===`);
out('browser', M.meta.browser['User-Agent'] ? M.meta.browser.Browser : JSON.stringify(M.meta.browser).slice(0, 60));
out('cells', cells.length);
out('elapsed (s)', M.meta.elapsedSec);

/* L1 — document-level horizontal overflow */
const ovf = cells.filter(([, c]) => c.audit && c.audit.overflow && c.audit.overflow.overflowing);
out('L1 horizontal overflow cells', ovf.length);
ovf.slice(0, 20).forEach(([k, c]) => console.log('    ' + k + '  ' + c.audit.overflow.docScrollW + '>' + c.audit.overflow.innerW +
  '  ' + JSON.stringify((c.audit.overflow.offenders || []).slice(0, 3))));

/* X1 — contrast, both themes */
const contrast = cells.filter(([, c]) => c.audit && c.audit.contrast && c.audit.contrast.failCount > 0);
out('X1 contrast: cells with fails', contrast.length);
const uniq = new Map();
for (const [k, c] of contrast) for (const fl of c.audit.contrast.fails) {
  const key = `${c.theme}|${fl.el}|${fl.fg}|${fl.bg}|${fl.ratio}`;
  if (!uniq.has(key)) uniq.set(key, { ...fl, theme: c.theme, seen: [] });
  uniq.get(key).seen.push(k);
}
out('X1 unique contrast defects', uniq.size);
[...uniq.values()].sort((a, b) => a.ratio - b.ratio).forEach(v =>
  console.log(`    [${v.theme}] ${v.el} "${v.txt}" ${v.fg} on ${v.bg} = ${v.ratio}:1 (need ${v.need}) x${v.seen.length}  e.g. ${v.seen[0]}`));

/* T4/T5 — headings */
const h1bad = cells.filter(([, c]) => c.audit && c.audit.headings && c.audit.headings.h1 !== 1);
out('T4 h1 != 1', h1bad.length);
[...new Set(h1bad.map(([k, c]) => k.split('|')[0] + ' h1=' + c.audit.headings.h1))].forEach(x => console.log('    ' + x));
const skips = cells.filter(([, c]) => c.audit && c.audit.headings && c.audit.headings.skips.length);
out('T5 heading skips', skips.length);
[...new Set(skips.flatMap(([k, c]) => c.audit.headings.skips.map(s => k.split('|')[0] + ': ' + s)))].slice(0, 12).forEach(x => console.log('    ' + x));

/* X5 — landmarks */
const lm = cells.filter(([, c]) => { const l = c.audit && c.audit.landmarks; return !l || l.main !== 1 || l.header < 1 || l.footer < 1; });
out('X5 landmark problems', lm.length);
[...new Set(lm.map(([k, c]) => k.split('|')[0] + ' ' + JSON.stringify(c.audit.landmarks)))].slice(0, 8).forEach(x => console.log('    ' + x));

/* X13 — duplicate ids / positive tabindex */
const dup = cells.filter(([, c]) => c.audit && c.audit.misc && c.audit.misc.duplicateIds.length);
out('X13 duplicate ids', dup.length);
[...new Set(dup.map(([k, c]) => k.split('|')[0] + ': ' + c.audit.misc.duplicateIds.join(',')))].slice(0, 10).forEach(x => console.log('    ' + x));

/* M4 — images without dimensions */
const nd = cells.filter(([, c]) => c.audit && c.audit.images && c.audit.images.noDims > 0);
out('M4 imgs without w/h', nd.length);
[...new Set(nd.map(([k, c]) => k.split('|')[0] + ': ' + c.audit.images.noDims))].slice(0, 10).forEach(x => console.log('    ' + x));
const na = cells.filter(([, c]) => c.audit && c.audit.images && c.audit.images.noAlt.length);
out('M6 imgs without alt attr', na.length);

/* X7 — touch targets < 44 at touch viewports */
const TOUCH = new Set(['768x1024', '430x932', '390x844']);
const touchCells = cells.filter(([k]) => TOUCH.has(k.split('|')[1]));
const tt = new Map();
for (const [k, c] of touchCells) for (const s of (c.p7 && c.p7.small44) || []) {
  const key = s.el + '|' + s.w + 'x' + s.h + '|' + s.txt;
  if (!tt.has(key)) tt.set(key, { ...s, seen: [] });
  tt.get(key).seen.push(k);
}
out('X7 sub-44px (touch vps) unique', tt.size);
out('X7 sub-44px total instances', touchCells.reduce((a, [, c]) => a + ((c.p7 && c.p7.small44Count) || 0), 0));
const byRoute = {};
for (const [k, c] of touchCells) { const r = k.split('|')[0]; byRoute[r] = Math.max(byRoute[r] || 0, (c.p7 && c.p7.small44Count) || 0); }
Object.entries(byRoute).sort((a, b) => b[1] - a[1]).forEach(([r, n]) => console.log(`    ${r.padEnd(22)} max ${n}`));
console.log('  -- worst offenders --');
[...tt.values()].sort((a, b) => (a.w * a.h) - (b.w * b.h)).slice(0, 18).forEach(v =>
  console.log(`    ${v.w}x${v.h}  ${v.el}  "${v.txt}"  x${v.seen.length}`));

/* L3 — overlaps */
const ol = cells.filter(([, c]) => c.p7 && c.p7.overlaps && c.p7.overlaps.length);
out('L3 overlap candidates', ol.length);
ol.slice(0, 8).forEach(([k, c]) => console.log('    ' + k + ' ' + JSON.stringify(c.p7.overlaps.slice(0, 2))));

/* N6 — nav wraps at >= 1024 */
const navWrap = cells.filter(([k, c]) => ['1920x1080', '1440x900', '1280x800', '1024x768'].includes(k.split('|')[1]) && c.p7 && c.p7.nav && c.p7.nav.rows > 1);
out('N6 nav wraps >=1024px', navWrap.length);
[...new Set(navWrap.map(([k, c]) => k + ' rows=' + c.p7.nav.rows))].slice(0, 8).forEach(x => console.log('    ' + x));

/* tables contained */
const badTbl = cells.filter(([, c]) => c.p7 && (c.p7.tables || []).some(t => t.overflowsDoc));
out('tables overflowing document', badTbl.length);
[...new Set(badTbl.map(([k]) => k))].slice(0, 10).forEach(x => console.log('    ' + x));
const scrollersOutside = cells.filter(([, c]) => c.p7 && (c.p7.scrollers || []).some(s => !s.inViewport));
out('scroll containers out of vp', scrollersOutside.length);

/* grids: unreasonably narrow columns */
const narrow = new Map();
for (const [k, c] of cells) for (const g of (c.p7 && c.p7.grids) || []) {
  if (g.cols > 1 && g.colW < 150) { const key = k.split('|')[1] + '|' + g.el + '|' + g.cols + '|' + g.colW;
    narrow.set(key, (narrow.get(key) || 0) + 1); }
}
out('grids with <150px columns', narrow.size);
[...narrow.keys()].slice(0, 10).forEach(x => console.log('    ' + x));

/* footer */
const fb = cells.filter(([, c]) => c.p7 && c.p7.footer && c.p7.footer.overflows);
out('footer overflow', fb.length);

/* console errors / failed requests */
const ce = new Map();
for (const [k, c] of cells) for (const e of c.consoleErrors || []) ce.set(e, (ce.get(e) || 0) + 1);
out('distinct console errors', ce.size);
[...ce.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([e, n]) => console.log(`    x${n} ${e}`));
const fr = new Map();
for (const [k, c] of cells) for (const e of c.failedReq || []) fr.set(e, (fr.get(e) || 0) + 1);
out('distinct failed requests', fr.size);
[...fr.entries()].slice(0, 6).forEach(([e, n]) => console.log(`    x${n} ${e}`));

/* T9 raw LaTeX */
const latex = cells.filter(([, c]) => c.audit && c.audit.misc && /\$[^$]+\$/.test(c.audit.misc.title || ''));
out('T9 raw LaTeX in <title>', latex.length);

/* motion */
const inf = cells.filter(([, c]) => c.audit && c.audit.motion && c.audit.motion.infinite > 0);
out('A1 infinite animations', inf.length);

/* page height budget */
const home = cells.find(([k]) => k === 'home|1440x900|light');
if (home) out('L10 home height @1440', home[1].audit.layout.docHeight + ' px (budget 7000)');

/* backdrop-filter count (P6) */
const bd = cells.filter(([, c]) => c.audit && c.audit.motion && c.audit.motion.backdropFilterEls > 2);
out('P6 backdrop-filter els >2', bd.length);
if (bd.length) console.log('    max ' + Math.max(...bd.map(([, c]) => c.audit.motion.backdropFilterEls)));

console.log('');
