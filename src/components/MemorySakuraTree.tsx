import React, { useRef, useState } from 'react';
import { Calendar, Eye, Heart, Sparkles } from 'lucide-react';
import type { MemoryItem } from '../types/content';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';
import {
  AtmosphericVideoAccent,
  MediaRevealFrame,
} from './motion/MotionPrimitives';

export type BlossomInteractionState =
  | 'default'
  | 'hovered'
  | 'tapped'
  | 'opened';

interface SakuraNodePosition {
  xPercent: number;
  yPercent: number;
  branchLabel: string;
}

const SAKURA_BRANCH_POSITIONS: SakuraNodePosition[] = [
  { xPercent: 24, yPercent: 62, branchLabel: 'Lower West Bough' },
  { xPercent: 74, yPercent: 58, branchLabel: 'Lower East Bough' },
  { xPercent: 32, yPercent: 38, branchLabel: 'Mid Canopy West' },
  { xPercent: 68, yPercent: 36, branchLabel: 'Mid Canopy East' },
  { xPercent: 46, yPercent: 22, branchLabel: 'Crown Heart Bough' },
  { xPercent: 56, yPercent: 46, branchLabel: 'Inner Sanctuary Bough' },
];

interface BranchWhisperLight {
  id: string;
  xPercent: number;
  yPercent: number;
  label: string;
  whisper: string;
}

const BRANCH_WHISPER_LIGHTS: BranchWhisperLight[] = [
  {
    id: 'light-01',
    xPercent: 18,
    yPercent: 48,
    label: 'Branch light 1: Quiet roots',
    whisper: 'Every small kindness from you took root here, Shu ♥',
  },
  {
    id: 'light-02',
    xPercent: 52,
    yPercent: 14,
    label: 'Branch light 2: Canopy starlight',
    whisper: 'Under moonlight or sunshine, you are my favorite view ♥',
  },
  {
    id: 'light-03',
    xPercent: 82,
    yPercent: 44,
    label: 'Branch light 3: Future seasons',
    whisper: 'Here is to every season yet to bloom for us ♥',
  },
];

export interface MemorySakuraTreeProps {
  memories: MemoryItem[];
  openedMemoryIds: Record<string, boolean>;
  activeLightboxIndex: number | null;
  reducedMotion: boolean;
  onOpenMemoryLightbox: (index: number) => void;
  onSpawnHeart: (x: number, y: number, label?: string) => void;
}

/**
 * SIGNATURE ART DIRECTION — THE MEMORY SAKURA
 * Laptop-first widescreen interactive cherry blossom stage with mobile-compatible
 * fallback, active branch illumination, keyboard arrow navigation, and hidden branch lights.
 */
export const MemorySakuraTree: React.FC<MemorySakuraTreeProps> = ({
  memories,
  openedMemoryIds,
  activeLightboxIndex,
  reducedMotion,
  onOpenMemoryLightbox,
  onSpawnHeart,
}) => {
  const { ref, isVisible } = useRevealOnScroll<HTMLDivElement>(reducedMotion, {
    reversible: false,
    threshold: 0.08,
  });

  const blossomButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeWhisper, setActiveWhisper] = useState<BranchWhisperLight | null>(
    null,
  );

  const visibleMemories = memories.slice(0, 6);
  const activeMemory =
    visibleMemories[selectedIndex] ?? visibleMemories[0] ?? null;
  const highlightedBranchIndex = hoveredIndex ?? selectedIndex;
  const treeDrawn = reducedMotion || isVisible;

  const getBlossomState = (
    item: MemoryItem,
    idx: number,
  ): BlossomInteractionState => {
    if (activeLightboxIndex === idx || openedMemoryIds[item.id]) {
      return 'opened';
    }
    if (selectedIndex === idx) {
      return 'tapped';
    }
    if (hoveredIndex === idx) {
      return 'hovered';
    }
    return 'default';
  };

  const handleSelectBlossom = (
    idx: number,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setSelectedIndex(idx);
    const rect = e.currentTarget.getBoundingClientRect();
    const memory = visibleMemories[idx];
    if (memory) {
      onSpawnHeart(
        rect.left + rect.width / 2,
        Math.max(60, rect.top - 10),
        `Blossom 0${idx + 1}: ${memory.title}`,
      );
    }
  };

  const handleBlossomKeyDown = (
    idx: number,
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => {
    const count = visibleMemories.length;
    if (count === 0) return;
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIdx = (idx + 1) % count;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIdx = (idx - 1 + count) % count;
    } else if (e.key === 'Home') {
      nextIdx = 0;
    } else if (e.key === 'End') {
      nextIdx = count - 1;
    }
    if (nextIdx !== null) {
      e.preventDefault();
      setSelectedIndex(nextIdx);
      setHoveredIndex(nextIdx);
      blossomButtonRefs.current[nextIdx]?.focus();
    }
  };

  const handleTapWhisperLight = (
    light: BranchWhisperLight,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setActiveWhisper((prev) => (prev?.id === light.id ? null : light));
    const rect = e.currentTarget.getBoundingClientRect();
    onSpawnHeart(
      rect.left + rect.width / 2,
      Math.max(60, rect.top - 10),
      light.whisper,
    );
  };

  return (
    <div
      ref={ref}
      id="memory-sakura-tree"
      data-tree-drawn={treeDrawn ? 'true' : 'false'}
      data-active-branch={highlightedBranchIndex}
      className={`memory-sakura-sanctuary ${
        treeDrawn ? 'is-drawn' : 'is-budding'
      }`}
    >
      <div className="sakura-sanctuary-header">
        <div>
          <span className="sakura-sanctuary-eyebrow">
            SIGNATURE CANOPY // THE MEMORY SAKURA
          </span>
          <h3 className="sakura-sanctuary-title">
            Each blossom holds a moment along our branches.
          </h3>
        </div>
        <p className="sakura-sanctuary-hint">
          Hover, focus, or tap any numbered sakura blossom on the tree (or use
          arrow keys) to preview its memory and illuminate its branch—or open
          the full keepsake frame without losing your place in the canopy.
        </p>
      </div>

      <div className="sakura-interactive-layout">
        {/* Left / Primary Column: Laptop-First Interactive Cherry Blossom Tree Stage + Quick Selector */}
        <div className="sakura-stage-column">
          <div
            className="sakura-tree-canvas"
            role="group"
            aria-label="Interactive Memory Sakura Tree with six memory blossoms and three hidden branch lights"
          >
            {/* Optional Selective Atmospheric Video / Still Backdrop Accent */}
            <AtmosphericVideoAccent
              slotId="sakura-canopy-atmosphere"
              posterSrc="/api/media/photos/portrait-01"
              reducedMotion={reducedMotion}
              className="sakura-canvas-atmosphere-accent"
            />

            {/* Ambient Celestial Orb in Canopy (Moon in Moonlight, Sun in Sunshine) */}
            <div className="sakura-canopy-celestial-orb" aria-hidden="true" />

            {/* Hand-Drawn Trunk, Asymmetric Branches & Delicate Blossoms SVG */}
            <svg
              viewBox="0 0 600 500"
              preserveAspectRatio="xMidYMid meet"
              aria-hidden="true"
              focusable="false"
              className="sakura-tree-svg"
            >
              {/* Distant Soft Canopy Silhouette Boughs for Laptop Depth */}
              <path
                d="M 284 280 C 210 250 145 232 88 218 M 316 266 C 388 238 452 220 512 204 M 298 205 C 244 162 198 134 152 118"
                fill="none"
                className="sakura-stroke-distant"
                strokeWidth="1.15"
                strokeLinecap="round"
              />

              {/* Grounded Root & Horizon Line */}
              <path
                d="M 86 468 Q 300 448 514 468"
                fill="none"
                className="sakura-stroke-ground"
                strokeWidth="1.7"
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 820ms var(--ease-cinematic)',
                }}
              />

              {/* Primary Organic Trunk (Left & Right Contours + Heartwood Grain) */}
              <path
                d="M 270 465 C 282 415 292 365 296 300 C 298 255 288 215 268 175"
                fill="none"
                className="sakura-stroke-trunk"
                strokeWidth="4.4"
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 960ms var(--ease-cinematic) 80ms',
                }}
              />
              <path
                d="M 328 465 C 314 415 308 362 308 298 C 308 250 322 210 352 168"
                fill="none"
                className="sakura-stroke-trunk"
                strokeWidth="4"
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 960ms var(--ease-cinematic) 120ms',
                }}
              />

              {/* Branch 00: Lower West Bough -> Blossom 01 (24%, 62% => ~144, 310) */}
              <path
                data-branch-index={0}
                d="M 294 342 C 250 332 198 322 144 310 C 118 304 96 292 82 280"
                fill="none"
                className={`sakura-stroke-branch ${
                  highlightedBranchIndex === 0 ? 'is-branch-highlighted' : ''
                }`}
                strokeWidth={highlightedBranchIndex === 0 ? '3.5' : '2.6'}
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 920ms var(--ease-cinematic) 220ms, stroke-width 240ms ease',
                }}
              />

              {/* Branch 01: Lower East Bough -> Blossom 02 (74%, 58% => ~444, 290) */}
              <path
                data-branch-index={1}
                d="M 308 326 C 356 314 402 302 444 290 C 476 280 502 268 520 252"
                fill="none"
                className={`sakura-stroke-branch ${
                  highlightedBranchIndex === 1 ? 'is-branch-highlighted' : ''
                }`}
                strokeWidth={highlightedBranchIndex === 1 ? '3.5' : '2.6'}
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 920ms var(--ease-cinematic) 280ms, stroke-width 240ms ease',
                }}
              />

              {/* Branch 02: Mid Canopy West Bough -> Blossom 03 (32%, 38% => ~192, 190) */}
              <path
                data-branch-index={2}
                d="M 288 248 C 252 224 220 206 192 190 C 160 172 132 162 108 156"
                fill="none"
                className={`sakura-stroke-branch ${
                  highlightedBranchIndex === 2 ? 'is-branch-highlighted' : ''
                }`}
                strokeWidth={highlightedBranchIndex === 2 ? '3.2' : '2.2'}
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 900ms var(--ease-cinematic) 360ms, stroke-width 240ms ease',
                }}
              />

              {/* Branch 03: Mid Canopy East Bough -> Blossom 04 (68%, 36% => ~408, 180) */}
              <path
                data-branch-index={3}
                d="M 316 238 C 352 214 382 194 408 180 C 442 162 474 150 502 144"
                fill="none"
                className={`sakura-stroke-branch ${
                  highlightedBranchIndex === 3 ? 'is-branch-highlighted' : ''
                }`}
                strokeWidth={highlightedBranchIndex === 3 ? '3.2' : '2.2'}
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 900ms var(--ease-cinematic) 420ms, stroke-width 240ms ease',
                }}
              />

              {/* Branch 04: Crown Heart Bough -> Blossom 05 (46%, 22% => ~276, 110) */}
              <path
                data-branch-index={4}
                d="M 282 196 C 278 158 276 132 276 110 C 276 86 296 68 318 62"
                fill="none"
                className={`sakura-stroke-twig ${
                  highlightedBranchIndex === 4 ? 'is-branch-highlighted' : ''
                }`}
                strokeWidth={highlightedBranchIndex === 4 ? '2.8' : '1.9'}
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 940ms var(--ease-cinematic) 480ms, stroke-width 240ms ease',
                }}
              />

              {/* Branch 05: Inner Sanctuary Bough -> Blossom 06 (56%, 46% => ~336, 230) */}
              <path
                data-branch-index={5}
                d="M 296 265 C 314 248 326 238 336 230 C 352 216 368 206 382 198"
                fill="none"
                className={`sakura-stroke-twig ${
                  highlightedBranchIndex === 5 ? 'is-branch-highlighted' : ''
                }`}
                strokeWidth={highlightedBranchIndex === 5 ? '2.8' : '1.9'}
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 940ms var(--ease-cinematic) 520ms, stroke-width 240ms ease',
                }}
              />

              {/* Fine Decorative Secondary Twigs & Ambient Blossom Clusters */}
              <path
                d="M 192 190 C 184 162 196 138 214 124 M 408 180 C 418 152 404 126 382 112 M 144 310 C 134 282 146 258 164 246 M 444 290 C 458 262 446 238 428 226"
                fill="none"
                className="sakura-stroke-twig"
                strokeWidth="1.2"
                strokeLinecap="round"
                pathLength={100}
                style={{
                  strokeDasharray: 100,
                  strokeDashoffset: treeDrawn ? 0 : 100,
                  transition: reducedMotion
                    ? 'none'
                    : 'stroke-dashoffset 920ms var(--ease-cinematic) 560ms',
                }}
              />
            </svg>

            {/* Interactive Memory Blossom Nodes Along the Branches */}
            {visibleMemories.map((item, idx) => {
              const pos =
                SAKURA_BRANCH_POSITIONS[idx] ?? SAKURA_BRANCH_POSITIONS[0];
              const state = getBlossomState(item, idx);
              const plateNo = String(idx + 1).padStart(2, '0');
              const isSelected = selectedIndex === idx;

              return (
                <button
                  key={item.id}
                  ref={(el) => {
                    blossomButtonRefs.current[idx] = el;
                  }}
                  type="button"
                  data-blossom-slot={item.id}
                  data-blossom-state={state}
                  className={`sakura-blossom-node state-${state} ${
                    isSelected ? 'is-selected' : ''
                  }`}
                  style={{
                    left: `${pos.xPercent}%`,
                    top: `${pos.yPercent}%`,
                  }}
                  onClick={(e) => handleSelectBlossom(idx, e)}
                  onKeyDown={(e) => handleBlossomKeyDown(idx, e)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() =>
                    setHoveredIndex((prev) => (prev === idx ? null : prev))
                  }
                  onFocus={() => setHoveredIndex(idx)}
                  onBlur={() =>
                    setHoveredIndex((prev) => (prev === idx ? null : prev))
                  }
                  aria-pressed={isSelected}
                  aria-label={`Memory blossom ${plateNo}: ${item.title} (${state})`}
                >
                  <span className="sakura-blossom-flower" aria-hidden="true">
                    <svg viewBox="0 0 48 48" className="sakura-flower-svg">
                      <path
                        d="M 24 24 C 17 12 20 3 24 6 C 28 3 31 12 24 24 Z
                           M 24 24 C 35 16 45 18 42 23 C 45 27 35 30 24 24 Z
                           M 24 24 C 34 32 38 43 32 41 C 29 45 24 35 24 24 Z
                           M 24 24 C 24 35 19 45 16 41 C 10 43 14 32 24 24 Z
                           M 24 24 C 13 30 3 27 6 23 C 3 18 13 16 24 24 Z"
                        className="sakura-petal-path"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="4.2"
                        className="sakura-pistil-core"
                      />
                    </svg>
                  </span>
                  <span className="sakura-blossom-badge">{plateNo}</span>
                  <span className="sakura-blossom-tooltip" aria-hidden="true">
                    {item.title}
                  </span>
                </button>
              );
            })}

            {/* Optional Hidden Messages Represented by Tiny Lights Near Branches */}
            {BRANCH_WHISPER_LIGHTS.map((light) => {
              const isLit = activeWhisper?.id === light.id;
              return (
                <button
                  key={light.id}
                  type="button"
                  className={`sakura-branch-whisper-btn ${
                    isLit ? 'is-lit' : ''
                  }`}
                  style={{
                    left: `${light.xPercent}%`,
                    top: `${light.yPercent}%`,
                  }}
                  onClick={(e) => handleTapWhisperLight(light, e)}
                  aria-pressed={isLit}
                  aria-label={light.label}
                  title="Tap tiny branch light for a hidden note"
                >
                  <span className="sakura-whisper-spark" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {/* Accessible Quick Blossom Selector Strip (Helpful on both Laptop & Mobile) */}
          <div
            className="sakura-blossom-quick-strip"
            role="toolbar"
            aria-label="Quick blossom selector"
          >
            {visibleMemories.map((item, idx) => {
              const plateNo = String(idx + 1).padStart(2, '0');
              const isSelected = selectedIndex === idx;
              const isOpened = Boolean(openedMemoryIds[item.id]);
              return (
                <button
                  key={`quick-${item.id}`}
                  type="button"
                  className={`sakura-quick-pill ${
                    isSelected ? 'is-selected' : ''
                  } ${isOpened ? 'is-opened' : ''}`}
                  onClick={(e) => handleSelectBlossom(idx, e)}
                  aria-pressed={isSelected}
                >
                  <span className="sakura-quick-pill-num">{plateNo}</span>
                  <span className="sakura-quick-pill-label">{item.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right / Secondary Column: Active Blossom Memory Inspector (Preserves Place in Tree) */}
        {activeMemory && (
          <div
            className="sakura-blossom-inspector"
            role="region"
            aria-live="polite"
            aria-label="Selected Memory Blossom Preview"
          >
            <div className="sakura-inspector-meta">
              <span>
                BLOSSOM 0{selectedIndex + 1} //{' '}
                {SAKURA_BRANCH_POSITIONS[selectedIndex]?.branchLabel ||
                  'SAKURA BOUGH'}
              </span>
              <span className="sakura-state-pill">
                STATE: {getBlossomState(activeMemory, selectedIndex).toUpperCase()}
              </span>
            </div>

            <div className="sakura-inspector-media-wrap">
              <MediaRevealFrame
                slotId={`${activeMemory.id}-tree-preview`}
                src={
                  activeMemory.mediaType === 'video'
                    ? `/api/media/video/${encodeURIComponent(
                        activeMemory.fileStem,
                      )}`
                    : `/api/media/photos/${encodeURIComponent(
                        activeMemory.fileStem,
                      )}`
                }
                posterSrc={
                  activeMemory.posterStem
                    ? `/api/media/photos/${encodeURIComponent(
                        activeMemory.posterStem,
                      )}`
                    : undefined
                }
                mediaType={activeMemory.mediaType || 'image'}
                alt={activeMemory.title}
                aspect="landscape"
                revealVariant="organic-curve"
                decorativeAccent="botanical"
                reducedMotion={reducedMotion}
                fallbackTitle={activeMemory.title}
                fallbackSubtitle={activeMemory.caption}
              />
            </div>

            <div className="sakura-inspector-date">
              <Calendar size={12} />
              <span>{activeMemory.dateLabel}</span>
            </div>

            <h4 className="sakura-inspector-title">{activeMemory.title}</h4>
            <p className="sakura-inspector-caption">{activeMemory.caption}</p>

            {activeMemory.handwrittenNote && (
              <div className="sakura-inspector-handwritten">
                <span>“{activeMemory.handwrittenNote}”</span>
                <Heart size={13} fill="currentColor" />
              </div>
            )}

            <button
              type="button"
              className="sakura-open-plate-btn"
              onClick={() => onOpenMemoryLightbox(selectedIndex)}
            >
              <Eye size={15} />
              <span>
                Open Blossom 0{selectedIndex + 1} Full Keepsake Frame
              </span>
            </button>

            {activeWhisper && (
              <div className="sakura-whisper-reveal-banner" role="note">
                <Sparkles size={14} style={{ flexShrink: 0 }} />
                <span>{activeWhisper.whisper}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
