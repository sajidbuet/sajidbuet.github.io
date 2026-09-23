/* Phase 8 — interactive research-circuit hero QA.

   Verifies idle restraint, the six-domain interaction on hover / focus / tap,
   per-domain trace highlighting, the pointer spotlight, finite pulses, the
   viewport gate, reduced motion, click safety and keyboard access.

   node docs/redesign/evidence/phase8-circuit-qa.mjs [base]
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, sleep, tab, HERE, BASE as DEFAULT_BASE } from './phase7-cdp.mjs';

const BASE = process.argv[2] || DEFAULT_BASE;
const OUT = resolve(HERE, 'phase8-circuit-qa.json');
const R = { meta: { base: BASE, at: new Date().toISOString() } };

const IDLE = `(() => {
  const c = document.querySelector('.sj-circuit');
  if (!c) return JSON.stringify({ missing: true });
  const de = document.documentElement;
  const vis = e => getComputedStyle(e).display !== 'none';
  const doms = Array.from(document.querySelectorAll('[data-research-domain]'));
  const shown = doms.filter(vis);
  const icon = shown[0] && shown[0].querySelector('.sj-domain__icon');
  const title = shown[0] && shown[0].querySelector('.sj-domain__title');
  const desc = shown[0] && shown[0].querySelector('.sj-domain__desc');
  return JSON.stringify({
    heroH: Math.round(document.querySelector('.sj-hero').getBoundingClientRect().height),
    domainsInDom: doms.length,
    domainsVisible: shown.map(e => e.getAttribute('data-research-domain')),
    traces: c.querySelectorAll('.sj-trace').length,
    pulsePaths: c.querySelectorAll('[data-pulse]').length,
    netOpacity: +getComputedStyle(c.querySelector('.sj-net--base')).opacity,
    iconOpacity: icon ? +getComputedStyle(icon).opacity : null,
    titleOpacity: title ? +getComputedStyle(title).opacity : null,
    descVisibility: desc ? getComputedStyle(desc).visibility : null,
    quietZoneMask: (() => { const s = getComputedStyle(c.querySelector('.sj-circuit__svg'));
      return !!(s.maskImage && s.maskImage !== 'none'); })(),
    svgPointerEvents: getComputedStyle(c.querySelector('.sj-circuit__svg')).pointerEvents,
    containerPointerEvents: getComputedStyle(c).pointerEvents,
    buttonPointerEvents: (() => { const b = c.querySelector('.sj-domain__hit');
      return b ? getComputedStyle(b).pointerEvents : null; })(),
    activeAttr: c.getAttribute('data-active'),
    docOverflow: de.scrollWidth - de.clientWidth,
    h1: document.querySelectorAll('h1').length,
    h1Text: (document.querySelector('h1') || {}).textContent ? document.querySelector('h1').textContent.trim().slice(0, 60) : null,
    infiniteAnimations: document.getAnimations().filter(a => { try { return a.effect.getTiming().iterations === Infinity; } catch (e) { return false; } }).length,
    usesInfiniteCss: Array.from(c.querySelectorAll('*')).some(e => getComputedStyle(e).animationIterationCount === 'infinite'),
  });
})()`;

const domainState = (id) => `(() => {
  const el = document.querySelector('[data-research-domain="${id}"]');
  const c = document.querySelector('.sj-circuit');
  const icon = el.querySelector('.sj-domain__icon');
  const title = el.querySelector('.sj-domain__title');
  const desc = el.querySelector('.sj-domain__desc');
  const btn = el.querySelector('.sj-domain__hit');
  const own = c.querySelector('.sj-net--base [data-trace-domain="${id}"] .sj-trace');
  const other = c.querySelector('.sj-net--base [data-trace-domain="ambient"] .sj-trace');
  return JSON.stringify({
    isActive: el.classList.contains('is-active'),
    ariaExpanded: btn.getAttribute('aria-expanded'),
    activeAttr: c.getAttribute('data-active'),
    iconOpacity: +getComputedStyle(icon).opacity,
    iconTransform: getComputedStyle(icon).transform,
    titleOpacity: +getComputedStyle(title).opacity,
    descVisibility: getComputedStyle(desc).visibility,
    descOpacity: +getComputedStyle(desc).opacity,
    ownTraceStroke: getComputedStyle(own).stroke,
    ownTraceWidth: getComputedStyle(own).strokeWidth,
    otherGroupOpacity: +getComputedStyle(other.parentElement).opacity,
    netOpacity: +getComputedStyle(c.querySelector('.sj-net--base')).opacity,
    pulsing: c.querySelectorAll('.is-pulsing').length,
  });
})()`;

const { proc, port } = await launch();
const s = await attach(port);
const consoleErrors = [];
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(p.entry.text.slice(0, 140)); });

/* ---------- 1. idle restraint across viewports and themes ---------- */
R.idle = {};
for (const [label, w, h, mobile] of [['1920', 1920, 1080, false], ['1536', 1536, 864, false],
  ['1440', 1440, 900, false], ['1366', 1366, 768, false], ['1024', 1024, 768, false],
  ['390', 390, 844, true], ['360', 360, 800, true]]) {
  for (const theme of ['light', 'dark']) {
    await go(s, BASE + '/', { w, h, mobile, theme, settle: 2800 });
    R.idle[`${label}|${theme}`] = JSON.parse(await s.ev(IDLE));
  }
}

/* ---------- 2. hover on every domain ---------- */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 3000 });
R.hover = {};
const centreOf = async (id) => JSON.parse(await s.ev(`(() => {
  const b = document.querySelector('[data-research-domain="${id}"] .sj-domain__hit').getBoundingClientRect();
  return JSON.stringify({ x: Math.round(b.left + b.width / 2), y: Math.round(b.top + b.height / 2) }); })()`));

for (const id of ['photonics', 'quantum', 'embedded', 'antennas', 'computing', 'energy']) {
  const c = await centreOf(id);
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x, y: c.y, button: 'none', buttons: 0, pointerType: 'mouse' });
  await sleep(700);
  R.hover[id] = JSON.parse(await s.ev(domainState(id)));
  // move away, into the hero but off any domain
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 720, y: 120, button: 'none', buttons: 0, pointerType: 'mouse' });
  await sleep(600);
  R.hover[id].afterLeave = JSON.parse(await s.ev(domainState(id)));
}

/* ---------- 3. only one domain dominant at a time ---------- */
{
  const c = await centreOf('photonics');
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x, y: c.y, button: 'none', buttons: 0, pointerType: 'mouse' });
  await sleep(600);
  R.exclusivity = JSON.parse(await s.ev(`(() => {
    const act = Array.from(document.querySelectorAll('[data-research-domain].is-active')).map(e => e.getAttribute('data-research-domain'));
    const c = document.querySelector('.sj-circuit');
    const own = +getComputedStyle(c.querySelector('.sj-net--base [data-trace-domain="photonics"]')).opacity;
    const off = +getComputedStyle(c.querySelector('.sj-net--base [data-trace-domain="energy"]')).opacity;
    return JSON.stringify({ activeDomains: act, ownGroupOpacity: own, otherGroupOpacity: off,
      heroTextOpacity: +getComputedStyle(document.querySelector('.sj-hero__lede')).opacity }); })()`));
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 720, y: 120, button: 'none', buttons: 0, pointerType: 'mouse' });
  await sleep(500);
}

/* ---------- 4. pointer spotlight ---------- */
await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 300, y: 300, button: 'none', buttons: 0, pointerType: 'mouse' });
await sleep(200);
await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 320, y: 340, button: 'none', buttons: 0, pointerType: 'mouse' });
await sleep(500);
R.spotlight = JSON.parse(await s.ev(`(() => { const c = document.querySelector('.sj-circuit');
  const g = c.querySelector('.sj-net--glow');
  return JSON.stringify({ isPointer: c.classList.contains('is-pointer'),
    spotX: c.style.getPropertyValue('--sj-spot-x'), spotY: c.style.getPropertyValue('--sj-spot-y'),
    glowOpacity: +getComputedStyle(g).opacity,
    glowMasked: (() => { const s = getComputedStyle(g); return !!(s.maskImage && s.maskImage !== 'none'); })() }); })()`));
await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 720, y: -40, button: 'none', buttons: 0, pointerType: 'mouse' });
await sleep(500);
R.spotlightAfterLeave = JSON.parse(await s.ev(`(() => { const c = document.querySelector('.sj-circuit');
  return JSON.stringify({ isPointer: c.classList.contains('is-pointer'),
    glowOpacity: +getComputedStyle(c.querySelector('.sj-net--glow')).opacity }); })()`));

/* ---------- 5. idle pulses fire, and are finite ---------- */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 1200 });
await s.ev(`window.__pulseSeen = 0;
  new MutationObserver(ms => { for (const m of ms) {
    if (m.target.classList && m.target.classList.contains('is-pulsing')) window.__pulseSeen++; } })
  .observe(document.querySelector('.sj-circuit'), { subtree: true, attributes: true, attributeFilter: ['class'] });`);
await sleep(12000);
R.pulses = JSON.parse(await s.ev(`JSON.stringify({
  pulsesObserved: window.__pulseSeen,
  currentlyPulsing: document.querySelectorAll('.is-pulsing').length,
  infiniteAnimations: document.getAnimations().filter(a => { try { return a.effect.getTiming().iterations === Infinity; } catch(e){ return false; } }).length })`));

/* ---------- 6. work stops when the hero is offscreen ---------- */
await s.ev('window.scrollTo(0, 3000)');
await sleep(1500);
await s.ev('window.__pulseSeen = 0;');
await sleep(9000);
R.offscreen = JSON.parse(await s.ev(`JSON.stringify({
  pulsesWhileOffscreen: window.__pulseSeen,
  isPointer: document.querySelector('.sj-circuit').classList.contains('is-pointer'),
  runningAnimations: document.getAnimations().length })`));
await s.ev('window.scrollTo(0, 0)');
await sleep(1200);

/* ---------- 7. click safety: CTAs must not be blocked ---------- */
R.clickSafety = JSON.parse(await s.ev(`(() => {
  const btn = document.querySelector('.sj-btn--primary');
  const r = btn.getBoundingClientRect();
  const hitCentre = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  const sec = document.querySelector('.sj-btn--secondary').getBoundingClientRect();
  const hitSec = document.elementFromPoint(sec.left + sec.width / 2, sec.top + sec.height / 2);
  const heroMid = document.elementFromPoint(720, 300);
  return JSON.stringify({
    primaryTopElement: hitCentre ? hitCentre.tagName + '.' + String(hitCentre.className).split(' ')[0] : null,
    primaryReachable: !!(hitCentre && hitCentre.closest('.sj-btn--primary')),
    secondaryReachable: !!(hitSec && hitSec.closest('.sj-btn--secondary')),
    elementOverHeroText: heroMid ? heroMid.tagName + '.' + String(heroMid.className).split(' ')[0] : null,
    circuitInterceptsText: !!(heroMid && heroMid.closest('.sj-circuit')) }); })()`));

/* ---------- 8. keyboard ---------- */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 2800 });
await s.ev('window.scrollTo(0,0); document.body.setAttribute("tabindex","-1"); document.body.focus({ preventScroll: true }); document.body.removeAttribute("tabindex");');
const stops = [];
for (let i = 0; i < 22; i++) {
  await tab(s);
  stops.push(await s.ev(`(() => { const e = document.activeElement; if (!e || e === document.body) return null;
    const d = e.closest && e.closest('[data-research-domain]');
    const cs = getComputedStyle(e);
    return JSON.stringify({ name: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\\s+/g,' ').slice(0, 30),
      domain: d ? d.getAttribute('data-research-domain') : null,
      expanded: e.getAttribute('aria-expanded'),
      descVisible: d ? getComputedStyle(d.querySelector('.sj-domain__desc')).visibility : null,
      ring: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none') }); })()`));
}
const parsed = stops.filter(Boolean).map(x => JSON.parse(x));
R.keyboard = {
  stops: parsed.length,
  domainStops: parsed.filter(x => x.domain).map(x => x.domain),
  domainStopsWithRing: parsed.filter(x => x.domain && x.ring).length,
  domainStopsRevealingDesc: parsed.filter(x => x.domain && x.descVisible === 'visible').length,
  anyStopWithoutRing: parsed.filter(x => !x.ring).map(x => x.name),
  order: parsed.map(x => x.name),
};

/* ---------- 9. touch: tap to activate, tap away to reset ---------- */
await go(s, BASE + '/', { w: 390, h: 844, mobile: true, theme: 'light', settle: 2800 });
/* `Input.synthesizeTapGesture`, not a hand-rolled touchStart/touchEnd pair:
   the raw pair does not produce the follow-up `click` the component listens
   for, so a working tap interaction reported as broken. */
const tapAt = async (x, y) => {
  await s.send('Input.synthesizeTapGesture', { x, y, duration: 80, tapCount: 1, gestureSourceType: 'touch' }, 20000)
    .catch(async () => {
      await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
      await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    });
  await sleep(700);
};
{
  const box = JSON.parse(await s.ev(`(() => { const e = document.querySelector('[data-research-domain="photonics"] .sj-domain__hit');
    const r = e.getBoundingClientRect(); return JSON.stringify({ x: Math.round(r.left + r.width/2), y: Math.round(r.top + r.height/2) }); })()`));
  await tapAt(box.x, box.y);
  R.touchAfterTap = JSON.parse(await s.ev(domainState('photonics')));
  await tapAt(195, 700);
  R.touchAfterTapAway = JSON.parse(await s.ev(domainState('photonics')));
}

/* ---------- 10. reduced motion ---------- */
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', reduced: true, settle: 2600 });
R.reducedMotionIdle = JSON.parse(await s.ev(IDLE));
{
  const c = await centreOf('computing');
  await s.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c.x, y: c.y, button: 'none', buttons: 0, pointerType: 'mouse' });
  await sleep(700);
  R.reducedMotionHover = JSON.parse(await s.ev(domainState('computing')));
  R.reducedMotionGlow = await s.ev(`getComputedStyle(document.querySelector('.sj-net--glow')).display`);
}
await sleep(6000);
R.reducedMotionPulses = JSON.parse(await s.ev(`JSON.stringify({
  currentlyPulsing: document.querySelectorAll('.is-pulsing').length,
  runningAnimations: document.getAnimations().length })`));

R.consoleErrors = [...new Set(consoleErrors)];
writeFileSync(OUT, JSON.stringify(R, null, 1));

/* ---------- report ---------- */
const ok = (b) => (b ? 'PASS' : 'FAIL');
console.log('\n=== idle ===');
for (const [k, v] of Object.entries(R.idle)) {
  console.log(`  ${k.padEnd(12)} hero=${String(v.heroH).padEnd(4)} domains=${v.domainsVisible.length} [${v.domainsVisible.join(',')}] ` +
    `net=${v.netOpacity} icon=${v.iconOpacity} title=${v.titleOpacity} desc=${v.descVisibility} ovf=${v.docOverflow} h1=${v.h1} inf=${v.infiniteAnimations}`);
}
const i0 = R.idle['1440|light'];
console.log(`  traces=${i0.traces} pulsePaths=${i0.pulsePaths} quietZoneMask=${i0.quietZoneMask} cssInfinite=${i0.usesInfiniteCss}`);
console.log(`  pointer-events: container=${i0.containerPointerEvents} svg=${i0.svgPointerEvents} button=${i0.buttonPointerEvents}`);
console.log('\n=== hover ===');
for (const [id, v] of Object.entries(R.hover)) {
  console.log(`  ${id.padEnd(11)} active=${String(v.isActive).padEnd(5)} aria=${v.ariaExpanded} icon=${v.iconOpacity} title=${v.titleOpacity} ` +
    `desc=${v.descVisibility}/${v.descOpacity} ownStroke=${v.ownTraceStroke} net=${v.netOpacity} | afterLeave active=${v.afterLeave.isActive} desc=${v.afterLeave.descVisibility}`);
}
console.log('\n=== exclusivity ===\n  ' + JSON.stringify(R.exclusivity));
console.log('\n=== spotlight ===\n  ' + JSON.stringify(R.spotlight) + '\n  afterLeave ' + JSON.stringify(R.spotlightAfterLeave));
console.log('\n=== pulses ===\n  ' + JSON.stringify(R.pulses) + '\n  offscreen ' + JSON.stringify(R.offscreen));
console.log('\n=== click safety ===\n  ' + JSON.stringify(R.clickSafety));
console.log('\n=== keyboard ===');
console.log('  stops=' + R.keyboard.stops + ' domainStops=' + R.keyboard.domainStops.length + ' [' + R.keyboard.domainStops.join(',') + ']');
console.log('  domain stops with focus ring: ' + R.keyboard.domainStopsWithRing + '/' + R.keyboard.domainStops.length + '  ' + ok(R.keyboard.domainStopsWithRing === R.keyboard.domainStops.length));
console.log('  domain stops revealing description: ' + R.keyboard.domainStopsRevealingDesc + '  ' + ok(R.keyboard.domainStopsRevealingDesc > 0));
console.log('  stops without a ring: ' + (R.keyboard.anyStopWithoutRing.join(', ') || '(none)'));
console.log('\n=== touch ===\n  after tap: ' + JSON.stringify(R.touchAfterTap).slice(0, 220) + '\n  after tap away: active=' + R.touchAfterTapAway.isActive + ' desc=' + R.touchAfterTapAway.descVisibility);
console.log('\n=== reduced motion ===');
console.log('  idle inf=' + R.reducedMotionIdle.infiniteAnimations + ' cssInfinite=' + R.reducedMotionIdle.usesInfiniteCss);
console.log('  hover still reveals: active=' + R.reducedMotionHover.isActive + ' desc=' + R.reducedMotionHover.descVisibility + ' iconTransform=' + R.reducedMotionHover.iconTransform);
console.log('  glow layer display=' + R.reducedMotionGlow + '  ' + ok(R.reducedMotionGlow === 'none'));
console.log('  pulses after 6s: ' + JSON.stringify(R.reducedMotionPulses));
console.log('\nconsole errors: ' + (R.consoleErrors.length ? R.consoleErrors.join(' | ') : '(none)'));
try { s.ws.close(); } catch {}
proc.kill(); process.exit(0);
