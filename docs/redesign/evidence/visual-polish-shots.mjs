/* Visual polish (2026-10) — before/after evidence capture.

   node docs/redesign/evidence/visual-polish-shots.mjs <baseURL> <before|after>

   Serves nothing itself: point it at a production build (`hugo --minify`)
   served on any port. Uses the repo's Playwright devDependency driving the
   locally installed Chrome (no Playwright Chromium download needed).
   Every capture uses the same viewport/theme/scroll so before and after are
   directly comparable. Full-page captures are JPEG q55 to keep the set small. */
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(HERE, '../../../package.json'));
const { chromium } = require('playwright');
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const [base, tag] = process.argv.slice(2);
const OUT = resolve(HERE, '../screenshots/visual-polish', tag);
mkdirSync(OUT, { recursive: true });

// [file, path, width, height, theme, fullPage, mobile, scrollTo selector]
const JOBS = [
  ['home-1440-light', '/', 1440, 900, 'light', true],
  ['home-1440-dark', '/', 1440, 900, 'dark', true],
  ['home-390-light', '/', 390, 844, 'light', true, true],
  ['home-390-dark', '/', 390, 844, 'dark', false, true],
  ['research-1440-light', '/research/', 1440, 900, 'light', true],
  ['research-area-1440-light', '/research/photonics/', 1440, 900, 'light', true],
  ['projects-1440-light', '/projects/', 1440, 900, 'light', false],
  ['publications-1440-light', '/publication/', 1440, 900, 'light', false],
  ['publications-1440-dark', '/publication/', 1440, 900, 'dark', false],
  ['team-1440-light', '/authors/', 1440, 900, 'light', true],
  ['blog-1440-light', '/resources/blog/', 1440, 900, 'light', false],
  ['news-1440-light', '/news/', 1440, 900, 'light', false],
  ['article-1440-light', '/resources/blog/20260124-Citation-Count/', 1440, 900, 'light', false],
  ['article-390-light', '/resources/blog/20260124-Citation-Count/', 390, 844, 'light', false, true],
  ['resources-1440-light', '/resources/', 1440, 900, 'light', false],
  ['footer-1440-light', '/teaching/', 1440, 900, 'light', false, false, 'footer'],
  ['footer-1440-dark', '/teaching/', 1440, 900, 'dark', false, false, 'footer'],
];

const browser = await chromium.launch({ executablePath: CHROME });
for (const [file, path, w, h, theme, full, mobile, scrollSel] of JOBS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, isMobile: !!mobile, hasTouch: !!mobile });
  const p = await ctx.newPage();
  await p.goto(base + path, { waitUntil: 'networkidle' });
  // Decode lazy images before a full-page capture.
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); });
  if (scrollSel) await p.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'end' }), scrollSel);
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/${file}.jpg`, fullPage: !!full, type: 'jpeg', quality: full ? 55 : 72 });
  console.log(file);
  await ctx.close();
}
await browser.close();
