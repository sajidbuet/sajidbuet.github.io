/* Phase 8 closure — checklist items 15-22, plus the representative-viewport
   matrix. Companion to phase8-checklist.mjs (items 1-14).

   node docs/redesign/evidence/phase8-checklist-b.mjs
*/
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, sleep, tab, HERE, BASE } from './phase7-cdp.mjs';

const results = [];
const record = (n, name, verdict, detail) => {
  results.push({ n, name, verdict, detail });
  console.log(`${String(n).padStart(2)}. ${verdict.padEnd(4)}  ${name}\n        ${detail}`);
};

const VIEWPORTS = [
  ['375x812', 375, 812, true], ['430x932', 430, 932, true], ['768x1024', 768, 1024, true],
  ['1024x768', 1024, 768, false], ['1280x800', 1280, 800, false],
  ['1440x900', 1440, 900, false], ['1920x1080', 1920, 1080, false],
];

const INTERIOR = ['/research/', '/publication/', '/publication/j-029/', '/teaching/',
  '/teaching/jul2025_eee303/', '/authors/', '/authors/me/', '/news/', '/resources/', '/projects/'];

const LAYOUT = `(() => {
  const de = document.documentElement;
  const header = document.querySelector('header');
  const hero = document.querySelector('.sj-hero');
  const footer = document.querySelector('footer');
  const nav = document.querySelector('nav.navbar, header nav');
  const vw = de.clientWidth;

  // Anything whose painted box crosses the viewport edge (ignoring elements the
  // page deliberately clips, which cannot cause a scrollbar).
  const bleed = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= vw + 1 && r.left >= -1) continue;
    let p = el, clipped = false;
    while (p && p !== document.body) {
      const cs = getComputedStyle(p);
      if (cs.overflowX !== 'visible' || cs.clipPath !== 'none' || cs.maskImage !== 'none') { clipped = true; break; }
      p = p.parentElement;
    }
    if (!clipped) bleed.push({ el: el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 30), right: Math.round(r.right), left: Math.round(r.left) });
  }

  // Navigation clipping: is any visible top-level menu item cut off?
  const navItems = nav ? [...nav.querySelectorAll('a, button')].filter(a => {
    const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0;
  }) : [];
  const navClipped = navItems.filter(a => { const r = a.getBoundingClientRect(); return r.right > vw + 1 || r.left < -1; })
    .map(a => (a.textContent || '').trim().slice(0, 24));
  const navRows = new Set(navItems.map(a => Math.round(a.getBoundingClientRect().top))).size;

  const hb = header ? header.getBoundingClientRect() : null;
  const tb = hero ? hero.getBoundingClientRect() : null;
  const fb = footer ? footer.getBoundingClientRect() : null;

  return {
    vw,
    docScrollW: de.scrollWidth, docClientW: de.clientWidth,
    horizontalScroll: de.scrollWidth > de.clientWidth + 1,
    bleed: bleed.slice(0, 6), bleedCount: bleed.length,
    headerH: hb ? +hb.height.toFixed(2) : null,
    heroGap: (hb && tb) ? +(tb.top - hb.bottom).toFixed(2) : null,
    heroOverlapsHeader: (hb && tb) ? tb.top < hb.bottom - 1 : null,
    navClipped, navRows, navItemCount: navItems.length,
    footerW: fb ? Math.round(fb.width) : null,
    footerOverflows: fb ? fb.right > vw + 1 : null,
    footerH: fb ? Math.round(fb.height) : null,
  };
})()`;

const b = await launch();
const s = await attach(b.port);
const consoleErrors = [];
s.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') consoleErrors.push(p.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200)); });
s.on('Runtime.exceptionThrown', (p) => consoleErrors.push('exception: ' + (p.exceptionDetails?.text || '').slice(0, 200)));
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(`${p.entry.text} ${p.entry.url || ''}`.slice(0, 200)); });

/* ---------------- viewport matrix (also feeds items 15 and 18) ---------------- */
const matrix = [];
for (const [label, w, h, mobile] of VIEWPORTS) {
  for (const theme of ['light', 'dark']) {
    await go(s, '/', { w, h, mobile, theme, settle: 1400 });
    const m = await s.ev(LAYOUT);
    const hero = await s.ev(`(() => {
      const el = document.querySelector('.sj-hero__lede');
      const h1 = document.querySelector('.sj-hero__mark');
      const eyebrow = document.querySelector('.sj-hero__eyebrow');
      const cs = el ? getComputedStyle(el) : null;
      const r = h1 ? h1.getBoundingClientRect() : null;
      const actions = [...document.querySelectorAll('.sj-hero__actions a')].map(a => { const b = a.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height)]; });
      return {
        ledeFont: cs ? parseFloat(cs.fontSize) : null,
        ledeVisible: el ? (el.getBoundingClientRect().height > 0 && getComputedStyle(el).opacity !== '0') : false,
        markW: r ? Math.round(r.width) : null, markH: r ? Math.round(r.height) : null,
        markFits: r ? r.right <= document.documentElement.clientWidth + 1 : null,
        eyebrowVisible: eyebrow ? eyebrow.getBoundingClientRect().height > 0 : false,
        actions,
        actionsWrapOk: actions.every(a => a[0] <= document.documentElement.clientWidth),
      };
    })()`);
    matrix.push({ route: '/', viewport: label, theme, ...m, hero });
  }
}

/* interior routes at mobile / tablet / desktop */
for (const route of INTERIOR) {
  for (const [label, w, h, mobile] of [['390x844', 390, 844, true], ['768x1024', 768, 1024, true], ['1440x900', 1440, 900, false]]) {
    await go(s, route, { w, h, mobile, theme: 'light', settle: 1100 });
    const m = await s.ev(LAYOUT);
    matrix.push({ route, viewport: label, theme: 'light', ...m });
  }
}

const homeCells = matrix.filter((m) => m.route === '/');
const overflowing = matrix.filter((m) => m.horizontalScroll);
const navClipped = matrix.filter((m) => m.navClipped.length);
const heroOverlap = homeCells.filter((m) => m.heroOverlapsHeader);
const footerBad = matrix.filter((m) => m.footerOverflows);
const headerHeights = {};
for (const m of matrix) (headerHeights[m.viewport] ||= new Set()).add(m.headerH);
const headerUnstable = Object.entries(headerHeights).filter(([, v]) => v.size > 1);

record(15, 'Hero remains readable at all tested viewport sizes',
  homeCells.every((m) => m.hero.ledeVisible && m.hero.ledeFont >= 14 && m.hero.markFits && m.hero.eyebrowVisible && m.hero.actionsWrapOk) ? 'PASS' : 'FAIL',
  `${homeCells.length} homepage cells (7 widths x 2 themes): lede font ${Math.min(...homeCells.map(m => m.hero.ledeFont))}-${Math.max(...homeCells.map(m => m.hero.ledeFont))}px and visible everywhere; wordmark ${Math.min(...homeCells.map(m => m.hero.markW))}-${Math.max(...homeCells.map(m => m.hero.markW))}px wide, inside the viewport in every cell; eyebrow and both CTAs present and unclipped everywhere`);

record(18, 'No horizontal overflow',
  overflowing.length === 0 ? 'PASS' : 'FAIL',
  `${matrix.length} cells measured (homepage at 375/430/768/1024/1280/1440/1920 x light+dark, plus ${INTERIOR.length} interior routes at mobile/tablet/desktop): ${overflowing.length} with document scrollWidth > clientWidth`);

/* ---------------- 16. touch does not depend on hover ---------------- */
await go(s, '/', { w: 390, h: 844, mobile: true, theme: 'light', settle: 1800 });
const tapBox = await s.ev(`(() => {
  const hit = document.querySelector('[data-research-domain] .sj-domain__hit');
  if (!hit) return null;
  hit.scrollIntoView({ block: 'center' });
  const r = hit.getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2),
           w: Math.round(r.width), h: Math.round(r.height),
           domain: hit.closest('[data-research-domain]').getAttribute('data-research-domain') };
})()`);
let tapResult = { before: null, after: null };
if (tapBox) {
  await sleep(400);
  tapResult.before = await s.ev(`document.querySelector('.sj-circuit').getAttribute('data-active')`);
  await s.send('Input.synthesizeTapGesture', { x: tapBox.x, y: tapBox.y, duration: 60, tapCount: 1 }).catch(() => {});
  await sleep(900);
  tapResult.after = await s.ev(`document.querySelector('.sj-circuit').getAttribute('data-active')`);
}
const hoverOnly = await s.ev(`(() => {
  // Is any hero information reachable ONLY through :hover at a coarse pointer?
  return { anyHover: matchMedia('(any-hover: none)').matches, pointerCoarse: matchMedia('(pointer: coarse)').matches,
           titlesVisible: [...document.querySelectorAll('.sj-domain__title')].filter(t => getComputedStyle(t).display !== 'none').length,
           hitCount: document.querySelectorAll('.sj-domain__hit').length };
})()`);
record(16, 'Touch/mobile experience does not depend on hover',
  (tapBox && tapResult.after === tapBox.domain) ? 'PASS' : 'FAIL',
  `390x844, pointer:coarse=${hoverOnly.pointerCoarse}, any-hover:none=${hoverOnly.anyHover}. Synthesised tap on the "${tapBox ? tapBox.domain : '?'}" control (${tapBox ? tapBox.w + 'x' + tapBox.h : '?'}px): data-active ${JSON.stringify(tapResult.before)} -> ${JSON.stringify(tapResult.after)}. ${hoverOnly.hitCount} tap targets present`);

/* ---------------- 17. reduced motion ---------------- */
await go(s, '/', { w: 1280, h: 900, theme: 'light', reduced: true, settle: 2200 });
const rm = await s.ev(`(() => {
  const infinite = [], running = [];
  for (const el of document.querySelectorAll('*')) {
    for (const a of el.getAnimations ? el.getAnimations() : []) {
      const it = a.effect && a.effect.getTiming ? a.effect.getTiming().iterations : null;
      if (it === Infinity) infinite.push(el.tagName + '.' + String(el.className || '').slice(0, 30));
      if (a.playState === 'running') running.push(el.tagName);
    }
  }
  // Content must remain VISIBLE under reduced motion, not merely un-animated.
  const hero = document.querySelector('.sj-hero');
  const must = ['.sj-hero__mark', '.sj-hero__eyebrow', '.sj-hero__lede', '.sj-hero__actions'];
  const hidden = must.filter(sel => { const e = document.querySelector(sel); if (!e) return true;
    const cs = getComputedStyle(e); return +cs.opacity === 0 || cs.visibility === 'hidden' || cs.display === 'none'; });
  return { reducedMatches: matchMedia('(prefers-reduced-motion: reduce)').matches,
           infinite: infinite.length, infiniteWhere: infinite.slice(0, 4),
           running: running.length, hiddenHeroParts: hidden };
})()`);
record(17, 'Reduced-motion mode works',
  (rm.reducedMatches && rm.infinite === 0 && rm.hiddenHeroParts.length === 0) ? 'PASS' : 'FAIL',
  `prefers-reduced-motion honoured=${rm.reducedMatches}; infinite animations=${rm.infinite}; running animations=${rm.running}; hero parts hidden by the reduced-motion path=${JSON.stringify(rm.hiddenHeroParts)} (content must stay visible, not just still)`);

/* ---------------- 20. dark mode legibility ----------------

   Colours are resolved by PAINTING them on a 1x1 canvas and reading the pixel
   back, not by parsing the computed string. Tailwind v4 emits `oklch(...)`,
   `oklab(...)` and `color(srgb ... / a)`, and a naive parser that pulls the
   first three numbers out of `oklch(0.872 0.01 258.338)` and treats them as
   0-255 RGB reports slate-300-on-slate-900 as 2.12:1 when it is about 11:1.
   That produced 127 phantom failures on the first run of this check. The canvas
   converts every CSS colour syntax to sRGB the way the browser actually renders
   it, and semi-transparent text and backgrounds are composited in order.

   This is a correction to the instrument, not a relaxation of the threshold:
   the WCAG 1.4.3 thresholds below are unchanged at 4.5:1 and 3:1. */
const contrast = `(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const toRGBA = (css) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillStyle = css;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (fg, bg) => [0,1,2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
  const lum = (rgb) => { const [r,g,b] = rgb.slice(0,3).map(v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }); return 0.2126*r + 0.7152*g + 0.0722*b; };

  // Effective background: composite every semi-transparent layer up to an opaque one.
  const bgStack = (el) => {
    const layers = [];
    let p = el;
    while (p) { const c = toRGBA(getComputedStyle(p).backgroundColor); if (c[3] > 0) { layers.push(c); if (c[3] >= 0.999) break; } p = p.parentElement; }
    layers.push([255,255,255,1]);                    // canvas backstop
    let acc = layers[layers.length - 1];
    for (let i = layers.length - 2; i >= 0; i--) acc = over(layers[i], acc);
    return acc;
  };

  const out = [];
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,a,li,span,td,th,label,button')) {
    const t = (el.textContent || '').trim();
    if (!t || el.children.length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const size = parseFloat(cs.fontSize), weight = +cs.fontWeight || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const bg = bgStack(el);
    const fg = over(toRGBA(cs.color), bg);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1,l2) + 0.05) / (Math.min(l1,l2) + 0.05);
    const need = large ? 3 : 4.5;
    if (ratio < need) out.push({ t: t.slice(0,40), ratio: +ratio.toFixed(2), need, size,
      color: cs.color, resolvedFg: fg.slice(0,3).map(Math.round), resolvedBg: bg.slice(0,3).map(Math.round),
      cls: String(el.className||'').slice(0,40) });
  }
  return out;
})()`;
const darkFails = [];
for (const route of ['/', '/publication/', '/authors/me/', '/teaching/jul2025_eee303/', '/resources/']) {
  await go(s, route, { w: 1280, h: 900, theme: 'dark', settle: 1400 });
  const f = await s.ev(contrast);
  darkFails.push({ route, fails: f.length, sample: f.slice(0, 3) });
}
const totalDarkFails = darkFails.reduce((t, r) => t + r.fails, 0);
record(20, 'Dark mode remains legible',
  totalDarkFails === 0 ? 'PASS' : 'FAIL',
  `WCAG 1.4.3 contrast computed for every leaf text node on 5 routes in dark mode: ${totalDarkFails} below threshold. ${JSON.stringify(darkFails.map(d => d.route + ':' + d.fails))}`);

/* ---------------- 21. keyboard navigation ---------------- */
await go(s, '/', { w: 1280, h: 900, theme: 'light', settle: 1600 });
await s.ev(`(() => { document.body.focus({ preventScroll: true }); return 1; })()`);
const stops = [];
for (let i = 0; i < 25; i++) {
  await tab(s);
  const st = JSON.parse(await s.ev(`(() => { const e = document.activeElement; const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    return JSON.stringify({ tag: e.tagName, cls: String(e.className||'').slice(0,30),
      name: (e.getAttribute('aria-label') || e.textContent || '').replace(/\\s+/g,' ').trim().slice(0,32),
      ring: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none',
      visible: r.width > 0 && r.height > 0 }); })()`));
  stops.push(st);
}
const noRing = stops.filter((s2) => !s2.ring && s2.tag !== 'BODY');
const skipFirst = /skip/i.test(stops[0]?.name || '');
/* mobile menu reachable by keyboard */
await go(s, '/', { w: 390, h: 844, mobile: true, theme: 'light', settle: 1400 });
const mobileMenu = await s.ev(`(() => {
  const t = document.getElementById('nav-toggle');
  if (!t) return { missing: true };
  const before = t.getAttribute('aria-expanded');
  t.click();
  const menu = document.getElementById('nav-menu');
  const cs = menu ? getComputedStyle(menu) : null;
  return { missing: false, tabbable: t.tabIndex >= 0, before, after: t.getAttribute('aria-expanded'),
           menuVisible: cs ? (cs.display !== 'none' && cs.visibility !== 'hidden') : null,
           links: menu ? menu.querySelectorAll('a').length : 0 };
})()`);
record(21, 'Keyboard navigation works',
  (noRing.length === 0 && skipFirst && !mobileMenu.missing && mobileMenu.after === 'true' && mobileMenu.menuVisible) ? 'PASS' : 'FAIL',
  `25 consecutive Tab stops on the homepage: ${stops.length - noRing.length} had a visible focus indicator, ${noRing.length} did not. First stop is the skip link: ${skipFirst}. Mobile (390px) menu toggle is focusable=${mobileMenu.tabbable}, aria-expanded ${mobileMenu.before}->${mobileMenu.after}, menu visible=${mobileMenu.menuVisible} with ${mobileMenu.links} links`);

/* ---------------- 22. Phase 1-7 URL / IA ---------------- */
const ROUTES_17 = ['/', '/research/', '/research/photonics/', '/research/quantum/', '/research/antenna/',
  '/research/computing/', '/research/embedded/', '/research/renewable/', '/research/funding/',
  '/publication/', '/publication/j-029/', '/projects/', '/teaching/', '/teaching/jul2025_eee303/',
  '/authors/', '/authors/me/', '/news/', '/resources/', '/resources/blog/20260124-citation-count/'];
const routeStatus = [];
for (const r of ROUTES_17) {
  const res = await fetch(BASE + r).catch(() => null);
  routeStatus.push({ route: r, status: res ? res.status : 'ERR' });
}
await go(s, '/', { w: 1280, h: 900, theme: 'light', settle: 1200 });
const navHrefs = await s.ev(`(() => [...document.querySelectorAll('header nav a[href]')].map(a => a.getAttribute('href')).filter(h => h && h.startsWith('/')))()`);
const navStatus = [];
for (const h of [...new Set(navHrefs)]) {
  const res = await fetch(BASE + h).catch(() => null);
  navStatus.push({ href: h, status: res ? res.status : 'ERR' });
}
const bad = [...routeStatus, ...navStatus].filter((x) => x.status !== 200);
record(22, 'No Phase 1-7 URL/IA regressions',
  bad.length === 0 ? 'PASS' : 'FAIL',
  `${ROUTES_17.length} Phase 1-7 canonical routes + ${navStatus.length} distinct primary-nav destinations fetched: ${bad.length} non-200. ${bad.length ? JSON.stringify(bad) : 'all 200'}`);

/* ---------------- 19. console errors ---------------- */
record(19, 'No new console errors',
  consoleErrors.length === 0 ? 'PASS' : 'FAIL',
  `${consoleErrors.length} console errors across every navigation in this run (${matrix.length} viewport cells + reduced-motion + 5 dark-mode routes + mobile menu). ${consoleErrors.length ? JSON.stringify([...new Set(consoleErrors)].slice(0, 4)) : 'none'}`);

/* ---------------- viewport matrix summary ---------------- */
console.log('\n=== viewport matrix ===');
console.log(`   cells: ${matrix.length}`);
console.log(`   horizontal scroll        : ${overflowing.length}`);
console.log(`   clipped nav items        : ${navClipped.length}`);
console.log(`   hero overlapping header  : ${heroOverlap.length}`);
console.log(`   footer overflowing       : ${footerBad.length}`);
console.log(`   navbar height varying within a width: ${headerUnstable.length ? JSON.stringify(headerUnstable.map(([k, v]) => k + ':' + [...v].join('/'))) : 'none'}`);
console.log('   per homepage width:');
for (const [label] of VIEWPORTS) {
  const cells = homeCells.filter((m) => m.viewport === label);
  const c = cells[0];
  console.log(`     ${label.padEnd(9)} header ${String(c.headerH).padStart(6)}px  heroGap ${String(c.heroGap).padStart(5)}px  navRows ${c.navRows}  nav items ${String(c.navItemCount).padStart(2)}  overflow ${cells.some(x=>x.horizontalScroll)}  lede ${c.hero.ledeFont}px  mark ${c.hero.markW}x${c.hero.markH}`);
}

const partial = resolve(HERE, 'phase8-checklist-partial.json');
const first = existsSync(partial) ? JSON.parse(readFileSync(partial, 'utf8')) : [];
const all = [...first, ...results].sort((a, b) => a.n - b.n);
writeFileSync(resolve(HERE, 'phase8-checklist.json'),
  JSON.stringify({ base: BASE, when: new Date().toISOString(), checklist: all, matrix, routeStatus, navStatus }, null, 1));
console.log(`\n${all.filter(r => r.verdict === 'PASS').length}/${all.length} checklist items PASS`);
s.ws.close(); b.proc.kill();
