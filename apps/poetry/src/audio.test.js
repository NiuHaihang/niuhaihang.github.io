import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { POEMS } from './content';

describe('poetry recordings', () => {
  it('ships the chosen voice and a full reading plus every verse for all poems', () => {
    const manifest = JSON.parse(readFileSync(new URL('../public/audio/manifest.json', import.meta.url), 'utf8'));
    expect(manifest.voice).toBe('zh-CN-XiaoxiaoNeural');
    expect(manifest.rate).toBe('-15%');
    expect(manifest.poems).toEqual(Object.fromEntries(POEMS.map((poem) => [poem.id, poem.lines.length])));
    for (const poem of POEMS) {
      for (const track of ['full', ...poem.lines.map((_, index) => String(index))]) {
        expect(statSync(new URL(`../public/audio/poems/${poem.id}/${track}.mp3`, import.meta.url)).size).toBeGreaterThan(0);
      }
    }
  });
});
