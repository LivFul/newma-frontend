# TODOS

## Testing

### Pre-existing e2e failures against `next dev` and macOS WebKit

**What:** Make the nine e2e cases that fail on `main` as well as on this branch pass, or quarantine them with a reason.

**Why:** They fail on every local full run, which hides new failures in the noise.

**Context:** All nine fail on a fresh `origin/main` worktree too (`/ship` baseline, 2026-10-08):

- `tests/e2e/csp.spec.ts:83`: "/access gets a fresh nonce policy without 'unsafe-inline' for scripts". Fails on desktop-chromium and mobile-chromium against `next dev`.
- `tests/e2e/seo.spec.ts:89`: "the home page has one canonical on the production origin and one JSON-LD per type". Fails on both chromium projects against `next dev`.
- `tests/e2e/sticky-header.spec.ts:162`, `:168`, `:228`, `:241` and `:247`: the keyboard and skip-link cases on the `iphone` project. macOS WebKit does not Tab onto links. They pass on the Linux CI runner.

Start by deciding whether the CSP and SEO specs should run only against a production build (`PLAYWRIGHT_BASE_URL`).

**Effort:** M
**Priority:** P0
**Depends on:** None

### Layout regression tests for the About grid and the workflow breakout

**What:** Add e2e checks that the About purpose text is two columns from `md`, and that `.wf-bleed` is `min(95vw, 120rem)` wide, centred, with no horizontal overflow at 320, 1280 and 1920 px.

**Why:** Both layouts were user-requested fixes that unit tests cannot see (real layout only).

**Context:** `src/components/site/about-newma.tsx` (`md:grid-cols-2`) and `src/components/site/workflow-diagram.css` (`.wf-bleed`). They were deferred from the rebrand ship (decision D4).

**Effort:** S
**Priority:** P1
**Depends on:** None

### Duplicate CapsuleIcon token test

**What:** Merge "paints the colour capsule from the brand tokens" into "paints the colour tone from the brand colour tokens" in `tests/unit/brand/capsule-icon.test.tsx`.

**Why:** Both protect the same thing, so a palette change has to be made in two places.

**Context:** Keep the id-suffix selector and `.toLowerCase()` from the newer test, then delete it.

**Effort:** S
**Priority:** P3
**Depends on:** None

## Site

### Bring PRODUCT.md and the /impeccable home brief up to brand pack v1.0

**What:** Rewrite PRODUCT.md "Brand commitments" and "Open decisions", and the direction contract in `.impeccable/surfaces/src-app-site-page-tsx.md`, to match the shipped NEWMA brand pack v1.0.

**Why:** Both still describe the old direction: the livful.com palette, Fabio XM (licence open), leaf and capsule icons, Geologica and Martian Mono, a mint wash, and a hero glass panel. Future /impeccable runs read the brief as direction and would pull the design back toward it.

**Context:** The rebrand adopted Work Sans and Geist Mono, the Mist/Night/Teal/Emerald/Lime palette, NEWMA logos, a capsule-only mark, and a hero scrim. DESIGN.md already describes all of this. The docs audit in /ship (2026-10-08) flagged both files. The user chose to rewrite them themselves (decision D20).

**Effort:** S
**Priority:** P2
**Depends on:** None

### Footer reversed logo under forced colours and print

**What:** Show a legible footer lockup in Windows High Contrast and in print.

**Why:** The footer uses the reversed (light) logo, which can vanish on a forced light canvas or on paper.

**Context:** `src/components/site/site-footer.tsx` renders `<Wordmark lockup="logo" tone="dark">`. The forced-colours and print rules in `src/app/globals.css` only handle the header's adaptive wordmark. Deferred as decision D10.

**Effort:** S
**Priority:** P2
**Depends on:** None

### Hero diagram: describe its touch and keyboard controls

**What:** Tell visitors how to use the ecosystem diagram, now that Keyboard help has been removed.

**Why:** The diagram still answers arrow keys, Home/End and Escape (which merges the layers), and taps on touch screens, but nothing on the page says so.

**Context:** Keyboard help was removed at the user's request (D12). Options: a short visible hint, or an `aria-describedby` summary on the svg in `src/components/ecosystem-graphic/ecosystem-svg.tsx`. Also update `docs/A11Y_MANUAL_PASS.md` and the stale "Hero hint, toggle, key help" row in `docs/CONTENT_MATRIX.md`, and remove the old Keyboard help key names from the allowlist in `scripts/claims/policy.mjs`.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Header muted-label contrast over dark hero content

**What:** Measure the header's muted nav labels (`text-fg-muted` on the light glass) over the darkest hero content.

**Why:** At `--glass-tint: 0.58`, Slate over blurred dense ink may sit near 4.3:1, just under AA for 16px text.

**Context:** Add a bound like the caption-scrim proof in `tests/unit/site/hero-stage.test.ts`, or raise the light glass tint.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Header tone probe and menu tidy-ups

**What:** Do the following in `src/components/site/site-header.tsx`:

- Find the label row with a `data-header-row` attribute instead of `.glass > div`.
- Put the `mobile-sections` id in one constant.
- Re-probe the tone on client-side navigation.
- Close the menu when the viewport crosses the `md` breakpoint, so the Escape listener does not stay attached.

**Why:** Small fragilities from review: a wrapper div would silently break the probe, and an open menu survives a phone rotating to landscape.

**Context:** All low impact. The per-frame `elementsFromPoint` cost was judged acceptable.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Simplify duplicated CSS and JSX

**What:** Let the build add the `-webkit-mask-*` prefixes for the hero scrim, build CapsuleIcon's two gradients from a table, and drop the unused `HeroStep` 0.

**Why:** About 30 lines of repetition that can drift.

**Context:** Check that `.next/static` CSS still contains `-webkit-mask-image` before removing the hand-written copies in `src/app/globals.css`. `src/components/brand/capsule-icon.tsx`; `src/components/site/type.ts`.

**Effort:** S
**Priority:** P4
**Depends on:** None

## PWA

### Precache the offline page's wordmark

**What:** Add `/brand/newma-wordmark.svg` to `PRECACHE` in `public/sw.js`, and bump `CACHE`, because the precache list changes.

**Why:** The offline fallback renders the SVG wordmark. A visitor who goes offline before any online page under the worker has loaded it sees the page without the logo.

**Context:** next/image serves SVG as is, so the browser requests the plain `/brand/` path. Add a case to `tests/unit/pwa/service-worker.test.ts`. Bumping `CACHE` drops old build chunks; see the comment above `CACHE`.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Watch the `immutable` header that chunk caching depends on

**What:** Add a production smoke check that `/_next/static/*` responses carry `Cache-Control: ... immutable`.

**Why:** `public/sw.js` caches build chunks only for immutable responses. A CDN or hosting change that rewrites the header would silently turn off chunk caching and the offline page's CSS and JS.

**Context:** next start and Vercel send it today (`next/dist/server/lib/router-server.js`). A check in the preview e2e job would catch a regression.

**Effort:** S
**Priority:** P3
**Depends on:** None

### Dev worker comment wording

**What:** Re-wrap the reworded dev-cleanup comment in `src/components/pwa/pwa-mount.tsx` to the file's width, without the "now".

**Why:** One line runs to 150 characters, and "now" goes stale.

**Context:** Comment-only change.

**Effort:** S
**Priority:** P3
**Depends on:** None

## Workflow 3D

### One drawing-buffer allocation per resize

**What:** In `src/components/workflow-3d/stage.ts`, size the buffer and the ratio together (for example `setDrawingBufferSize` plus the canvas CSS size) instead of `setPixelRatio` followed by `setSize`.

**Why:** On canvases over the 4M-pixel budget the ratio changes with every resize, so dragging the window edge reallocates the WebGL buffers twice per resize callback.

**Context:** Only while resizing large canvases. Also fix the comment, which claims a single allocation.

**Effort:** S
**Priority:** P3
**Depends on:** None

## Completed
