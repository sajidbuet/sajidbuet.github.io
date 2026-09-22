#!/usr/bin/env node
/* SAJID.BD — migration redirect verification (Phase 4)
 *
 * Purpose: prove that every legacy URL still resolves to its new canonical
 * page in a real browser, not merely that Hugo wrote a file.
 *
 * It serves a built `public/` directory over HTTP the way GitHub Pages does
 * (directory -> index.html, no rewrite rules), loads each legacy URL in
 * headless Chrome, and asserts the browser ends up on the expected URL.
 *
 * Usage:
 *   hugo --minify -d ./public
 *   node docs/redesign/evidence/verify-redirects.mjs ./public
 *
 * Exit code 0 = all redirects verified, 1 = at least one failed.
 * No production runtime dependency; QA only. Node >= 22 (global WebSocket).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const PUBLIC = resolve(process.argv[2] || './public');
const PORT = Number(process.env.VERIFY_PORT || 8099);
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const CDP_PORT = Number(process.env.VERIFY_CDP_PORT || 9400);

/* Legacy URL -> expected destination path. Extend as later phases move content. */
const EXPECTED = [
  ['/projects/g-01/', '/research/funding/g-01/'],
  ['/projects/g-02/', '/research/funding/g-02/'],
  ['/projects/g-03/', '/research/funding/g-03/'],
];

/* Pages that must exist and must NOT redirect. */
const MUST_RESOLVE = [
  '/research/', '/research/funding/', '/projects/',
  '/research/quantum/', '/research/photonics/', '/research/antenna/',
  '/research/computing/', '/research/embedded/', '/research/renewable/',
  '/publication/', '/authors/', '/teaching/', '/news/', '/outreach/',
];

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.xml': 'application/xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- static server mimicking GitHub Pages ---- */
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split('?')[0]);
    let file = join(PUBLIC, p);
    try {
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    } catch {
      if (!extname(file)) file = join(PUBLIC, p, 'index.html');
    }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/html' });
    res.end('<h1>404</h1>');
  }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORT}`;

/* ---- headless Chrome over CDP ---- */
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${CDP_PORT}`,
  `--user-data-dir=${process.env.TEMP || '/tmp'}/sj-verify-redirects`, '--no-first-run', 'about:blank'], { stdio: 'ignore' });
let up = false;
for (let i = 0; i < 90 && !up; i++) { try { up = (await fetch(`http://127.0.0.1:${CDP_PORT}/json/version`)).ok; } catch {} if (!up) await sleep(250); }
if (!up) { console.error('Chrome did not start at', CHROME); process.exit(1); }

const target = await (await fetch(`http://127.0.0.1:${CDP_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map(); const handlers = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  else if (m.method && handlers.has(m.method)) handlers.get(m.method).forEach((h) => h(m.params)); });
const send = (M, P = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method: M, params: P })); });
const on = (m, h) => { if (!handlers.has(m)) handlers.set(m, []); handlers.get(m).push(h); };
const once = (m, to = 20000) => new Promise((r) => { const x = setTimeout(() => r(null), to); on(m, (p) => { clearTimeout(x); r(p); }); });
await send('Page.enable'); await send('Runtime.enable');
const evaluate = async (x) => (await send('Runtime.evaluate', { expression: x, returnByValue: true })).result.value;

const visit = async (path, settle = 1200) => {
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url: BASE + path });
  await loaded;
  /* An alias stub is a meta-refresh, so a SECOND navigation follows. Wait for
     that load event rather than a bare sleep, otherwise the DOM read races the
     redirect and reports the stub (or the previous page) instead of the
     destination. `once` resolves null on timeout, which is the correct
     outcome for a page that does not redirect. */
  const second = once('Page.loadEventFired', settle);
  await second;
  await sleep(250);
  return {
    url: await evaluate('location.pathname'),
    /* Host matters. Hugo writes alias stubs with an ABSOLUTE baseURL, so a
       build made with the production baseURL will redirect the browser off
       localhost to the live site — where location.pathname still matches and
       the check would pass while having verified nothing. Build the copy under
       test with `--baseURL http://127.0.0.1:<port>/`. */
    host: await evaluate('location.host'),
    title: await evaluate('document.title'),
    h1: await evaluate(`(()=>{const h=document.querySelector('h1');return h?h.textContent.trim().slice(0,60):null})()`),
    is404: await evaluate(`document.body.innerText.trim().startsWith('404')`),
  };
};

const EXPECT_HOST = `127.0.0.1:${PORT}`;

let failures = 0;
console.log(`\nServing ${PUBLIC} at ${BASE}\n`);
console.log('LEGACY REDIRECTS');
console.log('─'.repeat(78));
for (const [from, to] of EXPECTED) {
  const r = await visit(from);
  const sameHost = r.host === EXPECT_HOST;
  const ok = r.url === to && sameHost && !r.is404;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${from.padEnd(20)} -> ${r.url.padEnd(30)}`);
  if (!sameHost) console.log(`      !! left the test server: host=${r.host}. Rebuild with --baseURL http://${EXPECT_HOST}/`);
  else if (r.url !== to) console.log(`      !! expected ${to}`);
  else console.log(`      lands on: ${r.h1 ?? r.title}`);
}

console.log('\nCANONICAL PAGES (must resolve, must not redirect)');
console.log('─'.repeat(78));
for (const p of MUST_RESOLVE) {
  const r = await visit(p, 600);
  const ok = r.url === p && !r.is404;
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${p.padEnd(32)} ${r.is404 ? '404' : r.url}`);
}

console.log('\n' + '─'.repeat(78));
console.log(failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`);

try { await fetch(`http://127.0.0.1:${CDP_PORT}/json/close`); } catch {}
chrome.kill();
server.close();
process.exit(failures === 0 ? 0 : 1);
