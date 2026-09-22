/* Phase 8 — Lighthouse on the homepage, including Performance.

   Run against a STATIC SERVER over the production build (`hugo --minify`), not
   the Hugo dev server: the dev server serves unminified CSS/JS and injects a
   livereload socket, so its performance numbers are meaningless for a
   before/after comparison.

   Performance is noisy, so each category is measured `RUNS` times and the
   MEDIAN reported.

   node docs/redesign/evidence/phase8-lighthouse.mjs <label> [url] [runs]
*/
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { HERE } from './phase7-cdp.mjs';

const LABEL = process.argv[2] || 'run';
const URL = process.argv[3] || 'http://127.0.0.1:1338/';
const RUNS = Number(process.argv[4] || 3);
const OUT = resolve(HERE, `phase8-lighthouse-${LABEL}.json`);
const WORK = resolve(tmpdir(), 'p8-lighthouse');
mkdirSync(WORK, { recursive: true });

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const runs = [];
for (let i = 0; i < RUNS; i++) {
  const out = resolve(WORK, `${LABEL}-${i}.json`);
  process.stderr.write(`lighthouse ${LABEL} run ${i + 1}/${RUNS} …\n`);
  execFileSync('npx', ['--yes', 'lighthouse', URL,
    '--only-categories=performance,accessibility,best-practices',
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    '--output=json', `--output-path=${out}`,
    '--quiet', '--no-enable-error-reporting',
    '--form-factor=desktop', '--screenEmulation.disabled',
    '--throttling-method=simulate',
  ], { stdio: ['ignore', 'ignore', 'pipe'], shell: true, timeout: 300000 });
  if (!existsSync(out)) continue;
  const j = JSON.parse(readFileSync(out, 'utf8'));
  const a = j.audits || {};
  runs.push({
    version: j.lighthouseVersion,
    scores: Object.fromEntries(Object.entries(j.categories).map(([k, c]) => [k, c.score === null ? null : Math.round(c.score * 100)])),
    metrics: {
      fcp: a['first-contentful-paint']?.numericValue,
      lcp: a['largest-contentful-paint']?.numericValue,
      tbt: a['total-blocking-time']?.numericValue,
      cls: a['cumulative-layout-shift']?.numericValue,
      si: a['speed-index']?.numericValue,
      mainThread: a['mainthread-work-breakdown']?.numericValue,
      domSize: a['dom-size']?.numericValue,
      transferKB: Math.round((a['total-byte-weight']?.numericValue || 0) / 1024),
    },
    failedAudits: Object.entries(a)
      .filter(([, x]) => x.score !== null && x.score < 1 && !['manual', 'notApplicable', 'informative'].includes(x.scoreDisplayMode))
      .map(([id, x]) => id),
  });
}

const R = {
  label: LABEL, url: URL, at: new Date().toISOString(), runs: runs.length,
  lighthouseVersion: runs[0]?.version,
  median: {
    performance: median(runs.map(r => r.scores.performance)),
    accessibility: median(runs.map(r => r.scores.accessibility)),
    bestPractices: median(runs.map(r => r.scores['best-practices'])),
    fcpMs: Math.round(median(runs.map(r => r.metrics.fcp))),
    lcpMs: Math.round(median(runs.map(r => r.metrics.lcp))),
    tbtMs: Math.round(median(runs.map(r => r.metrics.tbt))),
    cls: +median(runs.map(r => r.metrics.cls)).toFixed(4),
    speedIndexMs: Math.round(median(runs.map(r => r.metrics.si))),
    mainThreadMs: Math.round(median(runs.map(r => r.metrics.mainThread))),
    domNodes: median(runs.map(r => r.metrics.domSize)),
    transferKB: median(runs.map(r => r.metrics.transferKB)),
  },
  allScores: runs.map(r => r.scores),
  failedAudits: [...new Set(runs.flatMap(r => r.failedAudits))],
};
writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log(JSON.stringify({ label: R.label, lighthouse: R.lighthouseVersion, ...R.median }, null, 1));
console.log('failed audits:', R.failedAudits.join(', ') || '(none)');
