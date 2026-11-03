import { useCallback, useEffect, useRef } from 'react';

/**
 * Tiny WebAudio synth: no audio files, no network, instant on every device.
 * The context is created lazily on the first user gesture.
 */
class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  private ensure(): AudioContext | null {
    if (!this.enabled) return null;
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    freq: number,
    duration: number,
    opts: { delay?: number; type?: OscillatorType; gain?: number; slideTo?: number } = {},
  ): void {
    const ctx = this.ensure();
    if (!ctx) return;
    const { delay = 0, type = 'sine', gain = 0.06, slideTo } = opts;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  tap(): void {
    this.tone(560, 0.05, { type: 'triangle', gain: 0.025 });
  }

  correct(): void {
    this.tone(660, 0.11, { type: 'sine', gain: 0.07 });
    this.tone(990, 0.16, { delay: 0.09, type: 'sine', gain: 0.05 });
  }

  wrong(): void {
    this.tone(300, 0.16, { type: 'sine', gain: 0.05, slideTo: 230 });
  }

  finish(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => this.tone(freq, 0.22, { delay: i * 0.1, type: 'triangle', gain: 0.055 }));
  }
}

export const sound = new SoundEngine();

export function useSoundFeedback(enabled: boolean) {
  useEffect(() => {
    sound.setEnabled(enabled);
  }, [enabled]);

  const haptic = useCallback((ms = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
    } catch {
      /* ignore */
    }
  }, []);

  return { sound, haptic };
}

export function useSoundRef(enabled: boolean) {
  const ref = useRef(enabled);
  useEffect(() => {
    ref.current = enabled;
    sound.setEnabled(enabled);
  }, [enabled]);
  return ref;
}
