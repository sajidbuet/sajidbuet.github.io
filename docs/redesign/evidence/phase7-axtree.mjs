/* Phase 7 §18 — accessible names straight from the browser's accessibility tree.

   A hand-rolled accName() heuristic is not evidence: the first version of this
   check treated an icon-only link's whitespace textContent as a name and never
   reached the <img alt>/<svg><title> fallback, so it reported false positives.
   CDP's Accessibility domain computes the real name the way a screen reader does.

   node docs/redesign/evidence/phase7-axtree.mjs
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, HERE, ROUTES, BASE } from './phase7-cdp.mjs';

const OUT = resolve(HERE, 'phase7-axtree.json');
const { proc, port, version } = await launch();
const s = await attach(port);
await s.send('Accessibility.enable');
await s.send('DOM.enable');

const R = { meta: { browser: version, base: BASE, at: new Date().toISOString() }, routes: {} };

const INTERACTIVE = new Set(['link', 'button', 'textbox', 'searchbox', 'combobox', 'checkbox', 'radio', 'menuitem', 'tab', 'switch', 'slider', 'disclosure triangle']);

for (const [slug, path] of [...ROUTES, ['home@390', '/'], ['notes', '/teaching/notes/']]) {
  const mobile = slug.endsWith('@390');
  await go(s, path, { w: mobile ? 390 : 1440, h: mobile ? 844 : 900, mobile, theme: 'light', settle: 2000 });
  const { nodes } = await s.send('Accessibility.getFullAXTree', {}, 90000);

  const unnamed = [];
  const headings = [];
  const landmarks = [];
  let interactive = 0;
  for (const n of nodes) {
    if (n.ignored) continue;
    const role = n.role && n.role.value;
    const name = (n.name && n.name.value || '').trim();
    if (INTERACTIVE.has(role)) {
      interactive++;
      if (!name) unnamed.push({ role, backendId: n.backendDOMNodeId, props: (n.properties || []).map(p => p.name + '=' + JSON.stringify(p.value && p.value.value)).slice(0, 4) });
    }
    if (role === 'heading') headings.push({ level: (n.properties || []).find(p => p.name === 'level')?.value?.value, name: name.slice(0, 50) });
    if (['banner', 'navigation', 'main', 'contentinfo', 'complementary', 'search', 'region', 'form'].includes(role)) landmarks.push({ role, name: name.slice(0, 40) });
  }

  /* resolve the unnamed ones back to markup so the finding is actionable */
  for (const u of unnamed.slice(0, 25)) {
    try {
      const { object } = await s.send('DOM.resolveNode', { backendNodeId: u.backendId });
      const r = await s.send('Runtime.callFunctionOn', {
        objectId: object.objectId, returnByValue: true,
        functionDeclaration: `function(){ return this.outerHTML.replace(/\\s+/g,' ').slice(0,180); }`,
      });
      u.html = r.result.value;
    } catch { u.html = '(unresolved)'; }
  }

  R.routes[slug] = { route: path, interactive, unnamedCount: unnamed.length, unnamed: unnamed.slice(0, 25),
    landmarks, headingCount: headings.length,
    headingOutline: headings.slice(0, 24).map(h => 'h' + h.level + ' ' + h.name) };
  process.stderr.write(`ax: ${slug} — ${unnamed.length} unnamed of ${interactive} interactive\n`);
}

R.summary = Object.fromEntries(Object.entries(R.routes).map(([k, v]) => [k, `${v.unnamedCount}/${v.interactive}`]));
writeFileSync(OUT, JSON.stringify(R, null, 1));
console.log(JSON.stringify(R.summary, null, 1));
const all = new Map();
for (const v of Object.values(R.routes)) for (const u of v.unnamed) {
  const k = u.role + ' :: ' + String(u.html).slice(0, 110);
  all.set(k, (all.get(k) || 0) + 1);
}
console.log('--- distinct unnamed interactive nodes ---');
[...all.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, n]) => console.log(`  x${n} ${k}`));
try { s.ws.close(); } catch {}
proc.kill(); process.exit(0);
