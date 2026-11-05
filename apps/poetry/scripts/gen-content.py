"""Build the checked-in pinyin bank. Requires pypinyin 0.55.0; no runtime dependency."""
import json
import re
from pathlib import Path

from pypinyin import Style, load_phrases_dict, pinyin

ROOT = Path(__file__).resolve().parent.parent
# Context matters in poetry. Keep these readings explicit instead of trusting
# the modern phrase dictionary for archaic meanings and names.
READINGS = {
    '敕勒': 'chì lè', '曲项': 'qū xiàng', '解落': 'jiě luò',
    '似穹庐': 'sì qióng lú', '见牛羊': 'xiàn niú yáng',
    '鬓毛衰': 'bìn máo shuāi', '风簸': 'fēng bǒ',
    '单于': 'chán yú', '轻骑': 'qīng qí', '欲将': 'yù jiāng',
    '潜入': 'qián rù', '花重': 'huā zhòng', '锦官城': 'jǐn guān chéng',
    '曾谙': 'céng ān', '春种': 'chūn zhòng', '万颗子': 'wàn kē zǐ',
    '坐爱': 'zuò ài', '石径斜': 'shí jìng xié',
    '长扫': 'cháng sǎo', '排闼': 'pái tà', '空蒙': 'kōng méng',
    '三衢': 'sān qú', '乃翁': 'nǎi wēng', '上摩天': 'shàng mó tiān',
    '杂兴': 'zá xìng', '供耕织': 'gòng gēng zhī', '种瓜': 'zhòng guā',
    '日长': 'rì cháng', '那得': 'nǎ dé', '屐齿': 'jī chǐ',
    '才了': 'cái liǎo', '坚劲': 'jiān jìng', '任尔': 'rèn ěr',
    '林樾': 'lín yuè', '恃风雷': 'shì fēng léi', '重抖擞': 'chóng dǒu sǒu',
    '纸鸢': 'zhǐ yuān', '相媚好': 'xiāng mèi hǎo', '翁媪': 'wēng ǎo',
    '亡赖': 'wú lài', '剥莲蓬': 'bāo lián péng', '忽见': 'hū xiàn',
    '朝辞': 'zhāo cí', '一日还': 'yī rì huán', '照我还': 'zhào wǒ huán',
    '不教': 'bù jiào', '西出': 'xī chū', '远上': 'yuǎn shàng',
    '青箬笠': 'qīng ruò lì', '绿蓑衣': 'lǜ suō yī', '鳜鱼': 'guì yú',
    '似剪刀': 'sì jiǎn dāo', '依山尽': 'yī shān jìn',
    '人未还': 'rén wèi huán', '飞将': 'fēi jiàng',
    '朝雨': 'zhāo yǔ', '客舍': 'kè shè', '更尽': 'gèng jìn',
    '为异客': 'wéi yì kè', '长江': 'cháng jiāng', '空尽': 'kōng jìn',
    '万重山': 'wàn chóng shān', '一行': 'yī háng', '门泊': 'mén bó',
    '西塞': 'xī sài', '游子': 'yóu zǐ', '密密缝': 'mì mì féng',
    '皇都': 'huáng dū', '稚子': 'zhì zǐ', '不应人': 'bù yìng rén',
    '童子': 'tóng zǐ', '数重山': 'shù chóng shān',
    '生当': 'shēng dāng', '为鬼雄': 'wéi guǐ xióng',
    '泛尽': 'fàn jìn', '泪尽': 'lèi jìn', '子规': 'zǐ guī',
    '返景': 'fǎn jǐng',
}
load_phrases_dict({text: [[sound] for sound in sounds.split()] for text, sounds in READINGS.items()})

poems = []
for row in (ROOT / 'src/data/poems-source.txt').read_text().splitlines():
    if not row or row.startswith('#'):
        continue
    order, grade, title, author, era, theme, text, meaning = row.split('|')
    lines = []
    for line in re.findall(r'[^，。！？]+[，。！？]', text):
        sounds = [item[0] for item in pinyin(line, style=Style.TONE, errors=lambda chars: list(chars))]
        # Show citation tones consistently; natural speech applies tone sandhi.
        sounds = [{'一': 'yī', '不': 'bù'}.get(char, sound) for char, sound in zip(line, sounds)]
        lines.append({'text': line, 'pinyin': [sound if re.search(r'[a-zāáǎàēéěèīíǐìōóǒòūúǔùüǖǘǚǜ]', sound) else '' for sound in sounds]})
    if ''.join(line['text'] for line in lines) != text:
        raise ValueError(f'Unparsed poem: {title}')
    poems.append({
        'id': f'poem-{int(order):02d}', 'order': int(order), 'grade': int(grade),
        'title': title, 'author': author, 'era': era, 'theme': theme,
        'core': int(order) <= 75, 'meaning': meaning, 'lines': lines,
    })
(ROOT / 'src/data/poems.json').write_text(json.dumps(poems, ensure_ascii=False, indent=2) + '\n')
print(f'Generated {len(poems)} poems')
