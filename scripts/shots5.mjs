import { chromium } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:5174/';
const OUT = 'shots';

function parse(label) {
  const tk = label.split(' ').filter(Boolean);
  const op = tk.includes('×') ? '×' : tk.includes('÷') ? '÷' : tk.includes('+') ? '+' : '-';
  const eq = tk.indexOf('=');
  const left = tk.slice(0, eq);
  const right = tk[eq + 1];
  const a = left[0];
  const b = left[2];
  let answer;
  if (a === '?') answer = op === '+' ? Number(right) - Number(b) : op === '-' ? Number(right) + Number(b) : op === '×' ? Number(right) / Number(b) : Number(right) * Number(b);
  else if (b === '?') answer = op === '+' ? Number(right) - Number(a) : op === '-' ? Number(a) - Number(right) : op === '×' ? Number(right) / Number(a) : Number(a) / Number(right);
  else answer = op === '+' ? Number(a) + Number(b) : op === '-' ? Number(a) - Number(b) : op === '×' ? Number(a) * Number(b) : Number(a) / Number(b);
  return { op, a, b, answer, label };
}

async function typeNumber(page, n) {
  for (const d of String(n)) await page.locator(`.key--digit[aria-label="${d}"]`).click();
}

const browser = await chromium.launch({ channel: 'chrome' });

const ACCENT = { sprout: 'mint', blossom: 'blush', sparkle: 'lilac', starlight: 'butter' };

async function run(levelId, wantOp, name, { sheet = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2, locale: 'en-GB' });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.track--all4').click();
  await page.locator(`.level--${ACCENT[levelId]}`).click();
  await page.waitForTimeout(150);
  await page.locator('.btn--primary.btn--xl').click();
  await page.waitForSelector('.equation');

  for (let i = 0; i < 18; i++) {
    const label = await page.locator('.equation').getAttribute('aria-label');
    const q = parse(label);
    if (q.op === wantOp) {
      await page.waitForTimeout(200);
      await page.screenshot({ path: `${OUT}/${name}.png` });
      if (sheet) {
        // make it wrong on purpose so "Show me" is offered
        await typeNumber(page, Math.max(1, q.answer + 1));
        await page.locator('.key--go').click();
        await page.waitForTimeout(250);
        await page.locator('.chip', { hasText: 'Show me' }).click();
        await page.waitForTimeout(400);
        await page.screenshot({ path: `${OUT}/${name}-sheet.png` });
      }
      await ctx.close();
      return q;
    }
    await typeNumber(page, q.answer);
    await page.locator('.key--go').click();
    await page.waitForTimeout(1200);
  }
  await ctx.close();
  return null;
}

console.log('sprout ×:', JSON.stringify(await run('sprout', '×', '44-quiz-times')));
console.log('starlight ÷:', JSON.stringify(await run('starlight', '÷', '45-quiz-divide')));
await browser.close();
