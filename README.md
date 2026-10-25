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
| 01 | portrait-01 | The portrait near the start |
| 02 | film-01 | Full-bleed reel (keepsakes) |
| 03 to 07 | memory-01 to memory-05 | Polaroids in the keepsakes (03, 04) and hanging from the branch (05, 06, 07) |
| 08 | memory-06 | Not shown now. The big 3:2 frame was removed. Send a photo and it can go somewhere else |
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
| before first light | La lune blanche luit dans les bois… Ô bien-aimée. | Paul Verlaine, La Bonne Chanson, 1870 |
| before keepsakes | Poesia... eres tu. | Gustavo Adolfo Becquer, Rimas, 1871 |
| before the song | Ishq par zor nahin hai, ye woh aatish Ghalib (Hindi and Urdu script) | Mirza Ghalib, ghazal, 19th century |
| before the stars | Amor, ch'a nullo amato amar perdona. | Dante, Inferno V, c. 1320 |
| before the letter | Whatever our souls are made of, his and mine are the same. | Emily Bronte, Wuthering Heights, 1847 |
| before the finale | You pierce my soul. I am half agony, half hope. | Jane Austen, Persuasion, 1817 |
| before the birthday | I love thee with the breath, smiles, tears, of all my life. | E. B. Browning, Sonnets from the Portuguese, 1850 |
| before the lanterns | Dongjitdal gineun bameul han heorireul bae neo... (Korean) | Hwang Jini, sijo, 16th century |
| before the credits | Vivamus, mea Lesbia, atque amemus. | Catullus, Carmen 5, c. 60 BC |

No Gujarati or Marathi line is in yet: I could not confirm a classical quote with certainty. Candidates to check: Narsinh Mehta or Dayaram (Gujarati), Tukaram or Dnyaneshwar (Marathi).

## Quote voice-overs
Removed for now. When the recordings exist, name them v01.mp3 to v10.mp3 (same order as the quotes above, top to bottom) and put them in site/media/audio/voice/. Each quote section already carries data-voice="v01" to "v10".

## Finale track
site/media/audio/finale.mp3 starts when she reaches the Happy Birthday page, fades in, and loops until sound is turned off or she scrolls back above that page.

## Performance
The page switches to a lighter mode by itself on weak devices or when frames run slow. Force it with ?perf=lite or ?perf=full. Details are in docs/AUDIT_REPORT.md.

## Photos placed (25 Oct)
01 portrait, 05 memory-03, 09 final photo, 10 collage-01 (short video), 11 to 17 collage-02 to collage-08. Files are in site/media/photos and site/media/video, named by number. Still to place: 02, 03, 04, 06, 07, 08 (and 18, 19). Each placed photo has its own entry effect (the number picks the effect) and a slow drift while on screen.

## Photos updated (25 Oct, second pass)
01 (new collage edit), 02 (full-bleed frame, rotated upright), 05, 06, 07, 09 (rotated upright) and 11 to 17 are placed. bg-last.jpg is the blurred backdrop behind the finale photo. 15 is the earlier processed copy (the file is no longer in the source folder). Slot 19 is now an interactive 3D blossom tree (site/tree3d.js) with the photos hanging from it. Still open: 03, 04, 08, 18.

## Photos, third pass (25 Oct)
04 (card at the right of the keepsakes), 08 (big frame under the tree, couple selfie) and 18 (album art on the song sleeve) are placed from `media from me`. 03 is waiting for a photo. Every photo is cropped around the face (focus points in site/tree3d.js and the focus fields in index.html). Heart photo: site/media/photos/heart.jpg appears inside the star heart when all five stars are lit.

## Quote audit (25 Oct)
Every quote is now addressed to one beloved person: Keats (letter to Fanny Brawne), Verlaine (to his bride), Bécquer, Ghalib (the beloved's glance), Dante (Vita Nuova, to Beatrice), Donne, Austen (Wentworth's letter), Browning, Hwang Jini, Catullus (Carmen 5). Replaced as too general or mismatched: Pascal, Ghalib's fire couplet, Dante Inferno V, Emily Brontë ("his and mine"), Catullus naming Lesbia.

## Gujarati quote
11th quote, placed after Ghalib: Kalapi (1874 to 1900), opening of "Aapni Yaadi": jya jya najar mari thare, yaadi bhari tya aapni ("wherever my eyes rest, it is full of memories of you"). Source for the opening line: the Live History India article on Kalapi. No Marathi line was added because no pre-1900 Marathi love line could be verified.
