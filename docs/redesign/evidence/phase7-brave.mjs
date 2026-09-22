/* Phase 7.8 — Brave with Shields on.

   Two things are checked, and they are not the same thing:

   1. Does Brave's engine render the site the way Chrome does? Run the standard
      matrix driver with P7_BROWSER pointed at brave.exe for that.
   2. Does anything break when Shields blocks things? That is this file.

   HONEST LIMIT, stated up front: the Cloudflare Insights beacon and
   `email-decode.min.js` are injected **at the edge**, so they exist only on the
   production deploy and cannot be reproduced against a local Hugo server. What
   this driver *can* prove is that no layout or content depends on them, by
   loading the site with those hosts blocked at the network layer and comparing
   the result with the unblocked render. The remaining production-only checks are
   listed as manual in the Phase 7 report.

   node docs/redesign/evidence/phase7-brave.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, shoot, HERE, SHOTS, ROUTES, BASE } from './phase7-cdp.mjs';

const OUT = resolve(HERE, 'phase7-brave.json');

const PROBE = `(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const de = document.documentElement;
  const cs = getComputedStyle(document.body);
  return {
    isBrave: !!(navigator.brave && typeof navigator.brave.isBrave === 'function'),
    overflowPx: de.scrollWidth - de.clientWidth,
    docHeight: de.scrollHeight,
    devicePixelRatio: window.devicePixelRatio,
    zoomProxy: Math.round((window.outerWidth / window.innerWidth) * 100) / 100,
    bodyBg: cs.backgroundColor, bodyColor: cs.color,
    bodyFont: cs.fontFamily, bodySize: cs.fontSize,
    h1: q('h1').length,
    headerH: (() => { const h = document.querySelector('header'); return h ? Math.round(h.getBoundingClientRect().height) : null; })(),
    headerBg: (() => { const h = document.querySelector('header'); return h ? getComputedStyle(h).backgroundColor : null; })(),
    /* B7 — backdrop-filter under fingerprint protection */
    backdropSupported: CSS.supports('backdrop-filter', 'blur(4px)'),
    backdropEls: q('body *').filter(e => { const b = getComputedStyle(e).backdropFilter; return b && b !== 'none'; }).length,
    /* B2 — fonts. The logo must not depend on a locally installed Arial. */
    logoSvgText: q('header svg text').map(t => { const r = t.getBoundingClientRect();
      return { txt: (t.textContent||'').slice(0,12), w: Math.round(r.width), h: Math.round(r.height), font: getComputedStyle(t).fontFamily.slice(0,40) }; }).slice(0,6),
    logoBox: (() => { const s = document.querySelector('header svg'); if (!s) return null;
      const r = s.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })(),
    /* content presence — Shields must not remove anything */
    textChars: (document.body.innerText || '').replace(/\\s+/g,' ').trim().length,
    links: q('a[href]').length, images: q('img').length,
    imagesLoaded: q('img').filter(i => i.complete && i.naturalWidth > 0).length,
    svgs: q('svg').length,
    grids: q('body *').filter(e => getComputedStyle(e).display === 'grid').length,
    gapSample: q('body *').filter(e => { const c = getComputedStyle(e); return (c.display==='grid'||c.display==='flex') && c.gap!=='normal' && c.gap!=='0px'; })
      .slice(0,4).map(e => getComputedStyle(e).gap),
    /* obfuscated e-mail: Cloudflare rewrites mailto: into /cdn-cgi/l/email-protection */
    emailProtected: q('a[href*="/cdn-cgi/l/email-protection"], .__cf_email__').length,
    mailtoLinks: q('a[href^="mailto:"]').length,
    animations: (document.getAnimations ? document.getAnimations().length : null),
    infinite: (document.getAnimations ? document.getAnimations().filter(a => { try { return a.effect.getTiming().iterations === Infinity; } catch { return false; } }).length : null),
  };
})()`;

const BLOCKED = [
  '*cloudflareinsights.com*', '*static.cloudflareinsights.com*',
  '*/cdn-cgi/scripts/*', '*email-decode.min.js*',
  '*google-analytics.com*', '*googletagmanager.com*',
  '*badge.dimensions.ai*',
];

const { proc, port, version } = await launch();   // P7_BROWSER must point at brave.exe
const s = await attach(port);
const R = { meta: { browser: version, base: BASE, at: new Date().toISOString(), blocked: BLOCKED }, shieldsOff: {}, shieldsOn: {}, diff: {} };

const VPS = [['1440x900', 1440, 900, false], ['390x844', 390, 844, true]];

/* pass 1 — nothing blocked */
for (const [slug, path] of ROUTES) {
  for (const [vp, w, h, mobile] of VPS) {
    for (const theme of ['light', 'dark']) {
      await go(s, path, { w, h, mobile, theme, settle: 1600 });
      R.shieldsOff[`${slug}|${vp}|${theme}`] = await s.ev(PROBE);
    }
  }
}
process.stderr.write('pass 1 (unblocked) done\n');

/* pass 2 — third-party / edge-injected hosts blocked at the network layer,
   which is what Shields does to them in production */
await s.send('Network.setBlockedURLs', { urls: BLOCKED });
for (const [slug, path] of ROUTES) {
  for (const [vp, w, h, mobile] of VPS) {
    for (const theme of ['light', 'dark']) {
      await go(s, path, { w, h, mobile, theme, settle: 1800 });
      R.shieldsOn[`${slug}|${vp}|${theme}`] = await s.ev(PROBE);
      if (vp === '1440x900' && theme === 'light') await shoot(s, `${SHOTS}/brave/${slug}-1440x900-light-blocked.jpg`, { full: true, quality: 64 });
      if (vp === '390x844' && theme === 'dark') await shoot(s, `${SHOTS}/brave/${slug}-390x844-dark-blocked.jpg`, { full: true, quality: 64 });
    }
  }
  process.stderr.write(`brave: ${slug}\n`);
}

/* diff the two passes — anything that changes is something the page depends on */
for (const k of Object.keys(R.shieldsOff)) {
  const a = R.shieldsOff[k], b = R.shieldsOn[k];
  if (!a || !b) continue;
  const d = {};
  for (const f of ['overflowPx', 'docHeight', 'textChars', 'links', 'images', 'imagesLoaded', 'svgs', 'h1', 'headerH', 'grids', 'infinite']) {
    if (a[f] !== b[f]) d[f] = `${a[f]} -> ${b[f]}`;
  }
  if (Object.keys(d).length) R.diff[k] = d;
}

R.summary = {
  isBrave: Object.values(R.shieldsOff)[0].isBrave,
  cells: Object.keys(R.shieldsOff).length * 2,
  backdropSupported: Object.values(R.shieldsOff)[0].backdropSupported,
  maxBackdropEls: Math.max(...Object.values(R.shieldsOff).map(v => v.backdropEls)),
  devicePixelRatio: Object.values(R.shieldsOff)[0].devicePixelRatio,
  overflowCellsUnblocked: Object.entries(R.shieldsOff).filter(([, v]) => v.overflowPx > 1).map(([k]) => k),
  overflowCellsBlocked: Object.entries(R.shieldsOn).filter(([, v]) => v.overflowPx > 1).map(([k]) => k),
  cellsChangedByBlocking: Object.keys(R.diff).length,
  emailProtectedFound: Object.values(R.shieldsOff).reduce((a, v) => a + v.emailProtected, 0),
  mailtoLinks: Object.values(R.shieldsOff).reduce((a, v) => a + v.mailtoLinks, 0),
  infiniteAnimations: Math.max(...Object.values(R.shieldsOff).map(v => v.infinite ?? 0)),
  logoTextSample: Object.values(R.shieldsOff)[0].logoSvgText,
};
writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log(JSON.stringify(R.summary, null, 1));
console.log('--- cells changed by blocking ---');
console.log(JSON.stringify(R.diff, null, 1).slice(0, 2500));
try { s.ws.close(); } catch {}
proc.kill(); process.exit(0);
