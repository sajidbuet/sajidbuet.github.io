/* Phase 7 §22 — internal link / route sanity over the generated output.
   Static, so it covers every page rather than a browsable subset.

   Build first:
     $env:HUGO_IGNOREFILES = "-SAJID-PC\.,outreach[\\/]templates"
     hugo --destination public_p7
   Then:
     node docs/redesign/evidence/phase7-links.mjs public_p7
*/
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, posix } from 'node:path';
import { HERE, REPO } from './phase7-cdp.mjs';

const ROOT = resolve(REPO, process.argv[2] || 'public_p7');
const OUT = resolve(HERE, 'phase7-links.json');
if (!existsSync(ROOT)) { console.error('no build at ' + ROOT); process.exit(1); }

const HOSTS = ['https://www.sajid.bd', 'http://www.sajid.bd', 'https://sajid.bd'];

/* ---- index the build ---- */
const files = new Set();
(function walk(d) {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else files.add('/' + p.slice(ROOT.length + 1).split('\\').join('/'));
  }
})(ROOT);

const htmlFiles = [...files].filter(f => f.endsWith('.html'));
const isAlias = (f) => {
  try { const t = readFileSync(join(ROOT, f), 'utf8');
    return /<meta http-equiv="refresh"/i.test(t.slice(0, 900)) ? (t.match(/url=([^"']+)/i) || [])[1] || true : false;
  } catch { return false; }
};

const aliasMap = new Map();
for (const f of htmlFiles) { const a = isAlias(f); if (a) aliasMap.set(f, a); }

const resolveTarget = (p) => {
  if (files.has(p)) return p;
  if (files.has(p + 'index.html')) return p + 'index.html';
  if (files.has(p + '/index.html')) return p + '/index.html';
  if (p.endsWith('/') && files.has(p.slice(0, -1))) return p.slice(0, -1);
  return null;
};

/* ---- scan ---- */
const R = {
  meta: { root: ROOT, at: new Date().toISOString(), htmlPages: htmlFiles.length, aliasPages: aliasMap.size, totalFiles: files.size },
  broken: [], brokenImages: [], staleLinks: [], badAnchors: [],
  aliasCheck: { total: 0, pass: 0, fail: [] },
  counts: { links: 0, internal: 0, external: 0, images: 0, mailto: 0 },
};

const STALE = [/^\/outreach\//, /^\/people\//, /^\/projects\/g-\d/, /^\/opportunities/];
const LINK_RE = /<a\b[^>]*?href\s*=\s*["']([^"']*)["'][^>]*>/gi;
const IMG_RE = /<img\b[^>]*?src\s*=\s*["']([^"']*)["'][^>]*>/gi;
const SRCSET_RE = /<(?:img|source)\b[^>]*?srcset\s*=\s*["']([^"']*)["']/gi;

for (const f of htmlFiles) {
  if (aliasMap.has(f)) continue;                       // alias stubs have no real content
  const pageUrl = f.replace(/index\.html$/, '');
  /* Strip <script>, <template> and comments: they carry JS template literals like
     href="result.url" that are not links. Keeping them produced 2,496 false positives. */
  const html = readFileSync(join(ROOT, f), 'utf8')
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<template\b[\s\S]*?<\/template>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const ids = new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)].map(m => m[1]));

  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(html))) {
    let href = m[1].trim();
    R.counts.links++;
    if (!href || href.startsWith('javascript:')) continue;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) { R.counts.mailto++; continue; }
    for (const h of HOSTS) if (href.startsWith(h)) href = href.slice(h.length) || '/';
    if (/^https?:\/\//i.test(href)) { R.counts.external++; continue; }
    if (href.startsWith('#')) {
      const id = decodeURIComponent(href.slice(1));
      if (id && !ids.has(id)) R.badAnchors.push({ page: pageUrl, anchor: href });
      continue;
    }
    R.counts.internal++;
    const [pathPart, hash] = href.split('#');
    let p = pathPart;
    if (!p.startsWith('/')) p = posix.normalize(posix.join(posix.dirname(f), p));
    p = decodeURIComponent(p.split('?')[0]);
    const hit = resolveTarget(p);
    if (!hit) R.broken.push({ page: pageUrl, href });
    else if (hash && hit.endsWith('.html')) {
      const tIds = new Set([...readFileSync(join(ROOT, hit), 'utf8').matchAll(/\sid\s*=\s*["']([^"']+)["']/gi)].map(x => x[1]));
      if (!tIds.has(decodeURIComponent(hash))) R.badAnchors.push({ page: pageUrl, anchor: href });
    }
    for (const rx of STALE) if (rx.test(p)) R.staleLinks.push({ page: pageUrl, href: p });
  }

  IMG_RE.lastIndex = 0;
  while ((m = IMG_RE.exec(html))) {
    let src = m[1].trim(); R.counts.images++;
    if (!src || src.startsWith('data:')) continue;
    for (const h of HOSTS) if (src.startsWith(h)) src = src.slice(h.length);
    if (/^https?:\/\//i.test(src)) continue;
    let p = src.startsWith('/') ? src : posix.normalize(posix.join(posix.dirname(f), src));
    p = decodeURIComponent(p.split('?')[0]);
    if (!files.has(p)) R.brokenImages.push({ page: pageUrl, src: p });
  }

  SRCSET_RE.lastIndex = 0;
  while ((m = SRCSET_RE.exec(html))) {
    for (const cand of m[1].split(',')) {
      let u = cand.trim().split(/\s+/)[0];
      if (!u || /^(data|https?):/.test(u)) continue;
      let p = u.startsWith('/') ? u : posix.normalize(posix.join(posix.dirname(f), u));
      p = decodeURIComponent(p.split('?')[0]);
      if (!files.has(p)) R.brokenImages.push({ page: pageUrl, src: p, from: 'srcset' });
    }
  }
}

/* ---- aliases: stub exists → points at a real page → target is not itself a stub ---- */
for (const [f, target] of aliasMap) {
  R.aliasCheck.total++;
  let t = String(target);
  for (const h of HOSTS) if (t.startsWith(h)) t = t.slice(h.length) || '/';
  const hit = t.startsWith('/') ? resolveTarget(decodeURIComponent(t.split('#')[0].split('?')[0])) : null;
  if (!hit) R.aliasCheck.fail.push({ alias: f.replace(/index\.html$/, ''), target: t, why: 'target missing' });
  else if (aliasMap.has(hit)) R.aliasCheck.fail.push({ alias: f.replace(/index\.html$/, ''), target: t, why: 'target is itself an alias' });
  else R.aliasCheck.pass++;
}

/* ---- the routes Phases 4–5 moved must still redirect ---- */
R.legacyRoutes = {};
for (const legacy of ['/projects/g-01/', '/projects/g-02/', '/projects/g-03/', '/outreach/', '/outreach/lor/',
  '/outreach/scientific-typing/', '/outreach/templates/', '/outreach/graphics/', '/outreach/blog/',
  '/outreach/professional/', '/outreach/songs/', '/outreach/poetry/', '/outreach/hobbies/', '/people/',
  '/outreach/blog/20260811-bracu-arm-workshop/']) {
  const f = legacy + 'index.html';
  R.legacyRoutes[legacy] = files.has(f) ? (aliasMap.get(f) ? 'ALIAS -> ' + aliasMap.get(f) : 'REAL PAGE') : 'MISSING';
}

/* The Bengali mirror is a known Phase 8 item (content/bn nested in the EN contentDir);
   split it out so Phase 7's EN result is not buried under it. */
const isBn = (b) => b.page.startsWith('/bn/') || b.href.startsWith('/bn/');
R.brokenEn = R.broken.filter(b => !isBn(b));
R.brokenBn = R.broken.filter(isBn);
R.summary = {
  pagesScanned: htmlFiles.length - aliasMap.size,
  links: R.counts.links, internal: R.counts.internal, external: R.counts.external,
  broken: R.broken.length, brokenEn: R.brokenEn.length, brokenBn: R.brokenBn.length,
  brokenEnUnique: [...new Set(R.brokenEn.map(b => b.href))].slice(0, 30),
  brokenBnUnique: [...new Set(R.brokenBn.map(b => b.href))].slice(0, 20),
  brokenImages: R.brokenImages.length,
  badAnchors: R.badAnchors.length, staleLinks: R.staleLinks.length,
  aliasPass: R.aliasCheck.pass, aliasFail: R.aliasCheck.fail.length,
};
R.broken = R.broken.slice(0, 60);
R.brokenImages = R.brokenImages.slice(0, 60);
R.badAnchors = R.badAnchors.slice(0, 60);
R.staleLinks = R.staleLinks.slice(0, 60);

writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log(JSON.stringify(R.summary, null, 1));
console.log(JSON.stringify(R.legacyRoutes, null, 1));
