"""Synthesize one Xiaoxiao reading per poem, then cut matching verse clips.

Requires edge-tts 7.3.1 and ffmpeg. Only completed poem directories are kept;
rerunning resumes completed poems. Sentence boundaries must match every verse.
"""
import asyncio
import json
import re
import shutil
import subprocess
import tempfile
from pathlib import Path

import aiohttp
import edge_tts

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / 'public/audio/poems'
VOICE = 'zh-CN-XiaoxiaoNeural'
RATE = '-15%'
# These archaic readings need unambiguous homophones in the synthesis request.
# Display text and pinyin remain the original poem, never the speech aliases.
ALIASES = {'见牛羊': '现牛羊', '忽见': '忽现', '单于': '蝉于', '供耕织': '贡耕织', '亡赖': '无赖', '剥莲蓬': '包莲蓬'}


async def main():
    poems = json.loads((ROOT / 'src/data/poems.json').read_text())
    OUTPUT.mkdir(parents=True, exist_ok=True)
    queue = asyncio.Queue()
    for poem in poems:
        if not (OUTPUT / poem['id']).exists():
            queue.put_nowait(poem)
    print(f'{queue.qsize()} poems to generate, {len(poems)} total', flush=True)

    async def worker():
        while not queue.empty():
            poem = queue.get_nowait()
            spoken = []
            for line in poem['lines']:
                text = line['text']
                for original, alias in ALIASES.items():
                    text = text.replace(original, alias)
                spoken.append(re.sub(r'[，。！？]$', '。', text))
            with tempfile.TemporaryDirectory(prefix='.generating-', dir=OUTPUT) as directory:
                work = Path(directory)
                raw = work / 'raw.mp3'
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
                if [boundary['text'] for boundary in boundaries] != spoken:
                    raise ValueError(f"Verse boundaries differ: {poem['title']}: {boundaries!r}")
                outputs = work / poem['id']
                outputs.mkdir()
                filters = ['[0:a]asplit=' + str(len(spoken) + 1) + '[full]' + ''.join(f'[a{i}]' for i in range(len(spoken)))]
                for index, boundary in enumerate(boundaries):
                    start = boundary['offset'] / 10_000_000
                    end = (boundaries[index + 1]['offset'] if index + 1 < len(boundaries) else boundary['offset'] + boundary['duration']) / 10_000_000
                    filters.append(f'[a{index}]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[out{index}]')
                command = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(raw), '-filter_complex', ';'.join(filters)]
                for label, filename in [('full', 'full')] + [(f'out{i}', str(i)) for i in range(len(spoken))]:
                    command += ['-map', f'[{label}]', '-ar', '24000', '-c:a', 'libmp3lame', '-b:a', '96k', str(outputs / f'{filename}.mp3')]
                process = await asyncio.create_subprocess_exec(*command, stderr=asyncio.subprocess.PIPE)
                _, stderr = await process.communicate()
                if process.returncode:
                    raise subprocess.CalledProcessError(process.returncode, 'ffmpeg', stderr=stderr)
                shutil.move(str(outputs), OUTPUT / poem['id'])
                print(f"Ready: {poem['id']} {poem['title']}", flush=True)
            queue.task_done()

    async with asyncio.TaskGroup() as group:
        for _ in range(4):
            group.create_task(worker())
    (OUTPUT.parent / 'manifest.json').write_text(json.dumps({
        'voice': VOICE, 'rate': RATE, 'generator': f'edge-tts {edge_tts.__version__}',
        'poems': {poem['id']: len(poem['lines']) for poem in poems},
    }, ensure_ascii=False, indent=2) + '\n')
    print(f'Complete: {len(poems)} poems', flush=True)


asyncio.run(main())
