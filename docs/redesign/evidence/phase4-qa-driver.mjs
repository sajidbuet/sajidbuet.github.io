import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9410;
const SP = 'C:/Users/Sajid/AppData/Local/Temp/claude/C--Users-Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/c6ef8616-df74-46b1-9d32-459772a409c8/scratchpad';
const ROOT = 'C:/Users/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase-4';
const B = 'http://127.0.0.1:1330';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${SP}/chrome-qa4`, '--no-first-run', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
let ok = false; for (let i = 0; i < 90 && !ok; i++) { try { ok = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch {} if (!ok) await sleep(250); }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const hs = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else if (m.method && hs.has(m.method)) hs.get(m.method).forEach(h => h(m.params)); });
const send = (M, P = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: M, params: P })); });
const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
const once = (m, to = 40000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const errs = []; on('Log.entryAdded', p => { if (p.entry.level === 'error') errs.push(p.entry.text.slice(0, 130)); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value;
const shot = async (f, full) => { const c = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full }); mkdirSync(f.substring(0, f.lastIndexOf('/')), { recursive: true }); writeFileSync(f, Buffer.from(c.data, 'base64')); };
const go = async (path, w = 1440, h = 900, theme = 'light', mobile = false, settle = 2600) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
  const l = once('Page.loadEventFired'); await send('Page.navigate', { url: B + path }); await l; await sleep(settle); };

const R = {};

// ---- 1. Math rendering (rendered evidence, not source inspection) ----
await go('/publication/j-029/');
R.math = await ev(`(()=>{const h=document.querySelector('h1');
 return JSON.stringify({h1Text:h?h.textContent.trim().slice(0,70):null,
  katexNodes:document.querySelectorAll('.katex').length,
  rawDollarInH1:h?/\\$/.test(h.textContent):null,
  docTitle:document.title.slice(0,70)})})()`);
await go('/publication/');
R.mathList = await ev(`JSON.stringify({katexNodes:document.querySelectorAll('.katex').length,
  rawDollarsVisible:(document.body.innerText.match(/\\$\\[\\[/g)||[]).length})`);

// ---- 2. Publication filters still work ----
R.filters = await ev(`(()=>{const groups=[...document.querySelectorAll('[data-filter-group]')].map(e=>e.getAttribute('data-filter-group'));
 const items=document.querySelectorAll('.pub-item, [data-pub], article').length;
 return JSON.stringify({filterGroups:[...new Set(groups)],totalRowsInDom:document.querySelectorAll('.pub-hidden').length+items,
  hasPagination:!!document.querySelector('.pagination, nav[aria-label*=age]')})})()`);

// ---- 3. Homepage featured projects now real ----
await go('/');
R.homeProjects = await ev(`(()=>{const s=document.getElementById('projects-portfolio');if(!s)return'missing';
 const cards=[...s.querySelectorAll('.sj-card')];
 return JSON.stringify({height:Math.round(s.getBoundingClientRect().height),cards:cards.length,
  titles:cards.map(c=>{const a=c.querySelector('.sj-card__title a');return a?a.textContent.trim():null}),
  linksToOldProjects:[...s.querySelectorAll('a')].filter(a=>/\\/projects\\/g-/.test(a.getAttribute('href')||'')).length})})()`);

// ---- 4. Internal link crawl ----
const CRAWL = ['/', '/research/', '/research/funding/', '/projects/', '/projects/ctadmin/',
  '/projects/scholar-profile-exporter/', '/publication/', '/publication/j-029/', '/authors/',
  '/teaching/', '/news/', '/outreach/', '/research/photonics/', '/research/funding/g-01/'];
const seen = new Map(); const stale = [];
for (const p of CRAWL) {
  await go(p, 1440, 900, 'light', false, 900);
  const links = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>h&&!/^(https?:|mailto:|tel:|#)/.test(h)))`));
  for (const l of links) {
    const clean = l.split('#')[0];
    if (!clean) continue;
    if (/^\/projects\/g-/.test(clean)) stale.push(`${p} -> ${clean}`);
    seen.set(clean, (seen.get(clean) || 0) + 1);
  }
}
const broken = [];
for (const [href] of seen) {
  try { const r = await fetch(B + href); if (!r.ok) broken.push(`${href} (${r.status})`); }
  catch { broken.push(`${href} (fetch failed)`); }
}
R.linkCrawl = { uniqueInternalLinks: seen.size, broken, staleGrantLinks: stale };

// ---- 5. Accessibility + responsive across the priority routes ----
const AUDIT = readFileSync(`${SP}/audit.js`, 'utf8');
const ROUTES = { research: '/research/', funding: '/research/funding/', projects: '/projects/',
  'project-detail': '/projects/ctadmin/', publications: '/publication/' };
R.pages = [];
for (const [name, path] of Object.entries(ROUTES)) {
  for (const theme of ['light', 'dark']) {
    for (const [w, h] of [[1920,1080],[1440,900],[1280,800],[1024,768],[768,1024],[430,932],[390,844]]) {
      await go(path, w, h, theme, w < 1024, w === 1440 ? 2200 : 700);
      if (w === 1440 || w === 390) await shot(`${ROOT}/full-qa/${name}-${w}x${h}-${theme}-chromium.png`, true);
      const m = await ev(`JSON.stringify({over:document.documentElement.scrollWidth>innerWidth+1,h1:document.querySelectorAll('h1').length,main:document.querySelectorAll('main').length})`);
      const mm = JSON.parse(m);
      if (mm.over || mm.h1 !== 1 || mm.main !== 1) R.pages.push({ name, vp: `${w}x${h}`, theme, ...mm });
    }
  }
  await go(path, 1440, 900, 'light');
  const a = JSON.parse(await ev(`(function(){${AUDIT}\nreturn JSON.stringify(__audit());})()`));
  R.pages.push({ name, contrastFails: a.contrast.failCount, worst: a.contrast.fails.slice(0,3).map(f=>`${f.ratio} ${f.txt}`), smallTargets: a.touchTargets.smallCount, headingSkips: a.headings.skips });
}

// ---- 6. Review screenshots ----
const REV = ROOT + '/review';
const rev = [['01-research-1440-light','/research/',1440,900,'light',false],
  ['02-funding-1440-light','/research/funding/',1440,900,'light',false],
  ['03-projects-1440-light','/projects/',1440,900,'light',false],
  ['04-project-detail-1440-light','/projects/ctadmin/',1440,900,'light',false],
  ['05-publications-1440-light','/publication/',1440,900,'light',false],
  ['06-projects-390-light','/projects/',390,844,'light',true],
  ['07-project-detail-390-light','/projects/ctadmin/',390,844,'light',true],
  ['08-research-390-light','/research/',390,844,'light',true],
  ['09-projects-1440-dark','/projects/',1440,900,'dark',false],
  ['10-research-1440-dark','/research/',1440,900,'dark',false]];
for (const [n, p, w, h, th, mob] of rev) { await go(p, w, h, th, mob); await shot(`${REV}/${n}.png`, true); }

R.consoleErrors = [...new Set(errs)];
writeFileSync(`${SP}/qa4-results.json`, JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1).slice(0, 7000));
try { await fetch(`http://127.0.0.1:${PORT}/json/close`); } catch {}
proc.kill();
