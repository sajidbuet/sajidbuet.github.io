/* Phase 8 item 8.20 — the search box: does it exist, does it stay quiet until
   opened, and does it return real results?

   Three things are asserted, because making search lazy could plausibly have
   broken any of them:

     1. On load, NOTHING under /pagefind/ is requested and the console is clean.
        (Before: /pagefind/pagefind.js 404'd on every page. After the index was
        added but before laziness: it loaded and indexed on every page load.)
     2. Opening the modal loads Pagefind and focuses the input.
     3. Typing a query that only matches a page which was invisible to the old
        index — a publication and an author — returns results.

   Requires a Pagefind index next to the build:
     hugo --minify --destination public_p8b
     npx --yes pagefind@1.4.0 --site public_p8b
     node <this file>
*/
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { launch, attach, go, sleep, key, HERE, BASE } from './phase7-cdp.mjs';

/* Phase 8 closure requires one hit in each of four content categories, so each
   query is chosen to land in a section that Pagefind could not see before 8.20
   (publications, people, projects, grants) or, for teaching, one it could. */
const QUERIES = [
  ['metasurface', 'publication', /\/publication\//],
  ['Purbayan', 'person', /\/authors\//],
  ['CTAdmin', 'project', /\/projects\//],
  ['biosensors', 'grant / funding', /\/research\/funding\//],
  ['digital electronics', 'teaching (reachable before 8.20 too)', /\/teaching\//],
];

const b = await launch();
const s = await attach(b.port);

const pagefindReqs = [];
const alpineReqs = [];
const consoleErrors = [];
s.on('Network.requestWillBeSent', (p) => {
  if (/\/pagefind\//.test(p.request.url)) pagefindReqs.push(p.request.url);
  if (/alpinejs/i.test(p.request.url)) alpineReqs.push(p.request.url);
});
s.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error') consoleErrors.push(p.args.map((a) => a.value ?? a.description).join(' ').slice(0, 160)); });
s.on('Log.entryAdded', (p) => { if (p.entry.level === 'error') consoleErrors.push(p.entry.text.slice(0, 160)); });

const R = { base: BASE, when: new Date().toISOString(), checks: [] };
const check = (name, ok, detail) => { R.checks.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

await go(s, '/', { w: 1280, h: 900, theme: 'light', settle: 3000 });
await sleep(1500);

check('idle page load requests nothing from /pagefind/', pagefindReqs.length === 0, `${pagefindReqs.length} request(s)`);
check('idle page load does not download Alpine', alpineReqs.length === 0, `${alpineReqs.length} request(s)`);
check('idle page load logs no console errors', consoleErrors.length === 0, consoleErrors[0] || '');

const trigger = await s.ev(`!!document.querySelector('[data-search-toggle]')`);
check('a search trigger exists', trigger === true);

/* Ctrl+K is normally an Alpine @keydown binding, so it cannot work before
   Alpine exists; the bootstrap in libraries.html has to own it until then. */
await s.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, nativeVirtualKeyCode: 75, modifiers: 2 });
await s.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'k', code: 'KeyK', windowsVirtualKeyCode: 75, nativeVirtualKeyCode: 75, modifiers: 2 });
await sleep(2500);
const openedByKey = await s.ev(`!!document.querySelector('[x-data]') && window.Alpine && Alpine.store('search').open === true`);
check('Ctrl+K loads Alpine and opens the modal', openedByKey === true, `${alpineReqs.length} Alpine request(s)`);

/* Close it and reopen with the button, exercising the other entry point. */
await key(s, 'Escape', 'Escape', 27);
await sleep(600);
await s.ev(`document.querySelector('[data-search-toggle]').click()`);
await sleep(2500);

check('opening the modal loads Pagefind', pagefindReqs.length > 0, `${pagefindReqs.length} request(s)`);
check('Alpine is downloaded exactly once', alpineReqs.length === 1, `${alpineReqs.length} request(s)`);
const focused = await s.ev(`(document.activeElement && (document.activeElement.type === 'search' || document.activeElement.type === 'text')) === true`);
check('the search input takes focus on open', focused === true);

let lastHref = null;
for (const [q, category, expect] of QUERIES) {
  await s.ev(`(() => {
    const i = document.querySelector('[x-ref="searchInput"]');
    i.value = ${JSON.stringify(q)};
    i.dispatchEvent(new Event('input'));
    return true;
  })()`);
  await sleep(2200);
  const hrefs = await s.ev(`Array.from(document.querySelectorAll('a[href]'))
    .filter(a => a.closest('[x-show]') && /\\/(publication|authors|teaching|news|resources|projects|research)\\//.test(a.getAttribute('href')))
    .map(a => a.getAttribute('href')).slice(0, 10)`);
  const matched = (hrefs || []).filter((h) => expect.test(h));
  if (matched.length) lastHref = matched[0];
  check(`query "${q}" finds a ${category}`, matched.length > 0,
    `${(hrefs || []).length} result link(s), ${matched.length} matching ${expect} — e.g. ${matched[0] || (hrefs || [])[0] || '(none)'}`);
}

/* Result navigation: does following a result actually land on that page? */
if (lastHref) {
  await go(s, lastHref, { w: 1280, h: 900, theme: 'light', settle: 1400 });
  const landed = await s.ev(`(() => ({ path: location.pathname, h1: (document.querySelector('h1')||{}).textContent || '', status: document.title }))()`);
  check('result navigation works', landed.path === lastHref,
    `followed "${lastHref}" -> ${landed.path}, h1 "${landed.h1.trim().slice(0, 60)}"`);
} else {
  check('result navigation works', false, 'no result href captured');
}

check('no console errors after searching', consoleErrors.length === 0, consoleErrors[0] || '');
check('no Pagefind 404', !consoleErrors.some((e) => /404|pagefind/i.test(e)), `${pagefindReqs.length} Pagefind requests, none failed`);

R.pagefindRequests = pagefindReqs.length;
R.consoleErrors = consoleErrors;
writeFileSync(resolve(HERE, 'phase8-search-qa.json'), JSON.stringify(R, null, 1));
const bad = R.checks.filter((c) => !c.ok);
console.log(`\n${R.checks.length - bad.length}/${R.checks.length} checks passed`);
s.ws.close(); b.proc.kill();
process.exit(bad.length ? 1 : 0);
