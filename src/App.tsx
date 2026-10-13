import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, Heart, Lock, Moon, Sparkles, Sun } from 'lucide-react';
import type { ShuExperienceContent } from './types/content';
import {
  AmbientBackdrop,
  type FloatingBurst,
} from './components/AmbientBackdrop';
import { PasswordEntrance } from './components/PasswordEntrance';
import { StoryChapterSection } from './components/StoryChapterSection';
import { MemoryGallery } from './components/MemoryGallery';
import { SongPlayer } from './components/SongPlayer';
import { ConstellationSection } from './components/ConstellationSection';
import { PersonalLetter } from './components/PersonalLetter';
import { EndingSection } from './components/EndingSection';
import { useRevealOnScroll } from './hooks/useRevealOnScroll';
import {
  MaskedTextReveal,
  MediaRevealFrame,
} from './components/motion/MotionPrimitives';

export type VisualWorld = 'moonlight' | 'sunshine';

interface KineticInterludeProps {
  cueCode: string;
  scriptWord: string;
  statement: string;
  reducedMotion: boolean;
  variant?: 'moonlight' | 'sunshine';
}

const KineticInterlude: React.FC<KineticInterludeProps> = ({
  cueCode,
  scriptWord,
  statement,
  reducedMotion,
  variant = 'moonlight',
}) => {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>(reducedMotion, {
    reversible: true,
  });
  return (
    <div
      ref={ref}
      className={`kinetic-interlude-scene ${
        variant === 'sunshine' ? 'interlude-sunshine' : ''
      } ${isVisible ? 'is-visible' : ''}`}
      aria-hidden="true"
    >
      <div className="kinetic-interlude-inner">
        <span className="kinetic-interlude-code">{cueCode}</span>
        <span className="kinetic-interlude-script">{scriptWord}</span>
        <MaskedTextReveal
          as="p"
          text={statement}
          mode="words"
          reducedMotion={reducedMotion}
          reversible
          className="kinetic-interlude-statement"
        />
        <div className="kinetic-interlude-rule" />
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const [checkingSession, setCheckingSession] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordHint, setPasswordHint] = useState<string | undefined>(
    undefined,
  );
  const [content, setContent] = useState<ShuExperienceContent | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);

  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const transitionSceneRef = useRef<HTMLElement | null>(null);

  // Dual-World Theme State: Scroll-driven by default, manual override supported
  const [scrollWorld, setScrollWorld] = useState<VisualWorld>('moonlight');
  const [manualWorld, setManualWorld] = useState<VisualWorld | null>(null);
  const activeWorld: VisualWorld = manualWorld ?? scrollWorld;

  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  const [bursts, setBursts] = useState<FloatingBurst[]>([]);
  const [heroWhisperCount, setHeroWhisperCount] = useState(0);

  const spawnHeart = useCallback(
    (x: number, y: number, label?: string) => {
      if (reducedMotion) return;
      const id = Date.now() + Math.floor(Math.random() * 10000);
      setBursts((prev) => [...prev.slice(-5), { id, x, y, label }]);
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((item) => item.id !== id));
      }, 1500);
    },
    [reducedMotion],
  );

  useEffect(() => {
    if (reducedMotion) {
      document.body.classList.add('reduced-motion-mode');
    } else {
      document.body.classList.remove('reduced-motion-mode');
    }
  }, [reducedMotion]);

  // Synchronize active visual world ("moonlight" | "sunshine") with document.body
  useEffect(() => {
    document.body.dataset.world = activeWorld;
  }, [activeWorld]);

  // Pause non-essential CSS animations when tab is hidden on mobile
  useEffect(() => {
    const handleVisibilityChange = () => {
      document.body.classList.toggle('page-hidden', document.hidden);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const loadProtectedContent = useCallback(async () => {
    setContentError(null);
    try {
      const res = await fetch('/api/content', {
        headers: { Accept: 'application/json' },
      });
      if (res.status === 401) {
        setAuthenticated(false);
        setContent(null);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to load protected content');
      }
      const data = (await res.json()) as ShuExperienceContent;
      setContent(data);
    } catch {
      setContentError(
        'Could not load Shu’s keepsake content right now. Please refresh to try again.',
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        if (!res.ok) {
          if (!cancelled) setCheckingSession(false);
          return;
        }
        const data = (await res.json()) as {
          authenticated?: boolean;
          passwordHint?: string;
        };
        if (cancelled) return;
        setPasswordHint(data.passwordHint);
        if (data.authenticated) {
          setAuthenticated(true);
          await loadProtectedContent();
        }
      } catch {
        // Stay on entrance screen if offline
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }
    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [loadProtectedContent]);

  // GPU-composited scroll progress bar + deterministic, reversible Moonlight <-> Sunshine scroll transition
  useEffect(() => {
    if (!authenticated) return;
    let rafId = 0;
    const updateScrollState = () => {
      rafId = 0;
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio =
        docHeight <= 0 ? 0 : Math.min(1, Math.max(0, scrollTop / docHeight));

      const el = progressFillRef.current;
      if (el) {
        el.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }

      const horizonEl = transitionSceneRef.current;
      if (horizonEl) {
        const rect = horizonEl.getBoundingClientRect();
        const triggerLine = window.innerHeight * 0.45;
        const nextWorld: VisualWorld =
          rect.top <= triggerLine ? 'sunshine' : 'moonlight';
        setScrollWorld((prev) => (prev === nextWorld ? prev : nextWorld));
      }
    };

    const handleScroll = () => {
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(updateScrollState);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    updateScrollState();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [authenticated]);

  const handleAuthenticated = async () => {
    setAuthenticated(true);
    await loadProtectedContent();
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setAuthenticated(false);
      setContent(null);
      setManualWorld(null);
      setScrollWorld('moonlight');
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleToggleWorld = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextWorld: VisualWorld =
      activeWorld === 'moonlight' ? 'sunshine' : 'moonlight';
    setManualWorld(nextWorld);
    const rect = e.currentTarget.getBoundingClientRect();
    spawnHeart(
      rect.left + rect.width / 2,
      Math.min(window.innerHeight - 60, rect.bottom + 36),
      nextWorld === 'sunshine' ? 'You’re my sunshine ☀️' : 'You’re my moon 🌙',
    );
  };

  const navigateToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  };

  if (checkingSession) {
    return (
      <div
        className="entrance-screen"
        role="status"
        aria-live="polite"
        style={{
          color: 'var(--moon-lavender)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.35rem' }}>
          Preparing Shu’s keepsake...
        </p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <>
        <AmbientBackdrop
          reducedMotion={reducedMotion}
          bursts={bursts}
          activeWorld="moonlight"
        />
        <PasswordEntrance
          passwordHint={passwordHint}
          onAuthenticated={handleAuthenticated}
          onSpawnHeart={spawnHeart}
        />
      </>
    );
  }

  if (contentError || !content) {
    return (
      <div
        className="entrance-screen"
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="entrance-card">
          <p>{contentError || 'Opening your world, Shu...'}</p>
          {contentError && (
            <button
              type="button"
              className="primary-seal-btn"
              onClick={() => void loadProtectedContent()}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  const heroWhispers = [
    'Every pixel here was made thinking of you, Shu ♥',
    'You’re my moon in the quiet hours, and my sunshine every day ♥',
    'Always your quiet corner of the world, Yashvi ♥',
  ];

  const firstChapter = content.chapters[0];
  const remainingChapters = content.chapters.slice(1);

  return (
    <>
      <a href="#main-journey" className="skip-link">
        Skip to Shu’s Story
      </a>

      <AmbientBackdrop
        reducedMotion={reducedMotion}
        bursts={bursts}
        activeWorld={activeWorld}
      />

      {/* Top Reading Progress Indicator (GPU-composited transform: scaleX) */}
      <div className="top-progress-bar" aria-hidden="true">
        <div
          ref={progressFillRef}
          className="top-progress-fill"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      {/* Floating Cinema HUD Navigation */}
      <header className="top-nav-shell" aria-label="Journey Navigation">
        <a
          href="#hero-section"
          className="brand-monogram"
          onClick={(e) => {
            e.preventDefault();
            navigateToSection('hero-section');
          }}
        >
          <Heart
            size={14}
            fill="currentColor"
            style={{ color: 'var(--color-cherry-bright)' }}
          />
          <span>For Shu</span>
        </a>

        <nav className="nav-links" aria-label="Chapter shortcuts">
          <button
            type="button"
            className="nav-pill"
            onClick={() => navigateToSection('chapter-anticipation')}
          >
            Moonlight
          </button>
          <button
            type="button"
            className="nav-pill"
            onClick={() => navigateToSection('sunshine-section')}
          >
            Sunshine
          </button>
          <button
            type="button"
            className="nav-pill"
            onClick={() => navigateToSection('memories-section')}
          >
            Memories
          </button>
          <button
            type="button"
            className="nav-pill"
            onClick={() => navigateToSection('song-section')}
          >
            Our Song
          </button>
          <button
            type="button"
            className="nav-pill"
            onClick={() => navigateToSection('constellation-section')}
          >
            5 Stars
          </button>
          <button
            type="button"
            className="nav-pill"
            onClick={() => navigateToSection('letter-section')}
          >
            Letter
          </button>
          <button
            type="button"
            className="nav-pill"
            onClick={() => navigateToSection('ending-section')}
          >
            Finale
          </button>
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="icon-chip-btn theme-world-toggle"
            onClick={handleToggleWorld}
            aria-label={`Switch between Moonlight and Sunshine theme (currently ${activeWorld})`}
            title="Switch between Moonlight and Sunshine theme"
          >
            {activeWorld === 'moonlight' ? (
              <>
                <Moon size={13} />
                <span>Moonlight</span>
              </>
            ) : (
              <>
                <Sun size={13} />
                <span>Sunshine</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="icon-chip-btn"
            onClick={() => setReducedMotion((prev) => !prev)}
            aria-pressed={reducedMotion}
            title="Toggle reduced motion"
          >
            <Sparkles size={12} />
            <span>
              <span className="motion-prefix">Motion: </span>
              {reducedMotion ? 'Calm' : 'Full'}
            </span>
          </button>

          <button
            type="button"
            className="icon-chip-btn"
            onClick={() => void handleLogout()}
            aria-label="Lock envelope and return to password screen"
            title="Lock envelope"
          >
            <Lock size={12} />
            <span>Lock</span>
          </button>
        </div>
      </header>

      <main id="main-journey">
        {/* Scene 00: Moonlight / Sunshine Adaptive Hero Opening Spread */}
        <section
          id="hero-section"
          className="hero-section"
          aria-labelledby="hero-heading"
        >
          <div className="hero-top-metadata" aria-hidden="true">
            <span>
              SCENE 00 //{' '}
              {activeWorld === 'moonlight'
                ? 'MOONLIGHT OVERTURE'
                : 'SUNSHINE OVERTURE'}
            </span>
            <span className="hide-mobile">{content.meta.editionLabel}</span>
            <span className="hide-narrow">ATHARVA → SHU</span>
          </div>

          <div className="hero-inner">
            <div className="hero-editorial-grid">
              <div>
                <div className="world-poetic-banner">
                  {activeWorld === 'moonlight' ? (
                    <>
                      <Moon size={15} />
                      <span>
                        “You’re my moon.” — The softest light in every quiet
                        hour.
                      </span>
                    </>
                  ) : (
                    <>
                      <Sun size={15} />
                      <span>
                        “You’re my sunshine.” — The warmth that brightens every
                        ordinary day.
                      </span>
                    </>
                  )}
                </div>

                <div>
                  <span className="eyebrow-tag">{content.hero.eyebrow}</span>
                </div>

                <span className="hero-script-callout" aria-hidden="true">
                  {activeWorld === 'moonlight'
                    ? 'Under a quiet moonlit sky, just for you'
                    : 'Where warm sunlight fills the room, just for you'}
                </span>

                <h1 id="hero-heading" className="hero-title">
                  {content.hero.greeting}
                </h1>

                <p className="hero-subtitle">{content.hero.subtitle}</p>
              </div>

              <div className="hero-right-column">
                <div className="hero-note-card">{content.hero.openingNote}</div>

                {content.hero.portrait && (
                  <div
                    data-slot-id={content.hero.portrait.id}
                    style={{
                      width: '100%',
                      maxWidth: '340px',
                      padding: '0.65rem',
                      borderRadius: '10px',
                      background: 'rgba(24, 16, 44, 0.65)',
                      border: '1px solid rgba(214, 200, 247, 0.24)',
                    }}
                  >
                    <MediaRevealFrame
                      slotId={content.hero.portrait.id}
                      src={`/api/media/photos/${encodeURIComponent(
                        content.hero.portrait.fileStem,
                      )}`}
                      alt={content.hero.portrait.title}
                      aspect={content.hero.portrait.aspect}
                      fallbackTitle={content.hero.portrait.title}
                      fallbackSubtitle={content.hero.portrait.caption}
                    />
                  </div>
                )}

                <button
                  type="button"
                  className="interactive-heart-totem"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const msg =
                      heroWhispers[heroWhisperCount % heroWhispers.length];
                    setHeroWhisperCount((c) => c + 1);
                    spawnHeart(
                      rect.left + rect.width / 2,
                      Math.max(60, rect.top - 12),
                      msg,
                    );
                  }}
                >
                  <Heart
                    size={15}
                    fill="currentColor"
                    style={{
                      color: 'var(--color-cherry-bright)',
                      flexShrink: 0,
                    }}
                  />
                  <span>
                    {heroWhisperCount === 0
                      ? 'Touch this heart for a quiet note from Atharva'
                      : heroWhispers[
                          (heroWhisperCount - 1) % heroWhispers.length
                        ]}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="hero-bottom-bar">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                opacity: 0.72,
              }}
            >
              MOONLIGHT × SUNSHINE • PRIVATE EDITION
            </span>

            <button
              type="button"
              onClick={() => navigateToSection('chapter-anticipation')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                minHeight: '44px',
                padding: '0.35rem 0.5rem',
                fontSize: '0.82rem',
                cursor: 'pointer',
                letterSpacing: '0.06em',
              }}
            >
              <span>{content.hero.scrollInvitation}</span>
              <ArrowDown size={15} />
            </button>
          </div>
        </section>

        {/* Kinetic Film-Leader Marquee Interlude Strip */}
        <div className="cinema-marquee-strip" aria-hidden="true">
          <div className="cinema-marquee-track">
            <span>YOU’RE MY MOON • YOU’RE MY SUNSHINE</span>
            <span>✦</span>
            <span>FOR YASHVI POKAR (SHU) • CRAFTED BY ATHARVA PATIL</span>
            <span>✦</span>
            <span>EVERY INTERACTION INTENTIONAL • MADE WITH QUIET CARE</span>
            <span>✦</span>
            <span>YOU’RE MY MOON • YOU’RE MY SUNSHINE</span>
            <span>✦</span>
            <span>FOR YASHVI POKAR (SHU) • CRAFTED BY ATHARVA PATIL</span>
          </div>
        </div>

        {/* Act I (Moonlight): Chapter I — The Quiet Beginning */}
        {firstChapter && (
          <StoryChapterSection
            chapter={firstChapter}
            chapterNumber={1}
            reducedMotion={reducedMotion}
            onSpawnHeart={spawnHeart}
          />
        )}

        <KineticInterlude
          cueCode="INTERLUDE I // MOONLIGHT"
          scriptWord="You’re my moon,"
          statement="Even in the quietest hours, your calm is the softest light in the dark."
          reducedMotion={reducedMotion}
          variant="moonlight"
        />

        {/* Scene 02: The Dawn Horizon — Cinematic Transition from Moonlight to Sunshine */}
        <section
          id="theme-transition-scene"
          ref={transitionSceneRef}
          className="dawn-transition-scene"
          aria-labelledby="dawn-transition-heading"
        >
          <div className="dawn-transition-inner">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                opacity: 0.88,
              }}
            >
              SCENE 02 // THE HORIZON • MOONLIGHT INTO SUNSHINE
            </span>

            <div className="dawn-celestial-stage">
              <div className="dawn-horizon-arc" aria-hidden="true" />
              <div
                className="dawn-orb-pair"
                role="group"
                aria-label="Choose visual world"
              >
                <button
                  type="button"
                  className={`dawn-moon-badge ${
                    activeWorld === 'moonlight' ? 'is-active' : ''
                  }`}
                  onClick={() => setManualWorld('moonlight')}
                  aria-pressed={activeWorld === 'moonlight'}
                >
                  <Moon size={16} />
                  <span>You’re my moon</span>
                </button>

                <button
                  type="button"
                  className={`dawn-sun-badge ${
                    activeWorld === 'sunshine' ? 'is-active' : ''
                  }`}
                  onClick={() => setManualWorld('sunshine')}
                  aria-pressed={activeWorld === 'sunshine'}
                >
                  <Sun size={16} />
                  <span>You’re my sunshine</span>
                </button>
              </div>
            </div>

            <h2
              id="dawn-transition-heading"
              className="editorial-title"
              style={{ maxWidth: '22ch', margin: '0 auto 0.35rem' }}
            >
              As the stars recede, warm light begins to fill the room.
            </h2>

            <p
              style={{
                maxWidth: '52ch',
                margin: '0 auto',
                fontSize: '1.02rem',
                opacity: 0.94,
              }}
            >
              In the quiet of the night, you’re my moon—the gentle comfort that
              makes stillness feel safe. And when morning arrives, you’re my
              sunshine—turning ordinary hours into the brightest part of my day.
            </p>

            <div className="dawn-bridge-card">
              <div
                style={{
                  fontFamily: 'var(--font-handwriting)',
                  fontSize: '1.85rem',
                  color: 'var(--sun-rose)',
                  marginBottom: '0.25rem',
                }}
              >
                Two worlds, one feeling
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.22rem',
                  lineHeight: 1.6,
                  margin: '0 0 0.85rem',
                  color: 'var(--sun-ink-dark)',
                }}
              >
                “Whether the day is quiet and starry or warm and full of
                sunlight, you are the light I always look for, Shu.”
              </p>
              {manualWorld && (
                <button
                  type="button"
                  onClick={() => setManualWorld(null)}
                  style={{
                    minHeight: '44px',
                    padding: '0.42rem 0.95rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(201, 84, 114, 0.35)',
                    background: 'rgba(201, 84, 114, 0.08)',
                    color: 'var(--sun-rose)',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Follow Natural Scroll Transition Again
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Scene 03: Sunshine — Luminous Daylight Editorial Spread */}
        <section
          id="sunshine-section"
          className="sunshine-showcase-section"
          aria-labelledby="sunshine-heading"
        >
          <div className="section-container">
            <div className="scene-top-header" aria-hidden="true">
              <span>SCENE 03 // SUNSHINE • DAYLIGHT EDITION</span>
              <span>WARMTH • JOY • EVERYDAY LIGHT</span>
            </div>

            <div
              style={{
                maxWidth: '720px',
                margin: '0 auto',
                textAlign: 'center',
              }}
            >
              <span
                className="eyebrow-tag"
                style={{ color: 'var(--sun-rose)' }}
              >
                SUNSHINE • DAYLIGHT WORLD
              </span>
              <h2
                id="sunshine-heading"
                className="editorial-title"
                style={{ color: 'var(--sun-ink-dark)' }}
              >
                You’re my sunshine.
              </h2>
              <p
                style={{
                  fontSize: '1.06rem',
                  color: 'var(--sun-ink-body)',
                  margin: '0 auto',
                  maxWidth: '54ch',
                }}
              >
                You make ordinary days brighter just by being in them, Shu. The
                warmth in your voice, the kindness in how you care, and the
                happiness you bring into simple moments make everyday life feel
                luminous.
              </p>
            </div>

            <div className="sunshine-petal-grid">
              <div className="sunshine-note-tile">
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.16em',
                    color: 'var(--sun-gold)',
                    marginBottom: '0.4rem',
                  }}
                >
                  DAYLIGHT NOTE I // WARMTH
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.18rem',
                    lineHeight: 1.5,
                    margin: 0,
                    color: 'var(--sun-ink-dark)',
                  }}
                >
                  How a busy day immediately feels lighter the moment you share
                  a smile.
                </p>
              </div>

              <div className="sunshine-note-tile">
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.16em',
                    color: 'var(--sun-rose)',
                    marginBottom: '0.4rem',
                  }}
                >
                  DAYLIGHT NOTE II // JOY
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.18rem',
                    lineHeight: 1.5,
                    margin: 0,
                    color: 'var(--sun-ink-dark)',
                  }}
                >
                  The effortless happiness you bring into the smallest, most
                  ordinary plans.
                </p>
              </div>

              <div className="sunshine-note-tile">
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.16em',
                    color: 'var(--sun-gold)',
                    marginBottom: '0.4rem',
                  }}
                >
                  DAYLIGHT NOTE III // KINDNESS
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.18rem',
                    lineHeight: 1.5,
                    margin: 0,
                    color: 'var(--sun-ink-dark)',
                  }}
                >
                  A gentle, genuine warmth that makes everyone around you feel
                  appreciated.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Remaining Narrative Chapters (Chapter II & Chapter III) */}
        {remainingChapters.map((chapter, idx) => (
          <StoryChapterSection
            key={chapter.id}
            chapter={chapter}
            chapterNumber={idx + 2}
            reducedMotion={reducedMotion}
            onSpawnHeart={spawnHeart}
          />
        ))}

        <KineticInterlude
          cueCode="INTERLUDE II // SUNSHINE ARCHIVE"
          scriptWord="You’re my sunshine,"
          statement="Six frames held in warm light, ready for the moments we want to keep."
          reducedMotion={reducedMotion}
          variant="sunshine"
        />

        {/* Chapter IV: Our Memories Exhibition Gallery & Darkroom Lightbox */}
        <MemoryGallery
          intro={content.memoriesIntro}
          memories={content.memories}
          reducedMotion={reducedMotion}
          onSpawnHeart={spawnHeart}
        />

        {/* Chapter V: Our Song Cinema Soundtrack Cue Deck */}
        <SongPlayer
          section={content.songSection}
          reducedMotion={reducedMotion}
          onSpawnHeart={spawnHeart}
        />

        {/* Chapter VI: Interactive 5-Star Astrolabe Constellation */}
        <ConstellationSection
          section={content.constellationSection}
          reducedMotion={reducedMotion}
          onSpawnHeart={spawnHeart}
        />

        <KineticInterlude
          cueCode="INTERLUDE III // UNSEALED"
          scriptWord="Written by hand,"
          statement="Some words belong on warm paper, meant only for your eyes."
          reducedMotion={reducedMotion}
          variant="sunshine"
        />

        {/* Chapter VII: The Personal Sealed Letter */}
        <PersonalLetter
          section={content.letterSection}
          reducedMotion={reducedMotion}
          onSpawnHeart={spawnHeart}
        />

        {/* Finale: Quiet Intimate Epilogue Bringing Moonlight & Sunshine Together */}
        <EndingSection
          ending={content.ending}
          reducedMotion={reducedMotion}
          onSpawnHeart={spawnHeart}
          onNavigateSection={navigateToSection}
        />
      </main>
    </>
  );
};

export default App;
