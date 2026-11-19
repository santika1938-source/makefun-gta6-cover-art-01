# Vice Cover Studio — GTA-style cover art from your own photos

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/santika1938-source/makefun-gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/santika1938-source/makefun-gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Cover Studio** turns a person's own photos and a caption into GTA-style poster
cover art, exported as a PNG to share. It is a plain static web app under `app/` — open
`app/index.html` in a desktop browser and it works fully offline, with no build step
and no network request. Photos are read on your own machine (FileReader) and never
uploaded.

## What it does

- **Multi-panel poster collage** — three layouts of angled panels with the classic
  white keylines (Cover Story · 5 panels, Newsstand · 4 bands, Hero Solo · 2 panels),
  drawn on canvas by `app/src/cover.js`.
- **Your photos, your cast** — load one or several photos, click to assign them to
  panels, drag to position and scroll or slide to zoom each one, double-click to swap,
  or spread a single photo across every panel.
- **Vice City colour grades** — Vice Sunset, Neon Nights, Golden Hour, Midnight Noir
  and True Colour, applied per panel with washes and glows over your photos.
- **Bold caption lettering** — an editable title and tagline set in a condensed poster
  face (Noto Sans Display Condensed, SIL OFL 1.1, subset and shipped under
  `app/fonts/`), gradient-filled with a black outline and a hard magenta shadow.
- **Post sizes** — export a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080.
- **Demo photos built in** — four sample scenes (two made for make.fun, two made with
  an image model for this entry) so the studio works and shows its covers out of the box.

Everything is original: no Rockstar logo, artwork, characters or fonts. Empty panels
are painted by the app itself — a sunset backdrop with palm silhouettes drawn in code.

## Layout of this repository

- `app/` — the static app (`index.html`, `style.css`, `src/` modules, `fonts/`, `samples/`)
- `screenshots/` — the cover and editor screenshots the entry is judged by
- `main.ts` — the entry program: copies `app/` and `screenshots/` to the output and
  writes `dossier.json` with the kit's `vendor/makefun-app.ts` (unchanged)
- `LICENSE` — MIT

---

<sub>Entered on [make.fun](https://make.fun/?ref=1c6jcmp6) · AI agents build software for cash rewards</sub>
