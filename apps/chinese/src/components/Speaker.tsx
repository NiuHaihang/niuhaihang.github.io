import { useEffect, useRef, useState } from 'react';

interface Props {
  text: string;
  sentence?: string;
  label?: string;
  onUnavailable?: () => void;
}

/** Use the selected Xiaoxiao recordings consistently across devices. Reuse one
 * audio element so a user gesture also unlocks the following example on mobile. */
export function Speaker({ text, sentence, label = '听一听', onUnavailable }: Props) {
  const [message, setMessage] = useState('');
  const audio = useRef<HTMLAudioElement>(null);
  const pause = useRef<number | undefined>(undefined);
  const request = useRef(0);
  useEffect(() => {
    const player = audio.current!;
    const preload = new AbortController();
    const activeRequest = request.current;
    // A full fetch warms the service worker cache. Media preload alone can
    // request only a byte range, which is not a complete, reusable recording.
    for (const recording of sentence ? [text, sentence] : [text]) {
      void fetch(recordingUrl(recording), { signal: preload.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`Audio preload failed: HTTP ${response.status}`);
          return response.arrayBuffer();
        })
        .catch((error: unknown) => {
          if (preload.signal.aborted || activeRequest !== request.current) return;
          console.error('Could not preload Mandarin audio', error);
          setMessage('音频暂时未加载成功，点击“听词语”重试。');
        });
    }
    return () => {
      request.current += 1;
      preload.abort();
      window.clearTimeout(pause.current);
      player.onended = null;
      player.onerror = null;
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  }, [text, sentence]);

  function speak() {
    const player = audio.current!;
    const activeRequest = ++request.current;
    window.clearTimeout(pause.current);
    player.pause();
    player.onended = null;
    setMessage('');

    function unavailable() {
      // A replaced play() can reject later; it must not affect the new reading.
      if (activeRequest !== request.current) return;
      request.current += 1;
      window.clearTimeout(pause.current);
      player.onended = null;
      player.onerror = null;
      player.pause();
      setMessage('音频暂时无法播放，请重试或看拼音继续。');
      onUnavailable?.();
    }

    function play(recording: string) {
      player.src = recordingUrl(recording);
      player.onerror = unavailable;
      void player.play().catch(unavailable);
    }

    if (sentence) {
      player.onended = () => {
        player.onended = null;
        pause.current = window.setTimeout(() => play(sentence), 650);
      };
    }
    play(text);
  }

  return <div className="reading-audio">
    <audio ref={audio} preload="none" crossOrigin="anonymous" />
    <button type="button" className="pillbtn pillbtn--text" onClick={speak}>🔊 {label}</button>
    {message ? <p className="audio-note" role="status">{message}</p> : null}
  </div>;
}

function recordingUrl(text: string): string {
  return `${import.meta.env.BASE_URL}audio/readings/${encodeURIComponent(text)}.mp3`;
}
