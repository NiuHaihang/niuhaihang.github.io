import { chromium } from '@playwright/test';
const browser = await chromium.launch({ channel: 'chrome' });
for (const [name, width, height] of [['ipad', 1024, 768], ['desktop', 1440, 900]]) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/20-home-${name}.png` });
  await page.locator('.btn--primary.btn--xl').click();
  await page.waitForSelector('.equation');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `shots/21-quiz-${name}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(name, 'horizontal overflow:', overflow);
  await ctx.close();
}
await browser.close();
