#!/usr/bin/env node
/**
 * Generate the listening material with edge-tts and drop it in public/audio/.
 *
 * The voice is a child voice on purpose: the app is for an 8-year-old, and a
 * grown-up newsreader is harder to follow. Run it from apps/english:
 *
 *   node scripts/gen-audio.mjs
 *
 * Requires edge-tts (pip install edge-tts, or use the .ttsenv from the README).
 * Files that already exist are skipped, so the script is safe to re-run.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const VOICE = process.env.VOICE ?? 'en-US-AnaNeural';
const RATE = process.env.RATE ?? '-10%';
const EDGE = process.env.EDGE_TTS ?? '.ttsenv/bin/edge-tts';

const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');

async function read(path) {
  return readFile(join(root, path), 'utf8');
}

function wordsFromWordsUnit(source) {
  return [...source.matchAll(/\bw\('[^']*',\s*'([^']+)'/g)].map((m) => m[1]);
}

function wordsFromPhonics(source) {
  return [...source.matchAll(/\bp\('([a-z]+)'/g)].map((m) => m[1]);
}

function sentencesFrom(source) {
  const out = [];
  for (const match of source.matchAll(/sentences:\s*\[([^\]]+)\]/g)) {
    for (const str of match[1].matchAll(/'([^']+)'/g)) out.push(str[1]);
  }
  // Word units carry one example sentence per word.
  for (const match of source.matchAll(/\bw\('[^']*',\s*'[^']+',\s*'[^']+',\s*'[^']*',\s*'([^']+)'\)/g)) {
    out.push(match[1]);
  }
  return out;
}

const [pep, phonics, grammar] = await Promise.all([
  read('src/content/pep.ts'),
  read('src/content/phonics.ts'),
  read('src/content/grammar.ts'),
]);

const words = [...new Set([...wordsFromWordsUnit(pep), ...wordsFromPhonics(phonics)])].sort();
const sentences = [...new Set(sentencesFrom(grammar).concat(sentencesFrom(pep)))].sort();

const jobs = [
  ...words.map((text) => ({ text, dir: 'public/audio/words', file: `${slug(text)}.mp3` })),
  ...sentences.map((text) => ({ text, dir: 'public/audio/sentences', file: `${slug(text)}.mp3` })),
];

console.log(`words: ${words.length}, sentences: ${sentences.length}, voice: ${VOICE}`);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(EDGE, args, { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (chunk) => {
      err += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(err || `exit ${code}`))));
  });
}

const WORKERS = Number(process.env.WORKERS ?? 4);
let made = 0;
let skipped = 0;
let done = 0;

async function handle(job) {
  const dir = join(root, job.dir);
  await mkdir(dir, { recursive: true });
  const out = join(dir, job.file);
  if (await exists(out)) {
    skipped += 1;
    done += 1;
    return;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await run(['--voice', VOICE, `--rate=${RATE}`, '--text', job.text, '--write-media', out]);
      made += 1;
      break;
    } catch (error) {
      if (attempt === 3) {
        console.error(`\nfailed: ${job.text} — ${String(error).slice(0, 120)}`);
        break;
      }
      await new Promise((r) => setTimeout(r, 800 * attempt));
    }
  }
  done += 1;
  if (done % 10 === 0) process.stdout.write(`\r  ${done}/${jobs.length}  ${job.file}            `);
}

// A small pool: edge-tts is a network round trip, so a few at a time is much
// faster than one by one and still gentle on the endpoint.
const queue = [...jobs];
await Promise.all(
  Array.from({ length: Math.min(WORKERS, queue.length) }, async () => {
    for (;;) {
      const job = queue.shift();
      if (!job) return;
      await handle(job);
    }
  }),
);

await writeFile(
  join(root, 'public/audio/manifest.json'),
  JSON.stringify({ voice: VOICE, rate: RATE, generated: new Date().toISOString(), words, sentences }, null, 2),
);

console.log(`\ndone: ${made} generated, ${skipped} already there`);
