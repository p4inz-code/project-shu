import React, { useEffect, useRef, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Film,
  Heart,
  MapPin,
  Maximize2,
  RotateCw,
  X,
} from 'lucide-react';
import type { MemoryItem, ReplaceableFilmSlot } from '../types/content';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import { MediaRevealFrame } from './motion/MotionPrimitives';

interface MemoryGalleryProps {
  intro: {
    eyebrow: string;
    title: string;
    subtitle: string;
    placeholderNotice: string;
    featuredFilm?: ReplaceableFilmSlot;
  };
  memories: MemoryItem[];
  reducedMotion: boolean;
  onSpawnHeart: (x: number, y: number, label?: string) => void;
}

type PhotoViewportPhase = 'entering' | 'in-view' | 'exiting-top';

export const MemoryGallery: React.FC<MemoryGalleryProps> = ({
  intro,
  memories,
  reducedMotion,
  onSpawnHeart,
}) => {
  const { ref, isVisible } = useRevealOnScroll<HTMLElement>(reducedMotion);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [showBackNote, setShowBackNote] = useState(false);
  const [favoritedIds, setFavoritedIds] = useState<Record<string, boolean>>({});
  const [photoPhases, setPhotoPhases] = useState<
    Record<string, PhotoViewportPhase>
  >({});

  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const triggerBtnRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const lastOpenedIndexRef = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const activeMemory =
    activeIndex !== null && memories[activeIndex]
      ? memories[activeIndex]
      : null;

  const openLightbox = (idx: number) => {
    lastOpenedIndexRef.current = idx;
    setActiveIndex(idx);
    setShowBackNote(false);
  };

  const closeLightbox = () => {
    const returnIdx = lastOpenedIndexRef.current;
    setActiveIndex(null);
    setShowBackNote(false);
    if (returnIdx !== null) {
      window.setTimeout(() => {
        triggerBtnRefs.current[returnIdx]?.focus();
      }, 0);
    }
  };

  // Track individual photo entry and gentle top-exit states (reversible on backward scroll)
  useEffect(() => {
    if (reducedMotion || typeof IntersectionObserver === 'undefined') {
      const allInView: Record<string, PhotoViewportPhase> = {};
      for (const m of memories) {
        allInView[m.id] = 'in-view';
      }
      setPhotoPhases(allInView);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setPhotoPhases((prev) => {
          const next = { ...prev };
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.memoryId;
            if (!id) continue;
            if (entry.isIntersecting) {
              next[id] = 'in-view';
            } else if (entry.boundingClientRect.top < 0) {
              next[id] = 'exiting-top';
            } else {
              next[id] = 'entering';
            }
          }
          return next;
        });
      },
      {
        threshold: [0, 0.14, 0.35],
        rootMargin: '0px 0px -6% 0px',
      },
    );

    for (const m of memories) {
      const node = cardRefs.current[m.id];
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [memories, reducedMotion]);

  // Focus management + Escape/Arrow/Tab trap inside Lightbox dialog
  useEffect(() => {
    if (activeIndex === null) return;
    closeBtnRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === 'ArrowRight') {
        setActiveIndex((prev) =>
          prev === null ? 0 : (prev + 1) % memories.length,
        );
        setShowBackNote(false);
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex((prev) =>
          prev === null
            ? 0
            : (prev - 1 + memories.length) % memories.length,
        );
        setShowBackNote(false);
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, memories.length]);

  const toggleFavorite = (
    e: React.MouseEvent<HTMLButtonElement>,
    memory: MemoryItem,
  ) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const nextVal = !favoritedIds[memory.id];
    setFavoritedIds((prev) => ({ ...prev, [memory.id]: nextVal }));
    if (nextVal) {
      onSpawnHeart(
        rect.left + rect.width / 2,
        Math.max(60, rect.top - 10),
        'Saved to Shu’s favorites ♥',
      );
    }
  };

  const getGridSpanClass = (idx: number) => {
    const mod = idx % 4;
    if (mod === 0) return 'span-5';
    if (mod === 1) return 'span-7';
    if (mod === 2) return 'span-7';
    return 'span-5';
  };

  const getExitVariantClass = (idx: number) => {
    const mod = idx % 3;
    if (mod === 0) return 'exit-variant-anchor';
    if (mod === 1) return 'exit-variant-fade';
    return 'exit-variant-drift';
  };

  const getPlateFormatLabel = (aspect: MemoryItem['aspect'], idx: number) => {
    const worldTag = idx % 2 === 0 ? 'MOONLIGHT PLATE' : 'SUNSHINE PLATE';
    if (aspect === 'portrait') return `${worldTag} • 35MM`;
    if (aspect === 'square') return `${worldTag} • 6×6`;
    return `${worldTag} • WIDESCREEN`;
  };

  return (
    <section
      id="memories-section"
      ref={ref}
      className="story-section theme-parchment"
      aria-labelledby="memories-heading"
    >
      <div
        className={`section-container reveal-block ${
          isVisible ? 'is-visible' : ''
        }`}
      >
        <div className="vertical-scene-rail" aria-hidden="true">
          05 / KEEPSAKE ARCHIVE
        </div>

        <div className="scene-top-header" aria-hidden="true">
          <span>SCENE 05 // {intro.eyebrow}</span>
          <span>MOONLIGHT × SUNSHINE PLATES • 01–06</span>
        </div>

        {/* Asymmetric Editorial Exhibition Header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            alignItems: 'end',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <span className="eyebrow-tag">{intro.eyebrow}</span>
            <h2
              id="memories-heading"
              className="editorial-title"
              style={{ marginBottom: '0.35rem' }}
            >
              {intro.title}
            </h2>
          </div>

          <div>
            <p
              style={{
                fontSize: '1.02rem',
                color: 'var(--sun-ink-body)',
                margin: '0 0 0.85rem',
              }}
            >
              {intro.subtitle}
            </p>

            {intro.placeholderNotice && (
              <div
                role="note"
                style={{
                  display: 'inline-block',
                  fontFamily: 'var(--font-mono)',
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  background: 'rgba(201, 84, 114, 0.07)',
                  border: '1px dashed rgba(201, 84, 114, 0.35)',
                  color: 'var(--sun-rose)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.04em',
                  lineHeight: 1.45,
                }}
              >
                {intro.placeholderNotice}
              </div>
            )}
          </div>
        </div>

        {/* Optional Featured Motion Keepsake Slot (film-01) */}
        {intro.featuredFilm && (
          <div
            data-slot-id={intro.featuredFilm.id}
            style={{
              marginBottom: '2.25rem',
              padding: '1.1rem',
              borderRadius: '12px',
              background: '#fffcf9',
              border: '1px solid rgba(201, 84, 114, 0.2)',
              boxShadow: '0 16px 38px rgba(37, 19, 31, 0.08)',
            }}
          >
            <div
              className="memory-plate-header"
              style={{ marginBottom: '0.55rem' }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Film size={13} />
                <span>MOTION REEL // {intro.featuredFilm.id.toUpperCase()}</span>
              </span>
              <span>{intro.featuredFilm.dateLabel}</span>
            </div>

            <MediaRevealFrame
              slotId={intro.featuredFilm.id}
              src={
                intro.featuredFilm.mediaType === 'video'
                  ? `/api/media/video/${encodeURIComponent(
                      intro.featuredFilm.fileStem,
                    )}`
                  : `/api/media/photos/${encodeURIComponent(
                      intro.featuredFilm.posterStem,
                    )}`
              }
              posterSrc={`/api/media/photos/${encodeURIComponent(
                intro.featuredFilm.posterStem,
              )}`}
              mediaType={intro.featuredFilm.mediaType}
              alt={intro.featuredFilm.title}
              aspect="wide"
              revealVariant="paper-frame"
              reducedMotion={reducedMotion}
              fallbackTitle={intro.featuredFilm.title}
              fallbackSubtitle={intro.featuredFilm.caption}
            />

            <div style={{ marginTop: '0.85rem' }}>
              <h3 className="memory-title" style={{ margin: '0 0 0.25rem' }}>
                {intro.featuredFilm.title}
              </h3>
              <p className="memory-caption" style={{ margin: 0 }}>
                {intro.featuredFilm.caption}
              </p>
            </div>
          </div>
        )}

        <div className="memories-grid">
          {memories.map((item, idx) => {
            const plateNo = String(idx + 1).padStart(2, '0');
            const phase = photoPhases[item.id] || 'in-view';
            const mediaSrc =
              item.mediaType === 'video'
                ? `/api/media/video/${encodeURIComponent(item.fileStem)}`
                : `/api/media/photos/${encodeURIComponent(item.fileStem)}`;
            const variantForFrame =
              item.frameStyle === 'editorial'
                ? 'paper-frame'
                : item.frameStyle === 'film-strip'
                  ? 'gentle-scale'
                  : item.frameStyle === 'scrapbook-tape'
                    ? 'organic-curve'
                    : 'inset';

            return (
              <div
                key={item.id}
                ref={(el) => {
                  cardRefs.current[item.id] = el;
                }}
                data-memory-id={item.id}
                className={`memory-card-wrapper ${getGridSpanClass(
                  idx,
                )} photo-state-${phase} ${getExitVariantClass(
                  idx,
                )} reveal-stagger-child`}
                style={{ ['--stagger-idx' as string]: idx }}
              >
                <div
                  ref={(el) => {
                    triggerBtnRefs.current[idx] = el;
                  }}
                  role="button"
                  tabIndex={0}
                  className={`memory-card frame-${item.frameStyle}`}
                  style={{
                    transform: reducedMotion
                      ? 'none'
                      : `rotate(${item.rotationDeg}deg)`,
                  }}
                  onClick={() => openLightbox(idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openLightbox(idx);
                    }
                  }}
                  aria-label={`Open memory ${idx + 1}: ${item.title}`}
                >
                  {item.frameStyle === 'scrapbook-tape' && (
                    <div className="scrapbook-tape-piece" aria-hidden="true" />
                  )}

                  <div className="memory-plate-header" aria-hidden="true">
                    <span>PLATE {plateNo}</span>
                    <span>{getPlateFormatLabel(item.aspect, idx)}</span>
                  </div>

                  <MediaRevealFrame
                    slotId={item.id}
                    src={mediaSrc}
                    posterSrc={
                      item.posterStem
                        ? `/api/media/photos/${encodeURIComponent(
                            item.posterStem,
                          )}`
                        : undefined
                    }
                    mediaType={item.mediaType || 'image'}
                    alt={item.title}
                    aspect={item.aspect}
                    phase={phase}
                    revealVariant={variantForFrame}
                    reducedMotion={reducedMotion}
                    fallbackTitle={item.title}
                    fallbackSubtitle={item.caption}
                  />

                  <div className="memory-meta-bar">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <Calendar size={12} />
                      {item.dateLabel}
                    </span>
                    {item.locationLabel && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <MapPin size={12} />
                        {item.locationLabel}
                      </span>
                    )}
                  </div>

                  <h3 className="memory-title">{item.title}</h3>
                  <p className="memory-caption">{item.caption}</p>

                  <div className="memory-handwritten">
                    <span>{item.handwrittenNote}</span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(e, item)}
                        aria-label={`Love this memory: ${item.title}`}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: favoritedIds[item.id]
                            ? 'var(--color-cherry-bright)'
                            : 'currentColor',
                          minWidth: '44px',
                          minHeight: '44px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0.35rem',
                          opacity: favoritedIds[item.id] ? 1 : 0.78,
                        }}
                      >
                        <Heart
                          size={18}
                          fill={favoritedIds[item.id] ? 'currentColor' : 'none'}
                        />
                      </button>
                      <Maximize2 size={14} style={{ opacity: 0.65 }} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fullscreen Accessible Darkroom Lightbox */}
      {activeMemory && activeIndex !== null && (
        <div
          className="lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-memory-title"
          onClick={closeLightbox}
        >
          <div
            ref={dialogRef}
            className="lightbox-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-media-col">
              <MediaRevealFrame
                slotId={`${activeMemory.id}-lightbox`}
                src={
                  activeMemory.mediaType === 'video'
                    ? `/api/media/video/${encodeURIComponent(
                        activeMemory.fileStem,
                      )}`
                    : `/api/media/photos/${encodeURIComponent(
                        activeMemory.fileStem,
                      )}`
                }
                mediaType={activeMemory.mediaType || 'image'}
                alt={activeMemory.title}
                aspect={activeMemory.aspect}
                eager
                fallbackTitle={activeMemory.title}
                fallbackSubtitle={activeMemory.caption}
              />
            </div>

            <div className="lightbox-details-col">
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      color: 'var(--sun-rose)',
                      fontWeight: 600,
                    }}
                  >
                    ARCHIVAL PLATE {activeIndex + 1} OF {memories.length}
                  </span>

                  <button
                    ref={closeBtnRef}
                    type="button"
                    onClick={closeLightbox}
                    aria-label="Close memory viewer"
                    style={{
                      background: 'rgba(37, 19, 31, 0.08)',
                      border: 'none',
                      borderRadius: '6px',
                      minWidth: '44px',
                      minHeight: '44px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'var(--sun-ink-dark)',
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <h3
                  id="lightbox-memory-title"
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 'clamp(1.6rem, 3vw, 2.05rem)',
                    lineHeight: 1.16,
                    margin: '0 0 0.45rem',
                  }}
                >
                  {activeMemory.title}
                </h3>

                <p
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.76rem',
                    letterSpacing: '0.06em',
                    color: 'var(--sun-ink-muted)',
                    marginBottom: '1rem',
                  }}
                >
                  {activeMemory.dateLabel}
                  {activeMemory.locationLabel
                    ? ` • ${activeMemory.locationLabel}`
                    : ''}
                </p>

                <p
                  style={{
                    fontSize: '0.98rem',
                    lineHeight: 1.72,
                    color: 'var(--sun-ink-body)',
                  }}
                >
                  {activeMemory.caption}
                </p>

                <button
                  type="button"
                  onClick={() => setShowBackNote((prev) => !prev)}
                  style={{
                    marginTop: '0.85rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    minHeight: '44px',
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(201, 84, 114, 0.4)',
                    background: 'rgba(201, 84, 114, 0.08)',
                    color: 'var(--sun-rose)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCw size={14} />
                  <span>
                    {showBackNote
                      ? 'Hide note on the back of photo'
                      : 'Turn photo over — read handwritten note'}
                  </span>
                </button>

                {showBackNote && (
                  <div className="lightbox-back-note" role="note">
                    {activeMemory.behindTheMoment}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginTop: '1.75rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(37, 19, 31, 0.12)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex(
                      (activeIndex - 1 + memories.length) % memories.length,
                    );
                    setShowBackNote(false);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'transparent',
                    border: '1px solid rgba(37, 19, 31, 0.25)',
                    borderRadius: '6px',
                    minHeight: '44px',
                    padding: '0.45rem 0.9rem',
                    cursor: 'pointer',
                    color: 'var(--sun-ink-dark)',
                    fontSize: '0.82rem',
                  }}
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.7rem',
                    color: 'var(--sun-ink-muted)',
                  }}
                >
                  ← → OR ESC
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setActiveIndex((activeIndex + 1) % memories.length);
                    setShowBackNote(false);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'var(--sun-ink-dark)',
                    border: '1px solid var(--sun-ink-dark)',
                    borderRadius: '6px',
                    minHeight: '44px',
                    padding: '0.45rem 0.95rem',
                    cursor: 'pointer',
                    color: '#fffbf7',
                    fontSize: '0.82rem',
                  }}
                >
                  <span>Next Memory</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
