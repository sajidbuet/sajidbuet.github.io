/* Phase 7 — roll up the Firefox run and diff its geometry against Chromium.
   node docs/redesign/evidence/phase7-ff-report.mjs
*/
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { HERE } from './phase7-cdp.mjs';

const F = JSON.parse(readFileSync(resolve(HERE, 'phase7-firefox.json'), 'utf8'));
const cells = Object.entries(F.cells);
const out = (k, v) => console.log(String(k).padEnd(36) + ' ' + v);

console.log('\n=== Phase 7 — Firefox / Gecko ===');
out('engine', `${F.meta.engine} ${F.meta.version}`);
out('cells (15 routes x 4 vps x 2 themes)', cells.length);
out('evaluate errors', cells.filter(([, c]) => c.evalError).length);

out('L1 horizontal overflow', cells.filter(([, c]) => c.overflowPx > 1).length);
cells.filter(([, c]) => c.overflowPx > 1).forEach(([k, c]) => console.log('    ' + k + ' +' + c.overflowPx));
out('T4 h1 != 1', cells.filter(([, c]) => c.h1 !== 1).length);
cells.filter(([, c]) => c.h1 !== 1).forEach(([k, c]) => console.log('    ' + k + ' h1=' + c.h1));
out('T5 heading skips', cells.filter(([, c]) => (c.skips || []).length).length);
out('X5 main != 1', cells.filter(([, c]) => !c.landmarks || c.landmarks.main !== 1).length);
out('M4 imgs without w/h', cells.filter(([, c]) => c.imgsNoDim > 0).length);

const cu = new Map();
for (const [k, c] of cells) for (const f of c.contrast || []) {
  const key = `${k.split('|')[2]}|${f.el}|${f.fg}|${f.bg}|${f.ratio}`;
  if (!cu.has(key)) cu.set(key, { ...f, theme: k.split('|')[2], seen: [] });
  cu.get(key).seen.push(k);
}
out('X1 contrast cells with fails', cells.filter(([, c]) => c.contrastFails > 0).length);
out('X1 unique contrast defects', cu.size);
[...cu.values()].sort((a, b) => a.ratio - b.ratio).forEach(v =>
  console.log(`    [${v.theme}] <${v.el}> "${v.txt}" ${v.fg} on ${v.bg} = ${v.ratio}:1 (need ${v.need}) x${v.seen.length}`));

/* B3 / B7 backdrop-filter */
const s0 = cells[0][1];
out('B3 backdrop-filter supported', s0.backdropSupported);
out('B3 backdrop-filter elements', [...new Set(cells.map(([, c]) => c.backdrop))].join(', '));
out('B3/P0-02 header opaque', JSON.stringify(s0.headerBg));
const darkHdr = cells.find(([k]) => k.endsWith('|dark'));
out('   header (dark)', JSON.stringify(darkHdr[1].headerBg));

/* B2 SVG <text> metrics in the logo */
out('B2 logo box', JSON.stringify(s0.logoBox));
out('B2 logo <text> runs', JSON.stringify((s0.logoText || []).slice(0, 4)));

/* B5 nav toggle + B4 focus-visible */
console.log('\n--- Gecko-specific (roadmap §8 "Flagged for Firefox") ---');
out('B5 tabs to reach nav toggle', F.gecko.tabToToggle);
out('B5 toggle', JSON.stringify(F.gecko.toggle));
out('B5 Enter opens', JSON.stringify(F.gecko.openedByEnter));
out('B5 Escape closes', JSON.stringify(F.gecko.closedByEscape));
out('B4 :focus-visible supported', F.gecko.focusVisibleSupported);
out('B4 focus stops sampled', F.gecko.focusRings.length);
out('B4 stops without a ring', F.gecko.focusRingsWithout.length + (F.gecko.focusRingsWithout.length ? ' — ' + F.gecko.focusRingsWithout.join(', ') : ''));
const tokenRing = F.gecko.focusRings.filter(r => /solid 2px rgb\(14, 116, 144\)/.test(r.outline)).length;
out('B4 stops with the token ring', `${tokenRing}/${F.gecko.focusRings.length} (rest use a box-shadow ring)`);

/* B6 nav rows at desktop widths */
out('N6 nav rows (desktop cells)', [...new Set(cells.filter(([k]) => !k.includes('390') && !k.includes('768')).map(([, c]) => c.navRows && c.navRows.tops))].join(', '));

/* B8 gap parity + B1 geometry drift vs Chromium */
const CFILE = resolve(HERE, 'phase7-matrix-chromium.json');
if (existsSync(CFILE)) {
  const C = JSON.parse(readFileSync(CFILE, 'utf8'));
  console.log('\n--- B1: geometry drift vs Chromium (same route/viewport/theme) ---');
  let compared = 0, drifted = [];
  for (const [k, c] of cells) {
    const [slug, vp, theme] = k.split('|');
    const cc = C.cells[`${slug}|${vp}|${theme}`];
    if (!cc || !cc.audit || !cc.audit.layout) continue;
    compared++;
    const dh = Math.abs((c.docHeight || 0) - (cc.audit.layout.docHeight || 0));
    const hdrFF = c.anchors && c.anchors.header ? c.anchors.header.h : null;
    const hdrCR = cc.audit.layout.header ? cc.audit.layout.header.h : null;
    const dHdr = (hdrFF != null && hdrCR != null) ? Math.abs(hdrFF - hdrCR) : 0;
    if (dHdr > 4) drifted.push(`${k} header ${hdrCR}->${hdrFF}`);
    else if (dh > Math.max(60, (cc.audit.layout.docHeight || 0) * 0.04)) drifted.push(`${k} docHeight ${cc.audit.layout.docHeight}->${c.docHeight} (${dh}px)`);
  }
  out('cells compared', compared);
  out('cells with >4px header drift or >4% height drift', drifted.length);
  drifted.slice(0, 14).forEach(d => console.log('    ' + d));
}

console.log('\n--- console errors (Firefox) ---');
const ce = new Map();
for (const [, c] of cells) for (const e of c.consoleErrors || []) ce.set(e, (ce.get(e) || 0) + 1);
[...ce.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([e, n]) => console.log(`    x${n} ${e}`));
console.log('');
