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

## The gate
The lock screen is a teaser. The passphrase is checked with PBKDF2 (150,000 rounds, salted) in the browser, so the answer is not readable in the page source. After the passphrase there is one more step. After 3 wrong passphrases the gate tells the visitor to contact Atharva. On localhost only, `/#open` skips it for testing; `?calm=1` forces the still, reduced-motion version. It is a light gate, not real security.

## Sound
One speaker button (top right) controls all sound. Ambient piano starts on the gate tap. When the mashup is added, it will be muted by the same button. Pressing Play on the song while sound is off turns sound back on.

## Placeholder numbers
Every photo slot shows its number so you can send "photo 05" and I know where it goes.

| No. | Slot | Where |
|---|---|---|
| 01 | portrait-01 | Chapter I portrait |
| 02 | film-01 | Full-bleed reel (keepsakes) |
| 03 to 08 | memory-01 to memory-06 | Polaroids in the keepsakes and the memory gallery |
| 09 | final-photo | Finale |
| 10 to 17 | collage-01 to collage-08 | Birthday memory wall |
| 19 | model-3d | Frame reserved for the small 3D object (send the model file) |

To fill one: put the file in `site/media/photos/` and set its `src` in `MEDIA`, `PORTRAIT`, `FINAL` or `COLLAGE` (for example `'media/photos/memory-01.jpg'`). The number disappears once an image loads. Song: `site/media/audio/our-song.mp3`, set `trackSrc` in `data-props`, plus `TRACK_TITLE`, `TRACK_NOTE`, `LYRICS`.

## Copy
All lines are drafts for Atharva to rewrite: `LETTER`, `SIGNATURE`, `PS`, `SECRETS`, `STARS`, `COMPLETE`, `WHISPERS`, `WISHES`, `PROMISES`, `SECRET_END`, and the headings in the template. Bracketed text marks a spot only Atharva can fill.

## Epigraphs (real quotes, original language, credited)
Set in `site/index.html` between scenes. Please verify wording against your own copies before the day:

| Scene break | Quote | Credit |
|---|---|---|
| after the hero | I cannot exist without you. | John Keats, letter to Fanny Brawne, 1819 |
| before first light | Le coeur a ses raisons que la raison ne connait point. | Blaise Pascal, Pensees, 1670 |
| before keepsakes | Poesia... eres tu. | Gustavo Adolfo Becquer, Rimas, 1871 |
| before the song | Dhai aakhar prem ka, padhe so pandit hoy. | Kabir, doha, 15th century |
| before the stars | Amor, ch'a nullo amato amar perdona. | Dante, Inferno V, c. 1320 |
| before the letter | Whatever our souls are made of, his and mine are the same. | Emily Bronte, Wuthering Heights, 1847 |
| before the finale | You pierce my soul. I am half agony, half hope. | Jane Austen, Persuasion, 1817 |
| before the birthday | I love thee with the breath, smiles, tears, of all my life. | E. B. Browning, Sonnets from the Portuguese, 1850 |
| before the lanterns | Dongjitdal gineun bameul han heorireul bae neo... (Korean) | Hwang Jini, sijo, 16th century |
| before the credits | Vivamus, mea Lesbia, atque amemus. | Catullus, Carmen 5, c. 60 BC |

No Gujarati or Marathi line is in yet: I could not confirm a classical quote with certainty. Candidates to check: Narsinh Mehta or Dayaram (Gujarati), Tukaram or Dnyaneshwar (Marathi).
