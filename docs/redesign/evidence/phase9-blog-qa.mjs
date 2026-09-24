/* Blog article layout — validation and screenshots.

   node docs/redesign/evidence/phase9-blog-qa.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, shoot, sleep, tab, HERE, REPO, BASE } from './phase7-cdp.mjs';

const SHOTS = resolve(REPO, 'docs', 'redesign', 'screenshots', 'blog-article');

const VIEWPORTS = [
  ['1920x1080', 1920, 1080, false], ['1440x900', 1440, 900, false],
  ['1280x800', 1280, 800, false], ['1024x768', 1024, 768, false],
  ['768x1024', 768, 1024, true], ['390x844', 390, 844, true],
];

const ARTICLES = [
  ['long-code-table', '/resources/blog/20260224-word-lakh-taka-bdt/'],
  ['long-nested', '/resources/blog/20230424-ai-tools/'],
  ['short-no-toc', '/resources/blog/20230707-excelhacks/'],
  ['images-code', '/resources/blog/20250407-microsoft-teams-bulkadd/'],
];

const REGRESSION = ['/', '/research/', '/publication/', '/projects/', '/teaching/',
  '/authors/', '/resources/', '/resources/blog/', '/news/'];

const LAYOUT = `(() => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const main = document.querySelector('.sj-blog__main');
  const aside = document.querySelector('.sj-blog__aside');
  const prose = document.querySelector('.sj-prose');
  const rail = document.querySelector('[data-sj-toc]');
  const inline = document.querySelector('.sj-toc--inline');
  const header = document.querySelector('header');
  const cs = (el) => el ? getComputedStyle(el) : null;
  const box = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right) }; };

  /* Which element is sticking out — only worth computing when something is.
     The ancestor walk calls getComputedStyle per element, and running it over
     every node of a 68 KB article timed out the CDP call. */
  const bleed = [];
  if (de.scrollWidth > de.clientWidth + 1) {
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.right <= vw + 1 && r.left >= -1) continue;
      let p = el, clipped = false;
      while (p && p !== document.body) { const c = getComputedStyle(p);
        if (c.overflowX !== 'visible' || c.clipPath !== 'none') { clipped = true; break; } p = p.parentElement; }
      if (!clipped) bleed.push(el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 30));
      if (bleed.length >= 8) break;
    }
  }

  const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
  const dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);

  return {
    vw,
    horizontalScroll: de.scrollWidth > de.clientWidth + 1,
    bleed: bleed.slice(0, 5), bleedCount: bleed.length,
    main: box(main), aside: box(aside), prose: box(prose),
    proseFont: prose ? parseFloat(cs(prose).fontSize) : null,
    proseLineHeight: prose ? (parseFloat(cs(prose).lineHeight) / parseFloat(cs(prose).fontSize)).toFixed(2) : null,
    railVisible: rail ? cs(aside).display !== 'none' : false,
    railSticky: aside ? cs(aside).position : null,
    railTop: aside ? cs(aside).top : null,
    inlineVisible: inline ? getComputedStyle(inline).display !== 'none' : false,
    headerH: header ? Math.round(header.getBoundingClientRect().height) : null,
    gapFromHeader: (header && main) ? Math.round(main.getBoundingClientRect().top - header.getBoundingClientRect().bottom) : null,
    h1Count: document.querySelectorAll('h1').length,
    dupIds: [...new Set(dupIds)],
    // widest pre, to prove code scrolls inside rather than widening the page
    widestPre: (() => { let m = 0; for (const p of document.querySelectorAll('.sj-prose pre'))
      m = Math.max(m, Math.round(p.getBoundingClientRect().width)); return m; })(),
    preOverflows: [...document.querySelectorAll('.sj-prose pre')].some(p => p.getBoundingClientRect().right > vw + 1),
    tableOverflows: [...document.querySelectorAll('.sj-prose table')].some(t => t.getBoundingClientRect().right > vw + 1),
  };
})()`;

const b = await launch();
const s = await attach(b.port);
const consoleErrors = [];
s.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') consoleErrors.push(p.args.map(a => a.value ?? a.description).join(' ').slice(0, 200)); });
s.on('Runtime.exceptionThrown', (p) => consoleErrors.push('exception: ' + (p.exceptionDetails?.text || '').slice(0, 200)));
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(`${p.entry.text} ${p.entry.url || ''}`.slice(0, 200)); });

const R = { base: BASE, when: new Date().toISOString(), cells: [], sticky: null, scrollspy: null, keyboard: null, regression: [], consoleErrors };

console.log('=== layout matrix ===');
for (const [label, route] of ARTICLES) {
  for (const [vp, w, h, mobile] of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      await go(s, route, { w, h, mobile, theme, settle: 900 });
      const r = await s.ev(LAYOUT);
      R.cells.push({ article: label, viewport: vp, theme, ...r });
      if (theme === 'light') {
        console.log(`  ${label.padEnd(16)} ${vp.padEnd(10)} main=${r.main ? r.main.w : '-'} prose=${r.prose ? r.prose.w : '-'} ` +
          `rail=${r.railVisible} inlineToc=${r.inlineVisible} font=${r.proseFont}px/${r.proseLineHeight} ` +
          `overflow=${r.horizontalScroll} preOverflow=${r.preOverflows} h1=${r.h1Count} dupIds=${r.dupIds.length} gap=${r.gapFromHeader}px`);
      }
    }
  }
}

/* Screenshots of the reference article */
console.log('\n=== screenshots ===');
for (const [vp, w, h, mobile] of [['1440x900', 1440, 900, false], ['390x844', 390, 844, true]]) {
  for (const theme of ['light', 'dark']) {
    await go(s, ARTICLES[0][1], { w, h, mobile, theme, settle: 1400 });
    const file = resolve(SHOTS, `word-lakh-${vp}-${theme}.jpg`);
    const ok = await shoot(s, file, { full: false });
    console.log(`  ${ok ? 'saved' : 'FAILED'}  ${file.slice(REPO.length + 1)}`);
  }
}

/* Sticky + scrollspy */
console.log('\n=== sticky + active section ===');
await go(s, ARTICLES[0][1], { w: 1440, h: 900, theme: 'light', settle: 1600 });
const before = await s.ev(`(() => { const a = document.querySelector('.sj-blog__aside');
  return { top: Math.round(a.getBoundingClientRect().top), active: (document.querySelector('.sj-toc-rail__body a.is-active')||{}).textContent || null }; })()`);
await s.ev(`window.scrollTo(0, 3000)`); await sleep(1200);
const mid = await s.ev(`(() => { const a = document.querySelector('.sj-blog__aside');
  return { top: Math.round(a.getBoundingClientRect().top), headerBottom: Math.round(document.querySelector('header').getBoundingClientRect().bottom),
           active: (document.querySelector('.sj-toc-rail__body a.is-active')||{}).textContent || null,
           visible: a.getBoundingClientRect().bottom > 0 && a.getBoundingClientRect().top < window.innerHeight }; })()`);
await s.ev(`window.scrollTo(0, 9000)`); await sleep(1200);
const later = await s.ev(`(() => ({ active: (document.querySelector('.sj-toc-rail__body a.is-active')||{}).textContent || null }))()`);
R.sticky = { before, mid, later };
console.log(`  before scroll: rail top ${before.top}px, active ${JSON.stringify(before.active)}`);
console.log(`  at y=3000    : rail top ${mid.top}px (header bottom ${mid.headerBottom}px) visible=${mid.visible} active=${JSON.stringify(mid.active)}`);
console.log(`  at y=9000    : active ${JSON.stringify(later.active)}`);
R.scrollspy = { changed: before.active !== mid.active || mid.active !== later.active, noOverlap: mid.top >= mid.headerBottom - 1 };
console.log(`  active changes while scrolling: ${R.scrollspy.changed};  rail clears the header: ${R.scrollspy.noOverlap}`);

/* Anchor landing */
await go(s, ARTICLES[0][1] + '#conclusion', { w: 1440, h: 900, theme: 'light', settle: 1400 });
const anchor = await s.ev(`(() => { const el = document.getElementById('conclusion');
  const hb = document.querySelector('header').getBoundingClientRect().bottom;
  const r = el.getBoundingClientRect();
  return { top: Math.round(r.top), headerBottom: Math.round(hb), clear: r.top >= hb - 1, text: el.textContent.trim().slice(0,30) }; })()`);
R.anchor = anchor;
console.log(`\n=== anchor landing ===\n  #conclusion at y=${anchor.top}px, header bottom ${anchor.headerBottom}px, clear of header: ${anchor.clear}`);

/* Keyboard */
await go(s, ARTICLES[0][1], { w: 1440, h: 900, theme: 'light', settle: 1200 });
await s.ev(`(() => { document.body.focus({ preventScroll: true }); return 1; })()`);
const stops = [];
for (let i = 0; i < 40; i++) {
  await tab(s);
  stops.push(JSON.parse(await s.ev(`(() => { const e = document.activeElement; const cs = getComputedStyle(e);
    return JSON.stringify({ tag: e.tagName, inRail: !!(e.closest && e.closest('[data-sj-toc]')),
      name: (e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,34),
      ring: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none' }); })()`)));
}
const railStops = stops.filter(x => x.inRail);
R.keyboard = { total: stops.length, railStops: railStops.length, noRing: stops.filter(x => !x.ring && x.tag !== 'BODY').length };
console.log(`\n=== keyboard ===\n  ${stops.length} stops, ${railStops.length} inside the TOC rail, ${R.keyboard.noRing} without a focus ring`);

/* Reduced motion */
await go(s, ARTICLES[0][1], { w: 1440, h: 900, theme: 'light', reduced: true, settle: 1200 });
const rm = await s.ev(`(() => { let inf = 0;
  for (const el of document.querySelectorAll('.sj-blog, .sj-blog *'))
    for (const a of (el.getAnimations ? el.getAnimations() : [])) if (a.effect && a.effect.getTiming().iterations === Infinity) inf++;
  const a = document.querySelector('.sj-toc-rail__body a');
  return { infinite: inf, transition: getComputedStyle(a).transition, railStillVisible: getComputedStyle(document.querySelector('.sj-blog__aside')).display !== 'none' }; })()`);
R.reducedMotion = rm;
console.log(`\n=== reduced motion ===\n  infinite animations ${rm.infinite}, rail link transition "${rm.transition}", rail visible ${rm.railStillVisible}`);

/* Regression: other routes untouched and error-free */
console.log('\n=== regression ===');
for (const route of REGRESSION) {
  await go(s, route, { w: 1280, h: 900, theme: 'light', settle: 800 });
  const r = await s.ev(`(() => ({ blog: !!document.querySelector('.sj-blog'), rail: !!document.querySelector('[data-sj-toc]'),
    h1: document.querySelectorAll('h1').length, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    main: document.querySelectorAll('main#main').length }))()`);
  R.regression.push({ route, ...r });
  console.log(`  ${route.padEnd(24)} blogLayout=${r.blog} rail=${r.rail} h1=${r.h1} main=${r.main} overflow=${r.overflow}`);
}

console.log(`\n=== console ===\n  ${consoleErrors.length} errors ${consoleErrors.length ? JSON.stringify([...new Set(consoleErrors)].slice(0,3)) : ''}`);

writeFileSync(resolve(HERE, 'phase9-blog-qa.json'), JSON.stringify(R, null, 1));
const bad = R.cells.filter(c => c.horizontalScroll || c.preOverflows || c.tableOverflows || c.dupIds.length);
console.log(`\n${R.cells.length - bad.length}/${R.cells.length} layout cells clean`);
s.ws.close(); b.proc.kill();
