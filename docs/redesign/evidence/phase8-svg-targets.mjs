/* Phase 8 item 8.21 — target size of links INSIDE inline SVG.

   Phase 7 measured touch targets by walking HTML interactive elements and never
   descended into <svg>, so the seven <a> elements of the Q-PACERS research map
   were never sized. On the homepage they rendered as small as 11x11 CSS px.
   This driver measures every SVG link on every route that inlines the diagram,
   at desktop and at a coarse-pointer mobile viewport.

   WCAG 2.5.5 (AAA) asks for 44x44; 2.5.8 (AA, 2.2) asks for 24x24 unless the
   target is inline text or has an equivalent elsewhere on the page.

   node docs/redesign/evidence/phase8-svg-targets.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, HERE, BASE } from './phase7-cdp.mjs';

const ROUTES = ['/', '/research/', '/research/photonics/', '/research/quantum/', '/research/embedded/'];
const VIEWS = [['desktop-1280', 1280, 900, false], ['mobile-390', 390, 844, true]];

const PROBE = `(() => [...document.querySelectorAll('svg a')].map((a) => {
  const b = a.getBoundingClientRect();
  const cs = getComputedStyle(a);
  return {
    href: a.getAttribute('xlink:href') || a.getAttribute('href') || '',
    name: a.getAttribute('aria-label') || '',
    w: +b.width.toFixed(1), h: +b.height.toFixed(1),
    tabbable: a.tabIndex >= 0,
    hidden: !!a.closest('[aria-hidden="true"]'),
    pointerEvents: cs.pointerEvents,
  };
}))()`;

const b = await launch();
const s = await attach(b.port);
const rows = [];

for (const [vLabel, w, h, mobile] of VIEWS) {
  for (const route of ROUTES) {
    await go(s, route, { w, h, mobile, theme: 'light', settle: 1400 });
    const links = await s.ev(PROBE);
    for (const l of links) {
      rows.push({ route, viewport: vLabel, ...l,
        under44: l.w < 44 || l.h < 44,
        under24: l.w < 24 || l.h < 24 });
    }
    const bad = links.filter((l) => (l.w < 24 || l.h < 24) && l.tabbable && !l.hidden);
    console.log(`${vLabel.padEnd(13)} ${route.padEnd(24)} svgLinks=${String(links.length).padStart(2)}  under24-and-tabbable=${bad.length}`);
    for (const l of bad) console.log(`      ${l.w}x${l.h}  ${l.href}`);
  }
}

const violations = rows.filter((r) => r.under24 && r.tabbable && !r.hidden);
writeFileSync(resolve(HERE, 'phase8-svg-targets.json'),
  JSON.stringify({ base: BASE, when: new Date().toISOString(), rows, violations }, null, 1));
console.log(`\n${rows.length} SVG links measured; ${violations.length} are tabbable, exposed and under 24x24`);
s.ws.close(); b.proc.kill();
process.exit(violations.length ? 1 : 0);
