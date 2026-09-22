/* Phase 7 — shared CDP helper.
   Dependency-free. Drives an already-installed Chromium-family browser.
   Paths are resolved from this file's location, so the drivers are machine-independent
   (the Phase 6 driver hardcoded D:\ paths and could not be re-run here).

   Env:
     P7_BROWSER  path to the browser executable   (default: installed Chrome)
     P7_PORT     remote debugging port            (default: 9440)
     P7_PROFILE  user-data-dir                    (default: OS temp)
     P7_BASE     site origin                      (default: http://127.0.0.1:1337)
     P7_ARGS     extra comma-separated browser flags
*/
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

export const HERE = dirname(fileURLToPath(import.meta.url));
export const REPO = resolve(HERE, '..', '..', '..');
export const SHOTS = resolve(REPO, 'docs', 'redesign', 'screenshots', 'phase-7');
export const BASE = process.env.P7_BASE || 'http://127.0.0.1:1337';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function launch() {
  const exe = process.env.P7_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const port = Number(process.env.P7_PORT || 9440);
  const profile = process.env.P7_PROFILE || resolve(tmpdir(), 'p7-profile-' + port);
  const extra = (process.env.P7_ARGS || '').split(',').filter(Boolean);
  const args = [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--force-device-scale-factor=1', '--hide-scrollbars=false',
    '--font-render-hinting=none', '--disable-lcd-text',
    ...extra, 'about:blank',
  ];
  const proc = spawn(exe, args, { stdio: 'ignore' });
  let version = null;
  for (let i = 0; i < 120 && !version; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) version = await r.json(); } catch {}
    if (!version) await sleep(250);
  }
  if (!version) throw new Error(`browser did not start: ${exe}`);
  return { proc, port, version };
}

export async function attach(port) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  let id = 0; const pend = new Map(); const hs = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
    else if (m.method && hs.has(m.method)) hs.get(m.method).forEach((h) => h(m.params));
  });
  const send = (M, P = {}, to = 45000) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('CDP timeout: ' + M)); } }, to);
    ws.send(JSON.stringify({ id: i, method: M, params: P }));
  });
  const on = (m, h) => { if (!hs.has(m)) hs.set(m, []); hs.get(m).push(h); };
  const once = (m, to = 45000) => new Promise((r) => { const x = setTimeout(() => r(null), to); on(m, (p) => { clearTimeout(x); r(p); }); });
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable').catch(() => {});
  await send('Network.enable').catch(() => {});
  const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;
  return { ws, send, on, once, ev };
}

/** Navigate with viewport / theme / motion emulation applied first. */
export async function go(s, path, { w, h, mobile = false, theme = 'light', reduced = false, settle = 1500, dpr = 1 }) {
  await s.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile, screenWidth: w, screenHeight: h });
  await s.send('Emulation.setTouchEmulationEnabled', { enabled: !!mobile, maxTouchPoints: mobile ? 5 : 1 });
  const features = [{ name: 'prefers-color-scheme', value: theme }];
  if (reduced) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
  /* setDeviceMetricsOverride({mobile:true}) does NOT flip the pointer media
     features, so `@media (pointer: coarse)` stayed false and the Phase 7
     touch-target rules were never exercised by the audit. Emulate them
     explicitly, which is what a real phone reports. */
  if (mobile) features.push({ name: 'pointer', value: 'coarse' }, { name: 'any-pointer', value: 'coarse' },
    { name: 'hover', value: 'none' }, { name: 'any-hover', value: 'none' });
  await s.send('Emulation.setEmulatedMedia', { features });
  const loaded = s.once('Page.loadEventFired', 45000);
  await s.send('Page.navigate', { url: path.startsWith('http') ? path : BASE + path });
  await loaded;
  await sleep(settle);
}

export async function shoot(s, file, { full = false, quality = 72 } = {}) {
  const jpeg = file.endsWith('.jpg');
  try {
    const cap = await s.send('Page.captureScreenshot', {
      format: jpeg ? 'jpeg' : 'png', ...(jpeg ? { quality } : {}),
      captureBeyondViewport: !!full, optimizeForSpeed: false,
    }, 60000);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(cap.data, 'base64'));
    return true;
  } catch { return false; }
}

/** Press Tab once and report the newly focused element. */
export async function tab(s, shift = false) {
  const mods = shift ? 8 : 0;
  await s.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: mods });
  await s.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9, modifiers: mods });
  await sleep(60);
}

export async function key(s, name, code, vk) {
  await s.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: name, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  if (name === 'Enter') await s.send('Input.dispatchKeyEvent', { type: 'char', text: '\r' });
  if (name === ' ') await s.send('Input.dispatchKeyEvent', { type: 'char', text: ' ' });
  await s.send('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code, windowsVirtualKeyCode: vk, nativeVirtualKeyCode: vk });
  await sleep(220);
}

/* ---- the Phase 7 matrix ---- */

export const VIEWPORTS = [
  ['1920x1080', 1920, 1080, false],
  ['1440x900', 1440, 900, false],
  ['1280x800', 1280, 800, false],
  ['1024x768', 1024, 768, false],
  ['768x1024', 768, 1024, true],
  ['430x932', 430, 932, true],
  ['390x844', 390, 844, true],
];

/* visual-qa-baseline.md §1 route list, expanded from the "and" pairs. */
export const ROUTES = [
  ['home', '/'],
  ['research', '/research/'],
  ['research-area', '/research/photonics/'],
  ['publication-list', '/publication/'],
  ['publication-detail', '/publication/j-029/'],
  ['projects', '/projects/'],
  ['project-detail', '/projects/ctadmin/'],
  ['teaching', '/teaching/'],
  ['course-detail', '/teaching/jul2025_eee303/'],
  ['team', '/authors/'],
  ['team-profile', '/authors/me/'],
  ['news', '/news/'],
  ['news-detail', '/news/2024-05-09-new-pg-course/'],
  ['resources', '/resources/'],
  ['blog-post', '/resources/blog/20260124-citation-count/'],
];
