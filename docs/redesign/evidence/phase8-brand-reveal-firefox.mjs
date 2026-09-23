/* Phase 8 - navbar brand reveal, Gecko parity check.
   node docs/redesign/evidence/phase8-brand-reveal-firefox.mjs [base] */
import { firefox } from 'playwright';
const BASE = process.argv[2] || 'http://127.0.0.1:1337';
const browser = await firefox.launch({ headless: true });
console.log('Firefox ' + browser.version());

const STATE = () => {
  const b = document.querySelector('.navbar-brand');
  const cs = getComputedStyle(b);
  const r = b.getBoundingClientRect();
  const first = document.querySelector('header nav a.nav-link');
  return { shown: b.classList.contains('sj-brand--shown'), visibility: cs.visibility,
    opacity: +(+cs.opacity).toFixed(2), boxW: Math.round(r.width),
    firstNavLinkX: first ? Math.round(first.getBoundingClientRect().left) : null,
    headerH: Math.round(document.querySelector('.page-header').getBoundingClientRect().height),
    scrollY: Math.round(scrollY) };
};

for (const [label, w, h] of [['1440', 1440, 900], ['768', 768, 1024], ['390', 390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  const top = await page.evaluate(STATE);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(700);
  const scrolled = await page.evaluate(STATE);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  const back = await page.evaluate(STATE);
  console.log(`${label.padEnd(5)} top: ${top.visibility}/${top.opacity} | scrolled: ${scrolled.visibility}/${scrolled.opacity} | back: ${back.visibility}/${back.opacity} | navX ${top.firstNavLinkX}->${scrolled.firstNavLinkX} | boxW ${top.boxW}->${scrolled.boxW} | headerH ${top.headerH}->${scrolled.headerH}`);
  await ctx.close();
}

/* focusability: hidden must not be tabbable, shown must be */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2200);
  const atTop = [];
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    atTop.push(await page.evaluate(() => { const e = document.activeElement;
      return (String(e.className).indexOf('navbar-brand') > -1 ? 'BRAND:' : '') + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24); }));
  }
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(700);
  const shownFocus = await page.evaluate(() => {
    const l = document.querySelector('header nav a.nav-link');
    l.focus({ preventScroll: true });
    return { from: (l.textContent || '').trim().slice(0, 16), y: Math.round(scrollY) };
  });
  await page.keyboard.press('Shift+Tab');
  const landed = await page.evaluate(() => { const e = document.activeElement;
    return { isBrand: String(e.className).indexOf('navbar-brand') > -1,
      name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 28), y: Math.round(scrollY) }; });
  console.log('keyboard atTop: ' + atTop.join(' | '));
  console.log('  brand tabbable at top: ' + atTop.some(x => x.startsWith('BRAND:')) + '  (expect false)');
  console.log('  shift-tab from "' + shownFocus.from + '" @y' + shownFocus.y + ' landed on: ' + JSON.stringify(landed) + '  (expect isBrand true)');
  await ctx.close();
}

/* reduced motion */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  const a = await page.evaluate(STATE);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await page.waitForTimeout(500);
  const b = await page.evaluate(() => { const el = document.querySelector('.navbar-brand'); const cs = getComputedStyle(el);
    return { visibility: cs.visibility, opacity: +(+cs.opacity).toFixed(2), transitionDuration: cs.transitionDuration, transform: cs.transform }; });
  console.log('reduced motion: top ' + a.visibility + '/' + a.opacity + ' -> scrolled ' + JSON.stringify(b));
  await ctx.close();
}

/* non-homepage */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/research/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  console.log('/research/: ' + JSON.stringify(await page.evaluate(STATE)));
  await ctx.close();
}

await browser.close();
