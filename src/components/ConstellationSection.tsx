import React, { useState } from 'react';
import { Sparkles, Star } from 'lucide-react';
import type { ConstellationStar } from '../types/content';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';

interface ConstellationSectionProps {
  section: {
    eyebrow: string;
    title: string;
    subtitle: string;
    completionSecretTitle: string;
    completionSecretBody: string;
    stars: ConstellationStar[];
  };
  reducedMotion: boolean;
  onSpawnHeart: (x: number, y: number, label?: string) => void;
}

export const ConstellationSection: React.FC<ConstellationSectionProps> = ({
  section,
  reducedMotion,
  onSpawnHeart,
}) => {
  const { ref, isVisible } = useRevealOnScroll<HTMLElement>(reducedMotion);
  const [litIds, setLitIds] = useState<Record<string, boolean>>({});
  const [selectedStar, setSelectedStar] = useState<ConstellationStar | null>(
    section.stars[0] ?? null,
  );

  const litCount = section.stars.filter((s) => litIds[s.id]).length;
  const allLit = litCount === section.stars.length && section.stars.length > 0;

  const handleSelectStar = (
    star: ConstellationStar,
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    const wasLit = Boolean(litIds[star.id]);
    const nextLit = { ...litIds, [star.id]: true };
    setLitIds(nextLit);
    setSelectedStar(star);

    if (e && !wasLit) {
      const rect = e.currentTarget.getBoundingClientRect();
      const newCount = section.stars.filter((s) => nextLit[s.id]).length;
      onSpawnHeart(
        rect.left + rect.width / 2,
        Math.max(60, rect.top - 10),
        newCount === section.stars.length
          ? 'Constellation complete! ★'
          : `${star.label} lit ★`,
      );
    }
  };

  const handleLightAllRemaining = (e: React.MouseEvent<HTMLButtonElement>) => {
    const allMap: Record<string, boolean> = {};
    for (const s of section.stars) {
      allMap[s.id] = true;
    }
    setLitIds(allMap);
    if (section.stars.length > 0) {
      setSelectedStar(section.stars[section.stars.length - 1]);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    onSpawnHeart(
      rect.left + rect.width / 2,
      Math.max(60, rect.top - 14),
      'All five stars shining for Shu ★',
    );
  };

  return (
    <section
      id="constellation-section"
      ref={ref}
      className="story-section theme-midnight"
      aria-labelledby="constellation-heading"
    >
      <div
        className={`section-container reveal-block ${
          isVisible ? 'is-visible' : ''
        }`}
      >
        <div className="vertical-scene-rail" aria-hidden="true">
          06 / CELESTIAL OBSERVATORY
        </div>

        <div className="scene-top-header" aria-hidden="true">
          <span>SCENE 06 // {section.eyebrow}</span>
          <span>ASTROLABE CHART • 5 STAR NODES</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            alignItems: 'end',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <span className="eyebrow-tag">{section.eyebrow}</span>
            <h2
              id="constellation-heading"
              className="editorial-title"
              style={{ marginBottom: 0 }}
            >
              {section.title}
            </h2>
          </div>

          <div>
            <p
              style={{
                color: 'rgba(246, 241, 234, 0.8)',
                margin: '0 0 0.85rem',
              }}
            >
              {section.subtitle}
            </p>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0.34rem 0.85rem',
                  borderRadius: '3px',
                  background: 'rgba(214, 195, 165, 0.08)',
                  border: '1px solid rgba(214, 195, 165, 0.35)',
                  color: 'var(--color-gold-warm)',
                }}
              >
                {litCount} of {section.stars.length} Stars Lit
              </span>

              {!allLit && (
                <button
                  type="button"
                  onClick={handleLightAllRemaining}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    padding: '0.34rem 0.85rem',
                    borderRadius: '3px',
                    background: 'rgba(158, 27, 50, 0.28)',
                    border: '1px solid rgba(214, 195, 165, 0.42)',
                    color: 'var(--color-cream)',
                    cursor: 'pointer',
                  }}
                >
                  Light All 5 Stars Together
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Astrolabe Night Sky Map */}
        <div
          className="constellation-sky"
          role="group"
          aria-label="Interactive five-star constellation for Shu"
        >
          {/* Celestial coordinate watermarks */}
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              color: 'rgba(214, 195, 165, 0.42)',
              pointerEvents: 'none',
            }}
          >
            RA 14H 29M • DEC +26° 10&apos;
          </span>
          <span
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              letterSpacing: '0.18em',
              color: 'rgba(214, 195, 165, 0.42)',
              pointerEvents: 'none',
            }}
          >
            CHART NO. 06 // SHU MAJORIS
          </span>

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            <line
              x1="8"
              y1="50"
              x2="92"
              y2="50"
              stroke="rgba(214, 195, 165, 0.08)"
              strokeWidth="0.2"
            />
            <line
              x1="50"
              y1="8"
              x2="50"
              y2="92"
              stroke="rgba(214, 195, 165, 0.08)"
              strokeWidth="0.2"
            />

            {section.stars.map((star, idx) => {
              if (idx === 0) return null;
              const prev = section.stars[idx - 1];
              const isConnected = litIds[prev.id] && litIds[star.id];
              return (
                <line
                  key={`${prev.id}-${star.id}`}
                  x1={prev.xPercent}
                  y1={prev.yPercent}
                  x2={star.xPercent}
                  y2={star.yPercent}
                  stroke={
                    isConnected ? '#d6c3a5' : 'rgba(214, 195, 165, 0.2)'
                  }
                  strokeWidth={isConnected ? '0.48' : '0.26'}
                  strokeDasharray={isConnected ? 'none' : '1.4 1.4'}
                  style={{
                    transition: 'stroke 0.45s ease, stroke-width 0.45s ease',
                  }}
                />
              );
            })}
          </svg>

          {section.stars.map((star) => {
            const isLit = Boolean(litIds[star.id]);
            const isCurrent = selectedStar?.id === star.id;
            return (
              <button
                key={star.id}
                type="button"
                className={`constellation-star-btn ${isLit ? 'lit' : ''}`}
                style={{
                  left: `${star.xPercent}%`,
                  top: `${star.yPercent}%`,
                }}
                onClick={(e) => handleSelectStar(star, e)}
                aria-pressed={isLit}
                aria-label={`${star.label}: ${star.qualityTitle}`}
              >
                <span className="star-orb">
                  <Star
                    size={15}
                    fill={isLit ? 'currentColor' : 'none'}
                    style={{
                      color: isLit ? '#fff' : 'var(--color-gold-warm)',
                    }}
                  />
                </span>
                <span
                  className="star-caption-tag"
                  style={{
                    borderColor: isCurrent
                      ? 'var(--color-gold-warm)'
                      : undefined,
                  }}
                >
                  {star.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Observatory Field Log & Unlocked Keepsake Deck */}
        <div
          style={{
            marginTop: '1.25rem',
            display: 'grid',
            gridTemplateColumns: allLit
              ? 'repeat(auto-fit, minmax(280px, 1fr))'
              : '1fr',
            gap: '1.15rem',
          }}
        >
          {selectedStar && (
            <div
              style={{
                padding: '1.45rem 1.7rem',
                borderRadius: '4px',
                background: 'rgba(22, 11, 16, 0.84)',
                border: '1px solid rgba(214, 195, 165, 0.26)',
                borderLeft: '3px solid var(--color-gold-warm)',
                textAlign: 'left',
              }}
              aria-live="polite"
            >
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-gold-warm)',
                  marginBottom: '0.35rem',
                }}
              >
                OBSERVATION LOG // {selectedStar.label}
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.65rem',
                  margin: '0 0 0.45rem',
                }}
              >
                {selectedStar.qualityTitle}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.96rem',
                  color: 'rgba(246, 241, 234, 0.88)',
                }}
              >
                {selectedStar.affectionateNote}
              </p>
            </div>
          )}

          {allLit && (
            <div
              role="region"
              aria-label="Unlocked Constellation Keepsake"
              style={{
                padding: '1.45rem 1.7rem',
                borderRadius: '4px',
                background:
                  'linear-gradient(135deg, rgba(158, 27, 50, 0.34), rgba(18, 8, 12, 0.94))',
                border: '1px solid rgba(214, 195, 165, 0.55)',
                borderLeft: '3px solid var(--color-cherry-bright)',
                boxShadow: '0 18px 44px rgba(158, 27, 50, 0.24)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-gold-warm)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  marginBottom: '0.45rem',
                }}
              >
                <Sparkles size={14} />
                <span>{section.completionSecretTitle}</span>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: '1.28rem',
                  lineHeight: 1.5,
                  margin: 0,
                  color: 'var(--color-cream)',
                }}
              >
                “{section.completionSecretBody}”
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
