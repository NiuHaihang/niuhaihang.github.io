import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const reqs = [];
p.on('response', (r) => {
  const u = r.url();
  if (u.includes('/audio/')) reqs.push(`${r.status()} ${u.split('/audio/')[1]}`);
});
await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await p.locator('.lesson').first().click();
await p.waitForSelector('.ex');

// walk to the first listen exercise
for (let i = 0; i < 6; i++) {
  if (await p.locator('.speaker--big').count()) break;
  const opts = p.locator('.option:not([disabled]), .wordcard:not([disabled])');
  if (await opts.count()) await opts.first().click();
  else if (await p.locator('.tile:not([disabled])').count()) {
    const n = await p.locator('.tile:not([disabled])').count();
    for (let k = 0; k < n; k++) await p.locator('.tile:not([disabled])').first().click();
    await p.locator('.btn--primary').click();
  }
  await p.waitForTimeout(300);
  const next = p.locator('.feedback .btn--primary');
  if (await next.count()) { await next.click(); await p.waitForTimeout(400); }
}
await p.locator('.speaker--big').click();
await p.waitForTimeout(1500);
console.log('audio responses:', JSON.stringify(reqs, null, 1));
const playing = await p.evaluate(() => {
  const a = [...document.querySelectorAll('audio')];
  return a.map((x) => ({ src: x.currentSrc.split('/audio/')[1], t: Math.round(x.currentTime * 100) / 100, dur: Math.round(x.duration * 100) / 100, paused: x.paused }));
});
console.log('audio elements:', JSON.stringify(playing));
await b.close();
