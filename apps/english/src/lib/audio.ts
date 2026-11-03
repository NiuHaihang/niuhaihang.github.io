const base = import.meta.env.BASE_URL;

export function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function wordAudioUrl(en: string): string {
  return `${base}audio/words/${slug(en)}.mp3`;
}

export function sentenceAudioUrl(text: string): string {
  return `${base}audio/sentences/${slug(text)}.mp3`;
}

let current: HTMLAudioElement | null = null;
/**
 * Every request gets a token. A newer request bumps it, which tells any
 * slower older request to shut up — otherwise a cancelled mp3 resolves as
 * "failed" and speaks the system voice *on top of* the new mp3.
 */
let token = 0;

function stop(): void {
  token += 1;
  if (current) {
    current.onended = null;
    current.onerror = null;
    current.pause();
    current.currentTime = 0;
    current = null;
  }
  if ('speechSynthesis' in window) {
    // Safari can keep the queue after a single cancel(); ask twice.
    window.speechSynthesis.cancel();
    setTimeout(() => window.speechSynthesis.cancel(), 0);
  }
}

/** Play a generated mp3; resolves false when the file is not there. */
function playFile(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    current = audio;
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
    // A play() that is interrupted by pause()/a new request rejects too; the
    // caller's token check decides whether that false is worth acting on.
    audio.play().catch(() => resolve(false));
  });
}

/**
 * Last resort: the browser's own voice. Varies per device, always there.
 *
 * Picking the voice matters more than it looks: with no explicit voice,
 * Safari/Chrome on a Chinese system happily reads English words with the
 * Chinese system voice, which sounds croaky. Prefer a real English voice.
 */
const PREFERRED = [
  'Samantha',
  'Ava',
  'Allison',
  'Susan',
  'Karen',
  'Moira',
  'Google US English',
  'Microsoft Aria',
  'Microsoft Jenny',
];

let cachedVoice: SpeechSynthesisVoice | null | undefined;

function englishVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice !== undefined) return cachedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null; // not loaded yet; try again next time

  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  const pool = english.length > 0 ? english : voices;
  const named = pool.find((v) => PREFERRED.some((name) => v.name.includes(name)));
  cachedVoice = named ?? pool.find((v) => v.lang.toLowerCase().startsWith('en')) ?? null;
  return cachedVoice;
}

function speakAloud(text: string): void {
  if (!('speechSynthesis' in window)) return;
  // Voices arrive asynchronously on some browsers; refresh the cache once.
  if (cachedVoice === null) cachedVoice = undefined;

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'en-US';
  utter.rate = 0.85;
  const voice = englishVoice();
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang;
  }
  window.speechSynthesis.speak(utter);
}

/**
 * Say something in English: pre-generated audio first, system voice second.
 * Never throws — a silent exercise is still answerable.
 */
export async function say(
  text: string,
  opts: { sentence?: boolean; auto?: boolean } = {},
): Promise<void> {
  stop();
  const my = token;
  const url = opts.sentence ? sentenceAudioUrl(text) : wordAudioUrl(text);
  const played = await playFile(url);
  if (my !== token) return; // superseded while the file was loading

  // Auto-play never falls back to the system voice: on iOS the first
  // un-gestured play() is blocked, and speaking then makes an adult voice
  // talk over the mp3 the child triggers a second later. Silent beats that.
  if (played || opts.auto) return;
  if (current && !current.paused) return;
  speakAloud(text);
}

export function stopSpeaking(): void {
  stop();
}
