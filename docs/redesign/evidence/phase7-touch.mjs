/* Phase 7.6 — touch targets at mobile/tablet widths.

   The blanket "every a[href] must be 44x44" count the Phase 1 instrument produces
   is not actionable: WCAG 2.5.5/2.5.8 both exempt links that sit inline in a
   sentence, and the roadmap's own list (§13) is a list of *controls* — navbar
   toggle, prev/next, social icons, buttons, card actions, theme control,
   breadcrumbs, pagination, icon-only controls.

   This driver classifies each undersized target so the fix can be aimed at the
   controls rather than at the prose.

   node docs/redesign/evidence/phase7-touch.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, HERE, ROUTES, BASE } from './phase7-cdp.mjs';

const OUT = resolve(HERE, 'phase7-touch.json');

const PROBE = `(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const sel = e => (e.tagName.toLowerCase() + (e.id ? '#'+e.id : '') +
    (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).slice(0,3).join('.') : '')).slice(0, 80);

  /* An "inline" link: sits inside running text, i.e. its parent block contains
     text besides the link itself. Those are exempt from the target-size rule. */
  /* An "inline" link sits inside running text, so the target-size criteria
     exempt it (WCAG 2.5.5 and 2.5.8, "Inline" exception).

     The first version of this test used e.closest('p, li, …, span') and compared
     text lengths. That produced false positives all over /publication/: the
     citation author list wraps EVERY name in its own <span>, so the "block" it
     found had exactly the link's own text and the link was scored as a standalone
     control. Walk up to the nearest genuinely block-level ancestor instead. */
  const isInline = (e) => {
    if (e.tagName !== 'A') return false;
    if (e.closest('nav, footer nav, .pagination, [role=navigation]')) return false;
    if (!getComputedStyle(e).display.startsWith('inline')) return false;
    let n = e.parentElement;
    while (n && n !== document.body) {
      const d = getComputedStyle(n).display;
      if (!d.startsWith('inline') && d !== 'contents') break;
      n = n.parentElement;
    }
    if (!n || n === document.body) return false;
    const own = (e.textContent || '').trim();
    const all = (n.textContent || '').trim();
    return all.length > own.length + 3;
  };

  const zone = (e) => {
    if (e.closest('header')) return 'header/nav';
    if (e.closest('footer')) return 'footer';
    if (e.closest('nav.sj-crumbs')) return 'breadcrumb';
    if (e.closest('.pagination, .page-link, nav[aria-label*=agin i]')) return 'pagination';
    if (e.closest('.sj-prose, .page-body .prose, article')) return 'prose';
    if (e.closest('.pub-list-item, .view-citation')) return 'publication-row';
    if (e.closest('[class*=card], li')) return 'card/list';
    return 'other';
  };

  const iconOnly = (e) => !(e.textContent || '').trim() && !!e.querySelector('svg, img, i');

  const controls = q('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button]');
  const rows = [];
  for (const e of controls) {
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const under = r.width < 44 || r.height < 44;
    if (!under) continue;
    rows.push({
      el: sel(e), zone: zone(e), inline: isInline(e), icon: iconOnly(e),
      w: Math.round(r.width), h: Math.round(r.height),
      name: (e.getAttribute('aria-label') || e.textContent || e.getAttribute('title') || '').trim().replace(/\\s+/g, ' ').slice(0, 40),
      href: (e.getAttribute('href') || '').slice(0, 44),
      under24: r.width < 24 || r.height < 24,
      html: e.outerHTML.replace(/\\s+/g, ' ').slice(0, 150),
    });
  }
  const actionable = rows.filter(r => !r.inline);
  return {
    total: controls.length,
    under44: rows.length,
    under44Inline: rows.length - actionable.length,
    under44Actionable: actionable.length,
    under24Actionable: actionable.filter(r => r.under24).length,
    actionable: actionable.slice(0, 60),
  };
})()`;

const { proc, port, version } = await launch();
const s = await attach(port);
const R = { meta: { browser: version, base: BASE, at: new Date().toISOString(), threshold: 44 }, byCell: {} };

const VPS = [['768x1024', 768, 1024], ['430x932', 430, 932], ['390x844', 390, 844]];
for (const [slug, path] of ROUTES) {
  for (const [vp, w, h] of VPS) {
    await go(s, path, { w, h, mobile: true, theme: 'light', settle: 1400 });
    R.byCell[`${slug}|${vp}`] = await s.ev(PROBE);
  }
  process.stderr.write(`touch: ${slug}\n`);
}
/* mobile menu open — the roadmap calls out menu targets specifically */
await go(s, '/', { w: 390, h: 844, mobile: true, theme: 'light', settle: 1600 });
await s.ev(`document.querySelector('header button[aria-expanded]').click()`);
await new Promise(r => setTimeout(r, 700));
R.mobileMenuOpen = await s.ev(PROBE);

/* aggregate */
const agg = new Map();
for (const [k, v] of Object.entries(R.byCell)) for (const a of v.actionable) {
  const key = `${a.zone}|${a.el}|${a.w}x${a.h}`;
  if (!agg.has(key)) agg.set(key, { ...a, cells: [] });
  agg.get(key).cells.push(k);
}
R.uniqueActionable = [...agg.values()].sort((a, b) => (a.w * a.h) - (b.w * b.h))
  .map(v => ({ zone: v.zone, el: v.el, name: v.name, size: `${v.w}x${v.h}`, icon: v.icon, under24: v.under24, n: v.cells.length, eg: v.cells[0] }));
R.summary = {
  cells: Object.keys(R.byCell).length,
  worstRoute: Object.entries(R.byCell).sort((a, b) => b[1].under44Actionable - a[1].under44Actionable)[0],
  totalUnder44: Object.values(R.byCell).reduce((a, v) => a + v.under44, 0),
  totalInlineExempt: Object.values(R.byCell).reduce((a, v) => a + v.under44Inline, 0),
  totalActionable: Object.values(R.byCell).reduce((a, v) => a + v.under44Actionable, 0),
  uniqueActionable: R.uniqueActionable.length,
  byZone: R.uniqueActionable.reduce((m, v) => { m[v.zone] = (m[v.zone] || 0) + 1; return m; }, {}),
};
writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log(JSON.stringify(R.summary, null, 1));
console.log('--- unique actionable undersized controls ---');
R.uniqueActionable.slice(0, 40).forEach(v => console.log(`  ${v.size.padEnd(9)} ${v.zone.padEnd(17)} ${v.icon ? 'icon ' : '     '} ${v.el.slice(0,48).padEnd(50)} "${v.name}"`));
try { s.ws.close(); } catch {}
proc.kill(); process.exit(0);
