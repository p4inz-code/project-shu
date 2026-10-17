# Research → Decisions → Plan

Workflow followed: research, decide, plan, then execute. Sources are references only; nothing is copied.
Coverage note: botanical detail was well sourced; sources on 3D-on-canvas technique, romantic-writing craft and unusual-QA checklists were thin, so those decisions are marked *own synthesis*.

## 1. Research findings (what we learned)

| Topic | Finding | Source |
|---|---|---|
| Yoshino cherry anatomy | Smooth grey bark with horizontal notch-like lenticels (more ridged with age); slender reddish-brown twigs, pointed darker buds; form is vase-like / ascending then arching, fairly flat-topped | [Virginia Tech dendrology](https://dendro.cnre.vt.edu/dendrology/carddetail.cfm?ID=312), [Farmers Journal](https://www.farmersjournal.ie/life/gardening/the-beautiful-yoshino-cherry-tree-203581) |
| Flower structure | Five petals, each with a small notch (frilled look); clusters of 2–6 on short spurs; buds deep pink, opening to pale pink, then near-white before falling; reddish calyx; dark-pink mark at petal base; stamens shorter than petals, pale filaments; one pistil | [Prunus serrulata flora](https://nzflora.info/factsheet/Taxon/Prunus-serrulata.html), [Wikipedia](https://en.wikipedia.org/wiki/Prunus_serrulata) |
| 3D tree technique | Modified L-system with generalized cylinders; petals from a rose-curve variant; depth via trees at different z with atmospheric perspective; painter's-algorithm depth sort | [Stanford CS348B sakura writeup](https://graphics.stanford.edu/wikis/cs348b-07/PriscillaPham/FinalProject), [U of T showcase](https://www.dgp.toronto.edu/~joonho/courses/csc317-2025-09/showcase/03/) |
| Falling petal motion | Light objects fall by fluttering (side-to-side) and tumbling (rotation + drift); wind via noise field; per-petal speed/sway/rotation variance and depth layers | [Flutter/tumble paper](https://unpaywall.org/10.1007%2Fs00371-013-0783-7), [Framer sakura component](https://www.framer.com/community/marketplace/components/sakura-petals/) |
| Non-repeating motion | Plain Perlin/sine loops read as cyclical; fix by layering incommensurate frequencies, randomising per-cycle parameters, seeded variety | [Processing forum](https://discourse.processing.org/t/mitigating-periodicity-in-perlin-noise/31211) (+ own synthesis) |
| Scroll storytelling | Story first; three layers (slow background, normal content, fast foreground); reveal one beat at a time; keep headings at normal speed; native scrolling | [StudioMeyer](https://studiomeyer.io/en/blog/scroll-storytelling), [CyberOptik](https://www.cyberoptik.net/glossary/parallax-scrolling/) |
| Romantic writing | Specificity grounds feeling in concrete experience; restraint (what is *not* said) is powerful (Austen); negation/comparison structure (Neruda XVII); second person | [UT Austin on Persuasion](https://lifeandletters.la.utexas.edu/2010/05/my-dearest/), [Brookes](https://brookes.ac.uk/about-brookes/news/2022/02/how-to-write-a-love-letter-eighteenth-century-styl), [Neruda XVII analysis](https://poemanalysis.com/pablo-neruda/one-hundred-love-sonnets-xvii/) |
| Photo collage | One constant element (palette/frame) with varied prints; slight tilt and border variation; handwritten captions; slight overlap; clip-on string lights; space between clips | [Adobe Express](https://www.adobe.com/express/discover/ideas/collage), [Polaroid Booth](https://polaroidbooth.com/blog-polaroid-wall-gallery.html) |
| Audio UX | Music must be opt-in, user-gesture started; iOS needs a direct gesture for each start; show a clear audio on/off control | [Bitmovin autoplay policies](https://bitmovin.com/autoplay-policies-safari-14-chrome-64/), [Agora](https://docs.agora.io/en/realtime-media/rtc/build/optimize-and-operate/autoplay) |
| Canvas performance | Cap devicePixelRatio ~1.5; scale particle count by area and drop on coarse pointers; stop loops off-screen and when hidden; clamp dt after tab pause; one static frame for reduced motion | [Mintlify perf guide](https://www.mintlify.com/zz-plant/stims/guides/performance), [PlayCanvas DPR](https://developer.playcanvas.com/user-manual/optimization/runtime-devicepixelratio/) |
| Accessibility | prefers-reduced-motion must disable parallax/scroll motion; auto-playing motion >5s needs a way to stop (WCAG 2.2.2) | [W3C 2.3.3](https://w3c.github.io/wcag/understanding/animation-from-interactions.html), [specification.website](https://specification.website/spec/accessibility/reduced-motion/) |
| Shared private link | `noindex` does not stop chat apps building previews; keep OG tags generic and non-personal | [OG overview](https://dev.to/lirantal/how-to-get-social-media-previews-right-on-astro-blog-with-opengraph-meta-tags-25h6) |
| Unusual QA | Adversarial/random-action testing with a replayable seed; forced colours and high contrast; keyboard, mouse and touch paths | [chaosbringer](https://cdn.jsdelivr.net/npm/chaosbringer@0.9.0/README.md), [Google front-end testing](https://developers.google.cn/solutions/content-driven/frontend/testing) |

## 2. Decisions

1. **Tree**: replace the flat SVG with a *procedural pseudo-3D* canvas tree. A fresh random skeleton each visit (Yoshino form: short trunk, 4–5 ascending-then-arching boughs, 3 levels of sub-branches, clusters of 2–5 flowers on spurs). Perspective projection + painter's sort, orbit by pointer/drag, atmospheric perspective, lit bark with lenticels, five-petal notched sprites in four stages (bud → half → open → aged-white), 3D flutter/tumble petal fall, ground pile, foreground blades. The six memory blossoms and three whisper lights are real nodes on the tree; the HTML buttons follow their projected positions (stays accessible).
2. **Randomness engine** (`site/fx.js`): quasi-periodic noise (incommensurate sines), Poisson-timed events, per-cycle re-randomised loops, wind with random gusts. No fixed-period keyframes on ambient effects.
3. **Depth everywhere**: `data-depth` pointer parallax wrappers, silhouette/haze layers per scene, foreground petals in front of content, softened shadows.
4. **Controls**: remove the Night/Motion pill. One sound button controls all sound site-wide (ambient piano and, later, the mashup). Reduced motion is honoured automatically from the OS setting.
5. **Collage**: "memory wall" — a string-light garland with clipped swinging polaroids plus taped prints in three sizes, handwritten captions, doodles; seeded-random layout that keeps the centre clear; numbered placeholders 10–17.
6. **Copy**: rewrite every page in an original voice that blends specificity (Mansfield), restraint (Austen), negation/comparison (Neruda), "two solitudes" tenderness (Rilke) and plain devotion; bracketed slots remain where only Atharva can supply a real detail.
7. **Shared audience**: generic OG tags + generated PNG, gentle message for non-Shu visitors after repeated misses, no personal data in HTML head, stateless (no storage).
8. **QA**: functional + chaos + environment + a11y + performance suites, reported honestly with what could not be verified (real devices).

## 3. Plan (execution order)
1. `site/fx.js` (noise, wind, loops, depth, tree) → integrate.
2. HUD removal + global sound control.
3. Randomise ambient loops/petals/gusts.
4. Depth layers per scene.
5. Collage rebuild.
6. Copy pass per page.
7. Shared-audience hardening (OG image, hints, robots).
8. Full audit suite → fix → report.
