import React, { useState } from 'react';
import { ArrowUp, Camera, Heart, Mail, Moon, Sparkles, Sun } from 'lucide-react';
import type { FinalChapterContent } from '../types/content';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { MediaRevealFrame } from './motion/MotionPrimitives';

interface EndingSectionProps {
  ending: FinalChapterContent;
  reducedMotion: boolean;
  onSpawnHeart: (x: number, y: number, label?: string) => void;
  onNavigateSection: (sectionId: string) => void;
}

export const EndingSection: React.FC<EndingSectionProps> = ({
  ending,
  reducedMotion,
  onSpawnHeart,
  onNavigateSection,
}) => {
  const { ref, isVisible } = useRevealOnScroll<HTMLElement>(reducedMotion);
  const [warmthCount, setWarmthCount] = useState(0);

  const handleSendWarmth = (e: React.MouseEvent<HTMLButtonElement>) => {
    const next = warmthCount + 1;
    setWarmthCount(next);
    const rect = e.currentTarget.getBoundingClientRect();
    onSpawnHeart(
      rect.left + rect.width / 2,
      Math.max(60, rect.top - 12),
      next === 1 ? 'Always here for you, Shu ♥' : `Warmth #${next} sent ♥`,
    );
  };

  const romanNumerals = ['I', 'II', 'III'];

  return (
    <footer
      id="ending-section"
      ref={ref}
      className="story-section theme-midnight"
      style={{
        minHeight: '88vh',
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid rgba(214, 200, 247, 0.18)',
      }}
      aria-labelledby="ending-heading"
    >
      <div
        className={`section-container reveal-block ${
          isVisible ? 'is-visible' : ''
        }`}
      >
        <div className="vertical-scene-rail" aria-hidden="true">
          09 / EPILOGUE
        </div>

        <div className="scene-top-header" aria-hidden="true">
          <span>SCENE 09 // {ending.eyebrow}</span>
          <span>MOONLIGHT × SUNSHINE • ALWAYS YOUR WORLD</span>
        </div>

        <div
          style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto' }}
        >
          {/* Dual-Theme Epilogue Union Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.42rem 1rem',
              borderRadius: '999px',
              background:
                'linear-gradient(135deg, rgba(159, 122, 234, 0.18) 0%, rgba(243, 166, 131, 0.2) 100%)',
              border: '1px solid rgba(214, 200, 247, 0.35)',
              color: 'var(--moon-pearl)',
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '0.98rem',
              marginBottom: '0.95rem',
            }}
          >
            <Moon size={14} style={{ color: '#dfd2f7' }} />
            <span>You’re my moon, and you’re my sunshine.</span>
            <Sun size={14} style={{ color: '#f3a683' }} />
          </div>

          <div>
            <span className="eyebrow-tag">{ending.eyebrow}</span>
          </div>

          <h2
            id="ending-heading"
            className="editorial-title"
            style={{ maxWidth: '24ch', margin: '0 auto 1.15rem' }}
          >
            {ending.headline}
          </h2>

          <div className="ornamental-divider" aria-hidden="true">
            <span style={{ fontSize: '0.7rem' }}>✦</span>
          </div>

          {ending.paragraphs.map((para, idx) => (
            <p
              key={idx}
              className="chapter-paragraph"
              style={{
                color: 'rgba(248, 245, 252, 0.86)',
                maxWidth: '62ch',
                margin: '0 auto 1.25rem',
              }}
            >
              {para}
            </p>
          ))}

          {/* Optional Replaceable Finale Keepsake Frame (final-photo) */}
          {ending.finalPhoto && (
            <div
              data-slot-id={ending.finalPhoto.id}
              style={{
                maxWidth: '540px',
                margin: '2rem auto',
                padding: '0.9rem',
                borderRadius: '12px',
                background: 'rgba(24, 16, 44, 0.82)',
                border: '1px solid rgba(214, 200, 247, 0.28)',
                textAlign: 'left',
              }}
            >
              <MediaRevealFrame
                slotId={ending.finalPhoto.id}
                src={`/api/media/photos/${encodeURIComponent(
                  ending.finalPhoto.fileStem,
                )}`}
                alt={ending.finalPhoto.title}
                aspect={ending.finalPhoto.aspect}
                fallbackTitle={ending.finalPhoto.title}
                fallbackSubtitle={ending.finalPhoto.caption}
              />
              <div style={{ marginTop: '0.65rem' }}>
                <strong
                  style={{
                    display: 'block',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.1rem',
                    color: 'var(--moon-pearl)',
                  }}
                >
                  {ending.finalPhoto.title}
                </strong>
                <span
                  style={{
                    fontSize: '0.84rem',
                    color: 'rgba(248, 245, 252, 0.78)',
                  }}
                >
                  {ending.finalPhoto.caption}
                </span>
              </div>
            </div>
          )}

          {/* Numbered Archival Vow Ledger */}
          <div
            style={{
              margin: '2.5rem auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              textAlign: 'left',
            }}
          >
            {ending.keptPromises.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '1.25rem 1.35rem',
                  borderRadius: '10px',
                  background: 'rgba(248, 245, 252, 0.04)',
                  border: '1px solid rgba(214, 200, 247, 0.22)',
                  borderTop: '2px solid #e37b95',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    letterSpacing: '0.18em',
                    color: 'var(--moon-lavender)',
                  }}
                >
                  <span>PROMISE {romanNumerals[idx] || idx + 1}</span>
                  <Sparkles size={13} />
                </div>
                <span
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1.08rem',
                    lineHeight: 1.45,
                    color: 'var(--moon-pearl)',
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Interactive Heart Totem */}
          <div style={{ margin: '2rem 0' }}>
            <button
              type="button"
              className="interactive-heart-totem"
              onClick={handleSendWarmth}
            >
              <Heart
                size={16}
                fill="currentColor"
                style={{ color: 'var(--color-cherry-bright)', flexShrink: 0 }}
              />
              <span>
                {warmthCount === 0
                  ? 'Tap to send a little heart into the night sky'
                  : `Sent ${warmthCount} little ${
                      warmthCount === 1 ? 'heart' : 'hearts'
                    } into the night sky`}
              </span>
            </button>
          </div>

          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: '1.35rem',
              color: '#f3a6bd',
              margin: '1.4rem 0 0.25rem',
            }}
          >
            {ending.whisperLine}
          </p>

          <div
            style={{
              fontFamily: 'var(--font-handwriting)',
              fontSize: '2.2rem',
              color: 'var(--moon-lavender)',
              marginBottom: '2.25rem',
            }}
          >
            {ending.signatureLine}
          </div>

          {/* Gentle Revisit Navigation */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.65rem',
              paddingTop: '1.65rem',
              borderTop: '1px solid rgba(214, 200, 247, 0.16)',
            }}
          >
            <button
              type="button"
              className="icon-chip-btn"
              onClick={() => onNavigateSection('memories-section')}
            >
              <Camera size={14} />
              <span>Revisit Our Photographs</span>
            </button>

            <button
              type="button"
              className="icon-chip-btn"
              onClick={() => onNavigateSection('letter-section')}
            >
              <Mail size={14} />
              <span>Reread Your Letter</span>
            </button>

            <button
              type="button"
              className="icon-chip-btn"
              onClick={() => onNavigateSection('hero-section')}
            >
              <ArrowUp size={14} />
              <span>Replay from the Beginning</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
