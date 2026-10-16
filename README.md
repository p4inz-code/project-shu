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

## Gate
Passphrase is checked in the browser against SHA-256 hashes in `PHRASE_HASHES` (top of the script in `site/index.html`). Placeholder phrase: **`shu`**. Hint text: `HINT`. New hash: `echo -n "newphrase" | sha256sum`. This is a light gate, not real security.

## Filling in real content (in `site/index.html`, logic block at top of the script)
- Photos: put files in `site/media/photos/` and set `src` in `MEDIA` (`memory-01…06`, `film-01`), `PORTRAIT`, `FINAL` (e.g. `'media/photos/memory-01.jpg'`).
- Song: `site/media/audio/our-song.mp3`, set `trackSrc` default in `data-props`, plus `TRACK_TITLE`, `TRACK_NOTE`, `LYRICS`.
- Words: `LETTER`, `SIGNATURE`, `PS`, `SECRETS`, `STARS`, `COMPLETE`, `WHISPERS`, `WISHES`, `PROMISES`, `SECRET_END`.
- Hide the dashed slot labels once real media is in: set `showLabels` default to `false` in `data-props`.
