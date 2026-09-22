/* Phase 5 QA driver, part 2 — the remaining routes plus zoom / focus /
   reduced-motion / redirect probes. Split out because the very tall workshop
   handout (≈364 KB of HTML) aborts a captureBeyondViewport full-page shot, so
   tall pages are captured viewport-only here. */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9416;
const SP = 'C:/Users/BUETEEE/AppData/Local/Temp/claude/D--Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/f84b93ed-f291-4def-8568-d3df8fd61e74/scratchpad';
const ROOT = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase-5';
const OUT = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/evidence/phase5-qa.json';
const B = 'http://127.0.0.1:1331';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${SP}/chrome-qa5b`, '--no-first-run', '--force-device-scale-factor=1',
  '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });

let ok = false;
for (let i = 0; i < 90 && !ok; i++) {
  try { ok = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch {}
  if (!ok) await sleep(250);
}
if (!ok) { console.error('Chrome did not start'); process.exit(1); }

const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const hs = new Map();
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method && hs.has(m.method)) hs.get(m.method).forEach(h => h(m.params));
});
const send = (M, P = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: M, params: P })); });
const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
const once = (m, to = 40000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const consoleErrors = [];
on('Log.entryAdded', p => { if (p.entry.level === 'error') consoleErrors.push({ url: (p.entry.url||'').slice(-60), text: p.entry.text.slice(0, 150) }); });

const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value;
const shot = async (f, full) => {
  try {
    const c = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full });
    mkdirSync(f.substring(0, f.lastIndexOf('/')), { recursive: true });
    writeFileSync(f, Buffer.from(c.data, 'base64'));
    return true;
  } catch (e) { console.log('SHOT FAILED (captured viewport instead): ' + f.split('/').pop());
    try { const c = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(f, Buffer.from(c.data, 'base64')); return true; } catch { return false; }
  }
};
const go = async (path, w = 1440, h = 900, theme = 'light', mobile = false, settle = 1400) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
  const l = once('Page.loadEventFired');
  await send('Page.navigate', { url: B + path });
  await l; await sleep(settle);
};

const AUDIT = `(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const hs = q('h1,h2,h3,h4,h5,h6').filter(h => h.offsetParent !== null)
    .map(h => ({ l: +h.tagName[1], t: (h.textContent||'').trim().slice(0,60) }));
  let skips = [];
  for (let i = 1; i < hs.length; i++) if (hs[i].l - hs[i-1].l > 1) skips.push(hs[i-1].t + ' (h' + hs[i-1].l + ') -> ' + hs[i].t + ' (h' + hs[i].l + ')');
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;
  const offenders = overflow > 1 ? q('body *').filter(e => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && (r.right > de.clientWidth + 2 || r.left < -2);
  }).slice(0, 6).map(e => (e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0,2).join('.') : '')).slice(0,70)) : [];
  return {
    h1: q('h1').length,
    h1text: q('h1').map(h => (h.textContent||'').trim().slice(0,70)),
    headings: hs.length, skips,
    overflowPx: overflow, offenders,
    subMinTargets: q('a,button,[role=button],input,select,summary').filter(e => { const r = e.getBoundingClientRect(); return r.width>0 && r.height>0 && (r.width<24||r.height<24); }).length,
    namelessLinks: q('a').filter(a => a.offsetParent !== null).filter(a => ((a.getAttribute('aria-label')||a.textContent||'').trim().length === 0) && !a.querySelector('img[alt]:not([alt=""])')).length,
    imgsNoAlt: q('img').filter(i => !i.hasAttribute('alt')).length,
    docHeight: de.scrollHeight, title: document.title, lang: de.getAttribute('lang')||''
  };
})()`;

const VIEWPORTS = [
  ['1920x1080', 1920, 1080, false], ['1440x900', 1440, 900, false],
  ['1280x800', 1280, 800, false], ['1024x768', 1024, 768, false],
  ['768x1024', 768, 1024, true], ['430x932', 430, 932, true], ['390x844', 390, 844, true],
];

// Routes still missing from part 1. Tall pages captured viewport-only.
const ROUTES = [
  ['workshop-arm', '/teaching/workshops/bracu-arm-workshop/', false],
  ['teaching-curriculum', '/teaching/curriculum/', true],
  ['course-eee303', '/teaching/jul2025_eee303/', false],
];

const R = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { audits: {}, responsive: [], dark: {}, zoom: {}, focus: {} };
R.audits ||= {}; R.responsive ||= []; R.dark ||= {}; R.zoom ||= {}; R.focus ||= {};

for (const [slug, path, full] of ROUTES) {
  for (const [vp, w, h, mob] of VIEWPORTS) {
    await go(path, w, h, 'light', mob);
    const a = await ev(AUDIT);
    R.audits[`${slug}@${vp}`] = a;
    if (a.overflowPx > 1) R.responsive.push({ route: path, vp, overflowPx: a.overflowPx, offenders: a.offenders });
    await shot(`${ROOT}/full-qa/${slug}-${vp}-light-${full ? 'full' : 'top'}.png`, full);
  }
  await go(path, 1440, 900, 'dark');
  R.dark[slug] = await ev(AUDIT);
  await shot(`${ROOT}/full-qa/${slug}-1440x900-dark-${full ? 'full' : 'top'}.png`, full);
}

/* 200% zoom */
for (const [slug, path] of [['teaching', '/teaching/'], ['resources', '/resources/'], ['team', '/authors/']]) {
  await go(path, 640, 900, 'light');
  R.zoom[slug] = await ev(AUDIT);
  await shot(`${ROOT}/full-qa/${slug}-zoom200-640-light.png`, true);
}

/* focus visibility */
await go('/resources/', 1440, 900, 'light');
R.focus.resources = await ev(`(() => {
  const els = Array.from(document.querySelectorAll('a,button')).filter(e => e.offsetParent !== null).slice(0, 16);
  let noRing = 0; const sample = [];
  for (const e of els) { e.focus(); const cs = getComputedStyle(e);
    const ow = parseFloat(cs.outlineWidth)||0;
    const hasRing = (cs.outlineStyle !== 'none' && ow > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
    if (!hasRing) { noRing++; sample.push((e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,40)); } }
  return { checked: els.length, withoutVisibleRing: noRing, sample };
})()`);
await ev(`document.querySelectorAll('.sj-res-list__link')[0] && document.querySelectorAll('.sj-res-list__link')[0].focus()`);
await shot(`${ROOT}/full-qa/resources-1440x900-light-focus.png`, false);

/* reduced motion */
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
await go('/resources/', 1440, 900, 'light');
R.reducedMotion = await ev(AUDIT);
await shot(`${ROOT}/full-qa/resources-1440x900-light-reducedmotion.png`, true);
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });

/* mobile menu still works with the renamed Resources item */
await go('/resources/', 390, 844, 'light', true);
R.mobileMenu = await ev(`(() => {
  const btn = document.querySelector('[aria-controls][aria-expanded]');
  if (!btn) return { found: false };
  const before = btn.getAttribute('aria-expanded');
  btn.click();
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  const items = panel ? Array.from(panel.querySelectorAll('a')).map(a => a.textContent.trim()).filter(Boolean) : [];
  return { found: true, before, after: btn.getAttribute('aria-expanded'), itemCount: items.length, items: items.slice(0, 12) };
})()`);
await shot(`${ROOT}/full-qa/resources-390x844-light-mobilemenu.png`, false);

/* browser-verified redirects */
R.redirects = {};
for (const old of ['/outreach/', '/outreach/lor/', '/outreach/blog/', '/outreach/songs/', '/outreach/poetry/',
                   '/outreach/hobbies/', '/outreach/graphics/', '/outreach/templates/', '/outreach/professional/',
                   '/outreach/scientific-typing/', '/outreach/blog/20260811-bracu-arm-workshop/',
                   '/outreach/blog/20250511-ct-admin/', '/people/']) {
  await go(old, 1440, 900, 'light', false, 1800);
  R.redirects[old] = await ev('location.pathname');
}

R.consoleErrors = consoleErrors;
writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('DONE part2');
try { ws.close(); } catch {}
proc.kill();
process.exit(0);
