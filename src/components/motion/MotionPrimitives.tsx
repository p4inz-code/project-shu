import React, { useEffect, useRef, useState } from 'react';
import { Film, Image as ImageIcon } from 'lucide-react';
import {
  useRevealOnScroll,
  type ScrollViewportPhase,
} from '../../hooks/useRevealOnScroll';

/* ============================================================================
   1. SHARED PASSIVE SCROLL + RAF PARALLAX COORDINATOR
   Avoids per-component window scroll listeners by multiplexing all active
   parallax and scroll-progress layers through a single rAF-throttled listener.
   Automatically detaches when zero active subscribers remain.
   ============================================================================ */
type ScrollSubscriber = () => void;

const parallaxSubscribers = new Set<ScrollSubscriber>();
let sharedRafId = 0;
let listenersAttached = false;

function flushSubscribers() {
  sharedRafId = 0;
  if (typeof document !== 'undefined' && document.hidden) return;
  for (const callback of parallaxSubscribers) {
    callback();
  }
}

function onSharedScrollOrResize() {
  if (
    sharedRafId === 0 &&
    typeof window !== 'undefined' &&
    (typeof document === 'undefined' || !document.hidden)
  ) {
    sharedRafId = window.requestAnimationFrame(flushSubscribers);
  }
}

function subscribeToScrollCoordinator(callback: ScrollSubscriber): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  parallaxSubscribers.add(callback);
  if (!listenersAttached && parallaxSubscribers.size === 1) {
    window.addEventListener('scroll', onSharedScrollOrResize, {
      passive: true,
    });
    window.addEventListener('resize', onSharedScrollOrResize, {
      passive: true,
    });
    listenersAttached = true;
  }

  return () => {
    parallaxSubscribers.delete(callback);
    if (listenersAttached && parallaxSubscribers.size === 0) {
      window.removeEventListener('scroll', onSharedScrollOrResize);
      window.removeEventListener('resize', onSharedScrollOrResize);
      if (sharedRafId !== 0) {
        window.cancelAnimationFrame(sharedRafId);
        sharedRafId = 0;
      }
      listenersAttached = false;
    }
  };
}

/**
 * Exposed for testing observer/listener cleanup after unmount or reducedMotion changes.
 */
export function getActiveParallaxSubscriberCount(): number {
  return parallaxSubscribers.size;
}

/* ============================================================================
   2. MASKED TYPOGRAPHY REVEAL PRIMITIVE
   ============================================================================ */
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

/* ============================================================================
   3. CONSERVATIVE COORDINATED PARALLAX LAYER
   ============================================================================ */
export interface ParallaxLayerProps {
  children: React.ReactNode;
  speed?: number;
  maxOffset?: number;
  axis?: 'y' | 'x';
  reducedMotion?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Lightweight GPU-composited parallax layer coordinated through a single shared
 * passive scroll + rAF scheduler.
 * - Movement range is conservatively clamped (default <= 22px, hard cap <= 28px).
 * - Automatically disables movement and resets transform under `reducedMotion`.
 * - Never hijacks scroll or leaves elements displaced on reverse scroll.
 */
export const ParallaxLayer: React.FC<ParallaxLayerProps> = ({
  children,
  speed = 0.06,
  maxOffset = 22,
  axis = 'y',
  reducedMotion = false,
  className = '',
  style,
}) => {
  const layerRef = useRef<HTMLDivElement | null>(null);
  const safeMaxOffset = Math.min(28, Math.max(0, maxOffset));

  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;

    if (reducedMotion || speed === 0 || safeMaxOffset === 0) {
      el.style.transform = 'translate3d(0, 0, 0)';
      return;
    }

    const updatePosition = () => {
      const node = layerRef.current;
      if (!node || (typeof document !== 'undefined' && document.hidden)) return;
      const rect = node.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.5;
      const elementCenter = rect.top + rect.height * 0.5;
      const delta = (elementCenter - viewportCenter) * speed;
      const clamped = Math.max(
        -safeMaxOffset,
        Math.min(safeMaxOffset, -delta),
      );
      const offsetStr = `${clamped.toFixed(1)}px`;
      node.style.transform =
        axis === 'x'
          ? `translate3d(${offsetStr}, 0, 0)`
          : `translate3d(0, ${offsetStr}, 0)`;
    };

    const unsubscribe = subscribeToScrollCoordinator(updatePosition);
    updatePosition();

    return () => {
      unsubscribe();
      if (layerRef.current) {
        layerRef.current.style.transform = 'translate3d(0, 0, 0)';
      }
    };
  }, [reducedMotion, speed, safeMaxOffset, axis]);

  return (
    <div
      ref={layerRef}
      data-parallax-axis={axis}
      className={`parallax-layer ${
        reducedMotion ? 'parallax-static' : ''
      } ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
};

/* ============================================================================
   4. OPTIMIZED HAND-DRAWN SVG CAPABILITIES
   Supports progressive multi-stroke ink drawing, fine-line constellations,
   crescent moons, botanical stems, organic borders, and photo corner flourishes.
   ============================================================================ */
export interface HandDrawnStrokeSpec {
  d: string;
  stroke?: string;
  strokeWidth?: number;
  delayMs?: number;
  durationMs?: number;
  opacity?: number;
  strokeDasharray?: string;
  fill?: string;
}

export interface SvgLineDrawProps {
  d?: string;
  strokes?: HandDrawnStrokeSpec[];
  viewBox?: string;
  stroke?: string;
  strokeWidth?: number;
  durationMs?: number;
  staggerMs?: number;
  isDrawn?: boolean;
  triggerOnScroll?: boolean;
  reversible?: boolean;
  reducedMotion?: boolean;
  preserveAspectRatio?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable SVG line/ink drawing primitive with normalized `pathLength={100}`.
 * Supports single-path `d` or multi-stroke `strokes` with independent timing and colors.
 * Always `aria-hidden="true"` and `focusable="false"` so decorative ink never pollutes screen readers.
 */
export const SvgLineDraw: React.FC<SvgLineDrawProps> = ({
  d,
  strokes,
  viewBox = '0 0 100 100',
  stroke = 'currentColor',
  strokeWidth = 1.25,
  durationMs = 880,
  staggerMs = 110,
  isDrawn = true,
  triggerOnScroll = false,
  reversible = true,
  reducedMotion = false,
  preserveAspectRatio = 'xMidYMid meet',
  className = '',
  style,
}) => {
  const { ref, isVisible } = useRevealOnScroll<SVGSVGElement>(reducedMotion, {
    reversible,
  });

  const activeDrawn = reducedMotion
    ? true
    : triggerOnScroll
      ? isVisible && isDrawn
      : isDrawn;

  const resolvedStrokes: HandDrawnStrokeSpec[] =
    strokes && strokes.length > 0
      ? strokes
      : d
        ? [{ d, stroke, strokeWidth, durationMs, delayMs: 0 }]
        : [];

  return (
    <svg
      ref={triggerOnScroll ? ref : undefined}
      viewBox={viewBox}
      preserveAspectRatio={preserveAspectRatio}
      aria-hidden="true"
      focusable="false"
      data-drawn={activeDrawn ? 'true' : 'false'}
      className={`svg-line-draw ${
        activeDrawn ? 'is-drawn' : 'is-undrawn'
      } ${className}`.trim()}
      style={style}
    >
      {resolvedStrokes.map((item, idx) => {
        const itemDuration = item.durationMs ?? durationMs;
        const itemDelay = item.delayMs ?? idx * staggerMs;
        return (
          <path
            key={idx}
            d={item.d}
            fill={item.fill ?? 'none'}
            stroke={item.stroke ?? stroke}
            strokeWidth={item.strokeWidth ?? strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            style={{
              opacity: item.opacity ?? 1,
              strokeDasharray: item.strokeDasharray ?? 100,
              strokeDashoffset: activeDrawn ? 0 : 100,
              transition: reducedMotion
                ? 'none'
                : `stroke-dashoffset ${itemDuration}ms var(--ease-cinematic, cubic-bezier(0.22, 1, 0.36, 1)) ${itemDelay}ms, opacity 320ms ease ${itemDelay}ms`,
            }}
          />
        );
      })}
    </svg>
  );
};

export type HandDrawnMotifName =
  | 'constellation'
  | 'crescent-moon'
  | 'botanical-stem'
  | 'floral-flourish'
  | 'organic-border'
  | 'photo-corners'
  | 'horizon-sunrise'
  | 'sakura-bough'
  | 'sakura-blossom';

interface MotifDefinition {
  viewBox: string;
  strokes: HandDrawnStrokeSpec[];
}

export const HAND_DRAWN_MOTIFS: Record<HandDrawnMotifName, MotifDefinition> = {
  constellation: {
    viewBox: '0 0 240 64',
    strokes: [
      {
        d: 'M 18 44 L 68 20 L 122 36 L 176 14 L 222 38',
        strokeWidth: 1.1,
        durationMs: 920,
      },
      {
        d: 'M 18 39 L 18 49 M 13 44 L 23 44',
        strokeWidth: 1.3,
        delayMs: 120,
        durationMs: 420,
      },
      {
        d: 'M 68 14 L 68 26 M 62 20 L 74 20',
        strokeWidth: 1.35,
        delayMs: 260,
        durationMs: 420,
      },
      {
        d: 'M 122 30 L 122 42 M 116 36 L 128 36',
        strokeWidth: 1.3,
        delayMs: 400,
        durationMs: 420,
      },
      {
        d: 'M 176 8 L 176 20 M 170 14 L 182 14',
        strokeWidth: 1.35,
        delayMs: 540,
        durationMs: 420,
      },
      {
        d: 'M 222 33 L 222 43 M 217 38 L 227 38',
        strokeWidth: 1.3,
        delayMs: 680,
        durationMs: 420,
      },
    ],
  },
  'crescent-moon': {
    viewBox: '0 0 120 84',
    strokes: [
      {
        d: 'M 66 14 C 44 16 30 34 34 54 C 38 70 56 76 74 68 C 56 66 46 52 48 34 C 50 22 57 16 66 14 Z',
        strokeWidth: 1.35,
        durationMs: 900,
      },
      {
        d: 'M 86 24 L 86 34 M 81 29 L 91 29',
        strokeWidth: 1.2,
        delayMs: 240,
        durationMs: 480,
      },
      {
        d: 'M 24 28 L 24 34 M 21 31 L 27 31',
        strokeWidth: 1.1,
        delayMs: 380,
        durationMs: 440,
      },
    ],
  },
  'botanical-stem': {
    viewBox: '0 0 180 76',
    strokes: [
      {
        d: 'M 14 58 C 56 54 102 36 164 18',
        strokeWidth: 1.35,
        durationMs: 860,
      },
      {
        d: 'M 54 49 C 48 34 58 24 72 28 C 68 40 60 46 54 49 Z',
        strokeWidth: 1.15,
        delayMs: 180,
        durationMs: 620,
      },
      {
        d: 'M 94 38 C 102 50 116 52 126 42 C 114 34 102 34 94 38 Z',
        strokeWidth: 1.15,
        delayMs: 320,
        durationMs: 620,
      },
      {
        d: 'M 132 27 C 128 14 140 8 152 14 C 146 24 138 26 132 27 Z',
        strokeWidth: 1.15,
        delayMs: 460,
        durationMs: 620,
      },
      {
        d: 'M 164 18 C 168 12 174 14 172 20 C 169 24 164 22 164 18 Z',
        strokeWidth: 1.2,
        delayMs: 580,
        durationMs: 460,
      },
    ],
  },
  'floral-flourish': {
    viewBox: '0 0 260 44',
    strokes: [
      {
        d: 'M 12 22 C 54 22 78 12 114 22',
        strokeWidth: 1.2,
        durationMs: 740,
      },
      {
        d: 'M 248 22 C 206 22 182 32 146 22',
        strokeWidth: 1.2,
        delayMs: 90,
        durationMs: 740,
      },
      {
        d: 'M 130 13 C 124 7 116 13 122 21 L 130 29 L 138 21 C 144 13 136 7 130 13 Z',
        strokeWidth: 1.25,
        delayMs: 260,
        durationMs: 640,
      },
      {
        d: 'M 86 18 C 80 11 72 13 76 20 M 174 26 C 180 33 188 31 184 24',
        strokeWidth: 1.05,
        delayMs: 400,
        durationMs: 520,
      },
    ],
  },
  'organic-border': {
    viewBox: '0 0 200 200',
    strokes: [
      {
        d: 'M 12 24 C 64 10 136 10 188 22 C 194 74 192 132 186 182 C 132 192 68 192 14 180 C 8 128 8 72 12 24 Z',
        strokeWidth: 1.15,
        durationMs: 1080,
      },
    ],
  },
  'photo-corners': {
    viewBox: '0 0 200 200',
    strokes: [
      {
        d: 'M 6 36 C 6 14 14 6 36 6',
        strokeWidth: 1.6,
        delayMs: 0,
        durationMs: 560,
      },
      {
        d: 'M 164 6 C 186 6 194 14 194 36',
        strokeWidth: 1.6,
        delayMs: 110,
        durationMs: 560,
      },
      {
        d: 'M 194 164 C 194 186 186 194 164 194',
        strokeWidth: 1.6,
        delayMs: 220,
        durationMs: 560,
      },
      {
        d: 'M 36 194 C 14 194 6 186 6 164',
        strokeWidth: 1.6,
        delayMs: 330,
        durationMs: 560,
      },
    ],
  },
  'horizon-sunrise': {
    viewBox: '0 0 320 110',
    strokes: [
      {
        d: 'M 12 86 Q 160 28 308 86',
        strokeWidth: 1.4,
        durationMs: 920,
      },
      {
        d: 'M 116 66 A 46 46 0 0 1 204 66',
        strokeWidth: 1.35,
        delayMs: 180,
        durationMs: 780,
      },
      {
        d: 'M 160 12 L 160 26 M 112 26 L 122 36 M 208 26 L 198 36 M 82 52 L 96 56 M 238 52 L 224 56',
        strokeWidth: 1.2,
        delayMs: 360,
        durationMs: 640,
      },
      {
        d: 'M 254 82 C 260 66 274 58 286 56 M 268 70 C 264 62 270 56 278 60',
        strokeWidth: 1.15,
        delayMs: 520,
        durationMs: 600,
      },
    ],
  },
  'sakura-bough': {
    viewBox: '0 0 320 96',
    strokes: [
      {
        d: 'M 8 76 C 72 68 134 42 214 34 C 254 30 286 20 310 14',
        strokeWidth: 1.5,
        durationMs: 960,
      },
      {
        d: 'M 98 56 C 118 70 146 76 176 74',
        strokeWidth: 1.15,
        delayMs: 160,
        durationMs: 680,
      },
      {
        d: 'M 184 38 C 198 22 222 14 246 12',
        strokeWidth: 1.1,
        delayMs: 280,
        durationMs: 640,
      },
      {
        d: 'M 176 74 C 172 66 182 60 188 68 C 196 62 202 72 194 78 C 200 84 190 90 182 84 C 174 90 166 82 176 74 Z',
        strokeWidth: 1.2,
        delayMs: 420,
        durationMs: 620,
      },
      {
        d: 'M 246 12 C 242 4 252 0 258 8 C 266 2 272 12 264 18 C 270 24 260 30 252 24 C 244 30 236 20 246 12 Z',
        strokeWidth: 1.2,
        delayMs: 560,
        durationMs: 620,
      },
    ],
  },
  'sakura-blossom': {
    viewBox: '0 0 88 88',
    strokes: [
      {
        d: 'M 44 44 C 34 26 38 10 44 14 C 50 10 54 26 44 44 Z',
        strokeWidth: 1.25,
        durationMs: 560,
      },
      {
        d: 'M 44 44 C 60 32 76 34 72 42 C 76 48 60 52 44 44 Z',
        strokeWidth: 1.25,
        delayMs: 90,
        durationMs: 560,
      },
      {
        d: 'M 44 44 C 58 56 64 72 56 70 C 52 76 44 62 44 44 Z',
        strokeWidth: 1.25,
        delayMs: 180,
        durationMs: 560,
      },
      {
        d: 'M 44 44 C 44 62 36 76 32 70 C 24 72 30 56 44 44 Z',
        strokeWidth: 1.25,
        delayMs: 270,
        durationMs: 560,
      },
      {
        d: 'M 44 44 C 28 52 12 48 16 42 C 12 34 28 32 44 44 Z',
        strokeWidth: 1.25,
        delayMs: 360,
        durationMs: 560,
      },
      {
        d: 'M 44 44 L 44 33 M 44 44 L 53 40 M 44 44 L 50 51 M 44 44 L 38 51 M 44 44 L 35 40',
        strokeWidth: 1.05,
        delayMs: 460,
        durationMs: 440,
      },
    ],
  },
};

export interface HandDrawnOrnamentProps {
  motif: HandDrawnMotifName;
  stroke?: string;
  strokeWidth?: number;
  durationMs?: number;
  staggerMs?: number;
  isDrawn?: boolean;
  triggerOnScroll?: boolean;
  reversible?: boolean;
  reducedMotion?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable hand-drawn romantic ornament component backed by `HAND_DRAWN_MOTIFS`.
 * Supports different stroke colors, timing, and scroll-activation without duplicating SVG paths.
 */
export const HandDrawnOrnament: React.FC<HandDrawnOrnamentProps> = ({
  motif,
  stroke = 'currentColor',
  strokeWidth,
  durationMs = 860,
  staggerMs = 110,
  isDrawn = true,
  triggerOnScroll = true,
  reversible = true,
  reducedMotion = false,
  className = '',
  style,
}) => {
  const definition = HAND_DRAWN_MOTIFS[motif] ?? HAND_DRAWN_MOTIFS['floral-flourish'];
  const customizedStrokes = definition.strokes.map((s) => ({
    ...s,
    stroke: s.stroke ?? stroke,
    strokeWidth: strokeWidth ?? s.strokeWidth,
  }));

  return (
    <SvgLineDraw
      viewBox={definition.viewBox}
      strokes={customizedStrokes}
      stroke={stroke}
      durationMs={durationMs}
      staggerMs={staggerMs}
      isDrawn={isDrawn}
      triggerOnScroll={triggerOnScroll}
      reversible={reversible}
      reducedMotion={reducedMotion}
      className={`hand-drawn-ornament motif-${motif} ${className}`.trim()}
      style={style}
    />
  );
};

/* ============================================================================
   5. CINEMATIC IMAGE REVEAL PRIMITIVES
   Supports selectable mask shapes (inset, organic-curve, radial, paper-frame,
   gentle-scale), optional hand-drawn SVG accents around photographs, optional
   foreground/background separation, stable aspect ratios, and fallbacks.
   ============================================================================ */
export type ImageRevealVariant =
  | 'inset'
  | 'organic-curve'
  | 'radial'
  | 'paper-frame'
  | 'gentle-scale'
  | 'none';

export type DecorativeFrameAccent =
  | 'none'
  | 'photo-corners'
  | 'botanical'
  | 'celestial';

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
  revealVariant?: ImageRevealVariant;
  decorativeAccent?: DecorativeFrameAccent;
  accentColor?: string;
  foregroundOverlay?: React.ReactNode;
  reducedMotion?: boolean;
  className?: string;
  eager?: boolean;
}

/**
 * Resilient media frame supporting photographs, portraits, and videos with:
 * - Explicit reserved dimensions (`width` / `height` + CSS `aspect-ratio`) to prevent CLS
 * - Selectable reveal variants (`inset`, `organic-curve`, `radial`, `paper-frame`, `gentle-scale`, `none`)
 * - Optional hand-drawn SVG line accents around photographs (`photo-corners`, `botanical`, `celestial`)
 * - Optional foreground/background layer separation (`foregroundOverlay`)
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
  phase = 'in-view',
  revealVariant = 'inset',
  decorativeAccent = 'none',
  accentColor = 'currentColor',
  foregroundOverlay,
  reducedMotion = false,
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

  const effectivePhase: ScrollViewportPhase = reducedMotion ? 'in-view' : phase;
  const effectiveVariant: ImageRevealVariant = reducedMotion
    ? 'none'
    : revealVariant;

  return (
    <div
      data-slot-id={slotId}
      data-reveal-variant={effectiveVariant}
      data-scroll-phase={effectivePhase}
      className={`memory-image-frame ${aspectClass} reveal-variant-${effectiveVariant} frame-phase-${effectivePhase} ${
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

      {/* Optional Decorative Hand-Drawn SVG Line Accent Around Photographs */}
      {decorativeAccent !== 'none' && (
        <div className="media-decorative-frame-overlay" aria-hidden="true">
          <HandDrawnOrnament
            motif={
              decorativeAccent === 'botanical'
                ? 'botanical-stem'
                : decorativeAccent === 'celestial'
                  ? 'crescent-moon'
                  : 'photo-corners'
            }
            stroke={accentColor}
            isDrawn={effectivePhase !== 'entering'}
            triggerOnScroll={false}
            reducedMotion={reducedMotion}
            className={`media-frame-ornament accent-${decorativeAccent}`}
          />
        </div>
      )}

      {/* Optional Foreground Layer for Subtle Depth Separation */}
      {foregroundOverlay && (
        <div className="media-foreground-separation" aria-hidden="true">
          {foregroundOverlay}
        </div>
      )}
    </div>
  );
};

/* ============================================================================
   6. MOONLIGHT-TO-SUNSHINE WORLD TRANSITION PRIMITIVE
   Provides reusable scroll-linked progress (`--world-transition-progress: 0..1`),
   constellation fade-out, progressive horizon drawing, gradual illumination,
   and botanical accents appearing in Sunshine without locking final composition.
   ============================================================================ */
export interface WorldTransitionStageProps {
  activeWorld: 'moonlight' | 'sunshine';
  reducedMotion?: boolean;
  showHorizonIllustration?: boolean;
  showBotanicalAccents?: boolean;
  className?: string;
  id?: string;
  ariaLabelledBy?: string;
  stageRef?: React.RefObject<HTMLElement>;
  children: React.ReactNode;
}

export const WorldTransitionStage: React.FC<WorldTransitionStageProps> = ({
  activeWorld,
  reducedMotion = false,
  showHorizonIllustration = true,
  showBotanicalAccents = true,
  className = '',
  id,
  ariaLabelledBy,
  stageRef,
  children,
}) => {
  const internalRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState<number>(
    activeWorld === 'sunshine' ? 1 : 0,
  );

  useEffect(() => {
    const node = stageRef?.current ?? internalRef.current;
    if (!node) return;

    if (reducedMotion) {
      const staticProgress = activeWorld === 'sunshine' ? 1 : 0;
      setProgress(staticProgress);
      node.style.setProperty(
        '--world-transition-progress',
        String(staticProgress),
      );
      node.style.setProperty(
        '--constellation-fade',
        String(1 - staticProgress),
      );
      node.style.setProperty('--sunshine-bloom', String(staticProgress));
      return;
    }

    const updateTransitionProgress = () => {
      const target = stageRef?.current ?? internalRef.current;
      if (!target || (typeof document !== 'undefined' && document.hidden)) {
        return;
      }
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 800;
      // Progress moves smoothly from 0 when section top enters bottom of viewport
      // to 1 when section center crosses upper-middle viewport.
      const startY = viewportHeight * 0.88;
      const endY = viewportHeight * 0.22;
      const raw = (startY - rect.top) / Math.max(1, startY - endY);
      const clamped = Math.max(0, Math.min(1, raw));
      target.style.setProperty(
        '--world-transition-progress',
        clamped.toFixed(3),
      );
      target.style.setProperty(
        '--constellation-fade',
        (1 - clamped).toFixed(3),
      );
      target.style.setProperty('--sunshine-bloom', clamped.toFixed(3));
      setProgress((prev) =>
        Math.abs(prev - clamped) >= 0.08 ? Number(clamped.toFixed(2)) : prev,
      );
    };

    const unsubscribe = subscribeToScrollCoordinator(updateTransitionProgress);
    updateTransitionProgress();

    return () => {
      unsubscribe();
    };
  }, [activeWorld, reducedMotion, stageRef]);

  const assignRefs = (el: HTMLElement | null) => {
    internalRef.current = el;
    if (stageRef) {
      (stageRef as React.MutableRefObject<HTMLElement | null>).current = el;
    }
  };

  const isSunshine = activeWorld === 'sunshine' || progress >= 0.55;

  return (
    <section
      id={id}
      ref={assignRefs}
      aria-labelledby={ariaLabelledBy}
      data-transition-world={activeWorld}
      data-transition-progress={progress}
      className={`dawn-transition-scene world-transition-stage ${
        isSunshine ? 'world-stage-sunshine' : 'world-stage-moonlight'
      } ${className}`.trim()}
    >
      {/* Constellation Fade-Out Layer (Moonlight receding) */}
      <div
        className="world-transition-constellation-layer"
        aria-hidden="true"
        style={{
          opacity: reducedMotion ? (activeWorld === 'moonlight' ? 0.85 : 0.15) : undefined,
        }}
      >
        <HandDrawnOrnament
          motif="constellation"
          stroke="var(--moon-lavender)"
          isDrawn={true}
          triggerOnScroll={false}
          reducedMotion={reducedMotion}
          className="transition-constellation-svg"
        />
      </div>

      {/* Progressive Horizon & Rising Sun Illustration */}
      {showHorizonIllustration && (
        <div className="world-transition-horizon-svg-wrap" aria-hidden="true">
          <HandDrawnOrnament
            motif="horizon-sunrise"
            stroke="rgba(255, 245, 250, 0.72)"
            isDrawn={reducedMotion || progress > 0.12 || isSunshine}
            triggerOnScroll={false}
            reducedMotion={reducedMotion}
            className="transition-horizon-svg"
          />
        </div>
      )}

      {children}

      {/* Botanical Accents Appearing in Sunshine */}
      {showBotanicalAccents && (
        <div
          className={`world-transition-botanical-layer ${
            isSunshine ? 'is-blooming' : ''
          }`}
          aria-hidden="true"
        >
          <HandDrawnOrnament
            motif="botanical-stem"
            stroke="var(--sun-rose)"
            isDrawn={isSunshine}
            triggerOnScroll={false}
            reducedMotion={reducedMotion}
            className="transition-botanical-svg"
          />
        </div>
      )}
    </section>
  );
};

/* ============================================================================
   7. VARIED SCENE CHOREOGRAPHY VOCABULARY
   Allows future Claude Design scenes to combine ink drawing, image masking,
   typography reveals, subtle parallax, light transitions, staggered reveals,
   or deliberate stillness without a monotonous universal preset.
   ============================================================================ */
export type ChoreographyVocabulary =
  | 'ink-draw'
  | 'image-mask'
  | 'typography-reveal'
  | 'subtle-parallax'
  | 'light-transition'
  | 'staggered-reveal'
  | 'stillness';

export interface ChoreographedSceneProps {
  vocabulary: ChoreographyVocabulary;
  reducedMotion?: boolean;
  reversible?: boolean;
  as?: 'div' | 'section' | 'article';
  className?: string;
  id?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const ChoreographedScene: React.FC<ChoreographedSceneProps> = ({
  vocabulary,
  reducedMotion = false,
  reversible = false,
  as: Tag = 'div',
  className = '',
  id,
  style,
  children,
}) => {
  const { ref, isVisible, hasRevealed, phase } = useRevealOnScroll<HTMLElement>(
    reducedMotion || vocabulary === 'stillness',
    { reversible },
  );

  const effectiveVisible =
    reducedMotion || vocabulary === 'stillness' ? true : isVisible;

  return (
    <Tag
      id={id}
      ref={ref as React.RefObject<never>}
      data-choreography={vocabulary}
      data-scroll-phase={
        reducedMotion || vocabulary === 'stillness' ? 'in-view' : phase
      }
      data-has-revealed={hasRevealed ? 'true' : 'false'}
      className={`choreographed-scene vocab-${vocabulary} ${
        effectiveVisible ? 'is-visible' : 'is-entering'
      } ${className}`.trim()}
      style={style}
    >
      {children}
    </Tag>
  );
};
