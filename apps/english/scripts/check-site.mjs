import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const errors = [];
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

await p.goto('http://127.0.0.1:4180/english/', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
console.log('english root children:', await p.evaluate(() => document.querySelector('#root')?.children.length));
console.log('english h1:', await p.locator('h1').first().textContent());
await p.screenshot({ path: 'shots/eng-14-built.png' });

await p.goto('http://127.0.0.1:4180/', { waitUntil: 'networkidle' });
await p.waitForTimeout(700);
console.log('math h1:', await p.locator('h1').first().textContent());
console.log('errors:', JSON.stringify(errors.slice(0, 4)));
await b.close();
