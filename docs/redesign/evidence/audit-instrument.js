function __audit() {
  const R = {};
  const vw = innerWidth, vh = innerHeight;
  const sel = (el) => {
    if (!el || el === document.documentElement) return 'html';
    let s = el.tagName.toLowerCase();
    if (el.id) return s + '#' + el.id;
    const c = (el.className && typeof el.className === 'string') ? el.className.trim().split(/\s+/).slice(0, 4).join('.') : '';
    return c ? s + '.' + c : s;
  };
  const parseRGB = (str) => {
    const m = String(str).match(/rgba?\(([^)]+)\)/); if (!m) return null;
    const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const effBg = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = parseRGB(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0.85) return bg;
      n = n.parentElement;
    }
    const hb = parseRGB(getComputedStyle(document.body).backgroundColor);
    if (hb && hb.a > 0.85) return hb;
    const hh = parseRGB(getComputedStyle(document.documentElement).backgroundColor);
    return hh && hh.a > 0.85 ? hh : { r: 255, g: 255, b: 255, a: 1 };
  };

  // ---------- theme / tokens ----------
  const cs = getComputedStyle(document.documentElement);
  R.theme = {
    htmlClass: document.documentElement.className,
    dataTheme: document.documentElement.getAttribute('data-theme'),
    colorScheme: cs.colorScheme,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    bodyFont: getComputedStyle(document.body).fontFamily,
    bodySize: getComputedStyle(document.body).fontSize,
    bodyLineHeight: getComputedStyle(document.body).lineHeight,
  };

  // ---------- overflow ----------
  const de = document.documentElement;
  R.overflow = { docScrollW: de.scrollWidth, innerW: vw, overflowing: de.scrollWidth > vw + 1, offenders: [] };
  if (R.overflow.overflowing) {
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      const right = r.right + scrollX;
      if (right > vw + 1 && r.width <= de.scrollWidth) {
        const st = getComputedStyle(el);
        if (st.position === 'fixed') return;
        R.overflow.offenders.push({ el: sel(el), right: Math.round(right), w: Math.round(r.width) });
      }
    });
    R.overflow.offenders = R.overflow.offenders.slice(0, 12);
  }

  // ---------- headings ----------
  const hs = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  R.headings = { count: hs.length, h1: hs.filter(h => h.tagName === 'H1').length,
    outline: hs.slice(0, 40).map(h => ({ t: h.tagName, txt: (h.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
      size: getComputedStyle(h).fontSize, weight: getComputedStyle(h).fontWeight, lh: getComputedStyle(h).lineHeight })),
    skips: [] };
  let prev = 0;
  hs.forEach(h => { const l = +h.tagName[1]; if (prev && l > prev + 1) R.headings.skips.push(`${'h'+prev} -> ${h.tagName} "${(h.textContent||'').trim().slice(0,40)}"`); prev = l; });

  // ---------- landmarks ----------
  R.landmarks = {
    header: document.querySelectorAll('header, [role=banner]').length,
    nav: document.querySelectorAll('nav, [role=navigation]').length,
    main: document.querySelectorAll('main, [role=main]').length,
    footer: document.querySelectorAll('footer, [role=contentinfo]').length,
    aside: document.querySelectorAll('aside').length,
    navLabels: [...document.querySelectorAll('nav')].map(n => n.getAttribute('aria-label') || '(none)'),
  };

  // ---------- skip link ----------
  const first = document.querySelector('a[href^="#"]');
  R.skipLink = first ? { text: (first.textContent || '').trim().slice(0, 40), href: first.getAttribute('href') } : null;

  // ---------- images ----------
  const imgs = [...document.querySelectorAll('img')];
  R.images = {
    total: imgs.length,
    noAlt: imgs.filter(i => !i.hasAttribute('alt')).map(i => (i.currentSrc || i.src).split('/').pop()).slice(0, 15),
    emptyAlt: imgs.filter(i => i.getAttribute('alt') === '').length,
    noDims: imgs.filter(i => !i.getAttribute('width') || !i.getAttribute('height')).length,
    lazy: imgs.filter(i => i.loading === 'lazy').length,
    oversized: imgs.filter(i => i.naturalWidth && i.getBoundingClientRect().width > 0 && i.naturalWidth > i.getBoundingClientRect().width * 2.2)
      .map(i => ({ src: (i.currentSrc || i.src).split('/').pop().slice(0, 60), nat: i.naturalWidth, disp: Math.round(i.getBoundingClientRect().width) })).slice(0, 15),
    distorted: imgs.filter(i => { const r = i.getBoundingClientRect(); if (!i.naturalWidth || r.width < 10) return false;
      const na = i.naturalWidth / i.naturalHeight, da = r.width / r.height; return Math.abs(na - da) / na > 0.06 && getComputedStyle(i).objectFit === 'fill'; })
      .map(i => (i.currentSrc || i.src).split('/').pop().slice(0, 60)).slice(0, 10),
  };

  // ---------- touch targets ----------
  const inter = [...document.querySelectorAll('a[href],button,input,select,textarea,[role=button]')];
  R.touchTargets = { total: inter.length, small: [] };
  inter.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.top > document.documentElement.scrollHeight) return;
    if (r.height < 24 || r.width < 24) {
      R.touchTargets.small.push({ el: sel(el), txt: (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
    }
  });
  R.touchTargets.smallCount = R.touchTargets.small.length;
  R.touchTargets.small = R.touchTargets.small.slice(0, 20);

  // ---------- contrast ----------
  R.contrast = { checked: 0, fails: [] };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const txt = node.nodeValue.trim();
    if (txt.length < 3) continue;
    const el = node.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const st = getComputedStyle(el);
    if (st.visibility === 'hidden' || st.opacity === '0') continue;
    const key = sel(el) + '|' + st.color + '|' + st.fontSize;
    if (seen.has(key)) continue; seen.add(key);
    const fg = parseRGB(st.color); if (!fg) continue;
    const bg = effBg(el);
    const cr = ratio(fg, bg);
    R.contrast.checked++;
    const px = parseFloat(st.fontSize), bold = +st.fontWeight >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (cr < need) R.contrast.fails.push({ el: sel(el), txt: txt.slice(0, 40), fg: st.color, bg: `rgb(${bg.r},${bg.g},${bg.b})`, size: st.fontSize, ratio: +cr.toFixed(2), need });
    if (seen.size > 400) break;
  }
  R.contrast.failCount = R.contrast.fails.length;
  R.contrast.fails = R.contrast.fails.sort((a, b) => a.ratio - b.ratio).slice(0, 20);

  // ---------- focus ----------
  const focusables = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')]
    .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  R.focus = { count: focusables.length, samples: [] };
  focusables.slice(0, 10).forEach(el => {
    el.focus();
    const st = getComputedStyle(el);
    R.focus.samples.push({ el: sel(el), outlineWidth: st.outlineWidth, outlineStyle: st.outlineStyle, outlineColor: st.outlineColor, boxShadow: st.boxShadow.slice(0, 60) });
  });
  if (document.activeElement) document.activeElement.blur();
  R.focus.positiveTabindex = [...document.querySelectorAll('[tabindex]')].filter(e => +e.getAttribute('tabindex') > 0).length;

  // ---------- motion ----------
  const anims = document.getAnimations ? document.getAnimations() : [];
  R.motion = {
    runningAnimations: anims.length,
    infinite: anims.filter(a => { try { return a.effect && a.effect.getTiming().iterations === Infinity; } catch { return false; } }).length,
    details: anims.slice(0, 15).map(a => { let t = {}; try { t = a.effect.getTiming(); } catch {}
      return { target: a.effect && a.effect.target ? sel(a.effect.target) : '?', dur: t.duration, iter: t.iterations === Infinity ? 'inf' : t.iterations, name: a.animationName || '' }; }),
  };
  let transitionEls = 0, animEls = 0, blurEls = 0, bdFilterEls = 0;
  document.querySelectorAll('body *').forEach(el => {
    const st = getComputedStyle(el);
    if (st.transitionDuration !== '0s') transitionEls++;
    if (st.animationName !== 'none') animEls++;
    if (st.filter && st.filter.includes('blur')) blurEls++;
    if (st.backdropFilter && st.backdropFilter !== 'none') bdFilterEls++;
  });
  R.motion.transitionEls = transitionEls; R.motion.animEls = animEls;
  R.motion.blurEls = blurEls; R.motion.backdropFilterEls = bdFilterEls;

  // ---------- layout / typography metrics ----------
  const main = document.querySelector('main') || document.body;
  const mr = main.getBoundingClientRect();
  R.layout = { docHeight: de.scrollHeight, mainWidth: Math.round(mr.width), viewport: `${vw}x${vh}` };
  const hdr = document.querySelector('header');
  if (hdr) { const hr = hdr.getBoundingClientRect(); const hst = getComputedStyle(hdr);
    R.layout.header = { h: Math.round(hr.height), position: hst.position, bg: hst.backgroundColor, backdrop: hst.backdropFilter, z: hst.zIndex,
      borderBottom: hst.borderBottomColor + ' ' + hst.borderBottomWidth }; }
  const ftr = document.querySelector('footer');
  if (ftr) R.layout.footer = { h: Math.round(ftr.getBoundingClientRect().height), bg: getComputedStyle(ftr).backgroundColor };

  const ps = [...document.querySelectorAll('p')].filter(p => (p.textContent || '').trim().length > 120);
  R.typography = { longParas: ps.length, measures: ps.slice(0, 12).map(p => {
    const st = getComputedStyle(p); const w = p.getBoundingClientRect().width; const fs = parseFloat(st.fontSize);
    return { w: Math.round(w), fs: st.fontSize, lh: st.lineHeight, approxCPL: Math.round(w / (fs * 0.5)) }; }) };
  R.typography.fontsUsed = [...new Set([...document.querySelectorAll('body *')].slice(0, 1500).map(e => getComputedStyle(e).fontFamily))].slice(0, 8);

  // ---------- nav ----------
  const nav = document.querySelector('header nav') || document.querySelector('nav');
  if (nav) {
    const links = [...nav.querySelectorAll('a')].filter(a => a.getBoundingClientRect().width > 0);
    R.nav = { visibleLinks: links.map(a => ({ t: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24), href: a.getAttribute('href'), w: Math.round(a.getBoundingClientRect().width) })),
      navRect: (({ x, y, width, height }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height) }))(nav.getBoundingClientRect()),
      wraps: (() => { const ys = new Set(links.map(a => Math.round(a.getBoundingClientRect().top))); return ys.size; })() };
  }
  const logo = document.querySelector('header img, header svg');
  if (logo) { const lr = logo.getBoundingClientRect(); R.nav = R.nav || {};
    R.nav.logo = { tag: logo.tagName, w: Math.round(lr.width), h: Math.round(lr.height), src: logo.getAttribute('src') || '(inline svg)', alt: logo.getAttribute('alt') }; }

  // ---------- misc a11y ----------
  const ids = [...document.querySelectorAll('[id]')].map(e => e.id);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  R.misc = {
    duplicateIds: [...new Set(dup)].slice(0, 15),
    lang: document.documentElement.lang,
    title: document.title,
    genericLinks: [...document.querySelectorAll('a')].filter(a => /^(read more|more|click here|here|learn more)$/i.test((a.textContent || '').trim())).length,
    blankNoRel: [...document.querySelectorAll('a[target=_blank]')].filter(a => !/noopener/.test(a.rel || '')).length,
    inputsNoLabel: [...document.querySelectorAll('input,select,textarea')].filter(i => i.type !== 'hidden' && !i.getAttribute('aria-label') && !i.getAttribute('aria-labelledby') && !(i.id && document.querySelector(`label[for="${CSS.escape(i.id)}"]`)) && !i.closest('label')).length,
    scripts: document.querySelectorAll('script[src]').length,
    inlineScripts: document.querySelectorAll('script:not([src])').length,
    stylesheets: document.querySelectorAll('link[rel=stylesheet]').length,
    domNodes: document.querySelectorAll('*').length,
    iframes: document.querySelectorAll('iframe').length,
    canonical: (document.querySelector('link[rel=canonical]') || {}).href || null,
    metaDesc: ((document.querySelector('meta[name=description]') || {}).content || '').slice(0, 120),
    ogImage: (document.querySelector('meta[property="og:image"]') || {}).content || null,
    jsonLdTypes: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { const j = JSON.parse(s.textContent); return j['@type'] || (j['@graph'] || []).map(x => x['@type']).join(','); } catch { return 'parse-error'; } }),
  };

  // ---------- section inventory (homepage) ----------
  R.sections = [...document.querySelectorAll('section, main > div[id]')].slice(0, 30).map(s => {
    const r = s.getBoundingClientRect(); const st = getComputedStyle(s);
    return { id: s.id || '(none)', h: Math.round(r.height), pt: st.paddingTop, pb: st.paddingBottom, bg: st.backgroundImage !== 'none' ? 'gradient/image' : st.backgroundColor };
  });

  return R;
}
