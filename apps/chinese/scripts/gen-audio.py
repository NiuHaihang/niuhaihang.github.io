"""Generate Xiaoxiao recordings for the textbook words and example sentences.

Run with a Python environment containing edge-tts; ffmpeg must be on PATH.
Completed files are kept so an interrupted run can resume without regenerating
them. Files become visible only after synthesis and silence trimming succeed.
"""
import asyncio
import json
import subprocess
import tempfile
from pathlib import Path

import aiohttp
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'public/audio/readings'
VOICE = 'zh-CN-XiaoxiaoNeural'
RATE = '-15%'
WORKERS = 4
BATCH_SIZE = 32


async def main():
    books = json.loads((ROOT / 'src/data/textbooks.json').read_text())
    texts = sorted({text for book in books for entry in book['entries'] for text in entry[2:4] if text})
    OUTPUT.mkdir(parents=True, exist_ok=True)
    missing = [text for text in texts if not (OUTPUT / f'{text}.mp3').exists()]
    queue = asyncio.Queue()
    for index in range(0, len(missing), BATCH_SIZE):
        queue.put_nowait(missing[index:index + BATCH_SIZE])
    pending = len(missing)
    completed = 0
    print(f'{VOICE}, rate {RATE}: {pending} to generate, {len(texts) - pending} already present', flush=True)

    async def worker():
        nonlocal completed
        with tempfile.TemporaryDirectory(prefix='.generating-', dir=OUTPUT) as directory:
            raw = Path(directory) / 'raw.mp3'
            while not queue.empty():
                batch = queue.get_nowait()
                spoken = [text if text.endswith(('。', '！', '？')) else f'{text}。' for text in batch]
                # Retry only failures from the remote speech service. The final
                # error remains visible and prevents a success manifest.
                for attempt in range(3):
                    try:
                        boundaries = []
                        with raw.open('wb') as recording:
                            async for chunk in edge_tts.Communicate(''.join(spoken), VOICE, rate=RATE).stream():
                                if chunk['type'] == 'audio':
                                    recording.write(chunk['data'])
                                elif chunk['type'] == 'SentenceBoundary':
                                    boundaries.append(chunk)
                        break
                    except (aiohttp.ClientError, asyncio.TimeoutError, edge_tts.exceptions.NoAudioReceived):
                        if attempt == 2:
                            raise
                        await asyncio.sleep(attempt + 1)

                # Never guess a split: each returned boundary must match the
                # requested text exactly before its time offsets can be used.
                if [boundary['text'] for boundary in boundaries] != spoken:
                    raise ValueError(f'Speech boundaries do not match requested texts: {batch!r}; {boundaries!r}')
                filters = ['[0:a]asplit=' + str(len(batch)) + ''.join(f'[a{i}]' for i in range(len(batch)))]
                for index, boundary in enumerate(boundaries):
                    start = boundary['offset'] / 10_000_000
                    end = (boundaries[index + 1]['offset'] if index + 1 < len(batch)
                           else boundary['offset'] + boundary['duration']) / 10_000_000
                    # Trim only the outer silence; keep pauses within examples.
                    filters.append(
                        f'[a{index}]atrim=start={start}:end={end},asetpts=PTS-STARTPTS,'
                        'silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB,'
                        'areverse,silenceremove=start_periods=1:start_duration=0.02:start_threshold=-50dB,areverse'
                        f'[out{index}]'
                    )
                command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(raw), '-filter_complex', ';'.join(filters)]
                for index in range(len(batch)):
                    command += ['-map', f'[out{index}]', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '96k', str(Path(directory) / f'{index}.mp3')]
                process = await asyncio.create_subprocess_exec(*command, stderr=asyncio.subprocess.PIPE)
                _, stderr = await process.communicate()
                if process.returncode:
                    raise subprocess.CalledProcessError(process.returncode, 'ffmpeg', stderr=stderr)
                for index, text in enumerate(batch):
                    (Path(directory) / f'{index}.mp3').replace(OUTPUT / f'{text}.mp3')
                queue.task_done()
                completed += len(batch)
                print(f'{completed}/{pending}: {batch[-1]}', flush=True)

    async with asyncio.TaskGroup() as group:
        for _ in range(WORKERS):
            group.create_task(worker())

    (OUTPUT.parent / 'manifest.json').write_text(json.dumps({
        'voice': VOICE,
        'rate': RATE,
        'wordPauseSeconds': 0.65,
        'generator': f'edge-tts {edge_tts.__version__}',
        'texts': texts,
    }, ensure_ascii=False, indent=2) + '\n')
    print(f'Complete: {len(texts)} recordings', flush=True)


asyncio.run(main())
