import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import {
  handleApiRequest,
  resetLoginRateLimiter,
  type Env,
} from '../../functions/api/[[route]]';

const testEnv: Env = {
  SHU_PASSWORD: 'my-dearest-shu',
  SHU_SESSION_SECRET:
    '9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e',
  SHU_PASSWORD_HINT: 'Three words for Shu',
};

describe('Complete Shu Experience Journey', () => {
  let cookieJar = '';

  beforeEach(() => {
    cookieJar = '';
    resetLoginRateLimiter();
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const urlStr =
          typeof input === 'string'
            ? input.startsWith('http')
              ? input
              : `http://localhost${input}`
            : input instanceof URL
              ? input.toString()
              : input.url;

        const headers = new Headers(init?.headers);
        if (cookieJar) {
          headers.set('Cookie', cookieJar);
        }

        const req = new Request(urlStr, {
          ...init,
          headers,
        });

        const res = await handleApiRequest(req, testEnv);
        const setCookie = res.headers.get('Set-Cookie');
        if (setCookie) {
          if (setCookie.includes('Max-Age=0')) {
            cookieJar = '';
          } else {
            cookieJar = setCookie.split(';')[0];
          }
        }
        return res;
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('guides Shu from the password entrance through memories, media fallbacks, stars, song, letter, and ending', async () => {
    render(<App />);

    // 1. Wait for entrance screen
    const heading = await screen.findByRole('heading', {
      name: /For Shu, With All My Heart/i,
    });
    expect(heading).toBeInTheDocument();

    // 2. Test wrong password error feedback
    const input = screen.getByLabelText(/Secret Phrase for Shu/i);
    fireEvent.change(input, { target: { value: 'wrong-guess' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Break the Seal & Enter/i }),
    );

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/wasn’t quite the secret phrase/i);

    // 3. Enter the correct password
    fireEvent.change(input, { target: { value: 'my-dearest-shu' } });
    fireEvent.click(
      screen.getByRole('button', { name: /Break the Seal & Enter/i }),
    );

    // 4. Verify hero & protected story content loads in Moonlight world
    await waitFor(
      () => {
        expect(
          screen.getByRole('heading', {
            name: /Welcome to your little corner of the world, Shu/i,
          }),
        ).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    expect(document.body.dataset.world).toBe('moonlight');
    expect(
      screen.getByRole('heading', { name: /You’re my sunshine\./i }),
    ).toBeInTheDocument();

    // Verify all replaceable media slot identifiers exist in the rendered DOM
    for (const slotId of [
      'portrait-01',
      'film-01',
      'memory-01',
      'memory-02',
      'memory-03',
      'memory-04',
      'memory-05',
      'memory-06',
      'final-photo',
    ]) {
      expect(
        document.querySelector(`[data-slot-id="${slotId}"]`),
      ).toBeTruthy();
    }

    // Verify resilient media fallback plate renders if an image fails to load
    const firstSlotImg = document.querySelector(
      '[data-slot-id="memory-01"] img',
    );
    expect(firstSlotImg).toBeTruthy();
    fireEvent.error(firstSlotImg!);
    expect(
      document.querySelector('[data-slot-id="memory-01"] .media-fallback-plate'),
    ).toBeTruthy();

    // Verify manual Moonlight <-> Sunshine theme toggle
    const themeToggleBtn = screen.getByRole('button', {
      name: /Switch between Moonlight and Sunshine theme/i,
    });
    fireEvent.click(themeToggleBtn);
    expect(document.body.dataset.world).toBe('sunshine');
    fireEvent.click(themeToggleBtn);
    expect(document.body.dataset.world).toBe('moonlight');

    // 5. Open a secret margin note in Chapter I
    const secretBtn = screen.getByRole('button', {
      name: /Tucked margin note #1/i,
    });
    fireEvent.click(secretBtn);
    expect(
      screen.getByText(/Whenever I see your name pop up on my screen/i),
    ).toBeInTheDocument();

    // 6. Interact with the Memory Sakura Tree blossoms (default -> hovered -> tapped -> opened) & hidden branch light
    const blossom02 = screen.getByRole('button', {
      name: /Memory blossom 02:/i,
    });
    expect(blossom02.getAttribute('data-blossom-state')).toBe('default');

    fireEvent.mouseEnter(blossom02);
    expect(blossom02.getAttribute('data-blossom-state')).toBe('hovered');

    fireEvent.click(blossom02);
    expect(blossom02.getAttribute('data-blossom-state')).toBe('tapped');

    // Tap a hidden branch whisper light on the Memory Sakura Tree
    const branchLight1 = screen.getByRole('button', {
      name: /Branch light 1: Quiet roots/i,
    });
    fireEvent.click(branchLight1);
    expect(
      document.querySelector('.sakura-whisper-reveal-banner')?.textContent,
    ).toMatch(/Every small kindness from you took root here, Shu/i);

    // Open a memory in the full-screen Lightbox, test keyboard navigation, flip photo, and close with Escape
    const firstMemoryCard = screen.getByRole('button', {
      name: /Open memory 1:/i,
    });
    fireEvent.click(firstMemoryCard);

    // Verify Blossom 01 transitions to 'opened' state while preserving place in the tree
    const blossom01 = screen.getByRole('button', {
      name: /Memory blossom 01:/i,
    });
    expect(blossom01.getAttribute('data-blossom-state')).toBe('opened');

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    const flipBtn = screen.getByRole('button', {
      name: /Turn photo over — read handwritten note/i,
    });
    fireEvent.click(flipBtn);
    expect(
      screen.getByText(/Placeholder Back-of-Photo Story 01/i),
    ).toBeInTheDocument();

    // Navigate to next memory with ArrowRight, then back with ArrowLeft
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText(/ARCHIVAL PLATE 2 OF 6/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText(/ARCHIVAL PLATE 1 OF 6/i)).toBeInTheDocument();

    // Close lightbox via Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // 7. Light all 5 stars in the constellation to unlock the secret keepsake
    const lightAllBtn = screen.getByRole('button', {
      name: /Light All 5 Stars Together/i,
    });
    fireEvent.click(lightAllBtn);
    expect(
      screen.getByRole('region', { name: /Unlocked Constellation Keepsake/i }),
    ).toBeInTheDocument();

    // 8. Break the wax seal on the Personal Letter & reveal full letter
    const openLetterBtn = screen.getByRole('button', {
      name: /Break the Wax Seal & Read Letter/i,
    });
    fireEvent.click(openLetterBtn);
    expect(
      screen.getByRole('heading', { name: /My dearest Shu,/i }),
    ).toBeInTheDocument();

    const skipRevealBtn = screen.queryByRole('button', {
      name: /Reveal Full Letter Immediately/i,
    });
    if (skipRevealBtn) {
      fireEvent.click(skipRevealBtn);
    }
    expect(screen.getByText(/With all my affection,/i)).toBeInTheDocument();

    // 9. Test Music Player controls (mute/volume/seek) and missing-audio fallback alert
    const muteBtn = screen.getByRole('button', { name: /Mute audio/i });
    fireEvent.click(muteBtn);
    expect(
      screen.getByRole('button', { name: /Unmute audio/i }),
    ).toBeInTheDocument();

    const audioEl = document.querySelector('audio');
    expect(audioEl).toBeTruthy();
    fireEvent.error(audioEl!);
    expect(
      await screen.findByText(/Song file not found yet in private-content\/audio\//i),
    ).toBeInTheDocument();

    // 10. Test Reduced Motion toggle & Finale heart totem
    const motionBtn = screen.getByRole('button', { name: /Motion:/i });
    fireEvent.click(motionBtn);
    expect(document.body.classList.contains('reduced-motion-mode')).toBe(true);

    const finaleHeartBtn = screen.getByRole('button', {
      name: /Tap to send a little heart into the night sky/i,
    });
    fireEvent.click(finaleHeartBtn);
    expect(
      screen.getByRole('button', {
        name: /Sent 1 little heart into the night sky/i,
      }),
    ).toBeInTheDocument();

    // 11. Test Lock button (logout) and relocking back to the Password Entrance
    const lockBtn = screen.getByRole('button', {
      name: /Lock envelope and return to password screen/i,
    });
    fireEvent.click(lockBtn);

    expect(
      await screen.findByRole('heading', {
        name: /For Shu, With All My Heart/i,
      }),
    ).toBeInTheDocument();
  });

  it('renders MaskedTextReveal, SvgLineDraw, and ParallaxLayer cleanly in both standard and reduced-motion modes', async () => {
    const {
      MaskedTextReveal,
      ParallaxLayer,
      SvgLineDraw,
      getActiveParallaxSubscriberCount,
    } = await import('../components/motion/MotionPrimitives');

    const { rerender, unmount } = render(
      <div>
        <MaskedTextReveal
          as="h2"
          text="You’re my moon and my sunshine"
          mode="words"
          reducedMotion={false}
        />
        <ParallaxLayer speed={0.08} maxOffset={18} reducedMotion={false}>
          <span>Parallax child 1</span>
        </ParallaxLayer>
        <ParallaxLayer
          speed={0.05}
          maxOffset={14}
          axis="x"
          reducedMotion={false}
        >
          <span>Parallax child 2</span>
        </ParallaxLayer>
        <SvgLineDraw d="M 0,50 L 100,50" isDrawn={true} reducedMotion={false} />
      </div>,
    );

    expect(
      screen.getByRole('heading', { name: /You’re my moon and my sunshine/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Parallax child 1')).toBeInTheDocument();
    expect(getActiveParallaxSubscriberCount()).toBe(2);

    // Rerender in reducedMotion=true mode: subscribers should detach and transform reset
    rerender(
      <div>
        <MaskedTextReveal
          as="h2"
          text="You’re my moon and my sunshine"
          mode="lines"
          reducedMotion={true}
        />
        <ParallaxLayer speed={0.08} maxOffset={18} reducedMotion={true}>
          <span>Parallax child 1</span>
        </ParallaxLayer>
        <ParallaxLayer
          speed={0.05}
          maxOffset={14}
          axis="x"
          reducedMotion={true}
        >
          <span>Parallax child 2</span>
        </ParallaxLayer>
        <SvgLineDraw d="M 0,50 L 100,50" isDrawn={false} reducedMotion={true} />
      </div>,
    );

    expect(getActiveParallaxSubscriberCount()).toBe(0);
    expect(
      screen.getByRole('heading', { name: /You’re my moon and my sunshine/i }),
    ).toBeInTheDocument();

    unmount();
    expect(getActiveParallaxSubscriberCount()).toBe(0);
  });

  it('supports hand-drawn SVG motifs, selectable image reveal masks, WorldTransitionStage, and reversible scroll cleanup', async () => {
    const { act } = await import('@testing-library/react');
    const {
      HandDrawnOrnament,
      HAND_DRAWN_MOTIFS,
      MediaRevealFrame,
      WorldTransitionStage,
      ChoreographedScene,
      getActiveParallaxSubscriberCount,
    } = await import('../components/motion/MotionPrimitives');

    // Track IntersectionObserver callbacks and disconnect calls to verify scroll reversal & cleanup
    let observerCallback: IntersectionObserverCallback | null = null;
    const disconnectSpy = vi.fn();
    const OriginalIO = globalThis.IntersectionObserver;

    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = '0px';
      readonly thresholds: ReadonlyArray<number> = [0];
      constructor(cb: IntersectionObserverCallback) {
        observerCallback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {
        disconnectSpy();
      }
      takeRecords(): IntersectionObserverEntry[] {
        return [];
      }
    }

    globalThis.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;

    try {
      const motifNames = Object.keys(HAND_DRAWN_MOTIFS) as Array<
        keyof typeof HAND_DRAWN_MOTIFS
      >;

      const { container, rerender, unmount } = render(
        <div>
          {motifNames.map((motif) => (
            <HandDrawnOrnament
              key={motif}
              motif={motif}
              stroke="#d6c8f7"
              triggerOnScroll={false}
              isDrawn={true}
              reducedMotion={false}
            />
          ))}

          <MediaRevealFrame
            slotId="test-organic"
            src="/api/media/photos/memory-01"
            alt="Organic mask keepsake"
            aspect="portrait"
            revealVariant="organic-curve"
            decorativeAccent="botanical"
            phase="entering"
            foregroundOverlay={<span>Foregroundpetal</span>}
          />

          <MediaRevealFrame
            slotId="test-radial"
            src="/api/media/photos/memory-02"
            alt="Radial mask keepsake"
            aspect="square"
            revealVariant="radial"
            decorativeAccent="celestial"
            phase="in-view"
          />

          <WorldTransitionStage
            id="test-world-stage"
            activeWorld="moonlight"
            reducedMotion={false}
          >
            <p>Transition content</p>
          </WorldTransitionStage>

          <ChoreographedScene
            id="test-reversible-scene"
            vocabulary="ink-draw"
            reversible={true}
            reducedMotion={false}
          >
            <p>Reversible scene body</p>
          </ChoreographedScene>

          <ChoreographedScene
            id="test-stillness-scene"
            vocabulary="stillness"
            reducedMotion={false}
          >
            <p>Stillness scene body</p>
          </ChoreographedScene>
        </div>,
      );

      // All decorative hand-drawn SVGs must be aria-hidden="true"
      const svgs = container.querySelectorAll('svg.hand-drawn-ornament');
      expect(svgs.length).toBeGreaterThanOrEqual(motifNames.length);
      svgs.forEach((svg) => {
        expect(svg.getAttribute('aria-hidden')).toBe('true');
      });

      // Verify selectable image reveal variants & decorative accents
      const organicFrame = container.querySelector(
        '[data-slot-id="test-organic"]',
      );
      expect(organicFrame?.getAttribute('data-reveal-variant')).toBe(
        'organic-curve',
      );
      expect(
        organicFrame?.querySelector('.accent-botanical'),
      ).toBeInTheDocument();
      expect(
        organicFrame?.querySelector('.media-foreground-separation'),
      ).toBeInTheDocument();

      const radialFrame = container.querySelector(
        '[data-slot-id="test-radial"]',
      );
      expect(radialFrame?.getAttribute('data-reveal-variant')).toBe('radial');
      expect(
        radialFrame?.querySelector('.accent-celestial'),
      ).toBeInTheDocument();

      // Stillness vocabulary is immediately in-view without waiting for scroll
      const stillnessEl = container.querySelector('#test-stillness-scene');
      expect(stillnessEl?.getAttribute('data-scroll-phase')).toBe('in-view');

      // Test reversible scroll choreography on #test-reversible-scene:
      // 1) Initial state is 'entering'
      const reversibleEl = container.querySelector('#test-reversible-scene')!;
      expect(reversibleEl.getAttribute('data-scroll-phase')).toBe('entering');

      // 2) Intersecting -> 'in-view'
      act(() => {
        observerCallback?.(
          [
            {
              isIntersecting: true,
              target: reversibleEl,
              boundingClientRect: { top: 120 } as DOMRectReadOnly,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        );
      });
      expect(reversibleEl.getAttribute('data-scroll-phase')).toBe('in-view');
      expect(reversibleEl.getAttribute('data-has-revealed')).toBe('true');

      // 3) Scrolled past top of viewport (top < 0) -> 'exiting-top' (remains visible)
      act(() => {
        observerCallback?.(
          [
            {
              isIntersecting: false,
              target: reversibleEl,
              boundingClientRect: { top: -80 } as DOMRectReadOnly,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        );
      });
      expect(reversibleEl.getAttribute('data-scroll-phase')).toBe(
        'exiting-top',
      );
      expect(reversibleEl.classList.contains('is-visible')).toBe(true);

      // 4) Scrolled back up so element is below viewport again (top > 0) -> reverses cleanly to 'entering'
      act(() => {
        observerCallback?.(
          [
            {
              isIntersecting: false,
              target: reversibleEl,
              boundingClientRect: { top: 640 } as DOMRectReadOnly,
            } as IntersectionObserverEntry,
          ],
          {} as IntersectionObserver,
        );
      });
      expect(reversibleEl.getAttribute('data-scroll-phase')).toBe('entering');

      // 5) Rerender with reducedMotion=true: everything settles to 'in-view' and 'none' reveal variant
      rerender(
        <div>
          <MediaRevealFrame
            slotId="test-organic"
            src="/api/media/photos/memory-01"
            alt="Organic mask keepsake"
            aspect="portrait"
            revealVariant="organic-curve"
            decorativeAccent="botanical"
            phase="entering"
            reducedMotion={true}
          />
          <WorldTransitionStage
            id="test-world-stage"
            activeWorld="sunshine"
            reducedMotion={true}
          >
            <p>Transition content</p>
          </WorldTransitionStage>
          <ChoreographedScene
            id="test-reversible-scene"
            vocabulary="ink-draw"
            reversible={true}
            reducedMotion={true}
          >
            <p>Reversible scene body</p>
          </ChoreographedScene>
        </div>,
      );

      expect(
        container
          .querySelector('[data-slot-id="test-organic"]')
          ?.getAttribute('data-reveal-variant'),
      ).toBe('none');
      expect(
        container
          .querySelector('#test-reversible-scene')
          ?.getAttribute('data-scroll-phase'),
      ).toBe('in-view');

      // Unmount verifies observer disconnect & scroll coordinator cleanup
      unmount();
      expect(disconnectSpy).toHaveBeenCalled();
      expect(getActiveParallaxSubscriberCount()).toBe(0);
    } finally {
      globalThis.IntersectionObserver = OriginalIO;
    }
  });
});

