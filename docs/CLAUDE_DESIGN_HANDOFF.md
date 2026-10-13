# Project Shu ❤️ — Claude Design Handoff & Source Integration Guide

> **Important Note on Repository Access**:
> The canonical repository (`https://github.com/p4inz-code/project-shu`) is **private**. Do not assume an external design tool has automatic access to the private GitHub repository unless explicitly authorized via a GitHub integration. Never make the repository public or upload `.dev.vars`, passwords, session secrets, or real personal media into an external design tool. This document provides the complete source-grounded architecture, token system, component contracts, and replaceable slot specifications needed to prepare and integrate a Claude Design prototype safely.

---

## 1. Creative Direction & Dual-World Story Arc

Project Shu is a mobile-first romantic short-film experience created by **Atharva Patil** for **Yashvi Pokar (Shu)** (Birthday: October 26).

It unfolds across two interconnected visual worlds:

### World A — MOONLIGHT (`body[data-world="moonlight"]`)
- **Poetic Meaning**: *"You’re my moon."*
- **Palette Tokens (`src/styles/index.css`)**:
  - `--moon-midnight`: `#0d0a1a`
  - `--moon-indigo`: `#130e26`
  - `--moon-plum`: `#1d1436`
  - `--moon-velvet`: `#2b1d4c`
  - `--moon-lavender`: `#d6c8f7`
  - `--moon-silver-lilac`: `#e6defc`
  - `--moon-pearl`: `#f8f5fc`
  - `--moon-rose-glow`: `#d97593`
- **Mood**: Quiet night sky, lunar halo, soft stardust motes, intimate calm.

### World B — SUNSHINE (`body[data-world="sunshine"]`)
- **Poetic Meaning**: *"You’re my sunshine."*
- **Palette Tokens (`src/styles/index.css`)**:
  - `--sun-warm-white`: `#fffbf7`
  - `--sun-ivory`: `#fdf5ed`
  - `--sun-blush`: `#fae3ea`
  - `--sun-lavender`: `#f1e8fa`
  - `--sun-peach`: `#fde9d8`
  - `--sun-rose`: `#c95472`
  - `--sun-gold`: `#c88d3e`
  - `--sun-ink-dark`: `#25131f`
  - `--sun-ink-body`: `#4a2e3f`
- **Mood**: Warm morning light, blush-and-peach atmosphere, tenderness, everyday joy.

### Narrative Scene Sequence (`src/App.tsx`)
1. **Scene 00 — Moonlit Invitation (`PasswordEntrance.tsx`)**: Unauthenticated wax-sealed entrance (`A ♥ S`) with password verification (`POST /api/auth/login`).
2. **Scene 01 — Moonlight Hero Overture (`#hero-section`)**: Opens in Moonlight (*"You’re my moon."*) with opening greeting, note card, replaceable portrait (`portrait-01`), and interactive heart totem.
3. **Act I — Chapter I (`#chapter-anticipation`)**: Moonlight story spread (`StoryChapterSection.tsx`).
4. **Scene 02 — The Dawn Horizon (`#theme-transition-scene`)**: Dedicated scroll transition where stars recede and warm light spreads, switching `document.body.dataset.world` deterministically from `'moonlight'` to `'sunshine'` (and reversing back to `'moonlight'` when scrolling upward). Users can also toggle themes manually via `.theme-world-toggle` in the top HUD.
5. **Scene 03 — Sunshine Daylight World (`#sunshine-section`)**: Dedicated Sunshine editorial showcase (*"You’re my sunshine."*) with three daylight note tiles.
6. **Act II — Chapters II & III (`#chapter-affection`, `#chapter-appreciation`)**: Editorial story spreads with pull-quotes and expandable margin notes.
7. **Scene 05 — Keepsake Archive (`#memories-section`, `MemoryGallery.tsx`)**: Featured motion reel (`film-01`) + 6-plate asymmetric gallery (`memory-01`..`memory-06`) with scroll crop/blur/scale entry, varied top-exit choreography, and accessible fullscreen Lightbox with back-of-photo flip notes.
8. **Scene 06 — Soundtrack Score (`#song-section`, `SongPlayer.tsx`)**: Manual-play vinyl deck (`our-song`) with timestamped lyric cues.
9. **Scene 07 — Celestial Astrolabe (`#constellation-section`, `ConstellationSection.tsx`)**: Interactive 5-star SVG constellation unlocking a completion keepsake when all 5 stars are lit.
10. **Scene 08 — Personal Letter (`#letter-section`, `PersonalLetter.tsx`)**: Wax-sealed correspondence envelope that unfolds into a line-by-line or full-sheet personal letter.
11. **Scene 09 — Finale Union (`#ending-section`, `EndingSection.tsx`)**: Unites Moonlight and Sunshine (*"You’re my moon, and you’re my sunshine."*) with replaceable closing photo (`final-photo`), numbered promises, and revisit navigation.

---

## 2. Source Tree & Component Map

```text
project-shu/
├── functions/
│   └── api/
│       └── [[route]].ts          # Cloudflare Pages Functions auth & private media gate
├── private-content/
│   ├── shu-content.ts            # Protected narrative, captions, letter & slot manifest
│   ├── photos/                   # memory-01..06, portrait-01, film-01, final-photo
│   ├── audio/                    # our-song.wav / our-song.mp3
│   └── video/                    # film-01.mp4 / film-01.webm
├── scripts/
│   ├── generate-sample-media.mjs # Generates safe SVG & WAV placeholders
│   └── pack-private-assets.mjs   # Packs private-content/ into functions/_generated/
├── src/
│   ├── main.tsx                  # React root entry point
│   ├── App.tsx                   # Session lifecycle, HUD, Dawn Horizon & scene orchestration
│   ├── types/
│   │   └── content.ts            # TypeScript contracts for all content & media slots
│   ├── hooks/
│   │   └── useRevealOnScroll.ts  # Reversible IntersectionObserver viewport phase hook
│   ├── components/
│   │   ├── AmbientBackdrop.tsx   # Dual-world moon/sun glows, stardust & floating hearts
│   │   ├── PasswordEntrance.tsx  # Wax-sealed password login screen
│   │   ├── StoryChapterSection.tsx # Editorial chapter spread + margin secret drawer
│   │   ├── MemoryGallery.tsx     # Photo/video gallery + accessible Lightbox modal
│   │   ├── SongPlayer.tsx        # Manual-play audio console + lyric cues
│   │   ├── ConstellationSection.tsx # 5-star interactive SVG astrolabe
│   │   ├── PersonalLetter.tsx    # Wax-sealed envelope + line-by-line letter folio
│   │   ├── EndingSection.tsx     # Dual-theme epilogue + final-photo slot
│   │   └── motion/
│   │       └── MotionPrimitives.tsx # MaskedTextReveal, MediaRevealFrame, ParallaxLayer, SvgLineDraw
│   ├── styles/
│   │   └── index.css             # Complete Moonlight × Sunshine CSS variables & layout rules
│   └── test/
│       ├── auth-and-security.test.ts
│       └── experience.test.tsx
```

---

## 3. Non-Negotiable Constraints When Integrating a Claude Design Prototype

When applying visual updates from an approved Claude Design prototype:

1. **Preserve Server-Side Authentication & API Routes**:
   - Never bypass `PasswordEntrance.tsx` or inline `shuContent` into client-side bundles.
   - Keep `/api/auth/session`, `/api/auth/login`, `/api/auth/logout`, `/api/content`, `/api/media/photos/:key`, `/api/media/audio/:key`, and `/api/media/video/:key` intact.
2. **Preserve Stable Replaceable Slot IDs (`data-slot-id`)**:
   - Keep `portrait-01`, `film-01`, `memory-01` through `memory-06`, `final-photo`, and `our-song` wired through `<MediaRevealFrame>` and `SongPlayer.tsx` so Atharva can drop real files into `private-content/` without code changes.
3. **Preserve Dual-Theme State (`document.body.dataset.world`) & Reduced Motion (`body.reduced-motion-mode`)**:
   - Both automatic scroll transition at `#theme-transition-scene` and manual toggling via `.theme-world-toggle` must continue to work deterministically.
   - Respect `prefers-reduced-motion: reduce` and the HUD `Motion: Full / Calm` toggle.
4. **Maintain Mobile-First Ergonomics & Accessibility**:
   - Zero horizontal overflow at `320×640`, `360×800`, `390×844`, `768×1024`, and `1440×900`.
   - Touch targets `>= 44×44px` on all interactive controls.
   - Preserve Lightbox `role="dialog"`, focus trapping, `Escape` handling, and focus restoration.
   - Never autoplay audio without explicit user interaction.
5. **Verify Before Committing**:
   - Run `npm run typecheck`, `npm test`, and `npm run build` after any visual integration.

---

## 4. Hand-Drawn SVG, Image Masking & Motion Choreography Engine (`src/components/motion/MotionPrimitives.tsx`)

To support the upcoming Claude Design prototype without introducing external animation dependencies or expensive blur/canvas filters, `src/components/motion/MotionPrimitives.tsx` provides a lightweight, composable toolkit:

### 4.1 Progressive Hand-Drawn SVG Ornaments (`<HandDrawnOrnament>` & `<SvgLineDraw>`)
- **Built-in Motifs (`HAND_DRAWN_MOTIFS`)**:
  - `'constellation'` — Fine-line stars and constellation threads
  - `'crescent-moon'` — Crescent moon and delicate celestial sparkles
  - `'botanical-stem'` — Botanical stem, leaves, and blossoming bud
  - `'floral-flourish'` — Symmetrical editorial divider flourish with heart petal center
  - `'organic-border'` — Hand-drawn organic border accent
  - `'photo-corners'` — Delicate corner line drawing around photographs
  - `'horizon-sunrise'` — Progressive horizon arc, rising sun rays, and botanical sprout
- **Accessibility & Performance**: All decorative SVGs use normalized `pathLength={100}`, `aria-hidden="true"`, and `focusable="false"`, and settle immediately to `strokeDashoffset: 0` when `reducedMotion` is active.
- **Example**:
  ```tsx
  <HandDrawnOrnament
    motif="botanical-stem"
    stroke="var(--sun-rose)"
    durationMs={860}
    staggerMs={110}
    triggerOnScroll
    reversible
    reducedMotion={reducedMotion}
  />
  ```

### 4.2 Selectable Cinematic Image Reveal Primitives (`<MediaRevealFrame>`)
- **Selectable `revealVariant` Options** (not hardcoded uniformly across every photograph):
  - `'inset'` — Subtle paper-edge inset reveal (default)
  - `'organic-curve'` — Soft arched organic mask reveal
  - `'radial'` — Circular / iris mask reveal
  - `'paper-frame'` — Deckle-edge inset frame reveal
  - `'gentle-scale'` — Restrained scale & opacity reveal without clip-path masking
  - `'none'` — Static unmasked presentation (automatic under `reducedMotion`)
- **Optional Decorative SVG Frame Accents (`decorativeAccent`)**:
  - `'none' | 'photo-corners' | 'botanical' | 'celestial'`
- **Optional Foreground Depth Layer (`foregroundOverlay`)**:
  - Accepts a `React.ReactNode` overlay rendered above the media frame for subtle foreground/background separation.
- **Example**:
  ```tsx
  <MediaRevealFrame
    slotId="portrait-01"
    src="/api/media/photos/portrait-01"
    alt="Editorial portrait of Shu"
    aspect="portrait"
    revealVariant="organic-curve"
    decorativeAccent="photo-corners"
    accentColor="var(--moon-lavender)"
    reducedMotion={reducedMotion}
  />
  ```

### 4.3 Conservative Coordinated Parallax (`<ParallaxLayer>`)
- Multiplexes all mounted `<ParallaxLayer>` instances through a **single shared passive `scroll`/`resize` + `requestAnimationFrame` coordinator** (`subscribeToScrollCoordinator`), automatically detaching listeners when zero active layers remain (`getActiveParallaxSubscriberCount() === 0`).
- Clamps movement conservatively (`maxOffset` default `22px`, hard cap `28px`) and resets `transform: translate3d(0, 0, 0)` on unmount or `reducedMotion`.

### 4.4 Moonlight-to-Sunshine Transition Stage (`<WorldTransitionStage>`)
- Computes continuous scroll progress (`0..1`) through the Dawn Horizon transition zone and exposes CSS custom properties on the section container:
  - `--world-transition-progress` (`0` to `1`)
  - `--constellation-fade` (`1` to `0`)
  - `--sunshine-bloom` (`0` to `1`)
- Coordinates constellation fade-out, progressive horizon drawing (`motif="horizon-sunrise"`), and botanical accents appearing in Sunshine (`motif="botanical-stem"`), while leaving final color palette overrides, exact duration, and layout composition open for Claude Design.

### 4.5 Varied Scene Choreography Vocabulary (`<ChoreographedScene>`)
- Prevents every section from animating identically by offering selectable scene vocabularies:
  - `'ink-draw' | 'image-mask' | 'typography-reveal' | 'subtle-parallax' | 'light-transition' | 'staggered-reveal' | 'stillness'`
- Deterministic, interruptible, reversible on upward scroll when `reversible={true}`, and immediately visible when `vocabulary="stillness"` or `reducedMotion={true}`.

---

## 5. Signature Art Direction — The Memory Sakura (`src/components/MemorySakuraTree.tsx`)

The central visual identity of Project Shu is **The Memory Sakura**, an original hand-drawn cherry blossom tree woven through the storytelling, photography, scrolling, and interaction design:

### 5.1 Tree Stages Across the Narrative
1. **Stage I — Moonlit Bough & Drifting Petals (`AmbientBackdrop.tsx`, `StoryChapterSection.tsx`)**:
   - Sparse, GPU-composited drifting sakura petals (`.ambient-sakura-petal`) shift between silver-lilac in Moonlight and soft blush rose in Sunshine.
   - Each narrative chapter traces a delicate hand-drawn sakura bough (`motif="sakura-bough"`) as the chapter enters the viewport.
2. **Stage II — Dawn Horizon Awakening (`WorldTransitionStage`)**:
   - As the night sky transitions into dawn (`#theme-transition-scene`), constellation lines recede (`--constellation-fade`), the horizon arc traces itself, and warm botanical buds unfurl (`--sunshine-bloom`).
3. **Stage III — Interactive Memory Sakura Canopy (`MemorySakuraTree.tsx` inside `#memories-section`)**:
   - An organic hand-drawn SVG cherry blossom tree (`viewBox="0 0 600 500"`) with grounded roots, asymmetric trunk, primary boughs, and delicate twigs that progressively trace into existence (`pathLength={100}`).
   - Anchors all **6 replaceable photographic memories (`memory-01`..`memory-06`)** as interactive, keyboard-accessible, mobile-tappable **Memory Blossom Nodes** (`>= 48×48px` hit targets).
   - Includes **3 hidden branch whisper lights** (`.sakura-branch-whisper-btn`) nestled along the boughs that reveal affectionate hidden notes when tapped.
4. **Stage IV — Constellation Lines Connecting to Branches (`ConstellationSection.tsx`)**:
   - Inside `.constellation-sky`, dashed starlight threads connect each of the 5 constellation stars down to a hand-drawn horizon sakura bough.
5. **Stage V — Final Blossom Opening to Reveal the Letter (`PersonalLetter.tsx`)**:
   - A hand-drawn **Crown Sakura Blossom** (`motif="sakura-blossom"`) frames the wax seal on the correspondence envelope and blooms into an open sakura bough (`motif="sakura-bough"`) when the letter is unsealed.

### 5.2 Memory Blossom States (`data-blossom-state`)
Each blossom node on `<MemorySakuraTree>` transitions cleanly through four states without losing the visitor's place in the tree:
- **`default`**: Hand-drawn 5-petal sakura blossom with plate badge (`01`..`06`) and luminous pistil.
- **`hovered`** *(Desktop hover / keyboard `:focus-visible`)*: Scales gently (`1.12x`), highlights petal strokes, and reveals a floating title tooltip.
- **`tapped`** *(Active selection on mobile & desktop)*: Highlights the blossom (`1.16x` + halo ring) and updates the adjacent **Sakura Blossom Inspector Card** (`.sakura-blossom-inspector`), displaying the photograph through an `organic-curve` mask with a direct button (`Open Blossom 0X Full Keepsake Frame`) to launch the Lightbox.
- **`opened`** *(Visited in Lightbox)*: Fills the blossom petals with warm rose-gold ink (`state-opened`) so Shu can see which memories she has already explored.

### 5.3 Before / During / After Animation States
| Sequence | Before (`entering` / Undrawn) | During (Scroll / Interaction) | After (`in-view` / Completed / `reducedMotion`) |
| :--- | :--- | :--- | :--- |
| **Hand-Drawn Sakura Tree & Boughs** | `strokeDashoffset: 100` (branches hidden, layout space reserved) | Progressive stroke tracing (`820ms–960ms` staggered from roots -> trunk -> boughs -> twigs) | `strokeDashoffset: 0` (full crisp vector ink illustration) |
| **Organic Image Mask Reveal** | `clip-path: inset(8% 6% 6% 6% round 110px 110px 24px 24px)`, `scale(1.045)` | Smooth GPU-friendly clip-path + transform interpolation (`780ms–860ms`) | `clip-path: inset(0% round 28px 28px 10px 10px)`, `scale(1)` |
| **Moonlight → Sunshine World Shift** | `--world-transition-progress: 0`, `data-world="moonlight"` (midnight indigo/plum surfaces & silver-lilac tree) | Continuous scroll progress (`0..1`) fading constellations and illuminating horizon | `--world-transition-progress: 1`, `data-world="sunshine"` (warm ivory/blush/rose/gold surfaces & rosewood sakura tree) |
| **Final Letter Blossom Unfurl** | Sealed envelope crowned by `sakura-blossom` around `A ♥ S` wax seal | User taps *Break the Wax Seal & Read Letter*; heart burst spawns | Unsealed cotton folio crowned by `sakura-bough` with line-by-line or immediate full-letter reveal |


