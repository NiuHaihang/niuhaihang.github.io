# 🐰 小兔英语 (Bunny English)

给中文母语的小朋友练英语的小应用，跟着**人教版 PEP（三年级起点）**的单元走。
纯前端：没有账号、没有后端，进度只存在这台设备的 `localStorage` 里。

![首页](docs/12-home-review.jpg)

## 它怎么用

首页先选**年级**（3–6），再选**内容**：

| 菜单 | 内容 | 来源 |
| --- | --- | --- |
| 单词 | 每册 6 个单元的词汇 + 例句 | PEP 单元表 |
| 自然拼读 | 短元音、magic-e、ar/or、ou/ow 等音组 | 自编音组表，按年级分 |
| 语法 | be 动词、this/these、there is、过去式、比较级… | 自编句型，按年级分 |

| 听音选图 | 错题回看 |
| --- | --- |
| ![听音选图](docs/q02-listen.jpg) | ![结算页](docs/11-result-mistakes.jpg) |

每课固定 12 题，全部点选，不用打字：

- **看图选词**：给一张 emoji，选出英文
- **听音选图**：只听声音，选出对应的图（图下不显示英文，否则就变成阅读题了）
- **拼单词**：给打乱的字母块，按顺序拼出来
- **中英互选**：中文 → 英文、英文 → 中文各一题
- **连一连**：左右两列配对
- **组句**：把词块排成一句话
- **填空**：`I ___ a student.` 选 am / is / are

答完有星星（≥90% 三星、≥70% 两星）、正确率、用时，以及**「需要再看看」**清单：
每道错题列出题干、你写的答案（划掉）和正确答案，还有一个小喇叭可以直接听。

## 复习：隔天再见面

每道题答完都会记一条记忆（`w:<英文>` 或 `s:<句子>`）：

- 答对：等级 +1，下次间隔按 **1 → 3 → 7 → 16 天** 递增
- 答错：等级 −1（最低 0），明天再来

| 复习入口 | 复习一轮 |
| --- | --- |
| ![复习卡片](docs/12-home-review.jpg) | ![复习题](docs/13-review-question.jpg) |

首页顶部的「复习」卡片显示今天到期的数量，点进去就是一轮混合练习。
列表为空时卡片是灰的，不会打扰小朋友。

## 内容范围

单元表覆盖 PEP 三上到六下共 **46 个单元**（六下只有 4 个单元，其余七册各 6 个）。
目前已经填好 **12 个单元、133 个词**（每个词都有 emoji 和例句）：

| 册 | 单元 |
| --- | --- |
| 三上 | U1 Hello! · U2 Colours · U3 Look at me! · U4 We love animals · U5 Let's eat! · U6 Happy birthday! |
| 四上 | U1 My classroom · U2 My schoolbag · U3 My friends · U4 My home · U5 Dinner's ready · U6 Meet my family! |

其余单元在单元表里已有标题和中文，卡片上标「马上就来」。加内容只需要往
`src/content/pep.ts` 的 `WORD_BANK` 里补 `w(id, en, zh, emoji, sentence)`，界面会自动出现。

## 听力和发音

`public/audio/words/<slug>.mp3` 和 `public/audio/sentences/<slug>.mp3` 是**预生成**的音频，
用 `edge-tts` 的 `en-US-AnaNeural`（童声）生成，语速 `-10%`，每个词约 11 KB。

```bash
cd apps/english
python3 -m venv .ttsenv
./.ttsenv/bin/pip install edge-tts
node scripts/gen-audio.mjs                  # 缺什么补什么，可以反复跑
VOICE=en-US-EmmaNeural RATE=-5% node scripts/gen-audio.mjs   # 换个声音重来
```

换声音时先删掉要重生成的 mp3（脚本会跳过已存在的文件）。
没有音频文件时会回退到浏览器的 `speechSynthesis`，并优先挑一个英文语音；
但网页语音在不同设备上差别很大，所以正式使用建议把 mp3 都生成好再部署。

## 本地运行

```bash
pnpm install
pnpm dev:english      # http://127.0.0.1:5174
```

```bash
pnpm --filter @bunny/english test      # 内容完整性 + 出题 + 复习调度
pnpm --filter @bunny/english exec tsc --noEmit
```

## 部署

和数学应用一起发布到同一个 GitHub Pages 站点：

- 数学在 `/`
- 英语在 `/english/`

`pnpm build:site` 会在本地把两个应用拼进 `site/`（和 CI 做的事一样）。
英语应用自己的 Service Worker 注册在 `/english/` 作用域，数学应用的那个加了
`navigateFallbackDenylist: [/^\/english\//]`，所以两边不会互相抢路由。
