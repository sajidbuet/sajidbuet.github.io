/* Phase 6 QA driver — detail templates.
   Drives installed Chrome over CDP. Nothing installed.
   Requires `hugo server` on 127.0.0.1:1332. */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9420;
const SP = 'C:/Users/BUETEEE/AppData/Local/Temp/claude/D--Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/f84b93ed-f291-4def-8568-d3df8fd61e74/scratchpad';
const ROOT = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase-6';
const OUT = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/evidence/phase6-qa.json';
const B = 'http://127.0.0.1:1332';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${SP}/chrome-qa6`, '--no-first-run', '--force-device-scale-factor=1',
  '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let ok = false;
for (let i = 0; i < 90 && !ok; i++) { try { ok = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch {} if (!ok) await sleep(250); }
if (!ok) { console.error('chrome failed'); process.exit(1); }
const t0 = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t0.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const hs = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method && hs.has(m.method)) hs.get(m.method).forEach(h => h(m.params)); });
const send = (M, P = {}, to = 25000) => new Promise((res, rej) => {
  const i = ++id; pend.set(i, { res, rej });
  setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('CDP timeout: ' + M)); } }, to);
  ws.send(JSON.stringify({ id: i, method: M, params: P }));
});
const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
const once = (m, to = 40000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const consoleErrors = [];
on('Log.entryAdded', p => { if (p.entry.level === 'error') consoleErrors.push((p.entry.url || '').slice(-50) + ' :: ' + p.entry.text.slice(0, 120)); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value;
const TALL = new Set(['workshop-detail']);
const shot = async (f, full) => {
  try {
    const c = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full });
    mkdirSync(f.substring(0, f.lastIndexOf('/')), { recursive: true });
    writeFileSync(f, Buffer.from(c.data, 'base64')); return true;
  } catch { try { const c = await send('Page.captureScreenshot', { format: 'png' });
      mkdirSync(f.substring(0, f.lastIndexOf('/')), { recursive: true });
      writeFileSync(f, Buffer.from(c.data, 'base64')); return true; } catch { return false; } }
};
const go = async (path, w, h, theme, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: !!mobile, maxTouchPoints: 5 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
  const l = once('Page.loadEventFired');
  await send('Page.navigate', { url: B + path }); await l; await sleep(1300);
};

const AUDIT = `(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const vis = e => e.offsetParent !== null || getComputedStyle(e).position === 'fixed';
  const hs = q('h1,h2,h3,h4,h5,h6').filter(vis).map(h => ({ l: +h.tagName[1], t: (h.textContent||'').trim().slice(0,50) }));
  let skips = [];
  for (let i = 1; i < hs.length; i++) if (hs[i].l - hs[i-1].l > 1) skips.push(hs[i-1].t + ' (h' + hs[i-1].l + ') -> ' + hs[i].t + ' (h' + hs[i].l + ')');
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;
  const offenders = overflow > 1 ? q('body *').filter(e => { const r = e.getBoundingClientRect();
      return r.width > 0 && (r.right > de.clientWidth + 2 || r.left < -2); })
      .slice(0,6).map(e => (e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).slice(0,2).join('.') : '')).slice(0,60)) : [];
  // measured reading width of the main prose column
  const prose = document.querySelector('.sj-prose');
  let measure = null;
  if (prose) {
    const p = prose.querySelector('p');
    const cs = getComputedStyle(prose);
    const chW = (() => { const s = document.createElement('span'); s.textContent='0'.repeat(50);
      s.style.cssText='position:absolute;visibility:hidden;white-space:pre;font:'+getComputedStyle(p||prose).font;
      document.body.appendChild(s); const w=s.getBoundingClientRect().width/50; s.remove(); return w; })();
    measure = { px: Math.round(prose.getBoundingClientRect().width), ch: chW ? Math.round(prose.getBoundingClientRect().width / chW) : null, maxWidth: cs.maxWidth };
  }
  const crumbs = (() => { const n = document.querySelector('nav.sj-crumbs');
    if (!n) return null;
    return { isNav: n.tagName === 'NAV', label: n.getAttribute('aria-label'),
             list: !!n.querySelector('ol'), items: n.querySelectorAll('li').length,
             currentNotLinked: !!n.querySelector('[aria-current="page"]') && !n.querySelector('a[aria-current="page"]') }; })();
  return {
    h1: q('h1').length, headings: hs.length, skips,
    overflowPx: overflow, offenders,
    measure, crumbs,
    imgsNoDim: q('img').filter(i => !(i.getAttribute('width') && i.getAttribute('height'))).length,
    imgsNoAlt: q('img').filter(i => !i.hasAttribute('alt')).length,
    emptyHeadings: q('h1,h2,h3,h4,h5,h6').filter(h => vis(h) && !h.textContent.trim()).length,
    docHeight: de.scrollHeight, title: document.title
  };
})()`;

const ROUTES = [
  ['publication-detail', '/publication/j-023/'],
  ['publication-sparse', '/publication/x-03/'],
  ['project-detail', '/projects/ctadmin/'],
  ['project-max', '/projects/qa-fixture-max/'],
  ['project-min', '/projects/qa-fixture-min/'],
  ['course-detail', '/teaching/jul2025_eee303/'],
  ['course-archive', '/teaching/archive/jan2023_eee416/'],
  ['course-min', '/teaching/qa-fixture-course/'],
  ['team-profile', '/authors/me/'],
  ['team-profile-student', '/authors/0421062344-ayon-sarker/'],
  ['article-detail', '/resources/blog/20260124-citation-count/'],
  ['article-min', '/resources/blog/qa-fixture-article/'],
  ['news-detail', '/news/2024-05-09-new-pg-course/'],
  ['workshop-detail', '/teaching/workshops/bracu-arm-workshop/'],
  ['notes-index', '/teaching/notes/'],
  ['book-index', '/teaching/notes/qa-fixture-book/'],
  ['book-chapter', '/teaching/notes/qa-fixture-book/ch-02/'],
  ['grant-detail', '/research/funding/g-01/'],
];

const VPS = [['1440x900', 1440, 900, false], ['768x1024', 768, 1024, true], ['390x844', 390, 844, true]];
import { existsSync, readFileSync } from 'node:fs';
const R = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : { audits: {}, overflow: [], dark: {}, consoleErrors: [] };
R.audits ||= {}; R.overflow ||= []; R.dark ||= {};

const DONE = new Set((process.env.PH6_SKIP || '').split(',').filter(Boolean));
for (const [slug, path] of ROUTES) {
  if (DONE.has(slug)) continue;
  for (const [vp, w, h, mob] of VPS) {
    await go(path, w, h, 'light', mob);
    const a = await ev(AUDIT);
    R.audits[`${slug}@${vp}`] = a;
    if (a && a.overflowPx > 1) R.overflow.push({ route: path, vp, px: a.overflowPx, offenders: a.offenders });
    await shot(`${ROOT}/full-qa/${slug}-${vp}-light.png`, !TALL.has(slug));
  }
  await go(path, 1440, 900, 'dark', false);
  R.dark[slug] = await ev(AUDIT);
  await shot(`${ROOT}/full-qa/${slug}-1440x900-dark.png`, !TALL.has(slug));
}

/* keyboard focus on a detail page with a breadcrumb and a pager */
await go('/teaching/notes/qa-fixture-book/ch-02/', 1440, 900, 'light', false);
await ev('document.body.focus()');
const tab = async () => {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'char', text: '\t' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  await sleep(55);
};
const seen = [];
for (let i = 0; i < 26; i++) { await tab();
  const r = await ev(`(() => { const e=document.activeElement; if(!e||e===document.body) return null;
    const cs=getComputedStyle(e); const ow=parseFloat(cs.outlineWidth)||0;
    return { tag:e.tagName.toLowerCase(), name:(e.getAttribute('aria-label')||e.textContent||'').trim().replace(/\\s+/g,' ').slice(0,36),
             ring:(cs.outlineStyle!=='none'&&ow>0)||(cs.boxShadow&&cs.boxShadow!=='none') }; })()`);
  if (r) seen.push(r);
}
R.focus = { tabbed: seen.length, withRing: seen.filter(s => s.ring).length, withoutRing: seen.filter(s => !s.ring).map(s => s.name) };

/* mobile: is the chapter sidebar a collapsible disclosure that does not eat width? */
await go('/teaching/notes/qa-fixture-book/ch-02/', 390, 844, 'light', true);
R.mobileSidebar = await ev(`(() => {
  const d = document.querySelector('details.sj-book-nav');
  if (!d) return { found: false };
  const sum = d.querySelector('summary');
  const sumVisible = sum ? getComputedStyle(sum).display !== 'none' : false;
  const before = d.open; d.open = false; const closedH = d.getBoundingClientRect().height;
  d.open = true; const openH = d.getBoundingClientRect().height; d.open = before;
  return { found: true, summaryVisible: sumVisible, collapses: closedH < openH, closedH: Math.round(closedH), openH: Math.round(openH) };
})()`);
await shot(`${ROOT}/full-qa/book-chapter-390x844-light-sidebar.png`, false);

R.consoleErrors = [...new Set(consoleErrors)];
writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log('DONE phase6-qa');
try { ws.close(); } catch {}
proc.kill(); process.exit(0);
