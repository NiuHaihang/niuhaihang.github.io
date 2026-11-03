import { expect, test, type Page } from '@playwright/test';

type Sign = '+' | '-' | '×' | '÷';

function parseQuestion(label: string) {
  const tokens = label.split(' ').filter(Boolean);
  // The UI prints U+2212 for minus, so accept both dashes.
  const op: Sign =
    (['×', '÷', '+'] as Sign[]).find((s) => tokens.includes(s)) ??
    (tokens.includes('−') || tokens.includes('-') ? '-' : '+');
  const eq = tokens.indexOf('=');
  const [a, , b] = tokens.slice(0, eq);
  const right = tokens[eq + 1]!;
  return { op, a, b, right };
}

/** Read the equation on screen and work out the missing number. */
async function readQuestion(page: Page) {
  const label = (await page.locator('.equation').getAttribute('aria-label')) ?? '';
  const { op, a, b, right } = parseQuestion(label);
  if (a === '?') {
    if (op === '+') return Number(right) - Number(b);
    if (op === '-') return Number(right) + Number(b);
    return op === '×' ? Number(right) / Number(b) : Number(right) * Number(b);
  }
  if (b === '?') {
    if (op === '+') return Number(right) - Number(a);
    if (op === '-') return Number(a) - Number(right);
    return op === '×' ? Number(right) / Number(a) : Number(a) / Number(right);
  }
  if (op === '+') return Number(a) + Number(b);
  if (op === '-') return Number(a) - Number(b);
  return op === '×' ? Number(a) * Number(b) : Number(a) / Number(b);
}

async function readOp(page: Page): Promise<Sign> {
  const label = (await page.locator('.equation').getAttribute('aria-label')) ?? '';
  return parseQuestion(label).op;
}

async function typeNumber(page: Page, value: number) {
  for (const digit of String(value)) {
    await page.locator(`.key--digit[aria-label="${digit}"]`).click();
  }
}

async function questionNumber(page: Page): Promise<number> {
  const text = (await page.locator('.quiz__count').textContent()) ?? '';
  return Number(/\d+/.exec(text)?.[0] ?? 0);
}

test('a full round runs from home to the result screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ready to count?' })).toBeVisible();

  await page.getByRole('button', { name: /Start/ }).click();
  await expect(page.locator('.equation')).toBeVisible();
  await expect(page.locator('.quiz__count')).toContainText('1 of 18');

  for (let i = 1; i <= 18; i++) {
    expect(await questionNumber(page)).toBe(i);
    await typeNumber(page, await readQuestion(page));
    await page.locator('.key--go').click();
    // Correct answers auto-advance after ~1 s, so the counter is the signal.
    if (i < 18) await expect(page.locator('.quiz__count')).toContainText(`${i + 1} of 18`);
  }

  await expect(page.locator('.result')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.result__hero')).toContainText('All done!');
  await expect(page.locator('.result__pct')).toContainText('100% right');
  await expect(page.locator('.stars__slot svg.star--on')).toHaveCount(3);

  // Three stars out of three, and they stick to the home screen.
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.locator('.pill').first()).toContainText('3');
});

test('a wrong answer explains itself without a wall of text', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Start/ }).click();

  const answer = await readQuestion(page);
  await typeNumber(page, answer + 1);
  await page.locator('.key--go').click();

  await expect(page.locator('.quiz__feedback')).toContainText('Almost!');
  await expect(page.locator('.quiz__verdict-sub')).toContainText(`It is ${answer}`);

  await page.getByRole('button', { name: 'Show me' }).click();
  const sheet = page.locator('.sheet__panel');
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText('How to do it');
  await expect(sheet.locator('[data-visual]')).toBeVisible();
  await expect(sheet.locator('.strategy__visual > *').first()).toBeVisible();
  await expect(sheet.locator('.strategy__caption')).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Got it' })).toBeVisible();
});

test('the language switch flips the whole app', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '中文' }).click();

  await expect(page.getByRole('heading', { name: '来数一数吧？' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'zh');

  await page.getByRole('button', { name: '开始' }).click();
  await expect(page.locator('.quiz__count')).toContainText('第 1 题');

  // The choice survives a reload.
  await page.reload();
  await expect(page.locator('.home')).toBeVisible();
  await expect(page.getByRole('heading', { name: '来数一数吧？' })).toBeVisible();
});

test('the printable worksheet has 24 questions and an answer key', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Print worksheet/ }).click();

  await expect(page.locator('.print-item')).toHaveCount(24);
  await expect(page.locator('.print-sheet')).toBeVisible();

  await page.getByRole('button', { name: 'Show answers' }).click();
  await expect(page.locator('.print-item__answer')).toHaveCount(24);
});

test('the all-four set really mixes in times and division', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /All four/ }).click();
  await page.getByRole('button', { name: /Start/ }).click();
  await expect(page.locator('.equation')).toBeVisible();

  const seen = new Set<Sign>();
  for (let i = 1; i <= 18; i++) {
    seen.add(await readOp(page));
    await typeNumber(page, await readQuestion(page));
    await page.locator('.key--go').click();
    if (i < 18) await expect(page.locator('.quiz__count')).toContainText(`${i + 1} of 18`);
  }

  expect(seen.has('×')).toBe(true);
  expect(seen.has('÷')).toBe(true);
  await expect(page.locator('.result')).toBeVisible({ timeout: 10_000 });
});

test('the add-only set never shows times or division', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Add & take away/ }).click();
  await page.getByRole('button', { name: /Start/ }).click();

  const seen = new Set<Sign>();
  for (let i = 1; i <= 18; i++) {
    seen.add(await readOp(page));
    await typeNumber(page, await readQuestion(page));
    await page.locator('.key--go').click();
    if (i < 18) await expect(page.locator('.quiz__count')).toContainText(`${i + 1} of 18`);
  }

  expect([...seen].every((op) => op === '+' || op === '-')).toBe(true);
});
