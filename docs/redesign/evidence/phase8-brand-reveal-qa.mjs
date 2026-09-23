/* Phase 8 — navbar brand scroll-reveal QA.

   Covers every case in the brief: fresh load at the top, slow scroll, fast
   scroll past the hero, scroll back up, reload at a restored scroll position,
   deep link to an anchor, non-homepage routes, mobile menu, keyboard focus,
   reduced motion, layout shift and console errors.

   node docs/redesign/evidence/phase8-brand-reveal-qa.mjs [base]
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, shoot, sleep, tab, HERE, REPO } from './phase7-cdp.mjs';

/* Phase 8 evidence lives under its own directory; the shared helper's `SHOTS`
   constant points at phase-7. */
const SHOTS = resolve(REPO, 'docs', 'redesign', 'screenshots', 'phase-8');

const BASE = process.argv[2] || 'http://127.0.0.1:1337';
const OUT = resolve(HERE, 'phase8-brand-reveal-qa.json');
const R = { meta: { base: BASE, at: new Date().toISOString() } };

const STATE = `(() => {
  const b = document.querySelector('.navbar-brand');
  if (!b) return JSON.stringify({ missing: true });
  const cs = getComputedStyle(b);
  const r = b.getBoundingClientRect();
  const nav = document.querySelector('#nav-menu') || document.querySelector('header nav');
  const firstLink = document.querySelector('header nav a[href]:not(.navbar-brand)');
  const toggle = document.querySelector('#nav-toggle');
  const search = document.querySelector('header button[aria-label*="earch" i], header [data-search], header button');
  return JSON.stringify({
    shown: b.classList.contains('sj-brand--shown'),
    visibility: cs.visibility, opacity: +(+cs.opacity).toFixed(3),
    transform: cs.transform, transition: cs.transitionDuration,
    boxW: Math.round(r.width), boxH: Math.round(r.height),
    boxReserved: r.width > 0 && r.height > 0,
    headerH: Math.round(document.querySelector('.page-header').getBoundingClientRect().height),
    firstNavLinkX: firstLink ? Math.round(firstLink.getBoundingClientRect().left) : null,
    toggleX: toggle ? Math.round(toggle.getBoundingClientRect().left) : null,
    navVisible: !!nav,
    scrollY: Math.round(scrollY),
  });
})()`;

const { proc, port } = await launch();
const s = await attach(port);
const consoleErrors = [];
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(p.entry.text.slice(0, 140)); });

const scrollTo = async (y) => { await s.ev(`window.scrollTo(0, ${y})`); await sleep(520); };
const read = async () => JSON.parse(await s.ev(STATE));

/* ---------- 1. the scroll journey, per viewport ---------- */
R.journey = {};
for (const [label, w, h, mobile] of [['1440', 1440, 900, false], ['768', 768, 1024, true], ['390', 390, 844, true]]) {
  await go(s, BASE + '/', { w, h, mobile, theme: 'light', settle: 2600 });
  const markBottom = await s.ev(`(() => { const m = document.querySelector('.sj-hero__mark');
    return Math.round(m.getBoundingClientRect().bottom + scrollY); })()`);
  const headerH = await s.ev(`Math.round(document.querySelector('.page-header').getBoundingClientRect().height)`);
  const trigger = markBottom - headerH;   // scrollY at which the mark clears the header

  const steps = {};
  steps['load@0'] = await read();
  for (const y of [Math.round(trigger * 0.4), trigger - 20, trigger + 20, Math.round(trigger * 2), 4000]) {
    await scrollTo(y);
    steps['y=' + y] = await read();
  }
  /* fast jump straight past the hero, then straight back to the top */
  await s.ev('window.scrollTo(0, 6000)'); await sleep(600);
  steps['fastJump6000'] = await read();
  await s.ev('window.scrollTo(0, 0)'); await sleep(700);
  steps['backToTop'] = await read();

  R.journey[label] = { markBottom, headerH, triggerScrollY: trigger, steps };
  await scrollTo(0);
}

/* ---------- 2. layout shift: do the nav controls move when the brand appears? ---------- */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 2600 });
const hidden = await read();
await scrollTo(1200);
const shownState = await read();
await scrollTo(0);
R.layoutShift = {
  hidden: { brandBoxW: hidden.boxW, firstNavLinkX: hidden.firstNavLinkX, headerH: hidden.headerH },
  shown: { brandBoxW: shownState.boxW, firstNavLinkX: shownState.firstNavLinkX, headerH: shownState.headerH },
  navLinkMovedPx: Math.abs((shownState.firstNavLinkX ?? 0) - (hidden.firstNavLinkX ?? 0)),
  brandBoxChangedPx: Math.abs(shownState.boxW - hidden.boxW),
  headerHeightChangedPx: Math.abs(shownState.headerH - hidden.headerH),
};

/* CLS over a scripted scroll, measured by the browser's own LayoutShift API */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 400 });
await s.ev(`window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });`);
await sleep(1800);
for (const y of [200, 600, 1000, 1400, 0, 1400, 0]) { await s.ev(`window.scrollTo(0, ${y})`); await sleep(420); }
R.cumulativeLayoutShift = await s.ev(`+window.__cls.toFixed(5)`);

/* ---------- 3. reload at a restored scroll position ---------- */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 2200 });
await scrollTo(2500);
await s.send('Page.reload', { ignoreCache: false });
await s.once('Page.loadEventFired', 30000);
await sleep(2200);
R.reloadAtScroll = await read();

/* ---------- 4. deep link to an anchor further down ---------- */
await go(s, BASE + '/#contact', { w: 1440, h: 900, theme: 'light', settle: 2600 });
R.deepLinkAnchor = await read();

/* ---------- 5. non-homepage routes ---------- */
R.innerRoutes = {};
for (const p of ['/research/', '/publication/', '/teaching/jul2025_eee303/', '/authors/me/']) {
  await go(s, BASE + p, { w: 1440, h: 900, theme: 'light', settle: 1600 });
  const st = await read();
  R.innerRoutes[p] = { visibility: st.visibility, opacity: st.opacity, shownClass: st.shown, boxW: st.boxW };
}

/* ---------- 6. keyboard: no invisible focus target at the top ---------- */
/* NOTE on the focus reset below: `document.body.focus()` WITHOUT
   `preventScroll: true` scrolls the page back to the top, which silently
   reset scrollY to 0 and made the brand look permanently untabbable. Phase 2A
   hit the same trap with the scroll-spy (see implementation-roadmap.md). */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 2600 });
await s.ev('window.scrollTo(0,0); document.body.setAttribute("tabindex","-1"); document.body.focus({ preventScroll: true }); document.body.removeAttribute("tabindex");');
const topStops = [];
for (let i = 0; i < 5; i++) {
  await tab(s);
  topStops.push(await s.ev(`(() => { const e = document.activeElement; if (!e || e === document.body) return null;
    return (e.className && String(e.className).indexOf('navbar-brand') > -1 ? 'BRAND:' : '') +
      (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\\s+/g,' ').slice(0, 30); })()`));
}
/* Walking FORWARD from the top of the document is not a valid test of the
   shown state. The first Tab lands on the skip link, which sits at the very top
   of the document and is NOT sticky, so the browser scrolls the page back to 0
   to bring it into view — at which point the brand is correctly hidden again,
   and the walk reports a false negative. Walk BACKWARDS from a sticky header
   control instead: the header does not move, so the scroll position holds. */
/* A long walk is not usable here: every focus move inside the header nudges the
   scroll position, and once the page drifts back to 0 the brand is correctly
   hidden again, so the walk reports a false negative. One deterministic step
   instead — focus the link immediately AFTER the brand in DOM order, press
   Shift+Tab once, and check where focus lands. Anything other than the brand
   means the brand is being skipped while visible. */
await scrollTo(1500);
await s.ev(`(() => { var l = document.querySelector('header nav a.nav-link');
  if (l) l.focus({ preventScroll: true }); })()`);
await sleep(200);
const beforeShiftTab = await s.ev(`(() => { const e = document.activeElement;
  return (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\\s+/g,' ').slice(0,26) + ' @y' + Math.round(scrollY); })()`);
await tab(s, true);   // Shift+Tab
const scrolledStops = [beforeShiftTab, await s.ev(`(() => { const e = document.activeElement; if (!e || e === document.body) return null;
  return (e.className && String(e.className).indexOf('navbar-brand') > -1 ? 'BRAND:' : '') +
    (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\\s+/g,' ').slice(0, 30) + ' @y' + Math.round(scrollY); })()`)];
R.keyboard = {
  atTop: topStops, brandTabbableAtTop: topStops.some(x => x && x.startsWith('BRAND:')),
  scrolled: scrolledStops, brandTabbableWhenShown: scrolledStops.some(x => x && x.startsWith('BRAND:')),
};

/* ---------- 7. accessibility tree: is the hidden brand exposed? ---------- */
await s.send('Accessibility.enable').catch(() => {});
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 2400 });
const axAt = async () => {
  const { nodes } = await s.send('Accessibility.getFullAXTree', {}, 60000);
  return nodes.filter(n => !n.ignored && n.name && /SAJID Lab — Home/i.test(n.name.value || '')).length;
};
R.axBrandExposedAtTop = await axAt();
await scrollTo(1500);
R.axBrandExposedWhenShown = await axAt();

/* ---------- 8. reduced motion ---------- */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', reduced: true, settle: 2400 });
R.reducedMotion = { atTop: await read() };
await scrollTo(1500);
R.reducedMotion.scrolled = await read();

/* ---------- 9. mobile menu still works with the brand hidden ---------- */
await go(s, BASE + '/', { w: 390, h: 844, mobile: true, theme: 'light', settle: 2400 });
const beforeOpen = await read();
await s.ev(`document.querySelector('#nav-toggle').click()`);
await sleep(700);
R.mobileMenu = {
  brandHiddenBeforeOpen: beforeOpen.visibility === 'hidden',
  toggleXBefore: beforeOpen.toggleX,
  afterOpen: await s.ev(`(() => { const b = document.querySelector('#nav-toggle');
    const p = document.getElementById(b.getAttribute('aria-controls'));
    return JSON.stringify({ expanded: b.getAttribute('aria-expanded'),
      panelVisible: !!p && p.getBoundingClientRect().height > 0,
      items: p ? p.querySelectorAll('a,button').length : 0,
      toggleX: Math.round(b.getBoundingClientRect().left),
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }); })()`),
};

/* ---------- 10. screenshots ---------- */
for (const [label, w, h, mobile] of [['1440', 1440, 900, false], ['390', 390, 844, true]]) {
  for (const theme of ['light', 'dark']) {
    await go(s, BASE + '/', { w, h, mobile, theme, settle: 2600 });
    await shoot(s, `${SHOTS}/brand-reveal/top-${label}-${theme}.jpg`, { full: false, quality: 82 });
    await scrollTo(1600);
    await shoot(s, `${SHOTS}/brand-reveal/scrolled-${label}-${theme}.jpg`, { full: false, quality: 82 });
  }
}

R.consoleErrors = [...new Set(consoleErrors)];
writeFileSync(OUT, JSON.stringify(R, null, 1));

/* ---------- report ---------- */
const ok = (b) => (b ? 'PASS' : 'FAIL');
console.log('\n=== scroll journey ===');
for (const [vp, j] of Object.entries(R.journey)) {
  console.log(`${vp}: hero mark bottom=${j.markBottom}px, header=${j.headerH}px -> reveal at scrollY ~${j.triggerScrollY}`);
  for (const [k, v] of Object.entries(j.steps)) {
    console.log(`   ${k.padEnd(16)} shown=${String(v.shown).padEnd(5)} visibility=${v.visibility.padEnd(7)} opacity=${v.opacity} boxW=${v.boxW}`);
  }
}
console.log('\n=== layout shift ===');
console.log('  nav link moved: ' + R.layoutShift.navLinkMovedPx + 'px  ' + ok(R.layoutShift.navLinkMovedPx === 0));
console.log('  brand box changed: ' + R.layoutShift.brandBoxChangedPx + 'px  ' + ok(R.layoutShift.brandBoxChangedPx === 0));
console.log('  header height changed: ' + R.layoutShift.headerHeightChangedPx + 'px  ' + ok(R.layoutShift.headerHeightChangedPx === 0));
console.log('  CLS over scripted scroll: ' + R.cumulativeLayoutShift + '  ' + ok(R.cumulativeLayoutShift < 0.001));
console.log('\n=== state restoration ===');
console.log('  reload at scrollY 2500 -> shown=' + R.reloadAtScroll.shown + ' (scrollY ' + R.reloadAtScroll.scrollY + ')  ' + ok(R.reloadAtScroll.shown));
console.log('  deep link /#contact    -> shown=' + R.deepLinkAnchor.shown + ' (scrollY ' + R.deepLinkAnchor.scrollY + ')  ' + ok(R.deepLinkAnchor.shown));
console.log('\n=== non-homepage routes ===');
for (const [p, v] of Object.entries(R.innerRoutes)) console.log(`  ${p.padEnd(30)} visibility=${v.visibility} opacity=${v.opacity} boxW=${v.boxW}  ` + ok(v.visibility === 'visible' && v.opacity === 1));
console.log('\n=== keyboard / a11y ===');
console.log('  brand tabbable at top:      ' + R.keyboard.brandTabbableAtTop + '  ' + ok(!R.keyboard.brandTabbableAtTop));
console.log('    order: ' + R.keyboard.atTop.join(' | '));
console.log('  brand tabbable when shown:  ' + R.keyboard.brandTabbableWhenShown + '  ' + ok(R.keyboard.brandTabbableWhenShown));
console.log('    order: ' + R.keyboard.scrolled.join(' | '));
console.log('  in a11y tree at top: ' + R.axBrandExposedAtTop + '  ' + ok(R.axBrandExposedAtTop === 0));
console.log('  in a11y tree shown:  ' + R.axBrandExposedWhenShown + '  ' + ok(R.axBrandExposedWhenShown > 0));
console.log('\n=== reduced motion ===');
console.log('  at top:   shown=' + R.reducedMotion.atTop.shown + ' visibility=' + R.reducedMotion.atTop.visibility + ' transitionDuration=' + R.reducedMotion.atTop.transition + ' transform=' + R.reducedMotion.atTop.transform);
console.log('  scrolled: shown=' + R.reducedMotion.scrolled.shown + ' visibility=' + R.reducedMotion.scrolled.visibility + ' transitionDuration=' + R.reducedMotion.scrolled.transition);
console.log('\n=== mobile menu ===');
console.log('  brand hidden before open: ' + R.mobileMenu.brandHiddenBeforeOpen + '  toggleX=' + R.mobileMenu.toggleXBefore);
console.log('  after open: ' + R.mobileMenu.afterOpen);
console.log('\nconsole errors: ' + (R.consoleErrors.length ? R.consoleErrors.join(' | ') : '(none)'));
try { s.ws.close(); } catch {}
proc.kill(); process.exit(0);
