import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(300);
await p.screenshot({ path: 'shots/eng-10-home-review-empty.png' });

// Grammar lesson: sentences + blank, no match step. Submit empty answers => all wrong.
await p.locator('.topic').nth(2).click();
await p.waitForTimeout(250);
await p.locator('.lesson').first().click();
await p.waitForSelector('.ex');
for (let i = 0; i < 16; i++) {
  const tiles = p.locator('.tile:not([disabled])');
  if (await tiles.count()) {
    const n = await tiles.count();
    for (let k = 0; k < n; k++) await p.locator('.tile:not([disabled])').first().click();
  } else {
    const option = p.locator('.options .option:not([disabled])');
    if (await option.count()) await option.first().click();
  }
  await p.waitForTimeout(150);
  const check = p.locator('.ex__actions .btn--primary');
  if (await check.count()) {
    const enabled = await check.isEnabled().catch(() => false);
    if (enabled) await check.click();
  }
  await p.waitForTimeout(300);
  const next = p.locator('.feedback .btn--primary');
  if (await next.count()) {
    await next.click();
    await p.waitForTimeout(300);
  }
  if (await p.locator('.result').count()) break;
}
await p.waitForTimeout(300);
console.log('mistake rows:', await p.locator('.missed__row').count());
await p.screenshot({ path: 'shots/eng-11-result-mistakes.png', fullPage: true });

await p.locator('.result__actions .btn--ghost').click();
await p.waitForTimeout(400);
await p.screenshot({ path: 'shots/eng-12-home-review.png' });
console.log('review badge:', await p.locator('.review-card__count').textContent().catch(() => 'none'));
console.log('errors:', JSON.stringify(errors.slice(0, 3)));
await b.close();
