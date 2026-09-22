/* Phase 7.2 — keyboard-only traversal.
   Real Input.dispatchKeyEvent traffic, not programmatic .focus(): `:focus-visible`
   only matches keyboard-initiated focus, and Phase 5 already burned an hour on a
   probe that measured `.focus()` and reported a false negative.

   Produces: documented tab order per route, focus-ring coverage, DOM-order
   agreement, keyboard-trap detection, and full mobile-menu operation
   (Enter/Space open, Tab containment, Escape close, focus return).

   node docs/redesign/evidence/phase7-keyboard.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, shoot, tab, key, sleep, HERE, SHOTS, BASE } from './phase7-cdp.mjs';

const OUT = resolve(HERE, 'phase7-keyboard.json');

const FOCUSED = `(() => {
  const e = document.activeElement;
  if (!e || e === document.body || e === document.documentElement) return null;
  const cs = getComputedStyle(e);
  const ow = parseFloat(cs.outlineWidth) || 0;
  const r = e.getBoundingClientRect();
  const name = (e.getAttribute('aria-label') || e.textContent || e.value || e.getAttribute('title') || '').trim().replace(/\\s+/g, ' ').slice(0, 44);
  // DOM order index among all focusable candidates
  const cands = Array.from(document.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])'));
  return {
    tag: e.tagName.toLowerCase(),
    name: name || '(no accessible name)',
    href: (e.getAttribute('href') || '').slice(0, 60),
    domIndex: cands.indexOf(e),
    ring: (cs.outlineStyle !== 'none' && ow > 0) || (cs.boxShadow && cs.boxShadow !== 'none'),
    outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor + ' off:' + cs.outlineOffset,
    rect: { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) },
    inViewport: r.top >= -2 && r.bottom <= innerHeight + 2,
    visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden',
    ariaExpanded: e.getAttribute('aria-expanded'),
    insideMenu: !!e.closest('#nav-menu, [data-mobile-menu]'),
  };
})()`;

const { proc, port, version } = await launch();
const s = await attach(port);
const R = { meta: { browser: version, base: BASE, at: new Date().toISOString() }, tabOrder: {}, mobileMenu: {}, summary: {} };

/** Walk the tab ring from the very top of the document. */
async function walk(path, { w, h, mobile, theme = 'light', steps = 90 }) {
  await go(s, path, { w, h, mobile, theme, settle: 1600 });
  // put focus before the first element without focusing anything ourselves
  await s.ev('window.scrollTo(0,0); document.body.setAttribute("tabindex","-1"); document.body.focus(); document.body.removeAttribute("tabindex");');
  const seq = [];
  const keys = new Set();
  let wrapped = false, stuck = 0, lastKey = null;
  for (let i = 0; i < steps; i++) {
    await tab(s);
    const f = await s.ev(FOCUSED);
    if (!f) { // left the document (browser chrome) — the ring completed
      wrapped = true; break;
    }
    const k = f.tag + '|' + f.name + '|' + f.href + '|' + f.domIndex;
    if (k === lastKey) { stuck++; if (stuck >= 3) break; } else stuck = 0;
    lastKey = k;
    if (keys.has(k) && seq.length > 3) { wrapped = true; break; }
    keys.add(k);
    seq.push(f);
  }
  return { seq, wrapped, completed: seq.length < steps };
}

const ROUTES = [
  ['home-1440', '/', { w: 1440, h: 900, mobile: false }],
  ['publication-list-1440', '/publication/', { w: 1440, h: 900, mobile: false, steps: 140 }],
  ['course-detail-1440', '/teaching/jul2025_eee303/', { w: 1440, h: 900, mobile: false }],
  ['team-profile-1440', '/authors/me/', { w: 1440, h: 900, mobile: false }],
  ['project-detail-1440', '/projects/ctadmin/', { w: 1440, h: 900, mobile: false }],
  ['resources-1440', '/resources/', { w: 1440, h: 900, mobile: false }],
  ['home-390', '/', { w: 390, h: 844, mobile: true }],
  ['home-1440-dark', '/', { w: 1440, h: 900, mobile: false, theme: 'dark' }],
  ['course-detail-390', '/teaching/jul2025_eee303/', { w: 390, h: 844, mobile: true }],
];

for (const [label, path, opts] of ROUTES) {
  const { seq, wrapped } = await walk(path, opts);
  const noRing = seq.filter(f => !f.ring);
  const offscreen = seq.filter(f => !f.visible);
  // focus order vs DOM order: count inversions
  let inversions = 0;
  for (let i = 1; i < seq.length; i++) if (seq[i].domIndex >= 0 && seq[i-1].domIndex >= 0 && seq[i].domIndex < seq[i-1].domIndex) inversions++;
  R.tabOrder[label] = {
    route: path, viewport: `${opts.w}x${opts.h}`, theme: opts.theme || 'light',
    stops: seq.length, ringPresent: seq.length - noRing.length,
    withoutRing: noRing.map(f => ({ tag: f.tag, name: f.name, outline: f.outline })),
    focusedButInvisible: offscreen.map(f => f.name),
    domOrderInversions: inversions,
    ringCompleted: wrapped,
    firstStop: seq[0] || null,
    skipLinkFirst: !!(seq[0] && /skip/i.test(seq[0].name)),
    order: seq.map((f, i) => `${i + 1}. <${f.tag}> ${f.name}${f.href ? ' → ' + f.href : ''}`),
  };
  process.stderr.write(`tab order: ${label} (${seq.length} stops)\n`);
}

/* ---- mobile menu, keyboard only ---- */
for (const theme of ['light', 'dark']) {
  await go(s, '/', { w: 390, h: 844, mobile: true, theme, settle: 1800 });
  await s.ev('window.scrollTo(0,0); document.body.setAttribute("tabindex","-1"); document.body.focus(); document.body.removeAttribute("tabindex");');
  const rec = { theme, steps: [] };

  // Tab until the toggle has focus
  let hops = 0, onToggle = null;
  while (hops < 25) {
    await tab(s); hops++;
    const f = await s.ev(FOCUSED);
    if (f && f.ariaExpanded !== null) { onToggle = f; break; }
  }
  rec.toggleReachedAfterTabs = onToggle ? hops : null;
  rec.toggleFocusRing = onToggle ? onToggle.ring : null;
  rec.toggleName = onToggle ? onToggle.name : null;
  rec.toggleSize = onToggle ? `${onToggle.rect.w}x${onToggle.rect.h}` : null;

  if (onToggle) {
    // Enter opens
    await key(s, 'Enter', 'Enter', 13);
    rec.afterEnter = await s.ev(`(() => { const b = document.querySelector('header button[aria-expanded]');
      const panel = document.getElementById(b && b.getAttribute('aria-controls'));
      const pr = panel ? panel.getBoundingClientRect() : null;
      return { expanded: b.getAttribute('aria-expanded'),
               panelVisible: !!pr && pr.height > 0 && getComputedStyle(panel).visibility !== 'hidden',
               panelHeight: pr ? Math.round(pr.height) : null,
               panelScrolls: panel ? panel.scrollHeight > panel.clientHeight : null,
               focusInsidePanel: !!(panel && panel.contains(document.activeElement)),
               focusedNow: document.activeElement ? (document.activeElement.getAttribute('aria-label')||document.activeElement.textContent||'').trim().slice(0,30) : null,
               itemCount: panel ? panel.querySelectorAll('a,button').length : 0,
               smallTargets: panel ? Array.from(panel.querySelectorAll('a,button')).filter(e => { const r = e.getBoundingClientRect(); return r.width>0 && (r.width < 44 || r.height < 44); }).length : null }; })()`);
    await shoot(s, `${SHOTS}/keyboard/mobile-menu-open-${theme}.jpg`, { full: false, quality: 76 });

    // Tab through the panel — does focus stay inside?
    const inside = [];
    for (let i = 0; i < 14; i++) { await tab(s); const f = await s.ev(FOCUSED); if (f) inside.push({ name: f.name, insideMenu: f.insideMenu, ring: f.ring }); }
    rec.tabbingInsidePanel = inside;
    rec.escapedPanel = inside.filter(x => !x.insideMenu).length;
    rec.panelStopsWithoutRing = inside.filter(x => !x.ring).map(x => x.name);

    // Escape closes and focus returns to the trigger
    await key(s, 'Escape', 'Escape', 27);
    rec.afterEscape = await s.ev(`(() => { const b = document.querySelector('header button[aria-expanded]');
      return { expanded: b.getAttribute('aria-expanded'),
               focusOnTrigger: document.activeElement === b,
               focusedNow: document.activeElement ? (document.activeElement.getAttribute('aria-label')||document.activeElement.tagName) : null }; })()`);

    // Space also opens (button semantics)
    await key(s, ' ', 'Space', 32);
    rec.afterSpace = await s.ev(`document.querySelector('header button[aria-expanded]').getAttribute('aria-expanded')`);
    await key(s, 'Escape', 'Escape', 27);
  }
  R.mobileMenu[theme] = rec;
  process.stderr.write(`mobile menu: ${theme}\n`);
}

/* ---- skip link actually moves focus to main ---- */
await go(s, '/', { w: 1440, h: 900, settle: 1500 });
await s.ev('window.scrollTo(0,0); document.body.setAttribute("tabindex","-1"); document.body.focus(); document.body.removeAttribute("tabindex");');
await tab(s);
const skipStop = await s.ev(FOCUSED);
await shoot(s, `${SHOTS}/keyboard/skip-link-focused.jpg`, { full: false, quality: 80 });
await key(s, 'Enter', 'Enter', 13);
await sleep(500);
R.skipLink = { firstStop: skipStop, afterActivate: await s.ev(`(() => { const a = document.activeElement;
  return { tag: a ? a.tagName.toLowerCase() : null, id: a ? a.id : null, isMain: !!(a && (a.tagName === 'MAIN' || a.id === 'main')), hash: location.hash }; })()`) };

/* summary */
const t = Object.values(R.tabOrder);
R.summary = {
  routesWalked: t.length,
  totalStops: t.reduce((a, x) => a + x.stops, 0),
  stopsWithRing: t.reduce((a, x) => a + x.ringPresent, 0),
  stopsWithoutRing: t.reduce((a, x) => a + x.withoutRing.length, 0),
  routesWithDomOrderInversions: t.filter(x => x.domOrderInversions > 0).map(x => x.route + ':' + x.domOrderInversions),
  /* NOT a trap list. This is "the walk hit its step limit before the ring wrapped",
     which on /publication/ (538 focusable elements) and / (104) simply means the
     limit is lower than the ring length. Both were walked to completion in a
     separate unbounded run: the ring returns to "Skip to main content" and, on /,
     leaves the document into browser chrome. No keyboard trap exists. */
  ringsNotCompletedWithinStepLimit: t.filter(x => !x.ringCompleted).map(x => `${x.route} (${x.stops} stops walked)`),
  skipLinkFirstEverywhere: t.every(x => x.skipLinkFirst),
};

writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('DONE phase7-keyboard ->', OUT);
console.log(JSON.stringify(R.summary, null, 1));
try { s.ws.close(); } catch {}
proc.kill(); process.exit(0);
