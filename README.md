# Project Shu — Moonlight & Sunshine

A one-day birthday site for Shu (26 Oct). Static, no build step. Target URL: `yourbirthday.pages.dev`.

## Layout
- `site/` — the whole website (Cloudflare Pages output directory)
  - `index.html` — the experience (scenes, copy, motion, canvas FX, all logic in the `<script data-dc-script>` block)
  - `support.js` — the runtime that renders it (React is served from `site/vendor/`, no CDN)
  - `media/` — drop real photos / audio / video here (see below)
  - `preview.html` — phone + desktop frames around the site (review only; not linked)
- `.claude/serve.mjs` — local static server: `npm start` → http://127.0.0.1:5174
- Legacy: `src/`, `functions/`, `private-content/`, `scripts/` are the earlier React + Functions build, no longer deployed. Safe to delete (they stay in git history).

## Deploy (Cloudflare Pages via GitHub)
Create the Pages project named `yourbirthday` from this repo:
- Framework preset: None · Build command: *(empty)* · Build output directory: `site`

## Gate (two stages)
1. Passphrase: checked in the browser against SHA-256 hashes in `PHRASE_HASHES` (top of the script in `site/index.html`). Current phrase: **`athvi2067`**. Hint text: `HINT`. New hash: `echo -n "newphrase" | sha256sum`.
2. Star lock: tap the 5 stars in the secret order `STAR_ORDER` (indexes 0-4 left to right; placeholder `[2,0,4,1,3]`). A hint (`STAR_HINT`) appears after 3 misses. Star positions: `GATE_STARS`.
Light gate, not real security. On localhost only, `/#open` skips the gate for QA.

## Scenes
Gate -> title card -> Moonlight -> chapters -> Dawn (light leak) -> Sunshine -> keepsakes + sakura -> song -> heart constellation -> letter -> finale -> lanterns -> credits. Cherry-blossom layer: fixed blossom branch (fades after the hero), global drifting petals, petal gust + pink wash at every scene change, eased wheel scrolling on desktop.

## Filling in real content (in `site/index.html`, logic block at top of the script)
- Photos: put files in `site/media/photos/` and set `src` in `MEDIA` (`memory-01…06`, `film-01`), `PORTRAIT`, `FINAL` (e.g. `'media/photos/memory-01.jpg'`).
- Song: `site/media/audio/our-song.mp3`, set `trackSrc` default in `data-props`, plus `TRACK_TITLE`, `TRACK_NOTE`, `LYRICS`.
- Words: `LETTER`, `SIGNATURE`, `PS`, `SECRETS`, `STARS`, `COMPLETE`, `WHISPERS`, `WISHES`, `PROMISES`, `SECRET_END`.
- Hide the dashed slot labels once real media is in: set `showLabels` default to `false` in `data-props`.
