import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';

/**
 * Rasters the app icons with the system Chrome (no image libraries, no browser
 * download) by pointing a 512×512 page at the hand-written SVG.
 */
const OUT = 'public/icons';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });

async function render(svgPath, outPath, size, opaque = false) {
  const ctx = await browser.newContext({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
    ...(opaque ? { background: '#FFE3EC' } : {}),
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
