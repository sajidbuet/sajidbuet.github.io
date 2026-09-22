/* Phase 7.10 — Lighthouse Accessibility + Best Practices on 5 representative routes.

   Lighthouse is not a repository dependency; it is fetched through `npx --yes`
   into the npm cache at run time, so nothing in package.json changes.

   node docs/redesign/evidence/phase7-lighthouse.mjs
*/
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { HERE, BASE } from './phase7-cdp.mjs';

const OUT = resolve(HERE, 'phase7-lighthouse.json');
const WORK = resolve(tmpdir(), 'p7-lighthouse');
mkdirSync(WORK, { recursive: true });

/* One per page archetype: landing, long filtered list, publication detail,
   course detail (the wide-table page), team profile. */
const ROUTES = [
  ['home', '/'],
  ['publication-list', '/publication/'],
  ['publication-detail', '/publication/j-029/'],
  ['course-detail', '/teaching/jul2025_eee303/'],
  ['team-profile', '/authors/me/'],
];

const R = { meta: { base: BASE, at: new Date().toISOString(), tool: 'npx lighthouse' }, routes: {} };

for (const [slug, path] of ROUTES) {
  const out = resolve(WORK, `${slug}.report.json`);
  process.stderr.write(`lighthouse: ${slug} …\n`);
  try {
    execFileSync('npx', ['--yes', 'lighthouse', BASE + path,
      '--only-categories=accessibility,best-practices',
      '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
      '--output=json', `--output-path=${out}`,
      '--quiet', '--no-enable-error-reporting',
      '--form-factor=desktop', '--screenEmulation.disabled',
    ], { stdio: ['ignore', 'ignore', 'pipe'], shell: true, timeout: 300000 });
  } catch (e) {
    R.routes[slug] = { route: path, error: String(e.stderr || e).slice(0, 400) };
    continue;
  }
  if (!existsSync(out)) { R.routes[slug] = { route: path, error: 'no report produced' }; continue; }
  const j = JSON.parse(readFileSync(out, 'utf8'));
  const cats = {};
  for (const [k, c] of Object.entries(j.categories || {})) cats[k] = c.score === null ? null : Math.round(c.score * 100);
  const failed = [];
  const manual = [];
  for (const [id, a] of Object.entries(j.audits || {})) {
    if (a.scoreDisplayMode === 'manual') { manual.push(id); continue; }
    if (a.scoreDisplayMode === 'notApplicable' || a.scoreDisplayMode === 'informative') continue;
    if (a.score !== null && a.score < 1) {
      failed.push({ id, title: a.title, score: a.score,
        items: ((a.details && a.details.items) || []).slice(0, 4).map(it => (it.node && (it.node.snippet || it.node.selector)) || it.source || JSON.stringify(it).slice(0, 110)) });
    }
  }
  R.routes[slug] = { route: path, lighthouseVersion: j.lighthouseVersion, userAgent: (j.environment || {}).hostUserAgent,
    scores: cats, failedAudits: failed, manualAuditCount: manual.length };
}

writeFileSync(OUT, JSON.stringify(R, null, 1));
for (const [k, v] of Object.entries(R.routes)) {
  if (v.error) { console.log(`${k.padEnd(20)} ERROR ${v.error.slice(0, 120)}`); continue; }
  console.log(`${k.padEnd(20)} a11y=${v.scores.accessibility}  best-practices=${v.scores['best-practices']}  failed=${v.failedAudits.length}`);
  for (const f of v.failedAudits) console.log(`    - [${f.id}] ${f.title}`);
}
console.log('lighthouse version:', Object.values(R.routes).find(v => v.lighthouseVersion)?.lighthouseVersion);
