// Homepage section measurement — used for both the Phase 3 baseline and the after state.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.env.M_PORT || 9370);
const SP = 'C:/Users/Sajid/AppData/Local/Temp/claude/C--Users-Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/c6ef8616-df74-46b1-9d32-459772a409c8/scratchpad';
const B = process.env.M_BASE || 'http://127.0.0.1:1317';
const OUT = process.env.M_OUT || `${SP}/measure-out.json`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${SP}/chrome-m${PORT}`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let ok = false; for (let i = 0; i < 90 && !ok; i++) { try { ok = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch {} if (!ok) await sleep(250); }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const hs = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else if (m.method && hs.has(m.method)) hs.get(m.method).forEach(h => h(m.params)); });
const send = (M, P = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: M, params: P })); });
const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
const once = (m, to = 45000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const errs = []; on('Log.entryAdded', p => { if (p.entry.level === 'error') errs.push(p.entry.text.slice(0, 150)); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value;
const go = async (w, h, theme = 'light', mobile = false, reduced = false) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
  const f = [{ name: 'prefers-color-scheme', value: theme }];
  if (reduced) f.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  await send('Emulation.setEmulatedMedia', { features: f });
  const l = once('Page.loadEventFired'); await send('Page.navigate', { url: B + '/' }); await l; await sleep(3000); };

const R = {};
await go(1440, 900);
R.page = await ev(`JSON.stringify({docH:document.documentElement.scrollHeight, h1:document.querySelectorAll('h1').length,
  h1txt:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim().slice(0,50)),
  h2:document.querySelectorAll('h2').length, main:document.querySelectorAll('main').length,
  domNodes:document.querySelectorAll('*').length})`);
R.sections = await ev(`JSON.stringify([...document.querySelectorAll('.page-body > div > section, .page-body section, main > section, main > div[id]')].map(s=>{
  const r=s.getBoundingClientRect(); const st=getComputedStyle(s);
  const h=s.querySelector('h1,h2,h3');
  return {id:s.id||'(none)',h:Math.round(r.height),top:Math.round(r.top+scrollY),pt:st.paddingTop,pb:st.paddingBottom,
   heading:h?h.tagName+':'+h.textContent.trim().replace(/\\s+/g,' ').slice(0,38):null,
   minH:st.minHeight, cls:String(s.className).slice(0,60)};
}), null, 1)`);
R.motion = await ev(`JSON.stringify({anims:document.getAnimations().length,
  infinite:document.getAnimations().filter(a=>{try{return a.effect.getTiming().iterations===Infinity}catch(e){return false}}).length,
  names:[...new Set(document.getAnimations().map(a=>a.animationName||'?'))].slice(0,10)})`);
R.grants = await ev(`JSON.stringify({grantEntries:document.querySelectorAll('[id="projects"] article, [id="projects"] .grant, [id="projects"] li').length,
  projectsSectionH:(()=>{const s=document.getElementById('projects');return s?Math.round(s.getBoundingClientRect().height):null})(),
  outreachSectionH:(()=>{const s=document.getElementById('outreach');return s?Math.round(s.getBoundingClientRect().height):null})(),
  ctaSectionH:(()=>{const s=document.getElementById('section-cta-button-list');return s?Math.round(s.getBoundingClientRect().height):null})()})`);
// reduced motion
await go(1440, 900, 'light', false, true);
R.reduced = await ev(`JSON.stringify({anims:document.getAnimations().length,
  infinite:document.getAnimations().filter(a=>{try{return a.effect.getTiming().iterations===Infinity}catch(e){return false}}).length,
  hiddenBlocks:[...document.querySelectorAll('body *')].filter(el=>{const s=getComputedStyle(el);const r=el.getBoundingClientRect();
    return s.opacity==='0'&&r.width>60&&r.height>30}).length})`);
// heights at other viewports
R.viewports = [];
for (const [w, h, th] of [[1920,1080,'light'],[1440,900,'dark'],[1280,800,'light'],[1024,768,'light'],[768,1024,'light'],[430,932,'light'],[390,844,'light'],[390,844,'dark']]) {
  await go(w, h, th, w < 1024);
  R.viewports.push(await ev(`JSON.stringify({vp:'${w}x${h} ${th}',docH:document.documentElement.scrollHeight,
    over:document.documentElement.scrollWidth>innerWidth+1,scrollW:document.documentElement.scrollWidth})`));
}
R.consoleErrors = [...new Set(errs)];
mkdirSync(OUT.substring(0, OUT.lastIndexOf('/')), { recursive: true });
writeFileSync(OUT, JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1));
try { await fetch(`http://127.0.0.1:${PORT}/json/close`); } catch {}
proc.kill();
