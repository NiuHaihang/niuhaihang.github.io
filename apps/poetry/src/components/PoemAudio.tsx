import { useEffect, useRef, useState } from 'react';

interface Props { poemId: string; line: number }

/** One player prevents the whole poem and verse clips from talking over one
 * another. Only the current full poem and selected verse are downloaded. */
export function PoemAudio({ poemId, line }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const request = useRef(0);
  const [message, setMessage] = useState('');
  const directory = `${import.meta.env.BASE_URL}audio/poems/${poemId}/`;

  useEffect(() => {
    const player = audio.current!;
    const controller = new AbortController();
    setMessage('');
    for (const track of ['full', String(line)]) {
      void fetch(`${directory}${track}.mp3`, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`Poem audio HTTP ${response.status}`);
          return response.arrayBuffer();
        }).catch((error: unknown) => {
          if (controller.signal.aborted) return;
          console.error('Could not preload poem recording', error);
          setMessage('音频未加载成功，可以点击朗读按钮重试。');
        });
    }
    return () => {
      controller.abort();
      request.current += 1;
      player.onerror = null;
      player.pause();
      player.removeAttribute('src');
      player.load();
    };
  }, [directory, line]);

  function play(track: string) {
    const player = audio.current!;
    const active = ++request.current;
    player.pause();
    setMessage('');
    const unavailable = (error: unknown) => {
      if (active !== request.current) return;
      console.error('Could not play poem recording', error);
      setMessage('音频暂时无法播放，请重试，或打开拼音继续读。');
    };
    player.src = `${directory}${track}.mp3`;
    player.onerror = unavailable;
    void player.play().catch(unavailable);
  }

  return <div className="poem-audio">
    <audio ref={audio} preload="none" crossOrigin="anonymous" />
    <div className="poem-audio__buttons">
      <button type="button" className="btn btn--soft" onClick={() => play('full')}>🔊 听整首</button>
      <button type="button" className="btn btn--ghost" onClick={() => play(String(line))}>听第 {line + 1} 句</button>
      <button type="button" className="pillbtn pillbtn--text" onClick={() => { request.current += 1; audio.current!.pause(); }}>停止</button>
    </div>
    {message ? <p className="poem-audio__message" role="status">{message}</p> : null}
  </div>;
}
