import { chromium } from '@playwright/test';
const b = await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, locale: 'en-GB' });
const p = await ctx.newPage();
await p.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
await p.evaluate(() => document.fonts.ready);
await p.waitForTimeout(400);
await p.screenshot({ path: 'shots/63-home-addsub.png' });
await b.close();
