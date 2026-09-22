/* Phase 7.1 — responsive matrix.
   7 viewports x 2 themes x 15 routes = 210 combinations.
   Runs the Phase 1 `audit-instrument.js` unchanged (roadmap 7.3) plus a Phase 7
   extension (44 px touch targets, grid reflow, footer, nav, overlap).

   node docs/redesign/evidence/phase7-matrix.mjs [outSuffix]
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, shoot, HERE, SHOTS, VIEWPORTS, ROUTES, BASE } from './phase7-cdp.mjs';

const TAG = process.argv[2] || 'chromium';
const OUT = resolve(HERE, `phase7-matrix-${TAG}.json`);
const AUDIT = readFileSync(resolve(HERE, 'audit-instrument.js'), 'utf8');

/* Phase 7 additions the Phase 1 instrument does not cover. */
const P7 = `(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const de = document.documentElement;
  const vw = innerWidth;

  // --- touch targets at the Phase 7 threshold (44 px), not the audit's 24 px ---
  const inter = q('a[href],button,input:not([type=hidden]),select,textarea,[role=button],summary,details>summary');
  const small = [];
  for (const el of inter) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (getComputedStyle(el).visibility === 'hidden') continue;
    if (r.width < 44 || r.height < 44) {
      small.push({ el: (el.tagName.toLowerCase() + (el.id ? '#'+el.id : (typeof el.className==='string'&&el.className ? '.'+el.className.trim().split(/\\s+/).slice(0,3).join('.') : ''))).slice(0,70),
        txt: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\\s+/g,' ').slice(0,34),
        w: Math.round(r.width), h: Math.round(r.height),
        href: (el.getAttribute('href')||'').slice(0,50) });
    }
  }

  // --- grid reflow: column count of every CSS grid that holds >1 child ---
  const grids = [];
  for (const el of q('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display !== 'grid' && cs.display !== 'inline-grid') continue;
    if (el.children.length < 2) continue;
    const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length;
    const r = el.getBoundingClientRect();
    if (r.width < 40) continue;
    grids.push({ el: (el.tagName.toLowerCase() + (typeof el.className==='string'&&el.className ? '.'+el.className.trim().split(/\\s+/).slice(0,2).join('.') : '')).slice(0,60),
      cols, kids: el.children.length, w: Math.round(r.width),
      colW: Math.round(r.width / Math.max(cols,1)) });
  }

  // --- element overlap among sibling blocks (cheap, high-signal) ---
  const overlaps = [];
  const boxes = q('main section, main article, main header, main .sj-card, main li, footer > *')
    .map(e => ({ e, r: e.getBoundingClientRect() }))
    .filter(x => x.r.width > 30 && x.r.height > 10);
  for (let i = 0; i < boxes.length && overlaps.length < 6; i++) {
    const a = boxes[i];
    for (let j = i + 1; j < boxes.length; j++) {
      const b = boxes[j];
      if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
      const ox = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      const oy = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
      if (ox > 8 && oy > 8) { overlaps.push({ a: a.e.tagName + '.' + String(a.e.className).slice(0,24), b: b.e.tagName + '.' + String(b.e.className).slice(0,24), ox: Math.round(ox), oy: Math.round(oy) }); break; }
    }
  }

  // --- nav ---
  const hdrNav = document.querySelector('header nav');
  let nav = null;
  if (hdrNav) {
    const links = Array.from(hdrNav.querySelectorAll('a')).filter(a => a.getBoundingClientRect().width > 0);
    const rows = new Set(links.map(a => Math.round(a.getBoundingClientRect().top / 4)));
    nav = { visible: links.length, rows: rows.size,
      toggle: (() => { const b = document.querySelector('header button[aria-expanded]');
        if (!b) return null; const r = b.getBoundingClientRect();
        return { visible: r.width > 0, w: Math.round(r.width), h: Math.round(r.height),
          expanded: b.getAttribute('aria-expanded'), controls: b.getAttribute('aria-controls'),
          name: (b.getAttribute('aria-label')||b.textContent||'').trim().slice(0,30) }; })() };
  }

  // --- footer ---
  const f = document.querySelector('footer');
  let footer = null;
  if (f) { const r = f.getBoundingClientRect();
    footer = { h: Math.round(r.height), links: f.querySelectorAll('a').length,
      overflows: r.right > vw + 1 || r.left < -1,
      bottomGap: Math.round(de.scrollHeight - (r.bottom + scrollY)) };
  }

  // --- horizontally scrollable containers (tables/code) must be locally contained ---
  const scrollers = q('body *').filter(e => {
    const cs = getComputedStyle(e);
    return (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 1;
  }).slice(0, 12).map(e => ({ el: (e.tagName.toLowerCase() + (typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):'')).slice(0,60),
      scrollW: e.scrollWidth, clientW: e.clientWidth, inViewport: e.getBoundingClientRect().right <= vw + 1 }));

  // --- tables ---
  const tables = q('table').map(t => { const r = t.getBoundingClientRect();
    const p = t.parentElement; const pcs = p ? getComputedStyle(p) : null;
    return { w: Math.round(r.width), right: Math.round(r.right), overflowsDoc: r.right > vw + 1,
      wrapperScrolls: !!pcs && (pcs.overflowX === 'auto' || pcs.overflowX === 'scroll'),
      wrapper: p ? (p.tagName.toLowerCase() + (typeof p.className==='string'&&p.className?'.'+p.className.trim().split(/\\s+/).slice(0,2).join('.'):'')).slice(0,50) : null };
  }).slice(0, 8);

  return { small44: small.slice(0, 40), small44Count: small.length,
           interactive: inter.length, grids: grids.slice(0, 14), overlaps,
           nav, footer, scrollers, tables,
           docScrollW: de.scrollWidth, innerW: vw, overflowPx: de.scrollWidth - vw };
})()`;

const start = Date.now();
const { proc, port, version } = await launch();
const s = await attach(port);

const consoleErrors = [];
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(p.entry.text.slice(0, 160)); });
const failedReq = [];
s.on('Network.loadingFailed', (p) => failedReq.push(p.errorText));

const R = { meta: { tag: TAG, browser: version, base: BASE, started: new Date().toISOString(),
  viewports: VIEWPORTS.map(v => v[0]), themes: ['light', 'dark'], routes: ROUTES.map(r => r[1]) },
  cells: {}, consoleErrorsByRoute: {} };

/* Full-page capture only at the primary desktop + primary phone reference, to keep the
   evidence directory a sane size; the audit runs at all 210 cells regardless. */
const FULLPAGE = new Set(['1440x900', '390x844']);
const ONLY_R = (process.env.P7_ROUTES || '').split(',').filter(Boolean);
const ONLY_V = (process.env.P7_VPS || '').split(',').filter(Boolean);
let n = 0;
for (const [slug, path] of ROUTES) {
  if (ONLY_R.length && !ONLY_R.includes(slug)) continue;
  const errs = new Set();
  for (const [vp, w, h, mobile] of VIEWPORTS) {
    if (ONLY_V.length && !ONLY_V.includes(vp)) continue;
    for (const theme of ['light', 'dark']) {
      consoleErrors.length = 0; failedReq.length = 0;
      await go(s, path, { w, h, mobile, theme, settle: 1600 });
      const full = FULLPAGE.has(vp);
      await shoot(s, `${SHOTS}/matrix/${slug}/${slug}-${vp}-${theme}.jpg`, { full, quality: full ? 62 : 74 });
      /* Page.captureScreenshot resets the emulated media features, so anything
         measured after a capture sees `pointer: fine` even on a touch viewport.
         That is why an earlier run reported the publication action buttons at
         45x32 while a direct probe measured them at 44x44. Re-assert before
         measuring. */
      await s.send('Emulation.setEmulatedMedia', { features: [
        { name: 'prefers-color-scheme', value: theme },
        ...(mobile ? [{ name: 'pointer', value: 'coarse' }, { name: 'any-pointer', value: 'coarse' },
                      { name: 'hover', value: 'none' }, { name: 'any-hover', value: 'none' }] : []),
      ] });
      await s.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
      await new Promise(r => setTimeout(r, 350));
      const a = await s.send('Runtime.evaluate', {
        expression: `(function(){${AUDIT}\nreturn JSON.stringify(__audit());})()`, returnByValue: true }, 60000)
        .then(r => { try { return JSON.parse(r.result.value); } catch { return { error: String(r.result.value).slice(0, 300) }; } });
      const p7 = await s.ev(P7);
      R.cells[`${slug}|${vp}|${theme}`] = { route: path, vp, theme, audit: a, p7,
        consoleErrors: [...new Set(consoleErrors)].slice(0, 6), failedReq: [...new Set(failedReq)].slice(0, 6) };
      consoleErrors.forEach(e => errs.add(e));
      n++;
      if (n % 20 === 0) process.stderr.write(`  ${n}/210 ...\n`);
    }
  }
  R.consoleErrorsByRoute[slug] = [...errs];
  process.stderr.write(`route done: ${slug}\n`);
}

R.meta.finished = new Date().toISOString();
R.meta.elapsedSec = Math.round((Date.now() - start) / 1000);
mkdirSync(SHOTS, { recursive: true });
writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log(`DONE ${n} cells -> ${OUT}`);
try { s.ws.close(); } catch {}
proc.kill(); process.exit(0);
