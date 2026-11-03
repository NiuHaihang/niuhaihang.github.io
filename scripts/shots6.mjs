import { chromium } from '@playwright/test';
const BASE = 'http://localhost:5174/';
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, locale: 'en-GB' });
const page = await ctx.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.locator('.track--all4').click();
await page.locator('.level--blush').click();
await page.waitForTimeout(400);
await page.screenshot({ path: 'shots/50-home-all4.png' });

await page.locator('.btn--primary.btn--xl').click();
await page.waitForSelector('.equation');
for (let i = 0; i < 18; i++) {
  const label = await page.locator('.equation').getAttribute('aria-label');
  if (label.includes('×')) {
    const tk = label.split(' ').filter(Boolean);
    const a = Number(tk[0]);
    const b = Number(tk[2]);
    const ans = a * b;
    for (const d of String(ans + 1)) await page.locator(`.key--digit[aria-label="${d}"]`).click();
    await page.locator('.key--go').click();
    await page.waitForTimeout(250);
    await page.locator('.chip', { hasText: 'Show me' }).click();
    await page.waitForTimeout(450);
    await page.screenshot({ path: 'shots/51-times-sheet.png' });
    break;
  }
  const tk = label.split(' ').filter(Boolean);
  const eq = tk.indexOf('=');
  const a = Number(tk[0]);
  const b = Number(tk[2]);
  const op = tk[1];
  const right = Number(tk[eq + 1]);
  const ans = a === 0 || tk[0] === '?' ? 0 : op === '+' ? a + b : op === '−' ? a - b : 0;
  const value = tk[0] === '?' ? 0 : ans;
  if (value) for (const d of String(value)) await page.locator(`.key--digit[aria-label="${d}"]`).click();
  await page.locator('.key--go').click();
  await page.waitForTimeout(1250);
}
await browser.close();
console.log('ok');
