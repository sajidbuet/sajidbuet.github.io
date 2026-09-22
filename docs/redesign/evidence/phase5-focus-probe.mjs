/* Focus-visibility probe using real Tab keypresses.
   Phase 2A applies focus rings via :focus-visible only (custom.css:76) and
   suppresses them for :focus:not(:focus-visible) (custom.css:83). A
   programmatic element.focus() therefore reports no ring even when keyboard
   focus is styled correctly — this probe drives actual Tab keys instead. */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9417;
const SP = 'C:/Users/BUETEEE/AppData/Local/Temp/claude/D--Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/f84b93ed-f291-4def-8568-d3df8fd61e74/scratchpad';
const ROOT = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase-5';
const B = 'http://127.0.0.1:1331';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${SP}/chrome-focus`, '--no-first-run', '--force-device-scale-factor=1',
  '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
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
const tab = async () => {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'char', text: '\t' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 });
  await sleep(60);
};

const R = {};
for (const [slug, path] of [['resources', '/resources/'], ['teaching', '/teaching/'], ['team', '/authors/']]) {
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const l = once('Page.loadEventFired');
  await send('Page.navigate', { url: B + path }); await l; await sleep(1200);
  await ev('document.body.focus()');
  const seen = [];
  for (let i = 0; i < 22; i++) {
    await tab();
    const r = await ev(`(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      const cs = getComputedStyle(e);
      const ow = parseFloat(cs.outlineWidth) || 0;
      const ring = (cs.outlineStyle !== 'none' && ow > 0) || (cs.boxShadow && cs.boxShadow !== 'none');
      const rect = e.getBoundingClientRect();
      return { tag: e.tagName.toLowerCase(),
               name: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\\s+/g,' ').slice(0, 42),
               ring, outline: cs.outline, w: Math.round(rect.width), h: Math.round(rect.height),
               matchesFV: (() => { try { return e.matches(':focus-visible'); } catch { return null; } })() };
    })()`);
    if (r) seen.push(r);
  }
  const noRing = seen.filter(s => !s.ring);
  R[slug] = { tabbed: seen.length, withRing: seen.filter(s => s.ring).length, withoutRing: noRing.length, offenders: noRing.slice(0, 6), first8: seen.slice(0, 8) };
}

// capture a real keyboard-focused state on Resources
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const l2 = once('Page.loadEventFired');
await send('Page.navigate', { url: B + '/resources/' }); await l2; await sleep(1200);
await ev('document.body.focus()');
for (let i = 0; i < 12; i++) await tab();
const c = await send('Page.captureScreenshot', { format: 'png' });
mkdirSync(`${ROOT}/full-qa`, { recursive: true });
writeFileSync(`${ROOT}/full-qa/resources-1440x900-light-focus.png`, Buffer.from(c.data, 'base64'));

writeFileSync('D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/evidence/phase5-focus.json', JSON.stringify(R, null, 1));
console.log(JSON.stringify(R, null, 1));
try { ws.close(); } catch {}
proc.kill(); process.exit(0);
