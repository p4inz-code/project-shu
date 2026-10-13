import { useEffect, useRef, useState } from 'react';

export type ScrollViewportPhase = 'entering' | 'in-view' | 'exiting-top';

export interface RevealOnScrollOptions {
  /**
   * When true, scrolling back above the element resets its phase to 'entering'
   * and scrolling past the top sets 'exiting-top', enabling reversible scroll choreography.
   * Defaults to false for top-level story sections so primary text never disappears unexpectedly,
   * and true when explicitly enabled for reversible sequences.
   */
  reversible?: boolean;
  threshold?: number | number[];
  rootMargin?: string;
}

export function useRevealOnScroll<T extends Element = HTMLDivElement>(
  reducedMotion = false,
  options: RevealOnScrollOptions = {},
) {
  const {
    reversible = false,
    threshold = 0.12,
    rootMargin = '0px 0px -36px 0px',
  } = options;

  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(reducedMotion);
  const [hasRevealed, setHasRevealed] = useState<boolean>(reducedMotion);
  const [phase, setPhase] = useState<ScrollViewportPhase>(
    reducedMotion ? 'in-view' : 'entering',
  );

  useEffect(() => {
    if (reducedMotion) {
      setIsVisible(true);
      setHasRevealed(true);
      setPhase('in-view');
      return;
    }

    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      setHasRevealed(true);
      setPhase('in-view');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            setHasRevealed(true);
            setPhase('in-view');
            if (!reversible) {
              observer.unobserve(entry.target);
            }
          } else if (reversible) {
            if (entry.boundingClientRect.top < 0) {
              // Scrolled past top of viewport: keep visible & accessible, mark exiting-top
              setIsVisible(true);
              setHasRevealed(true);
              setPhase('exiting-top');
            } else {
              // Below viewport (user scrolled back up): reverse cleanly
              setIsVisible(false);
              setPhase('entering');
            }
          }
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion, reversible, threshold, rootMargin]);

  return { ref, isVisible, hasRevealed, phase };
}
