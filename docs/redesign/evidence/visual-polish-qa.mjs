/* Visual polish (2026-10) — rendered QA. Reproduces every measurement in
   docs/visual-polish-audit-2026-10-05.md.

   node docs/redesign/evidence/visual-polish-qa.mjs <baseURL> <tag>
     -> docs/redesign/evidence/visual-polish-qa-<tag>.json

   Point it at a production build (`hugo --minify`) on any port. Uses the
   repo's Playwright devDependency with the locally installed Chrome.

   1. contrast    Phase 1 instrument (audit-instrument.js), unchanged —
                  15 routes x {1440, 390} x {light, dark}
   2. overflow    document-level horizontal scroll at the same 60 cells, plus
                  8 scaled-desktop/phone widths (1920 @100/125/150/175 %,
                  1366, 1100, 768, 360) x 14 routes
   3. census      rendered styles off the design-system scale, 19 routes x 2
                  themes: box-shadow, radius > 12 px (avatars excluded),
                  font-weight >= 800 or <= 300 on text, gradients,
                  transitions > 400 ms, and every h1 (size/weight/alignment)
   4. scrollSpy   navbar active set at load / bottom / #team / top */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(HERE, '../../../package.json'));
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const AUDIT = readFileSync(resolve(HERE, 'audit-instrument.js'), 'utf8');
const [base, tag] = process.argv.slice(2);

const CONTRAST_ROUTES = ['/', '/research/', '/research/photonics/', '/publication/', '/projects/', '/authors/', '/teaching/', '/resources/', '/resources/academic/', '/resources/blog/', '/resources/blog/20260124-Citation-Count/', '/news/', '/bn/', '/teaching/jul2025_eee303/', '/authors/me/'];
const CENSUS_ROUTES = [...CONTRAST_ROUTES, '/research/quantum/', '/resources/templates/', '/projects/omrflow/', '/research/funding/'];
const SCALED_ROUTES = ['/', '/research/', '/research/photonics/', '/publication/', '/projects/', '/authors/', '/teaching/', '/resources/', '/resources/blog/', '/resources/blog/20260124-Citation-Count/', '/news/', '/bn/', '/bn/research/photonics/', '/authors/me/'];
const SCALED = [[1920, 1080, 1], [1536, 864, 1.25], [1366, 768, 1], [1280, 720, 1.5], [1100, 680, 1], [1097, 617, 1.75], [768, 1024, 1], [360, 800, 2]];

// Runs in the page.
function census() {
  const sel = (e) => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
    (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 4).join('.') : '')).slice(0, 110);
  const R = { shadow: {}, radius: {}, weight: {}, gradient: {}, transition: {}, h1: [] };
  const add = (o, k) => { o[k] = (o[k] || 0) + 1; };
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect();
    if (r.width <= 2 || r.height <= 2) continue;
    const cs = getComputedStyle(e);
    if (cs.boxShadow !== 'none' && !e.closest('#site-header')) add(R.shadow, sel(e));
    const rad = parseFloat(cs.borderTopLeftRadius);
    const painted = cs.borderTopWidth !== '0px' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.boxShadow !== 'none';
    const circle = Math.abs(r.width - r.height) < 2;
    if (rad > 12 && rad < 9000 && painted && !(circle && rad >= r.width / 2 - 1)) add(R.radius, sel(e) + ' r=' + cs.borderTopLeftRadius);
    if (rad >= 9000 && painted && !circle) add(R.radius, 'PILL ' + sel(e));
    const fw = +cs.fontWeight;
    if ((fw >= 800 || fw <= 300) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) add(R.weight, sel(e) + ' w=' + fw);
    if (/gradient/.test(cs.backgroundImage) && r.width > 60) add(R.gradient, sel(e));
    const mx = Math.max(...cs.transitionDuration.split(',').map((s) => parseFloat(s) * (s.includes('ms') ? 1 : 1000)));
    if (mx > 400) add(R.transition, sel(e) + ' ' + mx + 'ms');
  }
  for (const h of document.querySelectorAll('h1')) {
    const cs = getComputedStyle(h);
    R.h1.push(h.textContent.trim().slice(0, 30) + ' | ' + cs.fontSize + '/' + cs.fontWeight + ' ' + cs.textAlign);
  }
  return R;
}

const browser = await chromium.launch({ executablePath: CHROME });
const out = { meta: { base, tag, at: new Date().toISOString() }, contrast: {}, overflow: {}, census: {}, scrollSpy: null, summary: {} };
const open = async (ctx, path) => {
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: 'networkidle' }).catch(() => {});
  await p.waitForTimeout(400);
  return p;
};

for (const [w, h, m] of [[1440, 900, 0], [390, 844, 1]]) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: !!m, hasTouch: !!m });
    for (const r of CONTRAST_ROUTES) {
      const p = await open(ctx, r);
      const a = await p.evaluate(`(function(){${AUDIT}\nreturn __audit();})()`);
      const hs = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
      out.contrast[`${w} ${theme} ${r}`] = { failCount: a.contrast.failCount, fails: a.contrast.fails.slice(0, 5), hscroll: hs };
      await p.close();
    }
    await ctx.close();
  }
}

for (const [w, h, d] of SCALED) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: d, isMobile: w < 800, hasTouch: w < 800 });
  for (const r of SCALED_ROUTES) {
    const p = await open(ctx, r);
    out.overflow[`${w}@${d} ${r}`] = await p.evaluate(() => {
      const nav = document.querySelector('#nav-menu');
      return {
        hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        navWrapped: !!nav && innerWidth >= 1024 && nav.getBoundingClientRect().height > 60,
      };
    });
    await p.close();
  }
  await ctx.close();
}

for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
  for (const r of CENSUS_ROUTES) {
    const p = await open(ctx, r);
    out.census[`${theme} ${r}`] = await p.evaluate(census);
    await p.close();
  }
  await ctx.close();
}

{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await open(ctx, '/');
  // `*` = the item draws the circuit-trace marker.
  out.scrollSpy = await p.evaluate(async () => {
    const act = () => [...document.querySelectorAll('#nav-menu .nav-link.active')]
      .map((a) => a.textContent.trim() + (getComputedStyle(a, '::after').content !== 'none' ? '*' : '')).join('+');
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const o = { load: act() };
    scrollTo(0, document.body.scrollHeight); await wait(600); o.bottom = act();
    document.getElementById('team').scrollIntoView(); await wait(600); o.team = act();
    scrollTo(0, 0); await wait(600); o.top = act();
    return o;
  });
  await ctx.close();
}
await browser.close();

// The off-screen skip link and genuinely floating overlays are allowed a shadow.
const exempt = (k) => /skip-link|pub-filter-menu|sj-status__dot/.test(k);
const tally = (c, th) => Object.entries(out.census)
  .filter(([k]) => k.startsWith(th) && !k.endsWith('/bn/'))
  .reduce((n, [, v]) => n + Object.entries(v[c]).filter(([s]) => !exempt(s)).reduce((m, [, x]) => m + x, 0), 0);

out.summary = {
  contrastCells: Object.keys(out.contrast).length,
  contrastFailures: Object.values(out.contrast).reduce((n, v) => n + v.failCount, 0),
  hscrollCells: Object.values(out.contrast).filter((v) => v.hscroll).length + Object.values(out.overflow).filter((v) => v.hscroll).length,
  navWrapCells: Object.values(out.overflow).filter((v) => v.navWrapped).length,
  scaledCells: Object.keys(out.overflow).length,
  censusExcludingBn: Object.fromEntries(['shadow', 'radius', 'weight', 'gradient', 'transition']
    .map((c) => [c, { light: tally(c, 'light'), dark: tally(c, 'dark') }])),
  h1: Object.fromEntries(Object.entries(out.census).filter(([k]) => k.startsWith('light')).map(([k, v]) => [k.slice(6), v.h1.join(' ; ')])),
  scrollSpy: out.scrollSpy,
};
writeFileSync(resolve(HERE, `visual-polish-qa-${tag}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out.summary, null, 1));
