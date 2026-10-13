import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { StoryChapter } from '../types/content';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { HandDrawnOrnament } from './motion/MotionPrimitives';

interface StoryChapterSectionProps {
  chapter: StoryChapter;
  chapterNumber?: number;
  reducedMotion: boolean;
  onSpawnHeart: (x: number, y: number, label?: string) => void;
}

function splitBracketBadge(text: string): {
  badge: string | null;
  body: string;
} {
  if (text.startsWith('[')) {
    const closeIdx = text.indexOf(']');
    if (closeIdx > 1 && closeIdx < 80) {
      return {
        badge: text.slice(1, closeIdx).trim(),
        body: text.slice(closeIdx + 1).trim(),
      };
    }
  }
  return { badge: null, body: text };
}

export const StoryChapterSection: React.FC<StoryChapterSectionProps> = ({
  chapter,
  chapterNumber = 1,
  reducedMotion,
  onSpawnHeart,
}) => {
  const { ref, isVisible } = useRevealOnScroll<HTMLElement>(reducedMotion);
  const [secretOpen, setSecretOpen] = useState(false);

  const handleToggleSecret = (e: React.MouseEvent<HTMLButtonElement>) => {
    const nextState = !secretOpen;
    setSecretOpen(nextState);
    if (nextState) {
      const rect = e.currentTarget.getBoundingClientRect();
      onSpawnHeart(
        rect.left + rect.width / 2,
        Math.max(60, rect.top - 10),
        'Little note found ♥',
      );
    }
  };

  const formattedIndex = String(chapterNumber).padStart(2, '0');
  const railLabels = [
    '01 / ANTICIPATION',
    '02 / AFFECTION',
    '03 / APPRECIATION',
  ];
  const railLabel =
    railLabels[(chapterNumber - 1) % railLabels.length] ||
    `${formattedIndex} / STORYTELLING`;

  return (
    <section
      id={chapter.id}
      ref={ref}
      className={`story-section theme-${chapter.theme} chapter-scene-${chapterNumber}`}
      aria-labelledby={`${chapter.id}-heading`}
    >
      <div
        className={`section-container reveal-block ${
          isVisible ? 'is-visible' : ''
        }`}
      >
        {/* Vertical Rotated Margin Index (Inspired by Vintage Editorial Reference) */}
        <div className="vertical-scene-rail" aria-hidden="true">
          {railLabel}
        </div>

        {/* Architectural Scene Header Strip */}
        <div className="scene-top-header" aria-hidden="true">
          <span>
            SCENE {formattedIndex} // {chapter.eyebrow}
          </span>
          <span>ATHARVA → SHU</span>
        </div>

        <div className="chapter-card">
          <div className="chapter-editorial-grid">
            {/* Left Column: Monumental Index, Eyebrow, Display Title & Pullquote Plate */}
            <div
              className="reveal-stagger-child"
              style={{ ['--stagger-idx' as string]: 0 }}
            >
              <div className="chapter-index-watermark" aria-hidden="true">
                {formattedIndex}
              </div>
              <span className="eyebrow-tag">{chapter.eyebrow}</span>
              <h2
                id={`${chapter.id}-heading`}
                className="editorial-title"
                style={{ fontSize: 'clamp(1.95rem, 3.8vw, 3rem)' }}
              >
                {chapter.title}
              </h2>

              <HandDrawnOrnament
                motif="sakura-bough"
                stroke={
                  chapter.theme === 'parchment'
                    ? 'var(--sun-rose)'
                    : 'var(--moon-lavender)'
                }
                isDrawn={isVisible}
                triggerOnScroll={false}
                reducedMotion={reducedMotion}
                className="chapter-sakura-bough"
              />

              {/* Hand-sketched Crimson Editorial Quote Frame */}
              {chapter.pullQuote && (
                <div className="sketch-quote-frame">
                  <blockquote className="chapter-pullquote">
                    {chapter.pullQuote}
                  </blockquote>
                </div>
              )}
            </div>

            {/* Right Column: Narrative Copy & Tucked Margin Note Drawer */}
            <div
              className="reveal-stagger-child"
              style={{ ['--stagger-idx' as string]: 1 }}
            >
              {chapter.paragraphs.map((para, idx) => {
                const { badge, body } = splitBracketBadge(para);
                return (
                  <div key={idx} style={{ marginBottom: '1.35rem' }}>
                    {badge && idx === 0 && (
                      <div
                        style={{
                          display: 'inline-block',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.66rem',
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '3px',
                          border: '1px dashed currentColor',
                          opacity: 0.64,
                          marginBottom: '0.7rem',
                        }}
                      >
                        {badge}
                      </div>
                    )}
                    <p
                      className={`chapter-paragraph ${
                        idx === 0 ? 'lead-dropcap' : ''
                      }`}
                      style={{ marginBottom: 0 }}
                    >
                      {body}
                    </p>
                  </div>
                );
              })}

              {chapter.secretPrompt && (
                <div
                  style={{
                    marginTop: '1.5rem',
                    paddingTop: '1.15rem',
                    borderTop: '1px solid currentColor',
                    borderTopColor:
                      chapter.theme === 'parchment'
                        ? 'rgba(25, 13, 17, 0.12)'
                        : 'rgba(214, 195, 165, 0.15)',
                  }}
                >
                  {chapter.marginNote && (
                    <div
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: '0.92rem',
                        opacity: 0.78,
                        marginBottom: '0.45rem',
                      }}
                    >
                      {chapter.marginNote}
                    </div>
                  )}

                  <button
                    type="button"
                    className="secret-note-trigger"
                    onClick={handleToggleSecret}
                    aria-expanded={secretOpen}
                  >
                    <Sparkles size={14} />
                    <span>
                      {secretOpen
                        ? 'Tuck note back into the margin'
                        : chapter.secretPrompt.triggerLabel}
                    </span>
                  </button>

                  {secretOpen && (
                    <div className="secret-note-drawer" role="note">
                      {chapter.secretPrompt.revealedNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
