import React, { useEffect, useRef, useState } from 'react';
import { Film, Image as ImageIcon } from 'lucide-react';
import {
  useRevealOnScroll,
  type ScrollViewportPhase,
} from '../../hooks/useRevealOnScroll';

export interface MaskedTextRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  mode?: 'words' | 'lines';
  reducedMotion?: boolean;
  reversible?: boolean;
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

/**
 * Composable word-by-word or line-by-line editorial typography reveal primitive.
 * Keeps screen-reader accessibility intact via a single accessible label while
 * animating visual word/line spans with GPU-friendly translate3d + opacity.
 */
export const MaskedTextReveal: React.FC<MaskedTextRevealProps> = ({
  text,
  as: Tag = 'div',
  mode = 'words',
  reducedMotion = false,
  reversible = true,
  className = '',
  id,
  style,
}) => {
  const { ref, isVisible, phase } = useRevealOnScroll<HTMLElement>(
    reducedMotion,
    { reversible },
  );

  const segments =
    mode === 'lines'
      ? text.split(/\n+/).filter(Boolean)
      : text.split(/\s+/).filter(Boolean);

  if (reducedMotion) {
    return (
      <Tag id={id} className={className} style={style}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag
      id={id}
      ref={ref as React.RefObject<never>}
      className={`kinetic-text-reveal ${
        isVisible ? 'is-visible' : ''
      } kinetic-phase-${phase} ${className}`.trim()}
      style={style}
      aria-label={text}
    >
      <span aria-hidden="true">
        {segments.map((segment, idx) => (
          <span
            key={`${idx}-${segment}`}
            className="kinetic-word-mask"
            style={{
              display: mode === 'lines' ? 'block' : 'inline-block',
              overflow: 'hidden',
              verticalAlign: 'bottom',
              marginRight: mode === 'words' ? '0.26em' : undefined,
            }}
          >
            <span
              className="kinetic-word-inner"
              style={{
                display: 'inline-block',
                ['--word-idx' as string]: idx,
              }}
            >
              {segment}
            </span>
          </span>
        ))}
      </span>
    </Tag>
  );
};

export interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  reducedMotion?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lightweight GPU-composited parallax layer driven by passive scroll + rAF.
 * Automatically disables movement when `reducedMotion` is active or `document.hidden` is true.
 */
export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed = 0.06,
  reducedMotion = false,
  className = '',
  style,
}) => {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    if (reducedMotion || speed === 0) {
      el.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    let rafId = 0;
    const updatePosition = () => {
      rafId = 0;
      if (document.hidden || !layerRef.current) return;
      const rect = layerRef.current.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.5;
      const elementCenter = rect.top + rect.height * 0.5;
      const delta = (elementCenter - viewportCenter) * speed;
      const clamped = Math.max(-28, Math.min(28, -delta));
      layerRef.current.style.transform = `translate3d(0, ${clamped.toFixed(1)}px, 0)`;
    };

    const onScrollOrResize = () => {
      if (rafId === 0 && !document.hidden) {
        rafId = window.requestAnimationFrame(updatePosition);
      }
    };

    window.addEventListener('scroll', onScrollOrResize, { passive: true });
    window.addEventListener('resize', onScrollOrResize, { passive: true });
    updatePosition();

    return () => {
      window.removeEventListener('scroll', onScrollOrResize);
      window.removeEventListener('resize', onScrollOrResize);
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [reducedMotion, speed]);

  return (
    <div ref={layerRef} className={`parallax-layer ${className}`.trim()} style={style}>
      {children}
    </div>
  );
};

export interface SvgLineDrawProps {
  d: string;
  viewBox?: string;
  stroke?: string;
  strokeWidth?: number;
  isDrawn?: boolean;
  reducedMotion?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable SVG line/constellation path drawing primitive with normalized `pathLength={100}`.
 */
export const SvgLineDraw: React.FC<SvgLineDrawProps> = ({
  d,
  viewBox = '0 0 100 100',
  stroke = 'currentColor',
  strokeWidth = 1.2,
  isDrawn = true,
  reducedMotion = false,
  className = '',
  style,
}) => {
  return (
    <svg
      viewBox={viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`svg-line-draw ${className}`.trim()}
      style={style}
    >
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        pathLength={100}
        style={{
          strokeDasharray: 100,
          strokeDashoffset: reducedMotion || isDrawn ? 0 : 100,
          transition: reducedMotion
            ? 'none'
            : 'stroke-dashoffset var(--motion-duration-scene, 880ms) var(--ease-cinematic, cubic-bezier(0.22, 1, 0.36, 1))',
        }}
      />
    </svg>
  );
};

export interface MediaRevealFrameProps {
  slotId: string;
  src: string;
  alt: string;
  aspect?: 'portrait' | 'landscape' | 'square' | 'wide';
  mediaType?: 'image' | 'video';
  posterSrc?: string;
  fallbackTitle?: string;
  fallbackSubtitle?: string;
  phase?: ScrollViewportPhase;
  className?: string;
  eager?: boolean;
}

/**
 * Resilient media frame supporting photographs, portraits, and videos with:
 * - Explicit reserved dimensions (`width` / `height` + CSS `aspect-ratio`) to prevent CLS
 * - Controlled crop (`clip-path`), blur-to-clear, and scale reveal
 * - Graceful editorial fallback card if an image or video is missing or fails to load
 */
export const MediaRevealFrame: React.FC<MediaRevealFrameProps> = ({
  slotId,
  src,
  alt,
  aspect = 'portrait',
  mediaType = 'image',
  posterSrc,
  fallbackTitle,
  fallbackSubtitle,
  className = '',
  eager = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  const aspectClass =
    aspect === 'portrait'
      ? 'aspect-portrait'
      : aspect === 'square'
        ? 'aspect-square'
        : aspect === 'wide'
          ? 'aspect-wide'
          : 'aspect-landscape';

  const dimensions =
    aspect === 'portrait'
      ? { width: 800, height: 1000 }
      : aspect === 'square'
        ? { width: 800, height: 800 }
        : aspect === 'wide'
          ? { width: 1280, height: 720 }
          : { width: 960, height: 720 };

  return (
    <div
      data-slot-id={slotId}
      className={`memory-image-frame ${aspectClass} ${
        isLoaded ? 'media-loaded' : 'media-loading'
      } ${hasError ? 'media-fallback-active' : ''} ${className}`.trim()}
    >
      {!hasError && mediaType === 'video' ? (
        <video
          src={src}
          poster={posterSrc}
          controls
          playsInline
          preload="metadata"
          width={dimensions.width}
          height={dimensions.height}
          aria-label={alt}
          onLoadedData={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        >
          Your browser does not support embedded video playback.
        </video>
      ) : !hasError ? (
        <img
          src={src}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className="media-fallback-plate"
          style={{
            width: '100%',
            height: '100%',
            minHeight: '220px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            textAlign: 'center',
            background:
              'radial-gradient(circle at 50% 38%, rgba(183, 148, 244, 0.22), rgba(20, 14, 38, 0.96))',
            color: 'var(--moon-pearl, #f8f5fc)',
          }}
        >
          {mediaType === 'video' ? (
            <Film size={28} style={{ opacity: 0.78, marginBottom: '0.6rem' }} />
          ) : (
            <ImageIcon
              size={28}
              style={{ opacity: 0.78, marginBottom: '0.6rem' }}
            />
          )}
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.75,
              marginBottom: '0.35rem',
            }}
          >
            SLOT // {slotId.toUpperCase()}
          </span>
          <strong
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.15rem',
              fontWeight: 500,
              marginBottom: '0.3rem',
            }}
          >
            {fallbackTitle || alt}
          </strong>
          <span
            style={{
              fontSize: '0.8rem',
              opacity: 0.75,
              maxWidth: '30ch',
              lineHeight: 1.45,
            }}
          >
            {fallbackSubtitle ||
              `Reserved keepsake slot (${slotId}) — ready for Atharva’s personal media in private-content/.`}
          </span>
        </div>
      )}
    </div>
  );
};
