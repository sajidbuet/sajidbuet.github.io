/* Phase 8 — hero research-field QA.

   Chromium over CDP + Firefox via Playwright. Covers density by breakpoint,
   subtlety, overflow, the one-shot reveal, idle state, pointer parallax bounds,
   reduced motion, keyboard and zoom.

   node docs/redesign/evidence/phase8-hero-qa.mjs [base]
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { firefox } from 'playwright';
import { launch, attach, go, sleep, HERE } from './phase7-cdp.mjs';

const BASE = process.argv[2] || 'http://127.0.0.1:1337';
const OUT = resolve(HERE, 'phase8-hero-qa.json');
const R = { meta: { base: BASE, at: new Date().toISOString() }, chromium: {}, firefox: {} };

const FIELD = `(() => {
  const vis = e => { if (getComputedStyle(e).display === 'none') return false;
    const r = e.getBoundingClientRect(); return r.width > 0 || r.height > 0; };
  const f = document.querySelector('.sj-hero__field');
  if (!f) return JSON.stringify({ missing: true });
  const cs = getComputedStyle(f);
  const n = Array.from(f.querySelectorAll('.hf-node')).filter(vis);
  const l = Array.from(f.querySelectorAll('.hf-link')).filter(vis);
  const a = Array.from(f.querySelectorAll('.hf-arc')).filter(vis);
  const t = Array.from(f.querySelectorAll('.hf-trace')).filter(vis);
  const de = document.documentElement;
  const fr = f.getBoundingClientRect();
  const hero = document.querySelector('.sj-hero').getBoundingClientRect();
  const hdr = document.querySelector('.page-header').getBoundingClientRect();
  return JSON.stringify({
    nodes: n.length, links: l.length, arcs: a.length, traces: t.length,
    shapesInDom: f.querySelectorAll('circle,path').length,
    nodeOpacity: n[0] ? +getComputedStyle(n[0]).opacity : null,
    linkOpacity: l[0] ? +getComputedStyle(l[0]).opacity : null,
    arcOpacity: a[0] ? +getComputedStyle(a[0]).opacity : null,
    traceOpacity: t[0] ? +getComputedStyle(t[0]).opacity : null,
    fieldOpacity: +cs.opacity,
    maskApplied: !!(cs.maskImage && cs.maskImage !== 'none'),
    fieldCoversHero: Math.abs(fr.width - hero.width) < 2 && Math.abs(fr.height - hero.height) < 2,
    docOverflowPx: de.scrollWidth - de.clientWidth,
    navbarToHeroGap: Math.round(hero.top - hdr.bottom),
    ariaHidden: f.getAttribute('aria-hidden'),
    tabbablesInside: f.querySelectorAll('a,button,[tabindex]').length,
    usesAnimationProperty: Array.from(f.querySelectorAll('*')).some(e => getComputedStyle(e).animationName !== 'none'),
    usesBlur: [f].concat(Array.from(f.querySelectorAll('*'))).some(e => { const c = getComputedStyle(e);
      return /blur/.test(c.filter) || (c.backdropFilter && c.backdropFilter !== 'none'); }),
    infiniteAnimations: document.getAnimations().filter(x => { try { return x.effect.getTiming().iterations === Infinity; } catch (e) { return false; } }).length,
    runningAnimations: document.getAnimations().length,
    classes: f.getAttribute('class'),
  });
})()`;

/* ---------------- Chromium ---------------- */
{
  const { proc, port } = await launch();
  const s = await attach(port);

  for (const [label, w, h, mobile] of [['1440', 1440, 900, false], ['1024', 1024, 768, false],
                                       ['768', 768, 1024, true], ['430', 430, 932, true], ['390', 390, 844, true]]) {
    for (const theme of ['light', 'dark']) {
      await go(s, BASE + '/', { w, h, mobile, theme, settle: 2600 });
      R.chromium[`${label}|${theme}`] = JSON.parse(await s.ev(FIELD));
    }
  }

  /* one-shot reveal timeline */
  await s.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false, screenWidth: 1440, screenHeight: 900 });
  await s.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  const loaded = s.once('Page.loadEventFired', 45000);
  await s.send('Page.navigate', { url: BASE + '/' });
  await loaded;
  const SNAP = `(() => { const f = document.querySelector('.sj-hero__field');
    return JSON.stringify({ field: +getComputedStyle(f).opacity,
      node: +getComputedStyle(f.querySelector('.hf-node')).opacity,
      dashoffset: getComputedStyle(f.querySelector('.hf-link')).strokeDashoffset }); })()`;
  const timeline = {};
  let elapsed = 0;
  for (const t of [80, 400, 800, 1200, 1600]) {
    await sleep(t - elapsed); elapsed = t;
    timeline[t + 'ms'] = JSON.parse(await s.ev(SNAP));
  }
  R.chromium.revealTimeline = timeline;

  /* idle after the logo loader has also settled */
  await sleep(5000);
  R.chromium.idle = JSON.parse(await s.ev(`JSON.stringify({
    running: document.getAnimations().length,
    infinite: document.getAnimations().filter(a => { try { return a.effect.getTiming().iterations === Infinity; } catch(e){ return false; } }).length })`));

  /* pointer parallax — two moves, so pointerenter has a prior position.
     The emulated media MUST be re-asserted as a fine pointer first: the loop
     above ends on the 390px cell, which emulates `pointer: coarse`, and that
     state persists across a raw Page.navigate. Leaving it set made the parallax
     probe report zero displacement and look like a product bug when it was the
     harness disabling the feature. */
  await s.send('Emulation.setTouchEmulationEnabled', { enabled: false, maxTouchPoints: 1 });
  await s.send('Emulation.setEmulatedMedia', { features: [
    { name: 'prefers-color-scheme', value: 'light' },
    { name: 'pointer', value: 'fine' }, { name: 'any-pointer', value: 'fine' },
    { name: 'hover', value: 'hover' }, { name: 'any-hover', value: 'hover' },
  ] });
  {
    const l2 = s.once('Page.loadEventFired', 45000);
    await s.send('Page.navigate', { url: BASE + '/' });
    await l2;
    await sleep(2200);
  }
  R.chromium.pointerFine = await s.ev(`matchMedia('(pointer: fine)').matches`);
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 300, button: 'none', buttons: 0, pointerType: 'mouse' });
  await sleep(150);
  /* Near the hero's bottom-right corner but INSIDE it. The hero is 571px tall
     at 1440 after the Phase 8 rhythm tightening, so y must stay under ~636;
     an earlier y=660 landed outside and triggered pointerleave, which reset the
     offsets to 0 and read as "parallax not working". */
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1434, y: 600, button: 'none', buttons: 0, pointerType: 'mouse' });
  await sleep(900);
  const READ = `(() => { const f = document.querySelector('.sj-hero__field');
    const d = c => { const m = new DOMMatrixReadOnly(getComputedStyle(f.querySelector(c)).transform);
      return { dx: +m.m41.toFixed(2), dy: +m.m42.toFixed(2) }; };
    return JSON.stringify({ hfx: f.style.getPropertyValue('--hf-x'), hfy: f.style.getPropertyValue('--hf-y'),
      back: d('.hf-layer--back'), mid: d('.hf-layer--mid'), front: d('.hf-layer--front') }); })()`;
  R.chromium.parallaxExtreme = JSON.parse(await s.ev(READ));
  /* leaving the hero must return to equilibrium without a JS loop */
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 5, button: 'none', buttons: 0, pointerType: 'mouse' });
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: -20, button: 'none', buttons: 0, pointerType: 'mouse' });
  await sleep(1100);
  R.chromium.parallaxAfterLeave = JSON.parse(await s.ev(READ));

  /* reduced motion */
  await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', reduced: true, settle: 500 });
  R.chromium.reducedMotion = JSON.parse(await s.ev(FIELD));
  await go(s, BASE + '/', { w: 390, h: 844, mobile: true, theme: 'dark', reduced: true, settle: 500 });
  R.chromium.reducedMotionMobileDark = JSON.parse(await s.ev(FIELD));

  proc.kill();
}

/* ---------------- Firefox ---------------- */
{
  const browser = await firefox.launch({ headless: true });
  R.firefox.version = browser.version();
  const evalField = async (page) => JSON.parse(await page.evaluate(new Function('return ' + FIELD)));

  for (const [label, w, h] of [['1440', 1440, 900], ['768', 768, 1024], ['390', 390, 844]]) {
    for (const theme of ['light', 'dark']) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
      const page = await ctx.newPage();
      await page.goto(BASE + '/', { waitUntil: 'load' });
      await page.waitForTimeout(2600);
      R.firefox[`${label}|${theme}`] = await evalField(page);
      await ctx.close();
    }
  }

  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(600);
    R.firefox.reducedMotion = await evalField(page);
    await ctx.close();
  }

  /* keyboard: the decorative field must add no tab stops */
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    const stops = [];
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      stops.push(await page.evaluate(() => { const e = document.activeElement;
        return e ? { inField: !!(e.closest && e.closest('.sj-hero__field')),
          ring: (() => { const c = getComputedStyle(e); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || (c.boxShadow && c.boxShadow !== 'none'); })(),
          name: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28) } : null; }));
    }
    R.firefox.keyboard = { stops: stops.length, insideField: stops.filter(s => s && s.inField).length,
      withoutRing: stops.filter(s => s && !s.ring).length, order: stops.map(s => s && s.name) };
    await ctx.close();
  }

  /* zoom: 200% and 400% on a 1440 window */
  for (const [z, w, h] of [[200, 720, 450], [400, 360, 225]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1440 / w });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(2200);
    R.firefox['zoom' + z] = await page.evaluate(() => {
      const de = document.documentElement;
      const f = document.querySelector('.sj-hero__field');
      const vis = (e) => getComputedStyle(e).display !== 'none';
      const h1 = document.querySelector('h1'), cta = document.querySelector('.sj-btn--primary');
      return { cssPx: de.clientWidth, docOverflow: de.scrollWidth - de.clientWidth,
        nodes: Array.from(f.querySelectorAll('.hf-node')).filter(vis).length,
        h1Visible: !!h1 && h1.getBoundingClientRect().height > 0,
        ctaVisible: !!cta && cta.getBoundingClientRect().width > 0 };
    });
    await ctx.close();
  }

  await browser.close();
}

writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('=== Chromium ===');
for (const [k, v] of Object.entries(R.chromium)) {
  if (v && v.nodes !== undefined) console.log(`  ${k.padEnd(12)} nodes=${v.nodes} links=${v.links} arcs=${v.arcs} traces=${v.traces} ` +
    `op(n/l/a/t)=${v.nodeOpacity}/${v.linkOpacity}/${v.arcOpacity}/${v.traceOpacity} mask=${v.maskApplied} ` +
    `gap=${v.navbarToHeroGap} overflow=${v.docOverflowPx} inf=${v.infiniteAnimations} tabbables=${v.tabbablesInside}`);
}
console.log('  revealTimeline ' + JSON.stringify(R.chromium.revealTimeline));
console.log('  idle           ' + JSON.stringify(R.chromium.idle));
console.log('  pointer:fine   ' + R.chromium.pointerFine);
console.log('  parallax max   ' + JSON.stringify(R.chromium.parallaxExtreme));
console.log('  parallax leave ' + JSON.stringify(R.chromium.parallaxAfterLeave));
console.log('=== Firefox ' + R.firefox.version + ' ===');
for (const [k, v] of Object.entries(R.firefox)) {
  if (v && v.nodes !== undefined) console.log(`  ${k.padEnd(12)} nodes=${v.nodes} links=${v.links} op=${v.nodeOpacity} mask=${v.maskApplied} ` +
    `covers=${v.fieldCoversHero} gap=${v.navbarToHeroGap} overflow=${v.docOverflowPx} inf=${v.infiniteAnimations}`);
}
console.log('  keyboard ' + JSON.stringify(R.firefox.keyboard));
console.log('  zoom200  ' + JSON.stringify(R.firefox.zoom200));
console.log('  zoom400  ' + JSON.stringify(R.firefox.zoom400));
