/* Resources category pages — validation.

   node docs/redesign/evidence/resources-category-qa.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, shoot, sleep, tab, HERE, REPO, BASE } from './phase7-cdp.mjs';

const SHOTS = resolve(REPO, 'docs', 'redesign', 'screenshots', 'resources-category');

const VIEWPORTS = [
  ['320x568', 320, 568, true], ['375x812', 375, 812, true], ['768x1024', 768, 1024, true],
  ['1024x768', 1024, 768, false], ['1440x900', 1440, 900, false], ['1920x1080', 1920, 1080, false],
];

const TARGETS = [
  ['academic', '/resources/academic/'],
  ['templates', '/resources/templates/'],
];

const REGRESSION = ['/resources/', '/resources/blog/20260224-word-lakh-taka-bdt/', '/publication/',
  '/projects/', '/teaching/', '/', '/news/', '/resources/blog/'];

const PROBE = `(() => {
  const de = document.documentElement;
  const vw = de.clientWidth;
  const q = (s) => [...document.querySelectorAll(s)];
  const cat = document.querySelector('.sj-resource-category');
  const header = document.querySelector('header');
  const cards = q('.sj-resource-card');
  const rows = q('.sj-resource-category__content li');
  const h1 = q('h1');
  const title = document.querySelector('.sj-resource-category__title');

  // Heading order
  const order = q('h1,h2,h3,h4').map(h => +h.tagName[1]);
  let skips = [];
  for (let i = 1; i < order.length; i++) if (order[i] > order[i-1] + 1) skips.push(order[i-1] + '->' + order[i]);

  const ids = q('[id]').map(e => e.id);
  const dupIds = [...new Set(ids.filter((v,i) => ids.indexOf(v) !== i))];

  // Anything painted outside the viewport and not clipped
  const bleed = [];
  if (de.scrollWidth > de.clientWidth + 1) {
    for (const el of q('body *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || r.right <= vw + 1) continue;
      bleed.push(el.tagName.toLowerCase() + '.' + String(el.className||'').slice(0,30));
      if (bleed.length >= 6) break;
    }
  }

  const cs = (el) => el ? getComputedStyle(el) : null;
  const cardCols = cards.length > 1
    ? new Set(cards.map(c => Math.round(c.getBoundingClientRect().left))).size : 0;
  const rowCols = rows.length > 1
    ? new Set(rows.map(c => Math.round(c.getBoundingClientRect().left))).size : 0;

  return {
    vw,
    horizontalScroll: de.scrollWidth > de.clientWidth + 1,
    bleed,
    found: !!cat,
    containerW: cat ? Math.round(cat.getBoundingClientRect().width) : null,
    gapFromHeader: (header && cat) ? Math.round(cat.getBoundingClientRect().top - header.getBoundingClientRect().bottom) : null,
    titlePx: title ? Math.round(parseFloat(cs(title).fontSize)) : null,
    titleLines: title ? Math.round(title.getBoundingClientRect().height / parseFloat(cs(title).lineHeight)) : null,
    h1Count: h1.length,
    headingSkips: skips,
    dupIds,
    cards: cards.length,
    cardColumns: cardCols,
    cardHeights: cards.map(c => Math.round(c.getBoundingClientRect().height)),
    downloadRows: rows.length,
    rowColumns: rowCols,
    // Citation view must be gone
    citationJunk: /\\(0001\\)|\\[Lor\\]|\\[Scientifictyping\\]|\\[Graphics\\]/.test(document.body.innerText),
    // No TOC on these pages
    hasToc: !!document.querySelector('[data-sj-toc], .sj-toc'),
    badges: q('.sj-resource-category__content li > a').map(a => getComputedStyle(a, '::after').content).filter(c => c && c !== 'none'),
    cardLinkTargets: cards.map(c => c.querySelectorAll('a').length),
    footerGap: (() => { const f = document.querySelector('footer'); if (!f || !cat) return null;
      return Math.round(f.getBoundingClientRect().top - cat.getBoundingClientRect().bottom); })(),
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
  for (const el of document.querySelectorAll('.sj-resource-category *')) {
    const t = (el.textContent||'').trim(); if (!t || el.children.length) continue;
    const c = getComputedStyle(el);
    if (c.visibility==='hidden'||c.display==='none'||+c.opacity===0) continue;
    const r = el.getBoundingClientRect(); if (r.width<2||r.height<2) continue;
    const size = parseFloat(c.fontSize), weight = +c.fontWeight||400;
    const need = (size>=24 || (size>=18.66 && weight>=700)) ? 3 : 4.5;
    const bg = bgStack(el); const fg = over(toRGBA(c.color), bg);
    const l1 = lum(fg), l2 = lum(bg);
    const ratio = (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
    if (ratio < need) out.push({ t: t.slice(0,36), ratio: +ratio.toFixed(2), need, cls: String(el.className||'').slice(0,36) });
  }
  return out;
})()`;

const b = await launch();
const s = await attach(b.port);
const consoleErrors = [];
s.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') consoleErrors.push(p.args.map(a => a.value ?? a.description).join(' ').slice(0,200)); });
s.on('Runtime.exceptionThrown', (p) => consoleErrors.push('exception: ' + (p.exceptionDetails?.text||'').slice(0,200)));
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(`${p.entry.text} ${p.entry.url||''}`.slice(0,200)); });

const R = { base: BASE, when: new Date().toISOString(), cells: [], contrast: [], keyboard: [], links: [], regression: [], consoleErrors };

console.log('=== layout matrix ===');
for (const [name, route] of TARGETS) {
  for (const [vp, w, h, mobile] of VIEWPORTS) {
    for (const theme of ['light', 'dark']) {
      await go(s, route, { w, h, mobile, theme, settle: 800 });
      const r = await s.ev(PROBE);
      R.cells.push({ page: name, viewport: vp, theme, ...r });
      if (theme === 'light') {
        console.log(`  ${name.padEnd(10)} ${vp.padEnd(9)} container=${r.containerW} title=${r.titlePx}px/${r.titleLines}ln ` +
          `cards=${r.cards}/${r.cardColumns}col rows=${r.downloadRows}/${r.rowColumns}col ` +
          `h1=${r.h1Count} skips=${r.headingSkips.length} dupIds=${r.dupIds.length} overflow=${r.horizontalScroll} ` +
          `citationJunk=${r.citationJunk} toc=${r.hasToc} gap=${r.gapFromHeader}px footerGap=${r.footerGap}px`);
      }
    }
  }
}

console.log('\n=== one interactive target per card ===');
const targets = R.cells.filter(c => c.cards).map(c => c.cardLinkTargets);
console.log(`  links per card across all cells: ${JSON.stringify([...new Set(targets.flat())])} (must be [1])`);

console.log('\n=== file-type badges ===');
const badges = [...new Set(R.cells.flatMap(c => c.badges || []))];
console.log(`  ::after content on authored links: ${JSON.stringify(badges)}`);

console.log('\n=== contrast, both themes ===');
for (const [name, route] of TARGETS) {
  for (const theme of ['light', 'dark']) {
    await go(s, route, { w: 1440, h: 900, theme, settle: 900 });
    const f = await s.ev(CONTRAST);
    R.contrast.push({ page: name, theme, failures: f });
    console.log(`  ${name} ${theme}: ${f.length} below threshold ${f.length ? JSON.stringify(f.slice(0,2)) : ''}`);
  }
}

console.log('\n=== keyboard ===');
for (const [name, route] of TARGETS) {
  await go(s, route, { w: 1440, h: 900, theme: 'light', settle: 900 });
  await s.ev(`(() => { document.body.focus({ preventScroll: true }); return 1; })()`);
  const stops = [];
  for (let i = 0; i < 24; i++) {
    await tab(s);
    stops.push(JSON.parse(await s.ev(`(() => { const e = document.activeElement; const cs = getComputedStyle(e);
      const card = e.closest && e.closest('.sj-resource-card');
      const inContent = !!(e.closest && e.closest('.sj-resource-category__content'));
      return JSON.stringify({ tag: e.tagName, inCard: !!card, inContent,
        name: (e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,38),
        ring: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none'
              || (card ? getComputedStyle(card).outlineStyle !== 'none' : false) }); })()`)));
  }
  const inPage = stops.filter(x => x.inCard || x.inContent);
  const noRing = inPage.filter(x => !x.ring);
  R.keyboard.push({ page: name, inPage: inPage.length, noRing: noRing.length, stops: inPage });
  console.log(`  ${name}: ${inPage.length} stops in page content, ${noRing.length} without a focus indicator`);
  for (const st of inPage) console.log(`     ${st.tag}  "${st.name}"`);
}

console.log('\n=== links resolve ===');
await go(s, '/resources/templates/', { w: 1440, h: 900, theme: 'light', settle: 900 });
const hrefs = await s.ev(`[...document.querySelectorAll('.sj-resource-category a[href]')].map(a => a.getAttribute('href'))`);
for (const h of hrefs) {
  const url = h.startsWith('http') ? h : BASE + (h.startsWith('/') ? h : '/resources/templates/' + h);
  let status = 'ERR';
  try { const r = await fetch(url, { method: 'HEAD' }); status = r.status; } catch {}
  R.links.push({ href: h, status });
  console.log(`  ${String(status).padEnd(5)} ${h}`);
}

console.log('\n=== screenshots ===');
for (const [name, route] of TARGETS) {
  for (const [vp, w, h, mobile] of [['1440x900', 1440, 900, false], ['390x844', 390, 844, true]]) {
    for (const theme of ['light', 'dark']) {
      await go(s, route, { w, h, mobile, theme, settle: 1100 });
      const ok = await shoot(s, resolve(SHOTS, `${name}-${vp}-${theme}.jpg`));
      console.log(`  ${ok ? 'saved' : 'FAILED'}  ${name}-${vp}-${theme}.jpg`);
    }
  }
}

console.log('\n=== regression ===');
for (const route of REGRESSION) {
  await go(s, route, { w: 1280, h: 900, theme: 'light', settle: 800 });
  const r = await s.ev(`(() => ({ cat: !!document.querySelector('.sj-resource-category'),
    h1: document.querySelectorAll('h1').length, main: document.querySelectorAll('main#main').length,
    toc: !!document.querySelector('[data-sj-toc]'),
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    citation: !!document.querySelector('.view-citation, .pub-list-item') }))()`);
  R.regression.push({ route, ...r });
  console.log(`  ${route.padEnd(46)} categoryLayout=${r.cat} h1=${r.h1} main=${r.main} toc=${r.toc} citationView=${r.citation} overflow=${r.overflow}`);
}

console.log(`\n=== console ===\n  ${consoleErrors.length} errors ${consoleErrors.length ? JSON.stringify([...new Set(consoleErrors)].slice(0,3)) : ''}`);

writeFileSync(resolve(HERE, 'resources-category-qa.json'), JSON.stringify(R, null, 1));
const bad = R.cells.filter(c => c.horizontalScroll || c.dupIds.length || c.headingSkips.length || c.h1Count !== 1 || c.citationJunk || c.hasToc);
console.log(`\n${R.cells.length - bad.length}/${R.cells.length} layout cells clean`);
s.ws.close(); b.proc.kill();
