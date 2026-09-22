// Phase 3 full QA: matrix screenshots + accessibility/motion/overflow checks.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9390;
const SP = 'C:/Users/Sajid/AppData/Local/Temp/claude/C--Users-Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/c6ef8616-df74-46b1-9d32-459772a409c8/scratchpad';
const ROOT = 'C:/Users/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase-3';
const FULL = ROOT + '/full-qa';
const REVIEW = ROOT + '/review';
const B = 'http://127.0.0.1:1320';
const SETTLE = 6500; // wordmark one-shot completes ~4.3s; capture after it settles
const sleep = ms => new Promise(r => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${SP}/chrome-qa3`, '--no-first-run', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
let ok = false; for (let i = 0; i < 90 && !ok; i++) { try { ok = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch {} if (!ok) await sleep(250); }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const hs = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } else if (m.method && hs.has(m.method)) hs.get(m.method).forEach(h => h(m.params)); });
const send = (M, P = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: M, params: P })); });
const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
const once = (m, to = 45000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const errs = []; on('Log.entryAdded', p => { if (p.entry.level === 'error') errs.push(p.entry.text.slice(0, 140)); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value;
const shot = async (f, full) => { const c = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!full });
  mkdirSync(f.substring(0, f.lastIndexOf('/')), { recursive: true }); writeFileSync(f, Buffer.from(c.data, 'base64')); };
const go = async (w, h, theme = 'light', mobile = false, reduced = false, settle = SETTLE) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
  const f = [{ name: 'prefers-color-scheme', value: theme }];
  if (reduced) f.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  await send('Emulation.setEmulatedMedia', { features: f });
  const l = once('Page.loadEventFired'); await send('Page.navigate', { url: B + '/' }); await l; await sleep(settle); };

const R = { matrix: [], a11y: null, motion: null, contrast: null, zoom: null, focus: null };

// ---- Full responsive/theme matrix ----
const VPS = [[1920,1080],[1440,900],[1280,800],[1024,768],[768,1024],[430,932],[390,844]];
for (const [w, h] of VPS) {
  for (const theme of ['light', 'dark']) {
    await go(w, h, theme, w < 1024);
    await shot(`${FULL}/home-${w}x${h}-${theme}-full-chromium.png`, true);
    await shot(`${FULL}/home-${w}x${h}-${theme}-top-chromium.png`, false);
    R.matrix.push(await ev(`JSON.stringify({vp:'${w}x${h}',theme:'${theme}',
      docH:document.documentElement.scrollHeight,
      over:document.documentElement.scrollWidth>innerWidth+1,
      h1:document.querySelectorAll('h1').length,
      wordmark:(()=>{const s=document.getElementById('brand-suffix');return s?s.textContent:null})(),
      caret:!!document.getElementById('brand-cursor')})`));
  }
}

// ---- Section captures at 1440 (both themes) ----
for (const theme of ['light', 'dark']) {
  await go(1440, 900, theme);
  const tops = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('section[id]')].map(s=>({id:s.id,y:Math.round(s.getBoundingClientRect().top+scrollY),h:Math.round(s.getBoundingClientRect().height)})))`));
  for (const s of tops) {
    const c = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: s.y, width: 1440, height: Math.min(s.h, 1100), scale: 1 } });
    writeFileSync(`${FULL}/section-${s.id}-1440-${theme}-chromium.png`, Buffer.from(c.data, 'base64'));
  }
}

// ---- Accessibility / structure ----
await go(1440, 900);
R.a11y = await ev(`JSON.stringify({
  h1:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim().slice(0,60)),
  headingOutline:[...document.querySelectorAll('h1,h2,h3')].map(h=>h.tagName+': '+h.textContent.trim().replace(/\\s+/g,' ').slice(0,42)),
  skips:(()=>{const hs=[...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];let p=0,out=[];hs.forEach(h=>{const l=+h.tagName[1];if(p&&l>p+1)out.push(p+'->'+l+' '+h.textContent.trim().slice(0,28));p=l});return out})(),
  main:document.querySelectorAll('main').length,
  skipLink:!!document.querySelector('.sj-skip-link'),
  genericLinks:[...document.querySelectorAll('a')].filter(a=>/^(read more|more|click here|here|see all)$/i.test(a.textContent.trim())).length,
  imgsNoAlt:[...document.querySelectorAll('img')].filter(i=>!i.hasAttribute('alt')).length,
  nestedLinkCards:[...document.querySelectorAll('.sj-card')].filter(c=>c.querySelectorAll('a').length>1).length,
  statusHasText:[...document.querySelectorAll('.sj-status')].every(s=>s.textContent.trim().length>0),
  domNodes:document.querySelectorAll('*').length})`);

// ---- Motion (after settle) ----
R.motion = await ev(`JSON.stringify({
  total:document.getAnimations().length,
  infinite:document.getAnimations().filter(a=>{try{return a.effect.getTiming().iterations===Infinity}catch(e){return false}}).length,
  wordmark:(()=>{const s=document.getElementById('brand-suffix');return s?s.textContent:null})(),
  caretRemoved:!document.getElementById('brand-cursor')})`);

await go(1440, 900, 'light', false, true, 4000);
R.reducedMotion = await ev(`JSON.stringify({
  total:document.getAnimations().length,
  infinite:document.getAnimations().filter(a=>{try{return a.effect.getTiming().iterations===Infinity}catch(e){return false}}).length,
  wordmark:(()=>{const s=document.getElementById('brand-suffix');return s?s.textContent:null})(),
  hidden:[...document.querySelectorAll('body *')].filter(el=>{const s=getComputedStyle(el);const r=el.getBoundingClientRect();
    return s.opacity==='0'&&r.width>60&&r.height>30}).map(el=>el.tagName+'.'+String(el.className).slice(0,44))})`);
await shot(`${FULL}/home-1440x900-light-reducedmotion-chromium.png`, true);

// ---- Contrast (reuse Phase 1 instrument) ----
const AUDIT = (await import('node:fs')).readFileSync(`${SP}/audit.js`, 'utf8');
for (const theme of ['light', 'dark']) {
  await go(1440, 900, theme);
  const a = JSON.parse(await ev(`(function(){${AUDIT}\nreturn JSON.stringify(__audit());})()`));
  R[`contrast_${theme}`] = { checked: a.contrast.checked, fails: a.contrast.failCount,
    worst: a.contrast.fails.slice(0, 6).map(f => `${f.ratio} ${f.size} ${f.fg} on ${f.bg} | ${f.txt}`),
    smallTargets: a.touchTargets.smallCount };
}

// ---- 200% zoom ----
await go(640, 800);
R.zoom = await ev(`JSON.stringify({scrollW:document.documentElement.scrollWidth,inner:innerWidth,over:document.documentElement.scrollWidth>innerWidth+1})`);
await shot(`${FULL}/home-zoom200-640-light-chromium.png`, true);

// ---- Keyboard focus ----
await go(1440, 900);
const tab = async () => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 9, code: 'Tab', key: 'Tab' });
  await send('Input.dispatchKeyEvent', { type: 'char', text: '\t' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, code: 'Tab', key: 'Tab' }); await sleep(150); };
const fo = [];
for (let i = 0; i < 14; i++) { await tab();
  fo.push(await ev(`(()=>{const a=document.activeElement;const s=getComputedStyle(a);
   return JSON.stringify({txt:(a.getAttribute('aria-label')||a.textContent||'').trim().replace(/\\s+/g,' ').slice(0,30),
    outline:s.outlineStyle+' '+s.outlineWidth,fv:a.matches(':focus-visible')})})()`)); }
R.focus = fo;
await shot(`${FULL}/home-1440x900-light-focus-chromium.png`, false);

// ---- Mandatory review set ----
mkdirSync(REVIEW, { recursive: true });
await go(1440, 900, 'light');
await shot(`${REVIEW}/01-home-1440-light-full.png`, true);
await shot(`${REVIEW}/02-home-1440-light-top.png`, false);
await go(390, 844, 'light', true);
await shot(`${REVIEW}/03-home-390-light-full.png`, true);
await shot(`${REVIEW}/04-home-390-light-top.png`, false);
await go(1440, 900, 'dark');
await shot(`${REVIEW}/05-home-1440-dark-top.png`, false);
await go(390, 844, 'dark', true);
await shot(`${REVIEW}/06-home-390-dark-top.png`, false);

R.consoleErrors = [...new Set(errs)];
writeFileSync(`${SP}/qa3-results.json`, JSON.stringify(R, null, 2));
console.log(JSON.stringify(R, null, 1).slice(0, 9000));
try { await fetch(`http://127.0.0.1:${PORT}/json/close`); } catch {}
proc.kill();
