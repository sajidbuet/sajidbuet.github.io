/* Phase 8 — research-icon single source of truth.

   The hero's six domain icons and the six Research-card icons must be the same
   artwork: both are inlined from assets/media/icons/hero/*.svg by
   `functions/get_icon`. The hero once carried its own hand-drawn <symbol> set,
   which drifted from the cards. This check fails if that comes back.

   1. Source: hero-circuit.html holds no icon geometry of its own, and every
      domain's `icon` names an existing canonical asset.
   2. Rendered: on the built homepage, each hero icon's SVG markup is identical
      to the Research card for the same area, stays decorative, and the hero
      domain links to that same card.

   No path data is duplicated here — the comparison is hero vs card, both as
   rendered from the shared asset.

   node docs/redesign/evidence/phase8-hero-icon-source.mjs [base]
*/
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, HERE, REPO, BASE as DEFAULT_BASE } from './phase7-cdp.mjs';

const BASE = process.argv[2] || DEFAULT_BASE;
const OUT = resolve(HERE, 'phase8-hero-icon-source.json');
const R = { meta: { base: BASE, at: new Date().toISOString() }, failures: [] };
const fail = (m) => R.failures.push(m);

/* hero domain id -> the word each Research-card title STARTS with (titles like
   "Quantum Computing & Quantum Photonics" contain other areas' words). Pairs by
   meaning, not by filename, so a wrong `icon` mapping is caught too. */
const CARD_FOR = {
  photonics: 'Photonics', quantum: 'Quantum', embedded: 'Embedded',
  antennas: 'Antenna', computing: 'Computing', energy: 'Renewable',
};

/* ---------- 1. source ---------- */
const SRC = resolve(REPO, 'layouts', '_partials', 'custom', 'hero-circuit.html');
const src = readFileSync(SRC, 'utf8');
const code = src.replace(/\{\{\/\*[\s\S]*?\*\/\}\}/g, ''); // ignore template comments
if (/<symbol\b/i.test(code)) fail('source: hero-circuit.html contains a <symbol> again');
if (/sjico-|sj-ico__/.test(code)) fail('source: hero-circuit.html references the removed sjico-/sj-ico__ icon set');
if (!/partial\s+"functions\/get_icon"/.test(code)) fail('source: hero icons are not rendered through functions/get_icon');
const mapping = [...code.matchAll(/"id"\s+"([a-z]+)"\s+"icon"\s+"([a-z0-9-]+)"/g)].map(([, id, icon]) => ({ id, icon }));
R.mapping = mapping.map(({ id, icon }) => {
  const asset = `assets/media/icons/hero/${icon}.svg`;
  const exists = existsSync(resolve(REPO, asset));
  if (!exists) fail(`source: ${id} -> ${asset} does not exist`);
  return { id, icon: `hero/${icon}`, asset, exists };
});
const ids = mapping.map((m) => m.id).sort().join(',');
if (ids !== Object.keys(CARD_FOR).sort().join(',')) fail(`source: domain ids changed or lack an "icon": [${ids}]`);

/* ---------- 2. rendered ---------- */
const { proc, port } = await launch();
const s = await attach(port);
/* The shared CDP profile persists between runs; without this a cached homepage
   from a previous build can be checked instead of the current one. */
await s.send('Network.setCacheDisabled', { cacheDisabled: true });
await go(s, BASE + '/', { w: 1440, h: 900, theme: 'light', settle: 1500 });
R.rendered = JSON.parse(await s.ev(`(() => {
  const inner = (svg) => svg ? svg.innerHTML.replace(/\\s+/g, ' ').trim() : null;
  const cards = Array.from(document.querySelectorAll('.sj-card')).map((c) => ({
    title: (c.querySelector('.sj-card__title') || {}).textContent?.trim() || '',
    svg: c.querySelector('.sj-card__icon svg'),
    el: c,
  }));
  const CARD_FOR = ${JSON.stringify(CARD_FOR)};
  return JSON.stringify(Array.from(document.querySelectorAll('[data-research-domain]')).map((li) => {
    const id = li.getAttribute('data-research-domain');
    const span = li.querySelector('.sj-domain__icon');
    const svg = span && span.querySelector('svg');
    const card = cards.find((c) => c.title.startsWith(CARD_FOR[id]));
    const hit = li.querySelector('.sj-domain__hit');
    const href = hit ? hit.getAttribute('href') : null;
    const target = href && href.startsWith('#') ? document.getElementById(href.slice(1)) : null;
    return {
      id,
      card: card ? card.title : null,
      heroViewBox: svg && svg.getAttribute('viewBox'),
      cardViewBox: card && card.svg && card.svg.getAttribute('viewBox'),
      sameArtwork: !!(svg && card && card.svg && inner(svg) === inner(card.svg)),
      heroShapes: svg ? svg.querySelectorAll('path,polygon,rect,circle,ellipse,line,polyline').length : 0,
      usesSymbol: !!(svg && svg.querySelector('use')),
      decorative: !!(span && span.getAttribute('aria-hidden') === 'true'),
      focusable: svg ? svg.getAttribute('focusable') : null,
      tabbable: svg ? svg.tabIndex >= 0 : null,
      svgLabelled: !!(svg && (svg.getAttribute('aria-label') || svg.querySelector('title'))),
      buttonName: hit?.getAttribute('aria-label') || null,
      href,
      linksToCard: !!(card && target && target.classList.contains('sj-card') && target === card.el),
    };
  }));
})()`));
try { s.ws.close(); } catch {}
proc.kill();

for (const d of R.rendered) {
  if (!d.card) fail(`rendered: no Research card found for ${d.id}`);
  if (!d.heroShapes) fail(`rendered: ${d.id} hero icon is empty`);
  if (d.usesSymbol) fail(`rendered: ${d.id} hero icon is a <use> reference, not the inlined asset`);
  if (d.card && !d.sameArtwork) fail(`rendered: ${d.id} hero artwork differs from card "${d.card}"`);
  if (d.heroViewBox !== d.cardViewBox) fail(`rendered: ${d.id} viewBox ${d.heroViewBox} != card ${d.cardViewBox}`);
  if (!d.decorative || d.tabbable || d.svgLabelled || d.focusable !== 'false') fail(`rendered: ${d.id} icon is not purely decorative`);
  if (!d.buttonName) fail(`rendered: ${d.id} control lost its accessible name`);
  if (d.card && !d.linksToCard) fail(`rendered: ${d.id} link ${d.href} does not resolve to card "${d.card}"`);
}
if (R.rendered.length !== 6) fail(`rendered: expected 6 hero domains, found ${R.rendered.length}`);

writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('=== mapping (hero domain id -> canonical asset) ===');
for (const m of R.mapping) console.log(`  ${m.id.padEnd(10)} -> ${m.asset}${m.exists ? '' : '  MISSING'}`);
console.log('\n=== hero vs Research card ===');
for (const d of R.rendered) {
  console.log(`  ${d.id.padEnd(10)} card="${d.card}" same=${d.sameArtwork} viewBox=${d.heroViewBox} shapes=${d.heroShapes} ` +
    `decorative=${d.decorative} focusable=${d.focusable} name="${d.buttonName}" href=${d.href} linksToCard=${d.linksToCard}`);
}
console.log('\n' + (R.failures.length ? 'FAIL\n  ' + R.failures.join('\n  ') : 'PASS'));
process.exit(R.failures.length ? 1 : 0);
