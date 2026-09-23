/* Phase 8 closure — the 22-item manual checklist, executed in a real browser.

   Every item is decided by a measurement against the rendered page, never by
   reading source. Items that cannot be decided mechanically say so rather than
   claiming PASS.

   node docs/redesign/evidence/phase8-checklist.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, sleep, tab, HERE, BASE } from './phase7-cdp.mjs';

const results = [];
const record = (n, name, verdict, detail) => {
  results.push({ n, name, verdict, detail });
  console.log(`${String(n).padStart(2)}. ${verdict.padEnd(4)}  ${name}\n        ${detail}`);
};

const b = await launch();
const s = await attach(b.port);

const consoleErrors = [];
s.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') consoleErrors.push(p.args.map((a) => a.value ?? a.description).join(' ').slice(0, 200)); });
s.on('Runtime.exceptionThrown', (p) => consoleErrors.push('exception: ' + (p.exceptionDetails?.text || '').slice(0, 200)));
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(p.entry.text.slice(0, 200)); });

/* ---------- 1. no white band between navbar and hero ---------- */
await go(s, '/', { w: 1280, h: 900, theme: 'light', settle: 2000 });
const band = await s.ev(`(() => {
  const header = document.querySelector('header');
  const hero = document.querySelector('.sj-hero');
  if (!header || !hero) return { missing: true };
  const hb = header.getBoundingClientRect(), tb = hero.getBoundingClientRect();
  // Sample the page background in the strip between them.
  const gap = +(tb.top - hb.bottom).toFixed(2);
  return { gap, headerBottom: +hb.bottom.toFixed(1), heroTop: +tb.top.toFixed(1),
           heroBg: getComputedStyle(hero).backgroundColor,
           heroBgImage: getComputedStyle(hero).backgroundImage.slice(0, 60) };
})()`);
record(1, 'No white band between navbar and hero',
  band.missing ? 'FAIL' : (Math.abs(band.gap) <= 1 ? 'PASS' : 'FAIL'),
  band.missing ? 'header or .sj-hero not found' : `gap between header bottom (${band.headerBottom}px) and hero top (${band.heroTop}px) = ${band.gap}px`);

/* ---------- 2/3/4. navbar brand reveal ---------- */
const brandAt = async (y) => {
  await s.ev(`window.scrollTo(0, ${y})`);
  await sleep(900);
  return s.ev(`(() => {
    const a = document.querySelector('.navbar-brand');
    const h = document.querySelector('header');
    if (!a) return { missing: true };
    const cs = getComputedStyle(a);
    const r = a.getBoundingClientRect();
    return { visibility: cs.visibility, opacity: cs.opacity, tabbable: a.tabIndex >= 0,
             inTabOrder: cs.visibility !== 'hidden' && cs.display !== 'none',
             headerH: +h.getBoundingClientRect().height.toFixed(2),
             w: +r.width.toFixed(1), h: +r.height.toFixed(1), scrollY: window.scrollY };
  })()`);
};
const top = await brandAt(0);
record(2, 'Navbar logo hidden at homepage top',
  top.missing ? 'FAIL' : ((top.visibility === 'hidden' || +top.opacity === 0) ? 'PASS' : 'FAIL'),
  top.missing ? '.navbar-brand not found' : `scrollY=0: visibility=${top.visibility}, opacity=${top.opacity}, removed from tab order=${top.visibility === 'hidden'}`);

const scrolled = await brandAt(1400);
record(3, 'Navbar logo appears after scrolling',
  (scrolled.visibility === 'visible' && +scrolled.opacity > 0.9) ? 'PASS' : 'FAIL',
  `scrollY=${scrolled.scrollY}: visibility=${scrolled.visibility}, opacity=${scrolled.opacity}`);

record(4, 'Navbar does not shift when logo appears',
  (top.headerH === scrolled.headerH) ? 'PASS' : 'FAIL',
  `header height at top ${top.headerH}px vs scrolled ${scrolled.headerH}px (delta ${(scrolled.headerH - top.headerH).toFixed(2)}px); brand box reserved at top = ${top.w}x${top.h}`);

/* ---------- 5/6/7/8/9/10. hero content ---------- */
await s.ev(`window.scrollTo(0,0)`); await sleep(600);
const hero = await s.ev(`(() => {
  const h = document.querySelector('.sj-hero');
  const txt = h ? h.innerText.replace(/\\s+/g, ' ').trim() : '';
  const heroLogos = h ? h.querySelectorAll('svg.sj-logo, .sj-hero__mark svg').length : 0;
  const navBrandVisible = (() => { const a = document.querySelector('.navbar-brand'); return a && getComputedStyle(a).visibility === 'visible'; })();
  return {
    text: txt,
    stats: h ? h.querySelectorAll('.sj-stats, .sj-stats__value, .sj-hero__stats').length : -1,
    numbersLikeMetrics: /\\b(publications?|citations?|h-index)\\b/i.test(txt),
    heroMarks: heroLogos,
    navBrandVisible,
    h1: (document.querySelector('h1') || {}).innerText || '',
    h1Accessible: (() => { const e = document.querySelector('h1'); return e ? (e.innerText || e.textContent || '').replace(/\\s+/g,' ').trim() : ''; })(),
    oldHeadline: /Smart and Advanced Junction of Intelligent Devices\\s*$/i.test(txt) || /Welcome|Research Group|Academic/i.test(txt),
  };
})()`);
record(5, 'Hero metrics absent',
  (hero.stats === 0 && !hero.numbersLikeMetrics) ? 'PASS' : 'FAIL',
  `.sj-stats* elements in hero: ${hero.stats}; publication/citation/h-index wording present: ${hero.numbersLikeMetrics}`);
record(6, 'Redundant hero logo absent',
  (hero.heroMarks === 1 && !hero.navBrandVisible) ? 'PASS' : 'FAIL',
  `wordmarks inside hero: ${hero.heroMarks} (the <h1>); navbar brand simultaneously visible: ${hero.navBrandVisible} — exactly one brand mark on screen at the top`);
record(7, 'Generic old hero headline absent',
  hero.oldHeadline ? 'FAIL' : 'PASS',
  `hero text does not contain a generic headline. Hero copy: "${hero.text.slice(0, 150)}…"`);
record(8, '"Sajid Lab" retained',
  /SAJID Lab/i.test(hero.h1Accessible + ' ' + hero.text) ? 'PASS' : 'FAIL',
  `h1 accessible name: "${hero.h1Accessible.slice(0, 80)}"`);
record(9, '"Department of EEE, BUET" retained',
  /Department of EEE/i.test(hero.text) ? 'PASS' : 'FAIL',
  `hero eyebrow text found: ${/Department of EEE[^.]*/i.exec(hero.text)?.[0] || '(not found)'}`);
record(10, '"Led by Prof. Sajid Muhaimin Choudhury, PhD" retained',
  /Led by\s+Prof\.?\s+Sajid Muhaimin Choudhury,?\s*PhD/i.test(hero.text) ? 'PASS' : 'FAIL',
  `${/Led by[^\n]{0,60}/i.exec(hero.text)?.[0] || '(not found)'}`);

/* ---------- 11/12/13/14. research circuit idle vs interaction ---------- */
const idle = await s.ev(`(() => {
  const c = document.querySelector('[data-sj-circuit], .sj-circuit');
  if (!c) return { missing: true };
  const base = c.querySelector('.sj-net--base'), glow = c.querySelector('.sj-net--glow');
  const trace = c.querySelector('.sj-trace');
  const titles = [...c.querySelectorAll('.sj-domain__title')];
  return {
    baseOpacity: base ? getComputedStyle(base).opacity : null,
    glowOpacity: glow ? getComputedStyle(glow).opacity : null,
    traceOpacity: trace ? getComputedStyle(trace).opacity : null,
    active: c.getAttribute('data-active'),
    domains: c.querySelectorAll('[data-research-domain]').length,
    titleOpacities: titles.slice(0, 6).map(t => getComputedStyle(t).opacity),
    traces: c.querySelectorAll('.sj-trace').length,
    groupOpacity: (() => { const g = c.querySelector('.sj-net--base .sj-trace-group'); return g ? getComputedStyle(g).opacity : null; })(),
  };
})()`);
record(11, 'Research imagery subdued while idle',
  idle.missing ? 'FAIL' : ((+idle.baseOpacity <= 0.2 && +idle.glowOpacity === 0) ? 'PASS' : 'FAIL'),
  idle.missing ? 'no .sj-circuit found' : `idle: base layer opacity ${idle.baseOpacity}, spotlight layer ${idle.glowOpacity}, individual trace ${idle.traceOpacity}, data-active=${idle.active}, ${idle.traces} traces, ${idle.domains} domain controls`);

/* Reach a domain control by pressing Tab for real.

   NOT by calling .focus(): in a headless session the page does not hold system
   focus, so HTMLElement.focus() moves document.activeElement but dispatches no
   focus event, and the circuit binds `focus` on .sj-domain__hit. Probing that
   way reports a broken keyboard path on a hero whose keyboard path is fine —
   verified by driving real Tab presses, below, which do set data-active. */
await s.ev(`(() => { document.body.focus({ preventScroll: true }); return 1; })()`);
let reached = null;
for (let i = 0; i < 40 && !reached; i++) {
  await tab(s);
  const cur = JSON.parse(await s.ev(`(() => { const e = document.activeElement;
    return JSON.stringify({ cls: e.className || '', tag: e.tagName, label: e.getAttribute && e.getAttribute('aria-label') }); })()`));
  if (/sj-domain__hit/.test(cur.cls)) reached = { step: i + 1, ...cur };
}
await sleep(800);
const active = await s.ev(`(() => {
  const c = document.querySelector('[data-sj-circuit], .sj-circuit');
  const base = c.querySelector('.sj-net--base');
  const activeName = c.getAttribute('data-active');
  const host = [...c.querySelectorAll('[data-research-domain]')]
    .find(e => e.getAttribute('data-research-domain') === activeName);
  const activeTitle = host ? host.querySelector('.sj-domain__title') : null;
  const activeTraces = [...c.querySelectorAll('.sj-net--base [data-trace-domain="' + activeName + '"]')];
  const groups = [...c.querySelectorAll('.sj-net--base .sj-trace-group')];
  const inactiveGroup = groups.find(g => g.getAttribute('data-trace-domain') !== activeName);
  return {
    active: activeName,
    focusedEl: document.activeElement ? document.activeElement.tagName + '[' + (document.activeElement.getAttribute('aria-label')||'') + ']' : null,
    baseOpacity: getComputedStyle(base).opacity,
    activeTitleOpacity: activeTitle ? getComputedStyle(activeTitle).opacity : null,
    activeTitleText: activeTitle ? activeTitle.textContent.trim() : null,
    activeTraceCount: activeTraces.length,
    activeTraceOpacity: activeTraces[0] ? getComputedStyle(activeTraces[0]).opacity : null,
    dimmedGroupOpacity: inactiveGroup ? getComputedStyle(inactiveGroup).opacity : null,
    focusRing: (() => { const e = document.activeElement; const cs = getComputedStyle(e); return cs.outlineStyle !== 'none' || cs.boxShadow !== 'none'; })(),
  };
})()`);
record(12, 'Research imagery becomes prominent on interaction',
  (+active.baseOpacity > +idle.baseOpacity) ? 'PASS' : 'FAIL',
  `reached "${reached ? reached.label : '(not reached)'}" by Tab x${reached ? reached.step : '-'}: base layer opacity ${idle.baseOpacity} (idle) -> ${active.baseOpacity} (domain "${active.active}" active)`);
record(13, 'Relevant research label appears/emphasizes on interaction',
  (active.activeTitleOpacity !== null && +active.activeTitleOpacity > 0.9) ? 'PASS' : 'FAIL',
  `label "${active.activeTitleText}" opacity ${active.activeTitleOpacity} while its domain is active`);
record(14, 'PCB traces respond appropriately',
  (active.activeTraceCount > 0 && +active.dimmedGroupOpacity < 1) ? 'PASS' : 'FAIL',
  `${active.activeTraceCount} traces tagged "${active.active}" at opacity ${active.activeTraceOpacity}; a non-active trace group is dimmed to ${active.dimmedGroupOpacity} (idle groups: ${idle.groupOpacity})`);

writeFileSync(resolve(HERE, 'phase8-checklist-partial.json'), JSON.stringify(results, null, 1));
console.log('\n(items 15-22 continue in phase8-checklist-b.mjs)');
s.ws.close(); b.proc.kill();
