import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errors = [];
p.on('pageerror', (e) => errors.push(e.message));

// Seed a due-today memory so the review card is live.
await p.addInitScript(() => {
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  localStorage.setItem('bunny-english.v1', JSON.stringify({
    v: 1, grade: 3, topic: 'words', stars: { 'words-3-u1': 2 },
    memory: {
      'w:hello': { n: 1, due: key },
      'w:teacher': { n: 0, due: key },
      'w:school': { n: 2, due: key },
      's:Hello, I am Sarah.': { n: 1, due: key },
    },
    days: [key], sound: true,
  }));
});

await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
console.log('review count:', await p.locator('.review-card__count').textContent());
await p.screenshot({ path: 'shots/eng-12-home-review.png' });

await p.locator('.review-card').click();
await p.waitForSelector('.ex');
await p.waitForTimeout(250);
console.log('review total:', await p.locator('.bar__count').textContent());
await p.screenshot({ path: 'shots/eng-13-review-question.png' });
console.log('errors:', JSON.stringify(errors.slice(0, 3)));
await b.close();
