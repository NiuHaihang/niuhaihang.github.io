# 🐰 Bunny Math

A cute little addition & subtraction playground for ~8-year-olds, built as a
**pure front-end** web app. No accounts, no backend, no data leaves the device.

A round is 18 questions answered on a big friendly keypad. Every round is
generated fresh, ramps from gentle to stretchy, and ends with a star rating, a
per-skill breakdown, and a picture-first explanation for anything that slipped.

![Home screen](docs/home.jpg)

| Quiz | Explanation |
| --- | --- |
| ![Quiz](docs/quiz.jpg) | ![How to do it](docs/explain.jpg) |

![Result screen](docs/result.jpg)

## What's inside

- **Generated, not canned.** Every round is drawn from 15 skill generators and
  ordered by an explainable difficulty model, so practice never runs out.
- **Four gardens** (levels), each with its own skill mix and difficulty floor:
  `Sprout` (within 20) → `Blossom` (two digits, carrying) → `Sparkle`
  (two digits ± two digits) → `Starlight` (missing numbers, 100 −).
- **Duolingo-style loop.** Progress bar, instant feedback, streak cheer,
  auto-advance on a correct answer, no timer and no lives.
- **Picture-first help.** A wrong answer offers "Show me", which opens one
  small visual: ten-frame, number-line hops, part-part-whole, or a column sum
  with a carry/borrow badge. One idea per panel, no paragraphs.
- **End-of-round summary.** Stars, accuracy, time, per-skill bars, the slips
  worth another look (each opens its explanation), and a 5-question practice
  round on the weakest skill.
- **Printable worksheet.** The original ask, still supported: 24 questions,
  sorted easy → hard, name/date lines, optional answer key, print-ready A4.
- **English and 中文** with a one-tap switch, plus a sound toggle.
- **Installable PWA** and works offline after the first visit.
- **Landscape tablets, phones, and iPad** — the quiz switches to a
  question-left / keypad-right layout on wide screens and compacts in phone
  landscape.

| Phone | Landscape phone | Worksheet |
| --- | --- | --- |
| ![Phone](docs/phone.jpg) | ![Landscape](docs/landscape.jpg) | ![Worksheet](docs/worksheet.jpg) |

The worksheet prints as a clean two-column A4 page:

![Print preview](docs/print.jpg)

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:5173
```

Build and preview the production bundle:

```bash
pnpm build        # typecheck + vite build + service worker
pnpm preview
```

## Test it

```bash
pnpm test         # 15 unit tests: difficulty model + generator invariants
pnpm e2e          # 4 Playwright flows against your installed Chrome
```

E2E uses `channel: 'chrome'`, so there is no 150 MB browser download and the
tests run on the same engine the kid will use.

## Deploy to GitHub Pages

1. Push this repo to GitHub (default branch `main`).
2. **Settings → Pages → Source: GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds with
   `VITE_BASE=/<repo-name>/` on every push, runs the unit tests first, and
   publishes `dist`.

The base path is read from `VITE_BASE`, so the same code works at a project
sub-path, a custom domain (`VITE_BASE=/`), or locally.

## How the difficulty works

`src/game/difficulty.ts` scores every item 0–100 from properties a teacher
would name — magnitude, regrouping, bridging ten, blank position — rather than
from a hand-tuned table:

| Item | Score |
| --- | --- |
| `4 + 5` | 12 |
| `34 + 5` | 32 |
| `28 + 7` (carry) | 48 |
| `15 − 8` (break ten) | 30 |
| `100 − 37` | 84 |

`src/game/generator.ts` then builds each round as a ramp: a per-slot difficulty
target, a weighted skill choice, and a scoring pass over candidates that also
penalises repeats (same fact, same skill three times in a row, same answer
twice). Each level declares a difficulty floor, so a warm-up is gentle but not
babyish. The ordering guarantees — inside a family, across levels, and across a
round — are pinned by tests instead of by trusting the constants.

## Layout

```
src/
  game/      pure TypeScript: difficulty, skills, levels, generator, session, scoring, rng
  components/ Home, Quiz, Equation, Keypad, Strategy, Result, PrintSheet, Mascot, Stars…
  i18n/      hand-rolled en/zh dictionary
  lib/       localStorage progress, WebAudio chirps
  styles/    one hand-written CSS file with design tokens
scripts/     screenshot + icon tools (system Chrome, no image libraries)
e2e/         Playwright flows
```

## Privacy

Nothing is collected and nothing is sent anywhere. Progress (level, stars,
streak, best scores) lives in `localStorage` under `bunnymath.v1` and can be
cleared from the home screen.
