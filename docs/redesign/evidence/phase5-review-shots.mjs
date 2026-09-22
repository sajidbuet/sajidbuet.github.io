/* Re-capture the curated review set against the final content state. */
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9419;
const SP = 'C:/Users/BUETEEE/AppData/Local/Temp/claude/D--Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io/f84b93ed-f291-4def-8568-d3df8fd61e74/scratchpad';
const REV = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase-5/review';
const FULL = 'D:/Sajid/OneDrive/Documents/Website/sajidbuet/sajidbuet.github.io/docs/redesign/screenshots/phase-5/full-qa';
const B = 'http://127.0.0.1:1331';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${SP}/chrome-rev`, '--no-first-run', '--force-device-scale-factor=1',
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
const once = (m, to = 40000) => new Promise(r => { const x = setTimeout(() => r(null), to); on(m, p => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable');

const go = async (path, w, h, theme, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: !!mobile, maxTouchPoints: 5 });
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
  ['01-teaching-1440-light.png',       '/teaching/',        1440, 900, 'light', false],
  ['02-team-1440-light.png',           '/authors/',         1440, 900, 'light', false],
  ['03-resources-1440-light.png',      '/resources/',       1440, 900, 'light', false],
  ['04-resources-blog-1440-light.png', '/resources/blog/',  1440, 900, 'light', false],
  ['05-teaching-390-light.png',        '/teaching/',         390, 844, 'light', true],
  ['06-team-390-light.png',            '/authors/',          390, 844, 'light', true],
  ['07-resources-390-light.png',       '/resources/',        390, 844, 'light', true],
  ['08-news-1440-light.png',           '/news/',            1440, 900, 'light', false],
  ['09-resources-1440-dark.png',       '/resources/',       1440, 900, 'dark',  false],
  ['10-teaching-1440-dark.png',        '/teaching/',        1440, 900, 'dark',  false],
];
for (const [name, path, w, h, theme, mob] of SET) {
  await go(path, w, h, theme, mob);
  await shot(`${REV}/${name}`);
  console.log('captured ' + name);
}

/* refresh the matching full-qa copies too, so the matrix matches the review set */
for (const [slug, path] of [['teaching','/teaching/'],['team','/authors/'],['resources','/resources/'],
  ['resources-blog','/resources/blog/'],['news','/news/'],['resources-academic','/resources/academic/'],
  ['resources-personal','/resources/personal/'],['resources-templates','/resources/templates/'],
  ['resources-professional','/resources/professional/'],['teaching-archive','/teaching/archive/'],
  ['teaching-notes','/teaching/notes/'],['teaching-workshops','/teaching/workshops/']]) {
  for (const [vp, w, h, mob] of [['1920x1080',1920,1080,false],['1440x900',1440,900,false],
    ['1280x800',1280,800,false],['1024x768',1024,768,false],['768x1024',768,1024,true],
    ['430x932',430,932,true],['390x844',390,844,true]]) {
    await go(path, w, h, 'light', mob);
    await shot(`${FULL}/${slug}-${vp}-light-full.png`);
  }
  await go(path, 1440, 900, 'dark', false);
  await shot(`${FULL}/${slug}-1440x900-dark-full.png`);
}
console.log('DONE review-shots');
try { ws.close(); } catch {}
proc.kill(); process.exit(0);
