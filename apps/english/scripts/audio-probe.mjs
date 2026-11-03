import { chromium } from '@playwright/test';

async function run(label, blockAutoPlay) {
  const b = await chromium.launch({ channel: 'chrome' });
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 } });
  const p = await ctx.newPage();
  await p.addInitScript((block) => {
    window.__tss = [];
    const realSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);
    window.speechSynthesis.speak = (u) => { window.__tss.push(u.text); realSpeak(u); };

    // Block the very first play() (as iOS does before a gesture).
    window.__blocked = 0;
    window.__plays = 0;
    const realPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (...args) {
      window.__plays += 1;
      if (block && window.__blocked === 0) {
        window.__blocked = 1;
        return Promise.reject(new DOMException('NotAllowedError', 'NotAllowedError'));
      }
      return realPlay.apply(this, args);
    };
  }, blockAutoPlay);

  await p.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
  await p.locator('.topic').nth(1).click();      // 自然拼读: listen-first lessons
  await p.waitForTimeout(300);
  await p.locator('.lesson').first().click();
  await p.waitForSelector('.ex');
  await p.waitForTimeout(1200);   // let the mount auto-play happen

  const first = await p.evaluate(() => window.__tss.slice());

  // explicit tap on the speaker
  if (await p.locator('.speaker').count()) await p.locator('.speaker').first().click();
  await p.waitForTimeout(1500);

  const result = await p.evaluate(() => ({ tss: window.__tss, plays: window.__plays }));
  console.log(label, JSON.stringify({ autoTts: first, tss: result.tss, plays: result.plays }));
  await b.close();
}

await run('normal  ', false);
await run('blocked ', true);
