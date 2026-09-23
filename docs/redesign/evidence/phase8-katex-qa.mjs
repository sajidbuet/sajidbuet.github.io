/* Phase 8 item 8.19 — does the narrowed KaTeX gate still RENDER maths?
   The static scan (scratchpad/katexgate.mjs) proves which pages SHIP katex.min.js.
   That is not the same as proving the maths still resolves in a browser, so this
   driver loads real pages and counts `.katex` elements plus KaTeX network requests.

   Expected: renders > 0 where the gate allows KaTeX, and renders === 0 with
   requests === 0 on the routes it now skips, with no leftover raw `$...$`.

   Usage:  npx serve public_p8b -l 8099   (or any static server)
           node docs/redesign/evidence/phase8-katex-qa.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, HERE, BASE } from './phase7-cdp.mjs';

/* [route, should KaTeX load?, minimum formulas that must render]

   `minRendered` is 0 for /tags/photonics/ on purpose. A paginated term page is
   gated on `.Pages`, which is the UNPAGINATED set, so every page of the term
   ships KaTeX even though the eight titles that land on page 1 happen to carry
   no maths. Loading it there is correct — which title lands on which page is a
   pagination detail — so the assertion is "no errors, nothing left raw", not
   "something rendered". */
const CASES = [
  ['/', false, 0],
  ['/publication/', true, 1],
  ['/publication/j-029/', true, 1],
  ['/publication/j-019/', true, 1],
  ['/publication/j-022/', true, 1],
  ['/authors/me/', true, 1],
  ['/authors/purbayan-das/', true, 1],
  ['/authors/0421062341-purbayan-das/', true, 1],
  ['/tags/photonics/', true, 0],
  ['/tags/photonics/page/3/', true, 1],
  ['/publication_types/article-journal/', true, 1],
  ['/research/', false, 0],
  ['/research/photonics/', false, 0],
  ['/teaching/', false, 0],
  ['/news/', false, 0],
  ['/authors/', false, 0],
  ['/resources/', false, 0],
  ['/projects/', false, 0],
];

const PROBE = `(() => {
  const katex = document.querySelectorAll('.katex').length;
  const err   = document.querySelectorAll('.katex-error').length;
  // Raw delimiters still visible to a reader, ignoring the tags KaTeX skips.
  const skip  = new Set(['SCRIPT','STYLE','PRE','CODE','TEXTAREA','OPTION','NOSCRIPT']);
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let raw = 0, sample = '';
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    let p = n.parentElement, skipped = false;
    while (p) { if (skip.has(p.tagName) || p.classList.contains('katex')) { skipped = true; break; } p = p.parentElement; }
    if (skipped) continue;
    const m = n.nodeValue.match(/\\$\\$|\\$[^$\\n]{1,200}\\$|\\\\\\[|\\\\\\(/);
    if (m) { raw++; if (!sample) sample = m[0].slice(0, 40); }
  }
  return { katex, err, raw, sample };
})()`;

const rows = [];
const b = await launch();
const s = await attach(b.port);

const reqs = new Set();
s.on('Network.requestWillBeSent', (p) => { if (/katex/i.test(p.request.url)) reqs.add(p.request.url); });

for (const [route, expectKatex, minRendered] of CASES) {
  reqs.clear();
  await go(s, route, { w: 1280, h: 900, theme: 'light', settle: 1800 });
  const r = await s.ev(PROBE);
  const katexReqs = reqs.size;
  const loaded = katexReqs > 0;
  const ok = loaded === expectKatex && r.err === 0 && r.raw === 0 && r.katex >= minRendered;
  rows.push({ route, expectKatex, minRendered, katexReqs, ...r, ok });
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${route.padEnd(36)} ` +
    `katexReq=${String(katexReqs).padStart(2)} rendered=${String(r.katex).padStart(3)} ` +
    `errors=${r.err} rawLeft=${r.raw}${r.sample ? '  ' + r.sample : ''}`
  );
}

const failed = rows.filter((r) => !r.ok);
console.log(`\n${rows.length - failed.length}/${rows.length} routes behave as specified`);
writeFileSync(resolve(HERE, 'phase8-katex-qa.json'),
  JSON.stringify({ base: BASE, browser: b.version['User-Agent'], when: new Date().toISOString(), rows }, null, 1));
s.ws.close();
b.proc.kill();
process.exit(failed.length ? 1 : 0);
