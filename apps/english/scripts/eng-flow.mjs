import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errors = [];
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.locator('.lesson').first().click();
await p.waitForSelector('.ex');

const kinds = new Set();
for (let i = 0; i < 12; i++) {
  const kind = await p.evaluate(() => {
    const el = document.querySelector('.ex');
    return el ? [...el.classList].find((c) => c.startsWith('ex--'))?.slice(4) : 'unknown';
  });
  kinds.add(kind);
  await p.screenshot({ path: `shots/eng-q${String(i + 1).padStart(2, '0')}-${kind}.png` });

  // answer loosely: click first option, or fill tiles
  const isMatch = await p.locator('.matchgrid').count();
  if (isMatch) {
    for (let guard = 0; guard < 12; guard++) {
      const lefts = p.locator('.matchcol').first().locator('.option:not([disabled])');
      if ((await lefts.count()) === 0) break;
      await lefts.first().click();
      const doneBefore = await p.locator('.option--done').count();
      const rights = p.locator('.matchcol').nth(1).locator('.option:not([disabled])');
      const n = await rights.count();
      for (let r = 0; r < n; r++) {
        await p.locator('.matchcol').nth(1).locator('.option:not([disabled])').first().click();
        if ((await p.locator('.option--done').count()) > doneBefore) break;
      }
    }
)
    await options.first().click();
  } else if (await p.locator('.tile:not([disabled])').count()) {
    const tiles = p.locator('.tile:not([disabled])');
    const n = await tiles.count();
    for (let k = 0; k < n; k++) await p.locator('.tile:not([disabled])').first().click();
    await p.locator('.btn--primary').click();
  } else if (await p.locator('.option:not([disabled]), .wordcard:not([disabled])').count()) {
    await p.locator('.option:not([disabled]), .wordcard:not([disabled])').first().click();
  }
  await p.waitForTimeout(350);
  const next = p.locator('.feedback .btn--primary');
  if (await next.count()) {
    await next.click();
    await p.waitForTimeout(400);
  }
  if (await p.locator('.result').count()) break;
}
console.log('kinds:', [...kinds].join(', '));
await p.screenshot({ path: 'shots/eng-result.png' });
console.log('errors:', JSON.stringify(errors.slice(0, 5)));
await b.close();
