# Project Shu ❤️ — Moonlight × Sunshine Edition

A private, password-protected interactive birthday & romantic short-film experience created by **Atharva Patil** for **Yashvi Pokar (Shu)** (Birthday: October 26).

Built around two complementary visual worlds—**Moonlight** (*"You’re my moon."*) and **Sunshine** (*"You’re my sunshine."*)—that transition smoothly through a scroll-driven Dawn Horizon and unite in the closing epilogue.

- **Canonical Private Repository**: `https://github.com/p4inz-code/project-shu`
- **Stack**: React 18, TypeScript, Vite 6, Cloudflare Pages Functions (`functions/api/[[route]].ts`), Vitest + Testing Library
- **Claude Design Handoff**: See [`docs/CLAUDE_DESIGN_HANDOFF.md`](./docs/CLAUDE_DESIGN_HANDOFF.md)

---

## 1. Architecture & Private-Content Security Boundary

Project Shu enforces a strict **server-side authentication boundary** rather than hiding private content solely behind a client-side overlay:

1. **Public Static Bundle (`dist/`)**:
   - Contains only the application shell, CSS design tokens, motion primitives, and the password entrance UI (`src/components/PasswordEntrance.tsx`).
   - Verified by automated tests (`src/test/auth-and-security.test.ts`) to contain **zero** private photographs, videos, audio tracks, personal letter paragraphs, or secrets.
2. **Private Asset Packing (`scripts/pack-private-assets.mjs`)**:
   - During `npm run build`, files inside `private-content/photos/`, `private-content/audio/`, and `private-content/video/` are packed into `functions/_generated/private-bundle.ts` (gitignored).
3. **Cloudflare Pages Functions Gate (`functions/api/[[route]].ts`)**:
   - `GET /api/auth/session` — Returns authentication status and sanitized password hint (automatically redacts hint if it ever contains `SHU_PASSWORD`).
   - `POST /api/auth/login` — Verifies the submitted password using constant-time Web Crypto HMAC-SHA256 (`safeVerifyPassword`), enforces sliding-window per-IP rate limiting (`10` attempts per `60s`, returning `429 Too Many Requests` with `Retry-After: 60`), and issues a signed `HttpOnly; SameSite=Strict; Path=/` cookie (`shu_session`, 7-day TTL).
   - `POST /api/auth/logout` — Clears `shu_session` (`Max-Age=0`).
   - `GET /api/content` — Returns `private-content/shu-content.ts` JSON **only** when `shu_session` is valid (`401 Unauthorized` otherwise).
   - `GET /api/media/photos/:key` — Serves private photos/portraits (`memory-01..06`, `portrait-01`, `film-01`, `final-photo`) with HTTP `206 Partial Content` range support **only** when authenticated.
   - `GET /api/media/audio/:key` — Serves private audio (`our-song`) with HTTP `206` range streaming **only** when authenticated.
   - `GET /api/media/video/:key` — Serves private video (`film-01`) with HTTP `206` range streaming **only** when authenticated.
   - All responses attach `Cache-Control: no-store, no-cache, must-revalidate, private`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.

---

## 2. Prerequisites & Installation

- **Node.js**: `>= 20.x`
- **npm**: Uses existing `package-lock.json`

```bash
npm install
```

### Environment Variables (`.dev.vars`)
Copy `.dev.vars.example` to `.dev.vars` (which is gitignored and never committed):

```bash
cp .dev.vars.example .dev.vars
```

Required environment variable names:
- `SHU_PASSWORD`: The secret phrase Shu enters on the wax-sealed entrance screen.
- `SHU_SESSION_SECRET`: A 32+ character random signing key used for HMAC-SHA256 session cookies (`shu_session`).
- `SHU_PASSWORD_HINT` *(optional)*: A gentle clue displayed if Shu clicks *"Need a gentle clue, Shu?"*.

---

## 3. Development, Build & Test Commands

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server (`http://127.0.0.1:5173`) with the local Cloudflare Pages API adapter middleware (`vite.config.ts`). |
| `npm run typecheck` | Runs `tsc --noEmit` to validate TypeScript types across `src/` and `functions/`. |
| `npm test` | Runs the Vitest suite (`src/test/auth-and-security.test.ts` and `src/test/experience.test.tsx`). |
| `npm run build` | Runs `node scripts/pack-private-assets.mjs && tsc -b && vite build` to produce `functions/_generated/private-bundle.ts` and `dist/`. |
| `npx wrangler pages dev dist --port 8788` | Runs the full Cloudflare Pages runtime locally against the production `dist/` output and `functions/`. |

---

## 4. Placeholder Content & Personal Media Replacement Guide

All personal text and media are isolated in `private-content/`. No fabricated relationship memories are included; every placeholder is explicitly labeled for replacement.

### Stable Replaceable Media Identifiers
| Slot ID | File Location | Supported Formats (Priority Order) | Where It Renders |
| :--- | :--- | :--- | :--- |
| `portrait-01` | `private-content/photos/portrait-01.*` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.svg` | Hero Overture (`#hero-section`) right-column keepsake frame |
| `memory-01` .. `memory-06` | `private-content/photos/memory-01.*` .. `memory-06.*` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.svg` | Keepsake Gallery (`#memories-section`) & Fullscreen Lightbox |
| `film-01` | `private-content/video/film-01.*` + poster `private-content/photos/film-01.*` | Video: `.mp4`, `.webm`, `.mov`; Poster: `.jpg`, `.png`, `.webp`, `.svg` | Featured Motion Reel (`#memories-section`) |
| `final-photo` | `private-content/photos/final-photo.*` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.gif`, `.svg` | Closing Epilogue (`#ending-section`) keepsake frame |
| `our-song` | `private-content/audio/our-song.*` | `.mp3`, `.m4a`, `.ogg`, `.wav` | Soundtrack Score Deck (`#song-section`) |

> **Automatic Stem Override**: You do not need to delete the `.svg` or `.wav` placeholders. Dropping `memory-01.jpg` into `private-content/photos/` or `our-song.mp3` into `private-content/audio/` and running `npm run build` automatically prioritizes the real media file over the placeholder. To enable video playback for `film-01`, drop `film-01.mp4` into `private-content/video/` and set `memoriesIntro.featuredFilm.mediaType = 'video'` in `private-content/shu-content.ts`.

---

## 5. Cinematic Motion Primitives & Reduced-Motion Support

Reusable motion primitives live in `src/hooks/useRevealOnScroll.ts` and `src/components/motion/MotionPrimitives.tsx`:
- **`useRevealOnScroll(reducedMotion, { reversible })`**: Tracks element viewport phases (`'entering' | 'in-view' | 'exiting-top'`) using a single `IntersectionObserver` per instance and cleans up on unmount.
- **`<MaskedTextReveal>`**: Word-by-word or line-by-line masked typography reveal that preserves a unified `aria-label` for screen readers and renders static text immediately when `reducedMotion` is active.
- **`<MediaRevealFrame>`**: Handles aspect-ratio reservation (`portrait`, `landscape`, `square`, `wide` — zero layout shift), controlled `clip-path` crop + blur + scale reveal, `<video>`/`<img>` switching, and a styled archival fallback plate (`.media-fallback-plate`) if an asset fails to load.
- **`<ParallaxLayer>`**: Passive scroll + `requestAnimationFrame` `translate3d` layer that pauses automatically when `document.hidden` is true or `reducedMotion` is enabled.
- **`<SvgLineDraw>`**: Normalized `pathLength={100}` stroke-dashoffset line drawing primitive.
- **Full / Calm Motion Control**: Automatically respects `prefers-reduced-motion: reduce` and provides an interactive `Motion: Full / Calm` HUD button (`body.reduced-motion-mode`).

---

## 6. Responsive Viewports & Accessibility (WCAG 2.2 AA)

- **Target Viewports**: Verified at `320×640`, `360×800`, `390×844` (mobile portrait primary), `768×1024` (tablet), and `1440×900` (desktop widescreen) with `0` horizontal overflow (`scrollWidth <= innerWidth`).
- **Touch Targets**: All interactive buttons, seal medallions, navigation pills, audio controls, and constellation star nodes meet or exceed `44×44px`.
- **Keyboard & Screen Readers**: Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`), accessible labels on all icon controls, full `Tab`/`Shift+Tab` focus trapping inside the Lightbox modal, `Escape` to close, `ArrowLeft`/`ArrowRight` gallery navigation, and focus restoration to the triggering card on close.

---

## 7. Cloudflare Pages Deployment Preparation

When connecting `https://github.com/p4inz-code/project-shu` to Cloudflare Pages:

1. **Build Configuration**:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Node.js version**: `20` (or `22`)
2. **Environment Separation (Local vs Preview vs Production)**:
   - **Local Development**: Uses `.dev.vars` (gitignored).
   - **Preview Deployments (Cloudflare Pages)**: Configure separate preview secrets (`SHU_PASSWORD`, `SHU_SESSION_SECRET`, optional `SHU_PASSWORD_HINT`) under **Cloudflare Pages → Settings → Environment Variables → Preview**.
   - **Production Deployment (Cloudflare Pages)**: Configure production secrets (`SHU_PASSWORD`, `SHU_SESSION_SECRET`, optional `SHU_PASSWORD_HINT`) as **Encrypted** variables under **Cloudflare Pages → Settings → Environment Variables → Production**.

---

## 8. Known Limitations

- **Dev-Only Dependency Advisories**: `npm audit --omit=dev` reports **0 vulnerabilities** in production dependencies. `npm audit` (including devDependencies) reports dev-only advisories in `vitest@2.1.x` / `esbuild` / `tinypool`, which are used only for local unit testing and are never deployed or bundled.
- **In-Memory Rate Limiter Scope**: The login rate limiter in `functions/api/[[route]].ts` tracks attempts per Cloudflare Worker isolate in memory; for multi-colo distributed rate limiting at scale, Cloudflare WAF Rate Limiting rules can be layered in front of `/api/auth/login`.
