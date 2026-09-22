/* Phase 7.7 — Firefox / Gecko.

   Uses the Playwright Firefox build (added as a repo devDependency in Phase 7).
   Covers the full route list at the desktop/tablet/phone references in both
   themes, then the four Gecko-specific risks the roadmap names:
     backdrop-filter, :focus-visible rendering, the nav toggle, SVG <text> metrics.

   Also records element geometry so it can be diffed against the Chromium run
   (visual-qa-baseline B1: no >4 px positional drift).

   node docs/redesign/evidence/phase7-firefox.mjs
*/
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { firefox } from 'playwright';
import { HERE, SHOTS, ROUTES, BASE } from './phase7-cdp.mjs';

const OUT = resolve(HERE, 'phase7-firefox.json');

const AUDIT = () => {
  const q = (s) => Array.from(document.querySelectorAll(s));
  const de = document.documentElement;
  const vw = de.clientWidth;
  const parseRGB = (str) => { const m = String(str).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const effBg = (el) => { let n = el;
    while (n && n !== de) { const bg = parseRGB(getComputedStyle(n).backgroundColor); if (bg && bg.a > 0.85) return bg; n = n.parentElement; }
    const b = document.body ? parseRGB(getComputedStyle(document.body).backgroundColor) : null;
    return b && b.a > 0.85 ? b : { r: 255, g: 255, b: 255 }; };

  const contrast = []; const seen = new Set();
  /* Gecko throws "Argument 1 is not an object" if document.body is momentarily
     null, which it was on /projects/ in the first Firefox run. Guard it. */
  const root = document.body || document.documentElement;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = w.nextNode())) {
    const t = node.nodeValue.trim(); if (t.length < 3) continue;
    const el = node.parentElement; if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.opacity === '0') continue;
    const key = el.tagName + '|' + st.color + '|' + st.fontSize; if (seen.has(key)) continue; seen.add(key);
    const fg = parseRGB(st.color); if (!fg) continue;
    const bg = effBg(el); const cr = ratio(fg, bg);
    const px = parseFloat(st.fontSize), bold = +st.fontWeight >= 700;
    const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
    if (cr < need) contrast.push({ el: el.tagName.toLowerCase(), txt: t.slice(0, 34), fg: st.color, bg: `rgb(${bg.r},${bg.g},${bg.b})`, ratio: +cr.toFixed(2), need });
    if (seen.size > 400) break;
  }

  const hs = q('h1,h2,h3,h4,h5,h6').filter(h => h.getBoundingClientRect().height > 0);
  const skips = [];
  for (let i = 1; i < hs.length; i++) if (+hs[i].tagName[1] - +hs[i - 1].tagName[1] > 1) skips.push(hs[i - 1].tagName + '->' + hs[i].tagName);

  /* geometry anchors for the Chromium diff */
  const anchor = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; };

  return {
    overflowPx: de.scrollWidth - vw, docScrollW: de.scrollWidth, innerW: vw,
    docHeight: de.scrollHeight,
    h1: q('h1').length, headings: hs.length, skips,
    landmarks: { main: q('main,[role=main]').length, header: q('header').length, nav: q('nav').length, footer: q('footer').length },
    contrastFails: contrast.length, contrast: contrast.slice(0, 10),
    imgsNoDim: q('img').filter(i => !(i.getAttribute('width') && i.getAttribute('height'))).length,
    /* Gecko risk 1: backdrop-filter */
    backdrop: q('body *').filter(e => { const b = getComputedStyle(e).backdropFilter || getComputedStyle(e).webkitBackdropFilter;
      return b && b !== 'none'; }).length,
    backdropSupported: CSS.supports('backdrop-filter', 'blur(4px)') || CSS.supports('-webkit-backdrop-filter', 'blur(4px)'),
    headerBg: (() => { const h = document.querySelector('header'); if (!h) return null; const cs = getComputedStyle(h);
      return { bg: cs.backgroundColor, backdrop: cs.backdropFilter, opaque: (parseRGB(cs.backgroundColor) || { a: 0 }).a > 0.99 }; })(),
    /* Gecko risk 3: SVG <text> metrics in the logo */
    logoText: q('header svg text').map(t => { const r = t.getBoundingClientRect();
      return { id: t.id || '(none)', txt: (t.textContent || '').slice(0, 14), x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) }; }).slice(0, 8),
    logoBox: anchor('header svg'),
    /* Gecko risk 2: nav toggle */
    navToggle: (() => { const b = document.querySelector('header button[aria-expanded]'); if (!b) return null;
      const r = b.getBoundingClientRect();
      return { visible: r.width > 0, w: Math.round(r.width), h: Math.round(r.height), expanded: b.getAttribute('aria-expanded') }; })(),
    navRows: (() => { const n = document.querySelector('header nav'); if (!n) return null;
      const links = Array.from(n.querySelectorAll('a')).filter(a => a.getBoundingClientRect().width > 0);
      return { count: links.length, tops: [...new Set(links.map(a => Math.round(a.getBoundingClientRect().top)))].length }; })(),
    anchors: { header: anchor('header'), main: anchor('main'), footer: anchor('footer'), h1: anchor('h1') },
    /* grid/flex gap parity (B8) */
    gapSample: q('body *').filter(e => { const cs = getComputedStyle(e); return (cs.display === 'grid' || cs.display === 'flex') && cs.gap !== 'normal' && cs.gap !== '0px'; })
      .slice(0, 5).map(e => ({ el: e.tagName.toLowerCase() + '.' + String(e.className).trim().split(/\s+/)[0], gap: getComputedStyle(e).gap, w: Math.round(e.getBoundingClientRect().width) })),
    tables: q('table').map(t => { const r = t.getBoundingClientRect(); return { w: Math.round(r.width), overflowsDoc: r.right > vw + 1 }; }).slice(0, 4),
  };
};

const browser = await firefox.launch({ headless: true });
const R = { meta: { engine: 'gecko', version: browser.version(), base: BASE, at: new Date().toISOString() }, cells: {}, gecko: {} };

const VPS = [['1440x900', 1440, 900, false], ['1024x768', 1024, 768, false], ['768x1024', 768, 1024, true], ['390x844', 390, 844, true]];
for (const [slug, path] of ROUTES) {
  for (const [vp, w, h, mobile] of VPS) {
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, hasTouch: mobile, isMobile: false, deviceScaleFactor: 1 });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(String(e).slice(0, 140)));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
      await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
      await page.waitForSelector('body', { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(1500);
      let audit;
      try { audit = await page.evaluate(AUDIT); }
      catch (e) { audit = { evalError: String(e).slice(0, 200) }; }
      R.cells[`${slug}|${vp}|${theme}`] = { route: path, ...audit, consoleErrors: [...new Set(errors)].slice(0, 5) };
      if (vp === '1440x900' || vp === '390x844') {
        mkdirSync(`${SHOTS}/firefox/${slug}`, { recursive: true });
        await page.screenshot({ path: `${SHOTS}/firefox/${slug}/${slug}-${vp}-${theme}.jpg`, quality: 64, type: 'jpeg', fullPage: vp === '1440x900' });
      }
      await ctx.close();
    }
  }
  process.stderr.write(`ff: ${slug}\n`);
}

/* ---- Gecko-specific interaction checks ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, colorScheme: 'light' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);

  // B5 nav toggle, keyboard only
  await page.keyboard.press('Tab'); // skip link
  const order = [];
  for (let i = 0; i < 12; i++) {
    const info = await page.evaluate(() => { const e = document.activeElement;
      const cs = e ? getComputedStyle(e) : null;
      return e ? { tag: e.tagName.toLowerCase(), name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30),
        expanded: e.getAttribute('aria-expanded'),
        ring: !!cs && ((cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none')),
        outline: cs ? cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor : null } : null; });
    if (info) order.push(info);
    if (info && info.expanded !== null) break;
    await page.keyboard.press('Tab');
  }
  const toggle = order[order.length - 1];
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const opened = await page.evaluate(() => { const b = document.querySelector('header button[aria-expanded]');
    const p = document.getElementById(b.getAttribute('aria-controls'));
    return { expanded: b.getAttribute('aria-expanded'), panelH: p ? Math.round(p.getBoundingClientRect().height) : null,
      focusInside: !!(p && p.contains(document.activeElement)) }; });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  const closed = await page.evaluate(() => { const b = document.querySelector('header button[aria-expanded]');
    return { expanded: b.getAttribute('aria-expanded'), focusOnTrigger: document.activeElement === b }; });

  // B4 :focus-visible ring under real keyboard focus
  await page.goto(BASE + '/publication/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const rings = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    rings.push(await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null;
      const cs = getComputedStyle(e);
      return { name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 28),
        ring: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none'),
        outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' off:' + cs.outlineOffset,
        matchesFocusVisible: e.matches(':focus-visible') }; }));
  }
  await page.screenshot({ path: `${SHOTS}/firefox/focus-visible-publication.jpg`, quality: 80, type: 'jpeg' });

  R.gecko = { tabToToggle: order.length, toggle, openedByEnter: opened, closedByEscape: closed,
    focusRings: rings.filter(Boolean),
    focusRingsWithout: rings.filter(Boolean).filter(r => !r.ring).map(r => r.name),
    focusVisibleSupported: await page.evaluate(() => { try { document.querySelector(':focus-visible'); return true; } catch { return false; } }) };
  await ctx.close();
}

await browser.close();
writeFileSync(OUT, JSON.stringify(R, null, 1));

const cells = Object.entries(R.cells);
console.log('cells', cells.length);
console.log('overflow', cells.filter(([, c]) => c.overflowPx > 1).map(([k, c]) => k + ':' + c.overflowPx));
console.log('h1!=1', cells.filter(([, c]) => c.h1 !== 1).map(([k]) => k));
console.log('skips', cells.filter(([, c]) => c.skips.length).map(([k]) => k));
console.log('contrastCells', cells.filter(([, c]) => c.contrastFails > 0).length);
const cu = new Map();
for (const [k, c] of cells) for (const f of c.contrast) cu.set(`${k.split('|')[2]}|${f.el}|${f.fg}|${f.bg}|${f.ratio}`, f);
console.log('contrastUnique', cu.size); [...cu.entries()].forEach(([k, f]) => console.log('   ', k, JSON.stringify(f.txt)));
console.log('landmarkProblems', cells.filter(([, c]) => c.landmarks.main !== 1).map(([k]) => k));
console.log('backdropSupported', cells[0][1].backdropSupported, 'headerOpaque', cells[0][1].headerBg);
console.log('navRows', [...new Set(cells.filter(([k]) => !k.includes('390')).map(([, c]) => c.navRows && c.navRows.tops))]);
console.log('gecko', JSON.stringify(R.gecko, null, 1).slice(0, 2600));
