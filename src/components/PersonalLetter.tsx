import React, { useEffect, useState } from 'react';
import { BookOpen, FastForward, Mail, RotateCcw } from 'lucide-react';
import type { PersonalLetterContent } from '../types/content';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';

interface PersonalLetterProps {
  section: {
    eyebrow: string;
    title: string;
    subtitle: string;
    letter: PersonalLetterContent;
  };
  reducedMotion: boolean;
  onSpawnHeart: (x: number, y: number, label?: string) => void;
}

export const PersonalLetter: React.FC<PersonalLetterProps> = ({
  section,
  reducedMotion,
  onSpawnHeart,
}) => {
  const { ref, isVisible } = useRevealOnScroll<HTMLElement>(reducedMotion);
  const { letter } = section;

  const [isOpened, setIsOpened] = useState(false);
  const [visibleParagraphs, setVisibleParagraphs] = useState(
    reducedMotion ? letter.paragraphs.length : 1,
  );

  useEffect(() => {
    if (!isOpened) return;
    if (reducedMotion) {
      setVisibleParagraphs(letter.paragraphs.length);
      return;
    }
    if (visibleParagraphs >= letter.paragraphs.length) return;

    const timer = window.setTimeout(() => {
      setVisibleParagraphs((prev) =>
        Math.min(letter.paragraphs.length, prev + 1),
      );
    }, 420);

    return () => window.clearTimeout(timer);
  }, [isOpened, visibleParagraphs, letter.paragraphs.length, reducedMotion]);

  const handleOpenEnvelope = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSpawnHeart(
      rect.left + rect.width / 2,
      Math.max(60, rect.top - 36),
      'Opening Atharva’s letter ♥',
    );
    setVisibleParagraphs(reducedMotion ? letter.paragraphs.length : 1);
    setIsOpened(true);
  };

  const handleSkipReveal = () => {
    setVisibleParagraphs(letter.paragraphs.length);
  };

  const handleReseal = () => {
    setIsOpened(false);
    setVisibleParagraphs(reducedMotion ? letter.paragraphs.length : 1);
  };

  return (
    <section
      id="letter-section"
      ref={ref}
      className="story-section theme-burgundy"
      aria-labelledby="letter-heading"
    >
      <div
        className={`section-container reveal-block ${
          isVisible ? 'is-visible' : ''
        }`}
      >
        <div className="vertical-scene-rail" aria-hidden="true">
          07 / CORRESPONDENCE
        </div>

        <div className="scene-top-header" aria-hidden="true">
          <span>SCENE 07 // {section.eyebrow}</span>
          <span>COTTON FOLIO • SEALED BY ATHARVA</span>
        </div>

        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 1.75rem' }}>
          <span className="eyebrow-tag">{section.eyebrow}</span>
          <h2 id="letter-heading" className="editorial-title">
            {section.title}
          </h2>
          <p style={{ color: 'rgba(246, 241, 234, 0.8)' }}>
            {section.subtitle}
          </p>
        </div>

        <div className="envelope-stage">
          {!isOpened ? (
            <div className="sealed-envelope-card">
              <svg
                viewBox="0 0 600 120"
                preserveAspectRatio="none"
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  width: '100%',
                  height: '115px',
                  pointerEvents: 'none',
                  opacity: 0.45,
                }}
              >
                <path
                  d="M 0,0 L 300,105 L 600,0"
                  fill="none"
                  stroke="rgba(158, 27, 50, 0.35)"
                  strokeWidth="1.5"
                />
              </svg>

              <div
                className="wax-seal-crest"
                aria-hidden="true"
                style={{ cursor: 'default' }}
              >
                <span>{letter.waxSealInitials}</span>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--color-cherry)',
                  fontWeight: 600,
                  marginBottom: '0.35rem',
                }}
              >
                {letter.envelopeSubtitle}
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 'clamp(1.85rem, 3.5vw, 2.35rem)',
                  margin: '0 0 1.25rem',
                  color: 'var(--color-ink-dark)',
                }}
              >
                {letter.envelopeTitle}
              </h3>

              <button
                type="button"
                className="primary-seal-btn"
                onClick={handleOpenEnvelope}
              >
                <Mail size={18} />
                <span>Break the Wax Seal &amp; Read Letter</span>
              </button>
            </div>
          ) : (
            <article
              className="opened-letter-sheet"
              aria-label="Personal letter from Atharva to Shu"
            >
              {letter.isPlaceholderDraft && (
                <div
                  role="note"
                  style={{
                    marginBottom: '1.35rem',
                    padding: '0.58rem 0.95rem',
                    borderRadius: '4px',
                    background: 'rgba(158, 27, 50, 0.06)',
                    border: '1px dashed rgba(158, 27, 50, 0.34)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-cherry)',
                    fontSize: '0.7rem',
                    letterSpacing: '0.03em',
                    lineHeight: 1.45,
                  }}
                >
                  {letter.placeholderNotice}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.65rem',
                  marginBottom: '1.5rem',
                  paddingBottom: '0.95rem',
                  borderBottom: '1px solid rgba(25, 13, 17, 0.14)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    color: 'var(--color-ink-muted)',
                    fontSize: '1.05rem',
                  }}
                >
                  {letter.dateLine}
                </span>

                <div
                  style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}
                >
                  {visibleParagraphs < letter.paragraphs.length && (
                    <button
                      type="button"
                      onClick={handleSkipReveal}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.36rem 0.78rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(158, 27, 50, 0.38)',
                        background: 'rgba(158, 27, 50, 0.08)',
                        color: 'var(--color-cherry)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <FastForward size={13} />
                      <span>Reveal Full Letter Immediately</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setVisibleParagraphs(
                        reducedMotion ? letter.paragraphs.length : 1,
                      )
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.36rem 0.78rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(25, 13, 17, 0.22)',
                      background: 'transparent',
                      color: 'var(--color-ink-dark)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <BookOpen size={13} />
                    <span>Read Line-by-Line Again</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleReseal}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.36rem 0.78rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(25, 13, 17, 0.22)',
                      background: 'transparent',
                      color: 'var(--color-ink-dark)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <RotateCcw size={13} />
                    <span>Fold &amp; Reseal Envelope</span>
                  </button>
                </div>
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.9rem',
                  fontWeight: 600,
                  margin: '0 0 1.2rem',
                  color: 'var(--color-ink-dark)',
                }}
              >
                {letter.salutation}
              </h3>

              {letter.paragraphs
                .slice(0, visibleParagraphs)
                .map((para, index) => (
                  <p key={index} className="letter-paragraph">
                    {para}
                  </p>
                ))}

              {visibleParagraphs >= letter.paragraphs.length && (
                <div
                  style={{
                    marginTop: '1.85rem',
                    paddingTop: '1.2rem',
                    borderTop: '1px solid rgba(25, 13, 17, 0.14)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: '1.24rem',
                      margin: 0,
                      color: 'var(--color-ink-muted)',
                    }}
                  >
                    {letter.closing}
                  </p>
                  <div className="letter-signature">{letter.signature}</div>

                  {letter.postscript && (
                    <p
                      style={{
                        marginTop: '1.1rem',
                        fontSize: '0.92rem',
                        fontStyle: 'italic',
                        color: 'var(--color-ink-muted)',
                      }}
                    >
                      {letter.postscript}
                    </p>
                  )}
                </div>
              )}
            </article>
          )}
        </div>
      </div>
    </section>
  );
};
