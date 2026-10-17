# Project Shu: Moonlight and Sunshine

A one-day birthday site for Shu (26 Oct). Static, no build step.

## Layout
- `site/` is the whole website (the Cloudflare Pages output directory)
  - `index.html`: scenes, copy, motion and logic (the `<script data-dc-script>` block)
  - `fx.js`: organic randomness, wind, depth parallax and the procedural 3D cherry tree
  - `support.js` and `vendor/`: the renderer and React, served locally
  - `og.png`, `robots.txt`, `favicon.svg`: link preview and crawler settings
  - `media/`: drop real photos, audio and video here
  - `preview.html`: phone and desktop frames around the site (review only)
- `tools/make-og.mjs`: regenerates `site/og.png`
- `docs/RESEARCH_AND_PLAN.md`: research, decisions and plan
- `docs/AUDIT_REPORT.md`: what was tested, what passed, what was not verified
- `.claude/serve.mjs`: local server, `npm start` then http://127.0.0.1:5174
- Legacy: `src/`, `functions/`, `private-content/`, `scripts/` are the earlier React build. Unused and safe to delete (kept in git history).

## Deploy
Cloudflare Pages from this repo: no build command, output directory `site`.

## The gate (two stages)
1. Passphrase `athvi2067`, checked in the browser against a SHA-256 hash (`PHRASE_HASHES` in `site/index.html`). Case and surrounding spaces are ignored. Make a new hash with `echo -n "newphrase" | sha256sum`. Hint text is `HINT`.
2. Star lock: tap the five stars in `STAR_ORDER` (indexes 0 to 4, left to right; now `[2,0,4,1,3]`). `STAR_HINT` shows after 3 misses.
After 4 wrong phrases the gate says the site is private and to ask Atharva. It is a light gate, not real security. On localhost only, `/#open` skips it for testing; `?calm=1` forces the still, reduced-motion version.

## Sound
One speaker button (top right) controls all sound. Ambient piano starts on the gate tap. When the mashup is added, it will be muted by the same button. Pressing Play on the song while sound is off turns sound back on.

## Placeholder numbers
Every photo slot shows its number so you can send "photo 05" and I know where it goes.

| No. | Slot | Where |
|---|---|---|
| 01 | portrait-01 | Chapter I portrait |
| 02 | film-01 | Full-bleed reel (keepsakes) |
| 03 to 08 | memory-01 to memory-06 | Polaroids and the sakura tree inspector |
| 09 | final-photo | Finale |
| 10 to 17 | collage-01 to collage-08 | Birthday memory wall |

To fill one: put the file in `site/media/photos/` and set its `src` in `MEDIA`, `PORTRAIT`, `FINAL` or `COLLAGE` (for example `'media/photos/memory-01.jpg'`). The number disappears once an image loads. Song: `site/media/audio/our-song.mp3`, set `trackSrc` in `data-props`, plus `TRACK_TITLE`, `TRACK_NOTE`, `LYRICS`.

## Copy
All lines are drafts for Atharva to rewrite: `LETTER`, `SIGNATURE`, `PS`, `SECRETS`, `STARS`, `COMPLETE`, `WHISPERS`, `WISHES`, `PROMISES`, `SECRET_END`, and the headings in the template. Bracketed text marks a spot only Atharva can fill.
