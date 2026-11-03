import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

/** Raster the app icons with the system Chrome: no image libraries needed. */
const OUT = 'public/icons';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

async function render(svgPath, outPath, size, opaque = false) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
    ...(opaque ? { background: '#E6F0FF' } : {}),
  });
  const page = await ctx.newPage();
  const svg = (await readFile(svgPath, 'utf8'))
    .replace('width="64"', `width="${size}"`)
    .replace('height="64"', `height="${size}"`);
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style>${svg}`,
    { waitUntil: 'load' },
  );
  await page.waitForTimeout(120);
  await page.screenshot({ path: outPath, omitBackground: !opaque });
  await ctx.close();
  console.log('wrote', outPath);
}

await render('public/favicon.svg', `${OUT}/icon-512.png`, 512);
await render('public/favicon.svg', `${OUT}/icon-192.png`, 192);
await render('public/icons/icon-square.svg', `${OUT}/maskable-512.png`, 512, true);
await render('public/icons/icon-square.svg', 'public/apple-touch-icon.png', 180, true);

await browser.close();
