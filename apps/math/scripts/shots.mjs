import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:5173/';
const OUT = process.env.OUT_DIR ?? 'shots';

await mkdir(OUT, { recursive: true });

/** Read the current equation and work out the missing number. */
async function readQuestion(page) {
  const label = await page.locator('.equation').getAttribute('aria-label');
  const tokens = label.split(' ').filter(Boolean);
  const op = tokens.includes('+') ? '+' : '-';
  const eq = tokens.indexOf('=');
  const left = tokens.slice(0, eq);
  const right = tokens[eq + 1];
  const a = left[0];
  const b = left[2];
  let answer;
  if (a === '?') answer = op === '+' ? Number(right) - Number(b) : Number(right) + Number(b);
  else if (b === '?') answer = op === '+' ? Number(right) - Number(a) : Number(a) - Number(right);
  else answer = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
  return { label, answer, op };
}

async function typeNumber(page, value) {
  for (const digit of String(value)) {
    await page.locator(`.key--digit[aria-label="${digit}"]`).click();
  }
}

async function answerOne(page, { offset = 0 } = {}) {
  const { answer } = await readQuestion(page);
  await typeNumber(page, Math.max(0, answer + offset));
  await page.locator('.key--go').click();
  return answer;
}

async function waitForNextQuestion(page, previousIndex) {
  await page
    .waitForFunction(
      (prev) => {
        const el = document.querySelector('.quiz__count');
        if (!el) return false;
        const m = /(\d+)/.exec(el.textContent ?? '');
        return m ? Number(m[1]) !== prev : false;
      },
      previousIndex,
      { timeout: 4000 },
    )
    .catch(() => {});
}

async function currentIndex(page) {
  const text = (await page.locator('.quiz__count').textContent()) ?? '';
  const m = /\d+/.exec(text);
  return m ? Number(m[0]) : 1;
}

const browser = await chromium.launch({ channel: 'chrome' });

/* ------------------------------------------------ tablet landscape run */
{
  const ctx = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: 2,
    locale: 'en-GB',
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/01-home-tablet.png` });

  await page.locator('.btn--primary.btn--xl').click();
  await page.waitForSelector('.equation');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/02-quiz-input.png` });

  await answerOne(page);
  // The correct state auto-advances after ~1 s: grab it fast.
  await page.waitForTimeout(60);
  await page.screenshot({ path: `${OUT}/03-quiz-correct.png` });

  let index = await currentIndex(page);
  await waitForNextQuestion(page, index);
  await page.waitForTimeout(250);

  // deliberately wrong, then open the explanation
  index = await currentIndex(page);
  await answerOne(page, { offset: 1 });
  await page.waitForTimeout(260);
  await page.screenshot({ path: `${OUT}/04-quiz-wrong.png` });

  await page.locator('.chip', { hasText: 'Show me' }).click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/05-explanation.png` });
  await page.locator('.sheet__panel .btn--primary').click();
  await page.waitForTimeout(200);
  await page.locator('.key--go').click();
  await waitForNextQuestion(page, index);
  await page.waitForTimeout(200);

  // finish the round
  for (let i = 0; i < 20; i++) {
    if ((await page.locator('.result').count()) > 0) break;
    if ((await page.locator('.equation').count()) === 0) break;
    await answerOne(page);
    const at = await currentIndex(page);
    await page.waitForTimeout(1250);
    await waitForNextQuestion(page, at);
  }

  await page.waitForSelector('.result', { timeout: 5000 });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/06-result-tablet.png`, fullPage: true });

  await ctx.close();
}

/* --------------------------------------------------------- phone run */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'en-GB',
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/07-home-phone.png` });

  await page.locator('.btn--primary.btn--xl').click();
  await page.waitForSelector('.equation');
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/08-quiz-phone.png` });

  await ctx.close();
}

/* -------------------------------------------------------- chinese run */
{
  const ctx = await browser.newContext({
    viewport: { width: 1180, height: 820 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.home__tools .iconbtn--text').nth(0).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/09-home-zh.png` });

  await page.locator('.btn--primary.btn--xl').click();
  await page.waitForSelector('.equation');
  await page.waitForTimeout(300);
  await answerOne(page);
  await page.waitForTimeout(1200);
  const idx = await currentIndex(page);
  await waitForNextQuestion(page, idx);
  await answerOne(page, { offset: 2 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/10-quiz-zh-wrong.png` });
  await ctx.close();
}

/* ----------------------------------------------------------- worksheet run */
{
  const ctx = await browser.newContext({
    viewport: { width: 1180, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.btn--ghost', { hasText: 'Print worksheet' }).click();
  await page.waitForSelector('.print-sheet');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/11-worksheet.png`, fullPage: true });
  await ctx.close();
}

/* -------------------------------------------------- landscape phone run */
{
  const ctx = await browser.newContext({
    viewport: { width: 844, height: 390 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/12-home-phone-landscape.png` });
  await page.locator('.btn--primary.btn--xl').click();
  await page.waitForSelector('.equation');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/13-quiz-phone-landscape.png` });
  await ctx.close();
}

await browser.close();
console.log('screenshots done');
