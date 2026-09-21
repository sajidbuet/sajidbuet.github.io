// Dependency-free CDP driver (Node >=22 global WebSocket).
// Usage: node cdp.mjs <jobfile.json>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

const CHROME = process.env.CDP_BROWSER || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = Number(process.env.CDP_PORT || 9333);
const UDD = process.env.CDP_UDD || 'C:\\Users\\Sajid\\AppData\\Local\\Temp\\claude\\C--Users-Sajid-OneDrive-Documents-Website-sajidbuet-sajidbuet-github-io\\c6ef8616-df74-46b1-9d32-459772a409c8\\scratchpad\\chrome-profile';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const args = [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${UDD}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--force-device-scale-factor=1', '--hide-scrollbars=false',
    '--font-render-hinting=none', '--disable-lcd-text',
    'about:blank',
  ];
  const p = spawn(CHROME, args, { stdio: 'ignore', detached: false });
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return { proc: p, version: await r.json() };
    } catch {}
    await sleep(250);
  }
  throw new Error('chrome did not start');
}

class Session {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { res, rej } = this.pending.get(m.id); this.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      } else if (m.method) {
        (this.handlers.get(m.method) || []).forEach((h) => h(m.params));
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => { this.pending.set(id, { res, rej }); this.ws.send(JSON.stringify({ id, method, params })); });
  }
  on(method, h) { if (!this.handlers.has(method)) this.handlers.set(method, []); this.handlers.get(method).push(h); }
  once(method, timeout = 30000) {
    return new Promise((res) => { const t = setTimeout(() => res(null), timeout);
      this.on(method, (p) => { clearTimeout(t); res(p); }); });
  }
}

async function newPage() {
  const r = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' });
  const t = await r.json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  const s = new Session(ws);
  await s.send('Page.enable'); await s.send('Runtime.enable'); await s.send('Network.enable');
  await s.send('Log.enable').catch(() => {});
  return { session: s, targetId: t.id, ws };
}

const AUDIT_JS = readFileSync(new URL('./audit.js', import.meta.url), 'utf8');

async function run() {
  const job = JSON.parse(readFileSync(process.argv[2], 'utf8'));
  const { proc } = await launch();
  const out = [];
  const { session: s } = await newPage();

  const consoleErrors = [];
  s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(`${p.entry.source}: ${p.entry.text}`); });
  s.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') consoleErrors.push('console.error: ' + (p.args||[]).map(a=>a.value||a.description).join(' ')); });
  const failed = [];
  s.on('Network.loadingFailed', (p) => failed.push(p));
  const reqs = [];
  s.on('Network.responseReceived', (p) => reqs.push({ url: p.response.url, status: p.response.status, type: p.type, len: p.response.encodedDataLength, mime: p.response.mimeType }));

  for (const shot of job.shots) {
    consoleErrors.length = 0; failed.length = 0; reqs.length = 0;
    const { w, h, dpr = 1, mobile = false, theme = 'light', url, name, fullPage = true, reducedMotion = false } = shot;
    await s.send('Emulation.setDeviceMetricsOverride', {
      width: w, height: h, deviceScaleFactor: dpr, mobile,
      screenWidth: w, screenHeight: h,
    });
    await s.send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
    const features = [{ name: 'prefers-color-scheme', value: theme }];
    if (reducedMotion) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
    await s.send('Emulation.setEmulatedMedia', { features });

    const loaded = s.once('Page.loadEventFired', 45000);
    await s.send('Page.navigate', { url });
    await loaded;
    await sleep(shot.settle ?? 2200);

    const ev = await s.send('Runtime.evaluate', {
      expression: `(function(){${AUDIT_JS}\n return JSON.stringify(__audit());})()`,
      returnByValue: true, awaitPromise: false,
    });
    let audit = null;
    try { audit = JSON.parse(ev.result.value); } catch (e) { audit = { error: String(ev.result.value).slice(0, 4000) }; }

    if (shot.file) {
      const isJpeg = shot.file.endsWith('.jpg');
      const cap = await s.send('Page.captureScreenshot', {
        format: isJpeg ? 'jpeg' : 'png', ...(isJpeg ? { quality: 82 } : {}),
        captureBeyondViewport: fullPage, optimizeForSpeed: false,
        ...(shot.clip ? { clip: { ...shot.clip, scale: 1 } } : {}),
      });
      mkdirSync(dirname(shot.file), { recursive: true });
      writeFileSync(shot.file, Buffer.from(cap.data, 'base64'));
    }

    out.push({
      name, url, viewport: `${w}x${h}`, dpr, theme, mobile, reducedMotion,
      audit,
      consoleErrors: [...new Set(consoleErrors)].slice(0, 25),
      failedRequests: failed.map(f => ({ text: f.errorText, type: f.type })).slice(0, 25),
      network: { count: reqs.length, bytes: reqs.reduce((a, r) => a + (r.len || 0), 0),
        heavy: reqs.filter(r => (r.len || 0) > 120000).map(r => ({ url: r.url, kb: Math.round(r.len / 1024), mime: r.mime })).sort((a,b)=>b.kb-a.kb).slice(0, 15) },
    });
    process.stderr.write(`done ${name} ${w}x${h} ${theme}\n`);
  }

  writeFileSync(job.report, JSON.stringify(out, null, 2));
  try { await fetch(`http://127.0.0.1:${PORT}/json/close`); } catch {}
  proc.kill();
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
