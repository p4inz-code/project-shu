# Audit report

Environment: Chromium in the Claude desktop preview pane, desktop and emulated phone sizes. The pane throttles animation frames and timers while it is not focused, so real frame rate could not be measured. No real phone, Safari or Firefox was available.

## What passed

| Audit | Method | Result |
|---|---|---|
| Error budget | Scrolled the whole page in 30 steps, trapped `error`, `unhandledrejection` and `console.error` | 0 errors, 0 runtime template errors |
| Chaos run | Seeded (20261017): 260 random actions, including 59 button clicks, 75 scroll jumps, 35 key presses, 31 wheel bursts, 14 visibility flips and 46 pointer storms | 0 errors, heap about 10 MB, no stuck scroll lock, no layout overflow |
| Overflow | 320, 360, 414, 600, 768, 812x375 landscape, 1024, 1440, 2560 wide | No horizontal overflow at any size |
| Login abuse | Empty, whitespace, 5,000 characters, emoji, SQL and `<img onerror>` strings, near-miss phrases, mixed case with spaces | Only the right phrase passes; injected markup stays inert; friendly "ask Atharva" message after 4 misses |
| Star lock | Wrong orders, same star mashed, double taps, then the right order | Hint appears after 3 misses; right order unlocks |
| Sound control | State, label, 31 rapid taps, playing the song while sound is off | Label and pressed state stay correct; playing the song turns sound back on |
| Reduced motion | `?calm=1` path | Tree draws as a still image, no petals, no letterbox bars, all text visible |
| Accessibility checks | Script scan | 46 of 46 buttons named, 0 images without alt, no tap target under 40 px, form label present |
| Asset requests | Network log | All 200, no 404s |
| Photo hold | Counted hold triggers while passing every photo | 5 photos passed, 5 holds, one per photo |
| Canvas memory | Measured backing stores | Dropped from 52 megapixels to about 5 live (see below) |

## Bugs found and fixed during the audit
1. Effect canvases stretched across very tall sections (up to 2525x9104 px). That wastes hundreds of MB and would fail on iPhones, whose canvas limit is about 16.7 megapixels. This came from the original mockup. Backing stores are now capped near 1.8 megapixels and released a few seconds after leaving the screen.
2. Missing `lang` attribute and main landmark. Added.
3. The star-lock hint hid the success message at the moment of success. Fixed.
4. Rapid taps on the sound button could lose a toggle because the handler read a stale value. Fixed.
5. A script-order bug (`R` used before it was defined) broke the memory wall during development. Fixed and covered by the error-budget run.

## Not verified
- Real frame rate on a phone, and thermal behaviour over a five-minute run.
- Safari (iOS and macOS) and Firefox. The page relies on `color-mix`, `:has`, the individual `translate`, `rotate` and `scale` properties, and `mask-image`. All are supported by current releases, but none was tested.
- The 1-second photo hold on touch devices (it locks `html` scrolling for 1 second) and on trackpads with long inertia.
- Forced-colours mode, print, text zoom beyond what narrow widths imitate.
- Audio on iOS: the browser rules say each start needs a direct tap. Ambient music starts on the gate tap and the song needs a tap, which fits, but it has not been heard on a phone.
- Long-run memory over hours. The 260-action chaos run stayed at 10 MB.
- Any real photo, the real song, or the final mashup. All media are placeholders.

## Known limits
- The gate is a light check in the browser, as agreed. Anyone who reads the page source can find the hash and the star order.
- The tree is pseudo-3D drawn on a 2D canvas, not WebGL. It adapts its detail if frames run slow.
- Scroll-driven colour changes (the dawn sky) are deterministic on purpose. Ambient motion (petals, wind, loops, gust timing, tile sway, light flicker) is randomised.
- The old React and Functions app is still in the repo and unused.

## Addendum: lock screen and later changes
- Passphrase check: empty, junk, injection strings, near misses and mixed case all behave; wrong tries give a tease, then a romantic hint, then the contact message.
- Second step: physics was simulated frame by frame (a fast lunge reaches it, a slow approach does not, each miss makes it slower and easier); a full catch and drop unlocks the page.
- 10 epigraphs render in Latin, Devanagari, Hangul and accented scripts; 0 errors across a 22-step sweep; no overflow; no dashes in visible text.
- Not verified: touch dragging on a real phone, Safari and Firefox, and PBKDF2 timing on low-end phones (150,000 rounds is a deliberate short pause).
- Security limit: the answer is no longer readable in the source, but a determined person could still brute-force the short phrase offline or bypass the page in the console. Casual F12 reading will not reveal it.
