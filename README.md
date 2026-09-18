# AETHER ONE X

A complete, self-contained product site and interactive film for a fictional premium smartphone called the **Aether One X**. Dark, editorial, and cinematic - the homepage is a scroll-driven product film, with dedicated product pages and a configurator. Built to demonstrate a production-quality React experience with no external data, no hotlinked assets, and no backend.

> Aether One X is a fictional concept product. All specifications, benchmarks, and prices shown are illustrative demonstration values.

## Stack

- **React 19** + **TypeScript** (`verbatimModuleSyntax`, `erasableSyntaxOnly`)
- **React Router v7** (library mode) for the multi-page structure
- **Vite 8** (Node 24, native rolldown)
- **Tailwind CSS v4** (`@tailwindcss/vite`, `@theme` design tokens in `src/index.css`)
- **Motion** (via `motion/react`) for scroll film, presences, and layout animations
- **Three.js** + **@react-three/fiber** + **@react-three/drei** for real-time 3D product presentation
- **@phosphor-icons/react** for icons
- **@fontsource-variable/geist** + **geist-mono** for typography
- **oxlint** for linting

## Commands

```bash
npm install      # install dependencies
npm run dev      # local dev server
npm run build    # tsc -b && vite build (typecheck + production build)
npm run lint     # oxlint
npm run preview  # serve the production build
```

## Routes

| Route | Content |
| --- | --- |
| `/` | One continuous product film (13 acts, ~1500vh on desktop) ending in the configurator deck: arrival → frame → x-ray → A1 Ultra chip → camera macro → display → storage → battery → AetherOS → on-device AI → final hero pose, then finish/capacity + buy |
| `/cameras` | Focal-length strip, rear 3D study, lens legend |
| `/performance` | Full A1 Ultra die (tabs + metrics), side-profile 3D study |
| `/display` | Interactive 1-to-144 Hz demo with live front rail |
| `/software` | Interactive AetherOS phone, principles, on-device AI list |
| `/specifications` | Every spec category expanded, nothing tucked away |

All pages share a route-aware sticky Navbar, an editorial `PageHero`, the same Footer, and a `CtaBand` pointing at the configurator (`/#buy`).

## Structure

```
public/images/
  camera/           5 procedural SVG "photo" scenes (one per focal length)
  finishes/         3 procedural SVG rear-panel textures
src/
  data/            product.ts, software.ts - all copy/data in one place (source of truth)
  hooks/           useInView, useCountUp, useReducedMotion
  utils/           cn, format, battery (deterministic endurance math)
  components/
    ui/            Reveal (intersection reveal), SectionHeader
    layout/        Navbar (route-aware, sticky), Footer, PageHero, CtaBand
    Phone/         PhoneFrame - static CSS phone renderer (front/back), WebGL fallback
    PhoneOS/       the simulated AetherOS: state hook + app grid, notifications,
                   quick settings, and 8 mini app screens. AetherOSPhone wraps
                   PhoneFrame + the OS as the shared interactive device.
    DisplayDemo/   shared 1-144 Hz quantizer demo + controls (DisplayPage rail)
    SoC/           shared A1 Ultra die panel with CPU/GPU/NPU tabs (PerformancePage)
    PhoneViewer/   shared 3D phone: PhoneViewer (lazy canvas wrapper),
                   PhoneScene (viewport-aware pose rig), PhoneModel (procedural
                   geometry + per-instance materials), PhoneLighting (studio rig),
                   PhoneConfig (finish/lens context), usePhoneScroll (story tracker)
  film/            the homepage movie, as its own module
    story.ts       the master timeline: 13 acts + 30 keyframed poses/camera
    camera.ts      zero-alloc sampler (Catmull-Rom camera path, eased phone pose)
    scene/         FilmScene (single frame director driving everything per frame),
                   Internals (x-ray hardware: main board, A1 Ultra, battery, sensors),
                   LiveScreen (animated canvas display texture), StageLighting
                   (per-act studio light pass), materials (film-dedicated shell set)
    overlay/       FilmOverlay (editorial captions, act rail, scroll cue, and the
                   interactive AetherOS moment), chapters.tsx (all film copy),
                   primitives (kickers, spec lines, x-ray readouts), useChapter
    Film.tsx       the 1500vh scroll runway + sticky stage (WebGL fallback)
    BuyDeck.tsx    the closing configurator deck (id="buy")
  pages/           HomePage (Film + BuyDeck) + 5 product pages
```

## Notable implementation details

- **The homepage is a film, not a scroll.** One sticky stage runs ~1500vh on desktop (1100vh mobile). A single master `scrollYProgress` value drives everything - camera, phone pose, x-ray dissolve, per-act lighting, screen brightness, and chapter captions - with no window scroll listeners. The camera dollys along a Catmull-Rom path while the phone pose and fov ease between 30 authored keyframes, so the whole page reads as one continuous shot.
- **X-ray is a second material set.** `PhoneModel` accepts an optional per-instance material set; the film builds its own so the opacity dissolve never leaks into the product-page viewers. The A1 Ultra, board, battery, and camera housings are real 3D geometry inside the shell, exploded by scroll and lit by an interior glow.
- **The silicon is about to be macro-friendly.** The chip act pushes the camera to fov 36 at ~30cm from the die; the die itself gains emissive intensity and an additive circuit ring under focus.
- **Software act = touchable phone.** At that act the 3D phone holds front-on while the HTML AetherOS phone crossfades over it, keeping the interface inside "the actual screen" without a pixel-perfect projection.
- **3D framing is viewport-aware.** Each of the other seven scenes (`hero | reveal | camera | display | performance | config | final`) targets a fraction of the viewport height (0.5-0.66) and recomputes camera distance per frame so the phone holds its scale across breakpoints. Rotation and lighting are damped (`5.5/s`) so motion is continuous and carries momentum on scroll reversal. `prefers-reduced-motion` snaps poses and cancels sway, while keeping chapter switching via opacity.
- **3D interactions mirror the UI.** Configurator finishes lerp the live 3D materials (including the film's shell); the camera focal bar re-focuses the matching 3D lens; the display demo quantizes a real dot once per "frame" (1 Hz jumps, 144 Hz continuous).
- **Battery math is deterministic and pure** - `src/utils/battery.ts` turns an hours-per-activity schedule into remaining percent / hours to empty with no randomness.
- **The phone is interactive** - the AetherOS simulator opens apps, dismisses notifications, and pulls down quick settings.
- **3D is built for performance and fallback** - Three.js is lazy-loaded, the film scene is its own dynamic chunk, canvases construct once near the viewport (IntersectionObserver) with DPR capped (1.75 desktop / 1.3 mobile), `three` is split into its own cached chunk, rail viewers are skipped below `lg`, the live screen only redraws at ~9 fps, and WebGL-less browsers fall back to the static CSS `PhoneFrame` (even the rear-view scenes, via a rear variant).
- **Motion is compliant, not decorative** - the scroll film, reveal, and hover states are built on Motion's `useScroll`/`useInView` (no window scroll listeners), eyebrow-style labels only on page heroes, no em-dashes, single-middot mono labels, and hairline (never filled) progress tracks.
- **All imagery is local SVG / procedural** - nothing is fetched from the network; the studio environment is built from local `Lightformer` panels and a procedural canvas env sphere, no remote HDR.

## Accessibility & polish

- Semantic landmarks, `aria-label`s on icon buttons, `aria-pressed` / `aria-expanded` state, switch roles for toggles, skip link.
- Focus-visible outlines and a `:focus` theme in `index.css`.
- "Glass" surfaces and the accent blue are defined once in the Tailwind theme and reused everywhere.