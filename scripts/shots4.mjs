import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:5174/';
const OUT = process.env.OUT_DIR ?? 'shots';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

async function shot(name, opts = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1180, height: 900 },
    deviceScaleFactor: 2,
    locale: 'en-GB',
    ...opts,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  return { ctx, page };
}

/* home, add/sub set */
{
  const { ctx, page } = await shot();
  await page.screenshot({ path: `${OUT}/40-home-addsub.png`, fullPage: true });
  await ctx.close();
}

/* home, all four */
{
  const { ctx, page } = await shot();
  await page.locator('.track--all4').click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/41-home-all4.png`, fullPage: true });
  await page.locator('.btn--primary.btn--xl').click();
  await page.waitForSelector('.equation');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/42-quiz-all4.png` });
  await ctx.close();
}

/* phone home with both menus */
{
  const { ctx, page } = await shot({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.screenshot({ path: `${OUT}/43-home-phone.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
console.log('done');
