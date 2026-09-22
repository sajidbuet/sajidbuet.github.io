/* Phase 6 curated review captures. Requires `hugo server` on 127.0.0.1:1332. */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9422;
const SP = 'C:/Users/BUETEEE/AppData/Local/Temp/claude/D--Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/f84b93ed-f291-4def-8568-d3df8fd61e74/scratchpad';
const REV = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase-6/review';
const B = 'http://127.0.0.1:1332';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${SP}/chrome-r6`, '--no-first-run', '--force-device-scale-factor=1',
  '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
let ok = false;
for (let i = 0; i < 90 && !ok; i++) { try { ok = (await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok; } catch {} if (!ok) await sleep(250); }
if (!ok) { console.error('chrome failed to start'); process.exit(1); }

const t0 = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t0.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const hs = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method && hs.has(m.method)) hs.get(m.method).forEach(h => h(m.params)); });
const send = (M, P = {}, to = 25000) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej });
  setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + M)); } }, to);
  ws.send(JSON.stringify({ id: i, method: M, params: P })); });
const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
const once = (m, to = 30000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable');

const go = async (path, w, h, theme, mob) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: mob, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: !!mob, maxTouchPoints: 5 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }] });
  const l = once('Page.loadEventFired');
  await send('Page.navigate', { url: B + path }); await l; await sleep(1500);
};
const shot = async f => {
  const c = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  mkdirSync(f.substring(0, f.lastIndexOf('/')), { recursive: true });
  writeFileSync(f, Buffer.from(c.data, 'base64'));
};

const SET = [
  ['01-publication-detail-1440-light.png', '/publication/j-023/', 1440, 900, 'light', false],
  ['02-project-detail-1440-light.png', '/projects/ctadmin/', 1440, 900, 'light', false],
  ['03-course-detail-1440-light.png', '/teaching/jul2025_eee303/', 1440, 900, 'light', false],
  ['04-team-profile-1440-light.png', '/authors/me/', 1440, 900, 'light', false],
  ['05-article-detail-1440-light.png', '/resources/blog/20260124-citation-count/', 1440, 900, 'light', false],
  ['06-notes-index-1440-light.png', '/teaching/notes/', 1440, 900, 'light', false],
  ['08-publication-detail-390-light.png', '/publication/j-023/', 390, 844, 'light', true],
  ['09-project-detail-390-light.png', '/projects/ctadmin/', 390, 844, 'light', true],
  ['10-course-detail-390-light.png', '/teaching/jul2025_eee303/', 390, 844, 'light', true],
  ['12-publication-detail-1440-dark.png', '/publication/j-023/', 1440, 900, 'dark', false],
  ['13-project-detail-1440-dark.png', '/projects/ctadmin/', 1440, 900, 'dark', false],
];

for (const [n, p, w, h, th, mob] of SET) {
  await go(p, w, h, th, mob);
  await shot(`${REV}/${n}`);
  console.log('captured ' + n);
}
console.log('DONE review6');
try { ws.close(); } catch {}
proc.kill(); process.exit(0);
