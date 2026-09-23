/* Phase 8 — research-circuit hero, Gecko parity check.
   node docs/redesign/evidence/phase8-circuit-firefox.mjs [base] */
import { firefox } from 'playwright';

const BASE = process.argv[2] || 'http://127.0.0.1:1338';
const browser = await firefox.launch({ headless: true });
console.log('Firefox ' + browser.version());

const IDLE = () => {
  const c = document.querySelector('.sj-circuit');
  const de = document.documentElement;
  const vis = (e) => getComputedStyle(e).display !== 'none';
  const doms = Array.from(document.querySelectorAll('[data-research-domain]'));
  const shown = doms.filter(vis);
  const icon = shown[0].querySelector('.sj-domain__icon');
  const title = shown[0].querySelector('.sj-domain__title');
  const desc = shown[0].querySelector('.sj-domain__desc');
  const svg = c.querySelector('.sj-circuit__svg');
  return {
    heroH: Math.round(document.querySelector('.sj-hero').getBoundingClientRect().height),
    domains: shown.map((e) => e.getAttribute('data-research-domain')),
    netOpacity: +getComputedStyle(c.querySelector('.sj-net--base')).opacity,
    iconOpacity: +getComputedStyle(icon).opacity,
    titleOpacity: +getComputedStyle(title).opacity,
    descVisibility: getComputedStyle(desc).visibility,
    quietZoneMask: !!(getComputedStyle(svg).maskImage && getComputedStyle(svg).maskImage !== 'none'),
    glowMask: !!(getComputedStyle(c.querySelector('.sj-net--glow')).maskImage || '').includes('gradient'),
    docOverflow: de.scrollWidth - de.clientWidth,
    h1: document.querySelectorAll('h1').length,
    infinite: document.getAnimations().filter((a) => { try { return a.effect.getTiming().iterations === Infinity; } catch (e) { return false; } }).length,
    traces: c.querySelectorAll('.sj-trace').length,
  };
};

for (const [label, w, h] of [['1440', 1440, 900], ['1024', 1024, 768], ['390', 390, 844]]) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(2800);
    const v = await page.evaluate(IDLE);
    console.log(`${label.padEnd(5)} ${theme.padEnd(5)} hero=${v.heroH} domains=${v.domains.length} [${v.domains.join(',')}] net=${v.netOpacity} icon=${v.iconOpacity} title=${v.titleOpacity} desc=${v.descVisibility} quietMask=${v.quietZoneMask} glowMask=${v.glowMask} ovf=${v.docOverflow} h1=${v.h1} inf=${v.infinite} traces=${v.traces}`);
    await ctx.close();
  }
}

/* hover + keyboard + click safety */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(2800);

  await page.hover('[data-research-domain="quantum"] .sj-domain__hit');
  await page.waitForTimeout(700);
  console.log('hover quantum: ' + JSON.stringify(await page.evaluate(() => {
    const el = document.querySelector('[data-research-domain="quantum"]');
    const c = document.querySelector('.sj-circuit');
    return {
      active: el.classList.contains('is-active'),
      activeAttr: c.getAttribute('data-active'),
      icon: +getComputedStyle(el.querySelector('.sj-domain__icon')).opacity,
      desc: getComputedStyle(el.querySelector('.sj-domain__desc')).visibility,
      ownStroke: getComputedStyle(c.querySelector('.sj-net--base [data-trace-domain="quantum"] .sj-trace')).stroke,
      otherGroup: +getComputedStyle(c.querySelector('.sj-net--base [data-trace-domain="energy"]')).opacity,
    };
  })));

  await page.mouse.move(720, 120);
  await page.waitForTimeout(600);

  // keyboard: tab to the first domain button
  const stops = [];
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    stops.push(await page.evaluate(() => {
      const e = document.activeElement;
      const d = e.closest && e.closest('[data-research-domain]');
      const cs = getComputedStyle(e);
      return { name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24),
        domain: d ? d.getAttribute('data-research-domain') : null,
        descVisible: d ? getComputedStyle(d.querySelector('.sj-domain__desc')).visibility : null,
        ring: (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== 'none') };
    }));
  }
  const dom = stops.filter((s) => s.domain);
  console.log('keyboard: domainStops=' + dom.length + ' withRing=' + dom.filter((s) => s.ring).length + ' revealingDesc=' + dom.filter((s) => s.descVisible === 'visible').length);
  console.log('  names: ' + dom.map((s) => s.name).join(', '));

  console.log('click safety: ' + JSON.stringify(await page.evaluate(() => {
    const b = document.querySelector('.sj-btn--primary').getBoundingClientRect();
    const t = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
    return { primaryReachable: !!(t && t.closest('.sj-btn--primary')),
      overHeroText: !!(document.elementFromPoint(720, 300) || {}).tagName };
  })));
  await ctx.close();
}

/* reduced motion */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  await page.hover('[data-research-domain="computing"] .sj-domain__hit');
  await page.waitForTimeout(600);
  console.log('reduced motion: ' + JSON.stringify(await page.evaluate(() => ({
    glowDisplay: getComputedStyle(document.querySelector('.sj-net--glow')).display,
    pulsing: document.querySelectorAll('.is-pulsing').length,
    running: document.getAnimations().length,
    active: document.querySelector('[data-research-domain="computing"]').classList.contains('is-active'),
    desc: getComputedStyle(document.querySelector('[data-research-domain="computing"] .sj-domain__desc')).visibility,
    iconTransform: getComputedStyle(document.querySelector('[data-research-domain="computing"] .sj-domain__icon')).transform,
  }))));
  await ctx.close();
}

await browser.close();
