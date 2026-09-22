/* Phase 7.4 / 7.5 / 7.6 + §18 — zoom reflow, reduced motion, semantics & ARIA.

   Zoom is emulated the faithful way: browser zoom at Z% on a 1280 px window is
   `width = 1280/Z`, `deviceScaleFactor = Z`. That reproduces both the CSS-pixel
   count the WCAG reflow criterion is written against (640 at 200 %, 320 at 400 %)
   and the rendered scale, so the screenshots are legible evidence rather than a
   narrow-desktop simulation.

   node docs/redesign/evidence/phase7-a11y.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, shoot, HERE, SHOTS, ROUTES, BASE } from './phase7-cdp.mjs';

const OUT = resolve(HERE, 'phase7-a11y.json');

/* ---------------- probes ---------------- */

const ZOOM = `(() => {
  const de = document.documentElement;
  const q = s => Array.from(document.querySelectorAll(s));
  const vw = de.clientWidth;
  // Containers that are legitimately allowed to scroll horizontally.
  const allowed = e => !!e.closest('table, pre, .katex-display, .sj-book-nav, [data-allow-xscroll]')
                    || ['TABLE','PRE','CODE'].includes(e.tagName);
  const bleeding = q('body *').filter(e => {
    const r = e.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    if (getComputedStyle(e).position === 'fixed') return false;
    return r.right > vw + 2;
  });
  return {
    cssPx: vw,
    docScrollW: de.scrollWidth, docClientW: de.clientWidth,
    horizontalScroll: de.scrollWidth > de.clientWidth + 1,
    bleedTotal: bleeding.length,
    bleedDisallowed: bleeding.filter(e => !allowed(e)).slice(0, 10)
      .map(e => ({ el: (e.tagName.toLowerCase() + (typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\\s+/).slice(0,3).join('.'):'')).slice(0,70),
                   right: Math.round(e.getBoundingClientRect().right), w: Math.round(e.getBoundingClientRect().width) })),
    // controls that must survive zoom
    navToggleVisible: (() => { const b = document.querySelector('header button[aria-expanded]');
      return b ? b.getBoundingClientRect().width > 0 : null; })(),
    headerVisible: (() => { const h = document.querySelector('header'); return h ? h.getBoundingClientRect().height > 0 : false; })(),
    mainVisible: (() => { const m = document.querySelector('main'); return m ? m.getBoundingClientRect().height > 0 : false; })(),
    footerReachable: (() => { const f = document.querySelector('footer'); return f ? f.getBoundingClientRect().height > 0 : false; })(),
    interactiveVisible: q('a[href],button').filter(e => e.getBoundingClientRect().width > 0).length,
    textNodes: (() => { let n = 0; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (w.nextNode()) if (w.currentNode.nodeValue.trim().length > 2) n++; return n; })(),
    // single-column check for 400 %
    multiColumn: q('main *').filter(e => { const cs = getComputedStyle(e);
      if (cs.display !== 'grid' && cs.display !== 'inline-grid') return false;
      const cols = cs.gridTemplateColumns.split(' ').filter(Boolean).length;
      return cols > 1 && e.getBoundingClientRect().width > 40 && e.children.length > 1; })
      .slice(0, 8).map(e => ({ el: (e.tagName.toLowerCase()+'.'+String(e.className).trim().split(/\\s+/).slice(0,2).join('.')).slice(0,60),
                               cols: getComputedStyle(e).gridTemplateColumns })),
    userScalable: (() => { const m = document.querySelector('meta[name=viewport]');
      return m ? m.getAttribute('content') : null; })(),
  };
})()`;

const MOTION = `(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const anims = document.getAnimations ? document.getAnimations() : [];
  const infinite = anims.filter(a => { try { return a.effect.getTiming().iterations === Infinity; } catch { return false; } });
  // any element that carries text/content but renders fully transparent or scaled away
  const hidden = q('body *').filter(e => {
    const cs = getComputedStyle(e);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false; // deliberately hidden is fine
    if (parseFloat(cs.opacity) > 0.05) return false;
    const t = (e.textContent || '').trim();
    return t.length > 3 || e.querySelector('img,svg');
  }).slice(0, 12).map(e => ({ el: (e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\\s+/).slice(0,3).join('.'):'')).slice(0,70),
      opacity: getComputedStyle(e).opacity, txt: (e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,40) }));
  const offscreen = q('body *').filter(e => {
    const cs = getComputedStyle(e);
    if (cs.transform === 'none' || cs.transform === 'matrix(1, 0, 0, 1, 0, 0)') return false;
    const m = cs.transform.match(/matrix\\(([^)]+)\\)/); if (!m) return false;
    const p = m[1].split(',').map(Number);
    return (Math.abs(p[4]) > 80 || Math.abs(p[5]) > 80) && (e.textContent||'').trim().length > 3;
  }).slice(0, 8).map(e => ({ el: e.tagName.toLowerCase()+'.'+String(e.className).slice(0,30), transform: getComputedStyle(e).transform }));
  let animEls = 0, longDur = [];
  q('body *').forEach(e => { const cs = getComputedStyle(e);
    if (cs.animationName !== 'none') { animEls++;
      cs.animationDuration.split(',').forEach(d => { const ms = d.trim().endsWith('ms') ? parseFloat(d) : parseFloat(d) * 1000;
        if (ms > 400) longDur.push({ el: e.tagName.toLowerCase()+'.'+String(e.className).slice(0,26), dur: d.trim(), name: cs.animationName }); }); }
  });
  return { running: anims.length, infinite: infinite.length,
    infiniteDetail: infinite.slice(0,8).map(a => ({ name: a.animationName || '?', target: a.effect && a.effect.target ? a.effect.target.tagName + '.' + String(a.effect.target.className).slice(0,30) : '?' })),
    hiddenContent: hidden, offscreenContent: offscreen,
    animElements: animEls, durationsOver400ms: longDur.slice(0, 10),
    visibleTextChars: (document.body.innerText || '').replace(/\\s+/g, ' ').trim().length };
})()`;

const SEMANTICS = `(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const accName = el => (el.getAttribute('aria-label')
    || (el.getAttribute('aria-labelledby') && (document.getElementById(el.getAttribute('aria-labelledby'))||{}).textContent)
    || el.textContent || el.getAttribute('title') || (el.querySelector('img') ? el.querySelector('img').alt : '')
    || (el.querySelector('svg title') ? el.querySelector('svg title').textContent : '')
    || '').trim();

  const hs = q('h1,h2,h3,h4,h5,h6').filter(vis);
  const skips = [];
  for (let i = 1; i < hs.length; i++) {
    const a = +hs[i-1].tagName[1], b = +hs[i].tagName[1];
    if (b - a > 1) skips.push(hs[i-1].tagName + ' "' + hs[i-1].textContent.trim().slice(0,30) + '" -> ' + hs[i].tagName + ' "' + hs[i].textContent.trim().slice(0,30) + '"');
  }

  const ids = q('[id]').map(e => e.id);
  const dupIds = [...new Set(ids.filter((v,i) => ids.indexOf(v) !== i))];

  const iconOnly = q('a[href],button,[role=button]').filter(e => vis(e) && !e.textContent.trim() && (e.querySelector('svg,img') || e.className.toString().includes('icon')));
  const iconNoName = iconOnly.filter(e => !accName(e)).map(e => (e.tagName.toLowerCase()+(e.className?'.'+String(e.className).trim().split(/\\s+/).slice(0,2).join('.'):'')).slice(0,60));

  // button-vs-link correctness
  const linksNoHref = q('a:not([href])').filter(vis).length;
  const linksAsButtons = q('a[href="#"],a[href=""]').filter(vis).map(a => accName(a).slice(0,30));
  const buttonsNavigating = q('button[onclick*="location"],button[data-href]').length;

  // ARIA state on expandables
  const expandables = q('[aria-expanded]').map(e => ({ tag: e.tagName.toLowerCase(), state: e.getAttribute('aria-expanded'),
    controls: e.getAttribute('aria-controls'), targetExists: !!(e.getAttribute('aria-controls') && document.getElementById(e.getAttribute('aria-controls'))),
    name: accName(e).slice(0, 30) }));

  // redundant / invalid ARIA
  const redundantRole = q('[role]').filter(e => {
    const implicit = { NAV:'navigation', MAIN:'main', HEADER:'banner', FOOTER:'contentinfo', BUTTON:'button', A:'link',
                       UL:'list', OL:'list', LI:'listitem', TABLE:'table', ARTICLE:'article', ASIDE:'complementary', FORM:'form', H1:'heading' };
    return implicit[e.tagName] === e.getAttribute('role');
  }).map(e => e.tagName.toLowerCase() + '[role=' + e.getAttribute('role') + ']');
  const ariaRefsBroken = q('[aria-labelledby],[aria-describedby],[aria-controls]').flatMap(e =>
    ['aria-labelledby','aria-describedby','aria-controls'].filter(a => e.hasAttribute(a))
      .flatMap(a => e.getAttribute(a).split(/\\s+/).filter(Boolean).filter(id => !document.getElementById(id)).map(id => e.tagName.toLowerCase()+' '+a+'="'+id+'"'))
  ).slice(0, 10);

  // tables
  const tables = q('table').map(t => ({
    hasThead: !!t.querySelector('thead'), ths: t.querySelectorAll('th').length,
    scoped: t.querySelectorAll('th[scope]').length, caption: !!t.querySelector('caption'),
    rows: t.querySelectorAll('tr').length }));

  // lists: no stray non-li children
  const badLists = q('ul,ol').filter(l => Array.from(l.children).some(c => !['LI','SCRIPT','TEMPLATE'].includes(c.tagName))).length;

  // images
  const imgs = q('img');
  return {
    title: document.title, titleLen: document.title.length,
    lang: document.documentElement.lang,
    langOnPassages: q('[lang]').length - 1,
    landmarks: { main: q('main,[role=main]').length, header: q('header,[role=banner]').length,
      nav: q('nav,[role=navigation]').length, footer: q('footer,[role=contentinfo]').length,
      navLabels: q('nav').map(n => n.getAttribute('aria-label') || '(unlabelled)') },
    h1: q('h1').length, headingCount: hs.length,
    headingOutline: hs.slice(0, 26).map(h => h.tagName + ' ' + h.textContent.trim().replace(/\\s+/g,' ').slice(0, 46)),
    headingSkips: skips,
    dupIds, positiveTabindex: q('[tabindex]').filter(e => +e.getAttribute('tabindex') > 0).length,
    iconOnlyControls: iconOnly.length, iconOnlyWithoutName: iconNoName,
    linksNoHref, linksAsButtons, buttonsNavigating,
    expandables, redundantRole: [...new Set(redundantRole)], ariaRefsBroken,
    tables, badLists,
    images: { total: imgs.length, noAlt: imgs.filter(i => !i.hasAttribute('alt')).length,
      decorativeEmptyAlt: imgs.filter(i => i.getAttribute('alt') === '').length,
      noDims: imgs.filter(i => !(i.getAttribute('width') && i.getAttribute('height'))).length,
      noDimsSrc: imgs.filter(i => !(i.getAttribute('width') && i.getAttribute('height'))).slice(0,6).map(i => (i.currentSrc||i.src).split('/').pop()) },
    svgNoName: q('svg').filter(s => !s.closest('a,button') && !s.getAttribute('aria-hidden') && !s.getAttribute('aria-label') && !s.querySelector('title')).length,
    svgAriaHidden: q('svg[aria-hidden=true]').length,
    formControlsUnlabelled: q('input:not([type=hidden]),select,textarea').filter(i =>
      !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby') && !i.closest('label') &&
      !(i.id && document.querySelector('label[for="'+CSS.escape(i.id)+'"]'))).length,
    blankNoNoopener: q('a[target=_blank]').filter(a => !/noopener/.test(a.rel||'')).length,
    genericLinkText: q('a').filter(a => /^(read more|more|click here|here|learn more|link)$/i.test(a.textContent.trim())).length,
  };
})()`;

/* ---------------- run ---------------- */

const { proc, port, version } = await launch();
const s = await attach(port);
const R = { meta: { browser: version, base: BASE, at: new Date().toISOString() }, zoom: {}, motion: {}, semantics: {} };

/* --- 7.5 zoom: representative routes covering each page type --- */
const ZOOM_ROUTES = [
  ['home', '/'], ['publication-list', '/publication/'], ['publication-detail', '/publication/j-029/'],
  ['course-detail', '/teaching/jul2025_eee303/'], ['team-profile', '/authors/me/'],
  ['resources', '/resources/'], ['projects', '/projects/'], ['blog-post', '/resources/blog/20260124-citation-count/'],
];
for (const [slug, path] of ZOOM_ROUTES) {
  for (const [label, w, h, dpr] of [['200', 640, 512, 2], ['400', 320, 256, 4]]) {
    for (const theme of ['light', 'dark']) {
      await go(s, path, { w, h, dpr, mobile: false, theme, settle: 1400 });
      R.zoom[`${slug}|${label}|${theme}`] = await s.ev(ZOOM);
      if (theme === 'light') await shoot(s, `${SHOTS}/zoom/${slug}-zoom${label}.jpg`, { full: true, quality: 66 });
    }
  }
  process.stderr.write(`zoom done: ${slug}\n`);
}

/* --- 7.4 reduced motion, plus the normal-motion control --- */
const MOTION_ROUTES = [['home', '/'], ['research', '/research/'], ['projects', '/projects/'],
  ['publication-list', '/publication/'], ['teaching', '/teaching/'], ['team', '/authors/'], ['resources', '/resources/']];
for (const [slug, path] of MOTION_ROUTES) {
  for (const reduced of [false, true]) {
    await go(s, path, { w: 1440, h: 900, theme: 'light', reduced, settle: 3200 });
    R.motion[`${slug}|${reduced ? 'reduced' : 'normal'}`] = await s.ev(MOTION);
    if (reduced) await shoot(s, `${SHOTS}/reduced-motion/${slug}-reduced.jpg`, { full: true, quality: 66 });
  }
  // reduced motion at mobile too — the mobile menu animates
  await go(s, path, { w: 390, h: 844, mobile: true, theme: 'dark', reduced: true, settle: 2600 });
  R.motion[`${slug}|reduced-390-dark`] = await s.ev(MOTION);
  process.stderr.write(`motion done: ${slug}\n`);
}

/* --- §18 semantics / ARIA across the full route list, both themes irrelevant → light --- */
for (const [slug, path] of ROUTES) {
  await go(s, path, { w: 1440, h: 900, theme: 'light', settle: 1400 });
  R.semantics[slug] = { route: path, ...(await s.ev(SEMANTICS)) };
}
/* mobile semantics: the nav toggle only exists below the breakpoint */
for (const [slug, path] of [['home', '/'], ['course-detail', '/teaching/jul2025_eee303/']]) {
  await go(s, path, { w: 390, h: 844, mobile: true, theme: 'light', settle: 1400 });
  R.semantics[slug + '@390'] = { route: path, ...(await s.ev(SEMANTICS)) };
}

writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('DONE phase7-a11y ->', OUT);
try { s.ws.close(); } catch {}
proc.kill(); process.exit(0);
