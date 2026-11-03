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

function stop(): void {
  if (current) {
    current.pause();
    current.currentTime = 0;
    current = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

/** Play a generated mp3; resolves false when the file is not there. */
function playFile(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(url);
    current = audio;
    audio.onended = () => resolve(true);
    audio.onerror = () => resolve(false);
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
export async function say(text: string, opts: { sentence?: boolean } = {}): Promise<void> {
  stop();
  const url = opts.sentence ? sentenceAudioUrl(text) : wordAudioUrl(text);
  const played = await playFile(url);
  if (!played) speakAloud(text);
}

export function stopSpeaking(): void {
  stop();
}
