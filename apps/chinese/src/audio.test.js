import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CHARACTERS } from './content';

describe('Mandarin recordings', () => {
  it('ships the selected voice and a nonempty MP3 for every word and example', () => {
    const manifest = JSON.parse(readFileSync(new URL('../public/audio/manifest.json', import.meta.url), 'utf8'));
    expect(manifest.voice).toBe('zh-CN-XiaoxiaoNeural');
    expect(manifest.rate).toBe('-15%');
    const texts = [...new Set(CHARACTERS.flatMap((character) => [character.word, character.sentence]).filter(Boolean))].sort();
    expect(manifest.texts).toEqual(texts);
    for (const text of texts) {
      const recording = new URL(`../public/audio/readings/${encodeURIComponent(text)}.mp3`, import.meta.url);
      expect(statSync(recording).size, text).toBeGreaterThan(0);
    }
  });
});
