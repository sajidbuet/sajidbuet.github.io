/* Audit-only pass (no screenshots) for the seven routes whose screenshots were
   captured in part 1 before that run aborted without writing its JSON. */
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, existsSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9418;
const SP = 'C:/Users/BUETEEE/AppData/Local/Temp/claude/D--Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/f84b93ed-f291-4def-8568-d3df8fd61e74/scratchpad';
const OUT = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/evidence/phase5-qa.json';
const B = 'http://127.0.0.1:1331';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${SP}/chrome-audit`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let ok = false;
for (let i = 0; i < 90 && !ok; i++) { try { ok = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch {} if (!ok) await sleep(250); }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const hs = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method && hs.has(m.method)) hs.get(m.method).forEach(h => h(m.params)); });
const send = (M, P = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: M, params: P })); });
const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
const once = (m, to = 30000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable');
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value;
const go = async (path, w, h, theme, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
  const l = once('Page.loadEventFired');
  await send('Page.navigate', { url: B + path }); await l; await sleep(700);
};

const AUDIT = `(() => {
  const q = s => Array.from(document.querySelectorAll(s));
  const hs = q('h1,h2,h3,h4,h5,h6').filter(h => h.offsetParent !== null).map(h => ({ l: +h.tagName[1], t: (h.textContent||'').trim().slice(0,60) }));
  let skips = [];
  for (let i = 1; i < hs.length; i++) if (hs[i].l - hs[i-1].l > 1) skips.push(hs[i-1].t + ' (h' + hs[i-1].l + ') -> ' + hs[i].t + ' (h' + hs[i].l + ')');
  const de = document.documentElement;
  const overflow = de.scrollWidth - de.clientWidth;
  return {
    h1: q('h1').length, h1text: q('h1').map(h => (h.textContent||'').trim().slice(0,70)),
    headings: hs.length, skips, overflowPx: overflow,
    offenders: overflow > 1 ? q('body *').filter(e => { const r = e.getBoundingClientRect(); return r.width>0 && (r.right > de.clientWidth+2 || r.left < -2); }).slice(0,6).map(e => e.tagName.toLowerCase()+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\\s+/).slice(0,2).join('.'):'')) : [],
    subMinTargets: q('a,button,[role=button],input,select,summary').filter(e => { const r = e.getBoundingClientRect(); return r.width>0&&r.height>0&&(r.width<24||r.height<24); }).length,
    namelessLinks: q('a').filter(a => a.offsetParent !== null).filter(a => ((a.getAttribute('aria-label')||a.textContent||'').trim().length===0) && !a.querySelector('img[alt]:not([alt=""])')).length,
    imgsNoAlt: q('img').filter(i => !i.hasAttribute('alt')).length,
    lists: q('ul,ol').length, docHeight: de.scrollHeight, title: document.title, lang: de.getAttribute('lang')||''
  };
})()`;

const VIEWPORTS = [['1920x1080',1920,1080,false],['1440x900',1440,900,false],['1280x800',1280,800,false],
  ['1024x768',1024,768,false],['768x1024',768,1024,true],['430x932',430,932,true],['390x844',390,844,true]];
const ROUTES = [['teaching','/teaching/'],['team','/authors/'],['resources','/resources/'],
  ['resources-academic','/resources/academic/'],['resources-blog','/resources/blog/'],
  ['resources-personal','/resources/personal/'],['news','/news/'],
  ['resources-templates','/resources/templates/'],['resources-professional','/resources/professional/'],
  ['teaching-archive','/teaching/archive/'],['teaching-notes','/teaching/notes/'],['teaching-workshops','/teaching/workshops/']];

const R = existsSync(OUT) ? JSON.parse(readFileSync(OUT,'utf8')) : {};
R.audits ||= {}; R.responsive ||= []; R.dark ||= {};
for (const [slug, path] of ROUTES) {
  for (const [vp,w,h,mob] of VIEWPORTS) {
    await go(path,w,h,'light',mob);
    const a = await ev(AUDIT);
    R.audits[`${slug}@${vp}`] = a;
    if (a.overflowPx > 1) R.responsive.push({ route: path, vp, overflowPx: a.overflowPx, offenders: a.offenders });
  }
  await go(path,1440,900,'dark',false);
  R.dark[slug] = await ev(AUDIT);
}
writeFileSync(OUT, JSON.stringify(R,null,1));
console.log('DONE audit-rest');
try { ws.close(); } catch {}
proc.kill(); process.exit(0);
