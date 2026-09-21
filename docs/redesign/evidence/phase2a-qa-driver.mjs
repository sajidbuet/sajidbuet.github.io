// Phase 2A rendered QA: landmarks, focus, mobile menu keyboard, contrast, dark header.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9350;
const SP = 'C:/Users/Sajid/AppData/Local/Temp/claude/C--Users-Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/c6ef8616-df74-46b1-9d32-459772a409c8/scratchpad';
const B = 'http://127.0.0.1:1315';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${SP}/chrome-qa2a`,
  '--no-first-run', '--no-default-browser-check', '--force-device-scale-factor=1', 'about:blank'], { stdio: 'ignore' });
let ok = false; for (let i = 0; i < 90 && !ok; i++) { try { ok = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch {} if (!ok) await sleep(250); }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const hs = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method && hs.has(m.method)) hs.get(m.method).forEach(h => h(m.params)); });
const send = (M, P = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: M, params: P })); });
const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
const once = (m, to = 40000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
const errors = []; on('Log.entryAdded', p => { if (p.entry.level === 'error') errors.push(p.entry.text.slice(0, 160)); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result.value;
const shot = async (f, jpeg = true) => { const c = await send('Page.captureScreenshot', jpeg ? { format: 'jpeg', quality: 82 } : { format: 'png' });
  mkdirSync(f.substring(0, f.lastIndexOf('/')), { recursive: true }); writeFileSync(f, Buffer.from(c.data, 'base64')); };
const shotFull = async (f) => { const c = await send('Page.captureScreenshot', { format: 'jpeg', quality: 82, captureBeyondViewport: true });
  mkdirSync(f.substring(0, f.lastIndexOf('/')), { recursive: true }); writeFileSync(f, Buffer.from(c.data, 'base64')); };
const goto = async (url, w, h, theme = 'light', mobile = false, reduced = false) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
  const feats = [{ name: 'prefers-color-scheme', value: theme }];
  if (reduced) feats.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  await send('Emulation.setEmulatedMedia', { features: feats });
  const l = once('Page.loadEventFired'); await send('Page.navigate', { url }); await l; await sleep(2200); };
const AUDIT = readFileSync(`${SP}/audit.js`, 'utf8');
const audit = async () => { const r = await send('Runtime.evaluate', { expression: `(function(){${AUDIT}\nreturn JSON.stringify(__audit());})()`, returnByValue: true });
  try { return JSON.parse(r.result.value); } catch { return { error: String(r.result.value).slice(0, 500) }; } };

const OUT = { landmarks: [], contrast: [], focus: null, mobileMenu: null, darkHeader: null, reducedMotion: null, overflow: [], consoleErrors: [] };
const SHOTS = 'C:/Users/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase2a';

const ROUTES = ['/', '/research/', '/research/photonics/', '/publication/', '/publication/j-029/', '/authors/', '/authors/me/',
  '/teaching/', '/teaching/jul2025_eee303/', '/projects/', '/news/', '/news/2025-09-24-puja-defends/', '/outreach/',
  '/outreach/blog/', '/outreach/templates/', '/outreach/lor/', '/people/', '/tags/', '/bn/'];

// ---- 1. Landmarks + h1 + skip link across all routes (light) ----
for (const r of ROUTES) {
  await goto(B + r, 1440, 900);
  OUT.landmarks.push(await ev(`JSON.stringify({p:location.pathname,
    main:document.querySelectorAll('main').length,
    mainId:!!document.getElementById('main'),
    h1:document.querySelectorAll('h1').length,
    skip:(()=>{const a=document.querySelector('.sj-skip-link');return a?a.getAttribute('href'):null})(),
    skipFirst:(()=>{const a=document.querySelector('a[href],button');return a?a.className.includes('sj-skip-link'):false})(),
    headerBg:getComputedStyle(document.getElementById('site-header')).backgroundColor,
    headerShadow:getComputedStyle(document.getElementById('site-header')).boxShadow,
    backdrop:getComputedStyle(document.getElementById('site-header')).backdropFilter,
    activeNav:[...document.querySelectorAll('#nav-menu .nav-link.active')].map(a=>a.textContent.trim()),
    brandName:(()=>{const a=document.querySelector('.navbar-brand');return a?(a.getAttribute('aria-label')||a.textContent.trim().slice(0,40)):null})(),
    overflow:document.documentElement.scrollWidth>innerWidth+1})`));
}

// ---- 2. Contrast, both themes, key routes ----
for (const theme of ['light', 'dark']) {
  for (const r of ['/', '/publication/', '/research/', '/teaching/', '/authors/', '/outreach/']) {
    await goto(B + r, 1440, 900, theme);
    const a = await audit();
    OUT.contrast.push({ route: r, theme, checked: a.contrast?.checked, fails: a.contrast?.failCount,
      worst: (a.contrast?.fails || []).slice(0, 6).map(f => `${f.ratio} ${f.size} ${f.fg} on ${f.bg} | ${f.el} | ${f.txt}`),
      headerBg: a.layout?.header?.bg, overflow: a.overflow?.overflowing, bodyBg: a.theme?.bodyBg });
  }
}

// ---- 3. Dark header specifically ----
await goto(B + '/', 1440, 900, 'dark');
await ev('window.scrollTo(0,1500)'); await sleep(1000);
await shot(`${SHOTS}/header-1440x900-dark-chromium.jpg`);
OUT.darkHeader = await ev(`(()=>{const h=document.getElementById('site-header');const s=getComputedStyle(h);
 const nl=document.querySelector('.nav-link');
 return JSON.stringify({bg:s.backgroundColor,backdrop:s.backdropFilter,border:s.borderBottomColor,shadow:s.boxShadow,
  navLinkColor:getComputedStyle(nl).color, headerFgVar:getComputedStyle(document.documentElement).getPropertyValue('--hb-color-header-fg').trim(),
  accentVar:getComputedStyle(document.documentElement).getPropertyValue('--sj-accent').trim(),
  top:Math.round(h.getBoundingClientRect().top), height:Math.round(h.getBoundingClientRect().height)});})()`);
await goto(B + '/', 1440, 900, 'light');
await ev('window.scrollTo(0,1500)'); await sleep(1000);
await shot(`${SHOTS}/header-1440x900-light-chromium.jpg`);

// ---- 4. Keyboard: skip link + tab order + focus ring (desktop) ----
await goto(B + '/', 1440, 900);
const tab = async () => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 9, code: 'Tab', key: 'Tab' });
  await send('Input.dispatchKeyEvent', { type: 'char', text: '\t' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 9, code: 'Tab', key: 'Tab' }); await sleep(160); };
const tabs = [];
for (let i = 0; i < 6; i++) { await tab();
  tabs.push(await ev(`(()=>{const a=document.activeElement;const s=getComputedStyle(a);const r=a.getBoundingClientRect();
   return JSON.stringify({tag:a.tagName,cls:String(a.className).slice(0,32),txt:(a.getAttribute('aria-label')||a.textContent||'').trim().replace(/\\s+/g,' ').slice(0,34),
    outline:s.outlineStyle+' '+s.outlineWidth+' '+s.outlineColor,offset:s.outlineOffset,fv:(()=>{try{return a.matches(':focus-visible')}catch(e){return'n/a'}})(),
    visible:r.top>=0&&r.height>0});})()`));
  if (i === 0) await shot(`${SHOTS}/focus-skiplink-1440x900-light-chromium.jpg`);
  if (i === 2) await shot(`${SHOTS}/focus-nav-1440x900-light-chromium.jpg`);
}
OUT.focus = tabs;

// ---- 5. Mobile menu: keyboard only ----
await goto(B + '/', 390, 844, 'light', true);
await shot(`${SHOTS}/nav-closed-390x844-light-chromium.jpg`);
// Tab to the toggle then activate with Enter
let found = false, guard = 0;
while (!found && guard++ < 12) { await tab();
  found = await ev(`document.activeElement && document.activeElement.id==='nav-toggle'`); }
const focusedToggle = found;
await shot(`${SHOTS}/focus-navtoggle-390x844-light-chromium.jpg`);
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, code: 'Enter', key: 'Enter' });
await send('Input.dispatchKeyEvent', { type: 'char', text: '\r' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, code: 'Enter', key: 'Enter' });
await sleep(900);
await shot(`${SHOTS}/nav-open-390x844-light-chromium.jpg`);
const afterOpen = await ev(`(()=>{const b=document.getElementById('nav-toggle');const m=document.getElementById('nav-menu');
 const links=[...m.querySelectorAll('a')].filter(a=>a.getBoundingClientRect().height>0);
 return JSON.stringify({expanded:b.getAttribute('aria-expanded'),ariaControls:b.getAttribute('aria-controls'),ariaLabel:b.getAttribute('aria-label'),
  menuOpenClass:m.classList.contains('sj-open'),visibleLinks:links.length,
  minRowHeight:Math.min(...links.map(a=>Math.round(a.getBoundingClientRect().height))),
  focusMovedInto:m.contains(document.activeElement),
  toggleBox:(({width:w,height:h})=>[Math.round(w),Math.round(h)])(b.getBoundingClientRect()),
  overflow:document.documentElement.scrollWidth>innerWidth+1});})()`);
// Escape closes + focus returns
await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 27, code: 'Escape', key: 'Escape' });
await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 27, code: 'Escape', key: 'Escape' });
await sleep(700);
const afterEsc = await ev(`(()=>{const b=document.getElementById('nav-toggle');const m=document.getElementById('nav-menu');
 return JSON.stringify({expanded:b.getAttribute('aria-expanded'),menuOpenClass:m.classList.contains('sj-open'),
  focusReturned:document.activeElement===b, ariaLabel:b.getAttribute('aria-label')});})()`);
OUT.mobileMenu = { reachedToggleByTab: focusedToggle, afterOpen, afterEsc };

// dark mobile menu
await goto(B + '/', 390, 844, 'dark', true);
await ev(`document.getElementById('nav-toggle').click()`); await sleep(800);
await shot(`${SHOTS}/nav-open-390x844-dark-chromium.jpg`);

// ---- 6. Reduced motion ----
await goto(B + '/', 1440, 900, 'light', false, true);
await sleep(1500);
OUT.reducedMotion = await ev(`(()=>{const an=document.getAnimations();
 const inf=an.filter(a=>{try{return a.effect.getTiming().iterations===Infinity}catch(e){return false}});
 const hidden=[...document.querySelectorAll('body *')].filter(el=>{const s=getComputedStyle(el);const r=el.getBoundingClientRect();
   return s.opacity==='0'&&r.width>40&&r.height>20&&s.visibility!=='hidden'&&s.display!=='none'}).slice(0,12)
   .map(el=>el.tagName+'.'+String(el.className).slice(0,40));
 return JSON.stringify({total:an.length,infinite:inf.length,zeroOpacityBlocks:hidden.length,samples:hidden});})()`);
await shotFull(`${SHOTS}/home-1440x900-reducedmotion-light-chromium.jpg`);

// ---- 7. Responsive matrix screenshots ----
for (const [w, h] of [[1920,1080],[1440,900],[1280,800],[1024,768],[768,1024],[430,932],[390,844]]) {
  await goto(B + '/', w, h, 'light', w < 1024);
  await shotFull(`${SHOTS}/home-${w}x${h}-light-chromium.jpg`);
  OUT.overflow.push(await ev(`JSON.stringify({vp:'${w}x${h}',theme:'light',scrollW:document.documentElement.scrollWidth,inner:innerWidth,over:document.documentElement.scrollWidth>innerWidth+1,navWraps:(()=>{const ls=[...document.querySelectorAll('#nav-menu .nav-link')].filter(a=>a.getBoundingClientRect().width>0);return new Set(ls.map(a=>Math.round(a.getBoundingClientRect().top))).size})(),headerH:Math.round(document.getElementById('site-header').getBoundingClientRect().height)})`));
}
for (const [w, h] of [[1440,900],[390,844]]) {
  await goto(B + '/', w, h, 'dark', w < 1024);
  await shotFull(`${SHOTS}/home-${w}x${h}-dark-chromium.jpg`);
  OUT.overflow.push(await ev(`JSON.stringify({vp:'${w}x${h}',theme:'dark',scrollW:document.documentElement.scrollWidth,inner:innerWidth,over:document.documentElement.scrollWidth>innerWidth+1})`));
}
// cross-page matrix
for (const [name, r] of [['research','/research/'],['publication','/publication/'],['teaching','/teaching/'],['team','/authors/']]) {
  for (const [w, h, theme] of [[1440,900,'light'],[768,1024,'light'],[390,844,'light'],[1440,900,'dark'],[390,844,'dark']]) {
    await goto(B + r, w, h, theme, w < 1024);
    await shotFull(`${SHOTS}/${name}-${w}x${h}-${theme}-chromium.jpg`);
    OUT.overflow.push(await ev(`JSON.stringify({vp:'${name} ${w}x${h} ${theme}',scrollW:document.documentElement.scrollWidth,inner:innerWidth,over:document.documentElement.scrollWidth>innerWidth+1})`));
  }
}
// 200% zoom
await goto(B + '/', 640, 800);
OUT.zoom200 = await ev(`JSON.stringify({scrollW:document.documentElement.scrollWidth,inner:innerWidth,over:document.documentElement.scrollWidth>innerWidth+1})`);
await shotFull(`${SHOTS}/home-zoom200-640-light-chromium.jpg`);

OUT.consoleErrors = [...new Set(errors)];
writeFileSync(`${SP}/qa2a-results.json`, JSON.stringify(OUT, null, 2));
console.log(JSON.stringify(OUT, null, 2).slice(0, 14000));
try { await fetch(`http://127.0.0.1:${PORT}/json/close`); } catch {}
proc.kill();
