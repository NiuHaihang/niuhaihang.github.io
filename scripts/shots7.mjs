import { chromium } from '@playwright/test';
const BASE = 'http://localhost:5174/';
const b = await chromium.launch({ channel: 'chrome' });
for (const [name, viewport, mobile] of [
  ['60-home-phone', { width: 390, height: 844 }, true],
  ['61-home-phone-landscape', { width: 844, height: 390 }, true],
  ['62-home-tablet', { width: 820, height: 1180 }, false],
]) {
  const ctx = await b.newContext({ viewport, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(name, 'overflow-x:', overflow);
  await p.screenshot({ path: `shots/${name}.png`, fullPage: true });
  await ctx.close();
}
await b.close();
