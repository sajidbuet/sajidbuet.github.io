/* /projects/ — validation for the OMRFlow + Pi Web Kiosk addition.

   Checks the things the card system could plausibly break when two entries are
   added: overflow, badge/title collision, tag wrapping, density parity between
   the four cards, keyboard reachability, contrast in both themes, and console
   cleanliness.

   node docs/redesign/evidence/phase8-projects-qa.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, sleep, tab, HERE, BASE } from './phase7-cdp.mjs';

const VIEWPORTS = [
  ['320x568', 320, 568, true], ['375x812', 375, 812, true], ['768x1024', 768, 1024, true],
  ['1024x768', 1024, 768, false], ['1440x900', 1440, 900, false], ['1920x1080', 1920, 1080, false],
];

const CARDS = `(() => {
  const vw = document.documentElement.clientWidth;
  const cards = [...document.querySelectorAll('.sj-card--project')].map((c) => {
    const r = c.getBoundingClientRect();
    const title = c.querySelector('.sj-card__title');
    const cat = c.querySelector('.sj-card__cat');
    const status = c.querySelector('.sj-status');
    const desc = c.querySelector('.sj-card__desc');
    const tags = [...c.querySelectorAll('.sj-tag')];
    const links = [...c.querySelectorAll('.sj-card__links a')];
    const tr = title ? title.getBoundingClientRect() : null;
    const hr = (cat || status) ? (cat || status).getBoundingClientRect() : null;
    return {
      name: title ? title.textContent.trim() : '?',
      w: Math.round(r.width), h: Math.round(r.height),
      overflowsViewport: r.right > vw + 1 || r.left < -1,
      titleOverflows: title ? title.scrollWidth > title.clientWidth + 1 : false,
      // Badge row must sit above the title, never overlap it.
      headOverlapsTitle: (tr && hr) ? (hr.bottom > tr.top + 1 && hr.right > tr.left && hr.left < tr.right) : false,
      descH: desc ? Math.round(desc.getBoundingClientRect().height) : 0,
      descChars: desc ? desc.textContent.trim().length : 0,
      tagRows: new Set(tags.map(t => Math.round(t.getBoundingClientRect().top))).size,
      tagsOverflow: tags.some(t => t.getBoundingClientRect().right > r.right + 1),
      links: links.map(a => ({ text: a.textContent.replace(/\\s+/g, ' ').trim(), href: a.getAttribute('href'),
        target: a.getAttribute('target'), rel: a.getAttribute('rel'),
        name: (a.textContent || '').replace(/\\s+/g, ' ').trim() })),
      statusText: status ? status.textContent.trim() : null,
      statusColorOnly: status ? !status.textContent.trim() : null,
    };
  });
  return {
    vw, cards,
    horizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    columns: new Set(cards.map(c => Math.round(c.w))).size,
    gapFromNav: (() => {
      const h = document.querySelector('header'); const p = document.querySelector('.sj-projects-page');
      if (!h || !p) return null;
      return Math.round(p.getBoundingClientRect().top - h.getBoundingClientRect().bottom);
    })(),
  };
})()`;

const CONTRAST = `(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const toRGBA = (css) => { ctx.clearRect(0,0,1,1); ctx.fillStyle='rgba(0,0,0,0)'; ctx.fillStyle=css; ctx.fillRect(0,0,1,1);
    const d = ctx.getImageData(0,0,1,1).data; return [d[0],d[1],d[2],d[3]/255]; };
  const over = (f,b) => [0,1,2].map(i => f[i]*f[3] + b[i]*(1-f[3])).concat(1);
  const lum = (c) => { const [r,g,b] = c.slice(0,3).map(v => { v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); }); return 0.2126*r+0.7152*g+0.0722*b; };
  const bgStack = (el) => { const L=[]; let p=el;
    while (p) { const c = toRGBA(getComputedStyle(p).backgroundColor); if (c[3]>0) { L.push(c); if (c[3]>=0.999) break; } p = p.parentElement; }
    L.push([255,255,255,1]); let a=L[L.length-1]; for (let i=L.length-2;i>=0;i--) a=over(L[i],a); return a; };
  const out = [];
  for (const el of document.querySelectorAll('.sj-projects-page h1, .sj-card--project *')) {
    const t = (el.textContent||'').trim(); if (!t || el.children.length) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0) continue;
    const r = el.getBoundingClientRect(); if (r.width<2||r.height<2) continue;
    const size = parseFloat(cs.fontSize), weight = +cs.fontWeight||400;
    const need = (size>=24 || (size>=18.66 && weight>=700)) ? 3 : 4.5;
    const bg = bgStack(el); const fg = over(toRGBA(cs.color), bg);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    if (ratio < need) out.push({ t: t.slice(0,40), ratio: +ratio.toFixed(2), need, cls: String(el.className||'').slice(0,40) });
  }
  return out;
})()`;

const b = await launch();
const s = await attach(b.port);
const consoleErrors = [];
s.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') consoleErrors.push(p.args.map(a => a.value ?? a.description).join(' ').slice(0, 200)); });
s.on('Runtime.exceptionThrown', (p) => consoleErrors.push('exception: ' + (p.exceptionDetails?.text || '').slice(0, 200)));
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(`${p.entry.text} ${p.entry.url || ''}`.slice(0, 200)); });

const R = { base: BASE, when: new Date().toISOString(), cells: [], contrast: [], keyboard: null, consoleErrors };

console.log('=== responsive ===');
for (const [label, w, h, mobile] of VIEWPORTS) {
  for (const theme of ['light', 'dark']) {
    await go(s, '/projects/', { w, h, mobile, theme, settle: 1100 });
    const r = await s.ev(CARDS);
    R.cells.push({ viewport: label, theme, ...r });
    if (theme === 'light') {
      const descs = r.cards.map(c => c.descH);
      console.log(`  ${label.padEnd(9)} cards=${r.cards.length} overflow=${r.horizontalScroll} ` +
        `titleClip=${r.cards.some(c => c.titleOverflows)} badgeOverlap=${r.cards.some(c => c.headOverlapsTitle)} ` +
        `tagOverflow=${r.cards.some(c => c.tagsOverflow)} tagRows=${JSON.stringify(r.cards.map(c => c.tagRows))} ` +
        `descHeights=${JSON.stringify(descs)} cardW=${JSON.stringify(r.cards.map(c => c.w))} navGap=${r.gapFromNav}px`);
    }
  }
}

console.log('\n=== contrast (both themes, 1280px) ===');
for (const theme of ['light', 'dark']) {
  await go(s, '/projects/', { w: 1280, h: 900, theme, settle: 1100 });
  const f = await s.ev(CONTRAST);
  R.contrast.push({ theme, failures: f });
  console.log(`  ${theme}: ${f.length} below threshold ${f.length ? JSON.stringify(f.slice(0, 3)) : ''}`);
}

console.log('\n=== keyboard ===');
await go(s, '/projects/', { w: 1280, h: 900, theme: 'light', settle: 1100 });
await s.ev(`(() => { document.body.focus({ preventScroll: true }); return 1; })()`);
const stops = [];
for (let i = 0; i < 30; i++) {
  await tab(s);
  const st = JSON.parse(await s.ev(`(() => { const e=document.activeElement; const cs=getComputedStyle(e); const r=e.getBoundingClientRect();
    return JSON.stringify({ tag:e.tagName, href:e.getAttribute&&e.getAttribute('href'),
      name:(e.getAttribute('aria-label')||e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,44),
      ring: (cs.outlineStyle!=='none' && parseFloat(cs.outlineWidth)>0) || cs.boxShadow!=='none',
      inCard: !!(e.closest && e.closest('.sj-card--project')) }); })()`));
  stops.push(st);
}
const cardStops = stops.filter(x => x.inCard);
const noRing = cardStops.filter(x => !x.ring);
R.keyboard = { total: stops.length, cardStops: cardStops.length, noRing: noRing.length, stops: cardStops };
console.log(`  ${cardStops.length} tab stops inside project cards, ${noRing.length} without a focus ring`);
for (const c of cardStops) console.log(`     ${c.tag}  "${c.name}"  -> ${c.href}`);

/* Reduced motion: the card hover animation must not run. */
await go(s, '/projects/', { w: 1280, h: 900, theme: 'light', reduced: true, settle: 1100 });
const rm = await s.ev(`(() => {
  const c = document.querySelector('.sj-card--project');
  const cs = getComputedStyle(c);
  let infinite = 0;
  for (const el of document.querySelectorAll('.sj-card--project, .sj-card--project *'))
    for (const a of (el.getAnimations ? el.getAnimations() : []))
      if (a.effect && a.effect.getTiming().iterations === Infinity) infinite++;
  return { transition: cs.transition, transform: cs.transform, infinite };
})()`);
R.reducedMotion = rm;
console.log(`\n=== reduced motion ===\n  card transition: "${rm.transition}"  transform: ${rm.transform}  infinite animations: ${rm.infinite}`);

console.log(`\n=== console ===\n  ${consoleErrors.length} errors ${consoleErrors.length ? JSON.stringify([...new Set(consoleErrors)].slice(0,3)) : ''}`);

writeFileSync(resolve(HERE, 'phase8-projects-qa.json'), JSON.stringify(R, null, 1));
const bad = R.cells.filter(c => c.horizontalScroll || c.cards.some(x => x.titleOverflows || x.headOverlapsTitle || x.tagsOverflow));
console.log(`\n${R.cells.length - bad.length}/${R.cells.length} viewport cells clean`);
s.ws.close(); b.proc.kill();
process.exit(bad.length || noRing.length || consoleErrors.length || R.contrast.some(c => c.failures.length) ? 1 : 0);
