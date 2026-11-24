---
name: NEWMA
description: NEWMA brand guide v1 (Forest, Sage, Lavender; 60% white) in an Apple WWDC26 Liquid Glass shell.
colors:
  bg: "#f7f8f4"
  bg-elevated: "#ffffff"
  bg-deep: "#edf0e6"
  fg: "#1b2a1a"
  fg-muted: "#535e4d"
  accent: "#244322"
  accent-fg: "#ffffff"
  prominent: "#5f5986"
  prominent-fg: "#1b2a1a"
  border: "#dde2d3"
  border-strong: "#7a876f"
  danger: "#a3352b"
  warning: "#f2c46b"
  warning-ink: "#8a5a00"
  success: "#b5d39a"
  success-ink: "#3f6b2b"
  focus: "#86809c"
  route: "#fbd699"
  route-edge: "#b8643a"
  contour: "#b9c2a5"
  plate: "#1b3319"
  plate-fg: "#f4f6ef"
  plate-muted: "#bcc5a8"
  plate-accent: "#c9d0b3"
  eco-compute: "#b69cff"
  eco-optional: "#a8442a"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(2.5rem, 1.4rem + 3.6vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  statement:
    fontFamily: "Figtree, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Figtree, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.5
    letterSpacing: "0.14em"
  gridref:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.02em"
    fontFeature: '"tnum"'
rounded:
  sm: "0.375rem"
  md: "0.75rem"
  lg: "1.25rem"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "6": "1.5rem"
  "8": "2rem"
  "12": "3rem"
  "16": "4rem"
components:
  button-primary:
    backgroundColor: "{colors.prominent}"
    textColor: "{colors.prominent-fg}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.prominent}"
    textColor: "{colors.prominent-fg}"
  button-primary-lg:
    backgroundColor: "{colors.prominent}"
    textColor: "{colors.prominent-fg}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg}"
  button-ghost-hover:
    backgroundColor: "{colors.bg-deep}"
    textColor: "{colors.fg}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.bg-elevated}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
  badge-neutral:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    height: "24px"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.fg}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.fg}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.bg-elevated}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  surface:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg}"
    rounded: "{rounded.lg}"
  legend-plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.plate-fg}"
    padding: "80px 20px"
  rail-item-current:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
    padding: "6px 12px"
    height: "40px"
---

# Design System: NEWMA

## Overview

**Creative North Star: "Discovery at the speed of AI, rooted in the plant."**

NEWMA is a LivFul Therapeutics product. The identity follows brand guide v1 (`NEWMA_GUIDE_V1.pdf`, assets in `docs/newma_brand_pack`): a lowercase `newma™` wordmark whose `wʌʌa` runs a Forest → Sage → Lavender gradient, a tagline lockup ("AI-Powered Ethnobotanical Drug Discovery"), 60% white space, generous rounded white cards, a single-colour blur shadow, a pixel "bitmap wave" (the `wʌʌ` shape read as a DNA strand or data stream) and free-form gradient panels. Tone is precise, grounded and hopeful.

The interface follows Apple's WWDC26 Human Interface Guidelines. Liquid Glass forms a separate functional layer for navigation and controls that floats above content; content stays on standard materials. Motion is restrained: the pipeline's flow, a short settle on the nodes, the fog panel's slow drift, hover lift and scroll reveals, all transform and opacity, all off under reduced motion.

The public site and the demo share one visual language. Layout (section order, 6/6 hero, 7/5 splits, four-step row, six-component index) is the thing that stays.

**Key Characteristics:**

- 60% white, 15% Forest, 15% Sage, 10% Lavender in any space.
- Playfair Display (regular) titles; Figtree body as the web stand-in for Fabio XM; Geist Mono for labels and data.
- White rounded cards (2rem) lifted by the brand blur shadow; Forest plates; the fog gradient for feature panels.
- Pill buttons: Lavender for the one prominent action, Sage for supporting actions.
- Concentric corners: a control's radius is its container's radius minus the inset between them.

## Logos and icons

Masters live in `docs/newma_brand_pack/00_source` (vector, extracted from the guide PDF with text outlined). `node scripts/build-brand-icons.mjs` regenerates every size: `public/brand/*`, `public/favicon.ico`, `public/images/bitmap-wave.svg` and the whole brand pack (logo PNGs at 600/1200/2800, icon PNGs at 128–1024, favicons, app icons, avatars, social banners, email-signature logo).

- `newma-wordmark.svg` / `-reversed.svg`: newma™ alone, for tight spaces (header, demo). Minimum 96px wide.
- `newma-logo.svg` / `-reversed.svg`: with the tagline (footer, access, offline, OG). Minimum 180px wide.
- The primary files carry the brand gradient; reversed files are white for Forest and photo grounds. Never recolour a lockup with filters, shadows or effects.
- The app mark is the `wʌʌ` wave: brand gradient on a white tile (PWA, apple-touch, app icons), white on a Forest tile at favicon sizes for contrast.
- `CapsuleIcon`, `LeafIcon` and `PillIcon` remain as UI glyphs, recoloured Sage/Forest and Lavender.

## Colors

Brand guide v1: linear gradient Forest `#244322` → Sage `#9BA77D` → Lavender `#86809C`.

- **Forest ink** (fg) `#1B2A1A`, muted `#535E4D` on **Paper** (bg) `#F7F8F4` and white; **Sage mist** band `#EDF0E6`.
- **Forest** (accent) `#244322`: links, headline ink and outline actions.
- **Prominent** (Lavender, `#5F5986`) with white: the primary pill's gradient (`#57527C` → `#4F4A73`) holds 4.5:1 at rest and on hover; `tests/unit/contrast.test.ts` enforces it. Brand Lavender `#86809C` is the focus ring.
- **Sage** `#9BA77D` / Sage soft `#C9D0B3` with Forest ink: supporting pills.
- **Plates**: Deep Forest `#1B3319` to Forest, near-white text, Sage-light muted text and accent.
- **Fog** (`--background-image-fog`): the free-form gradient. White text sits on it only inside `.fog-panel`, whose Forest scrim keeps 4.5:1.
- Status colours, apricot route and the ecosystem hues are functional and stay paired with glyphs.

### Named Rules

**The Spot Ink Rule.** A new colour enters only with a pair in `contrast-pairs.json`.

**The Fill-and-Ink Rule.** Light fills never carry meaning as a stroke; use warning-ink, success-ink, route-edge.

**The Never-Hue-Alone Rule.** Status, plate identity and restriction are doubled by a glyph, dash, hatch or text.

**The Gradient Rule.** Gradients are for the pill, the primary action and large decorative fields. Text sits on a solid token or a contrast-tested gradient.

## Typography

**Titles:** Playfair Display (the guide's title face; Georgia fallback), regular weight, slight negative tracking.
**Body and UI:** Figtree, standing in for the guide's Fabio XM (no web licence in the repo). Swap `--font-figtree` for a `next/font/local` Fabio XM when licensed files are available.
**Labels and data:** Geist Mono Bold, uppercase and tracked (`.place`), plus hashes, codes and measured values (`.gridref`).

## Layout

Pages are full-bleed. Horizontal padding is 20px on phones, 48px from md. Sections pad 80px / 112px vertically. Composition is a 12-column grid: hero 6/6, content 7/5. Safe-area insets apply in standalone PWA mode. The sticky header is 4rem; scroll-padding clears it. The header unsticks below 32rem viewport height.

## Elevation & Depth: Liquid Glass

Per the WWDC26 HIG (Materials, Layout, Toolbars, Color, Buttons):

- **Glass is for the functional layer only.** `.glass` (regular variant, blurred) styles the floating header capsule and its menu sheet. Secondary buttons use `.glass-control`: the same rim and translucent fill without a blur layer, so the header is the only blurred surface. Content cards use `.surface`, `.surface-material` or elevated white, never glass.
- **Use it sparingly.** One glass navigation surface per page plus pressable controls.
- **Tint only the primary action.** `.glass-prominent` with the Plant gradient marks the one prominent action per view; colour sits on the background, never on the label.
- **Scroll edge effect, not a toolbar background.** The header has no solid bar; once the page scrolls, a fade of the page colour rises behind the capsule.
- **Adaptive.** Inside `.plate-surface` the same class becomes dark glass.
- **Accessibility.** `--glass-tint` (0 clear to 1 tinted) is a single knob; `prefers-reduced-transparency` and `prefers-contrast: more` set it to 1 and drop the blur, and increased contrast also draws ink borders. Browsers without `backdrop-filter` get the opaque fill.

## Shapes

Buttons and the header are capsules. Cards use 1.25rem corners. Corners are concentric: the 56px header capsule (28px radius) holds 44px pills inset 6px, whose 22px radius is 28 minus 6. The capsule is the only brand silhouette.

## Motion

Tokens: fast 150ms, base 280ms, slow 600ms. Animate transform and opacity only. `prefers-reduced-motion: reduce` zeros every duration.

Springs are CSS `linear()` curves sampled from damped-spring step responses, with a cubic-bezier fallback. `--motion-spring-settle` (critically damped, no overshoot) drives entrances, reveals, card lift and the mobile menu. `--motion-spring-snappy` (about 16% overshoot) is for the `scale` of pressable controls only: hover lifts to 1.04, press sinks to 0.96, and a transition retargets from its live value, so a press or lift can be interrupted mid-flight. Position carries over on interruption; velocity does not, because CSS restarts the curve. Colour, filter and shadow never use the overshooting curve.

Only the hero cascades: its actions and disclaimer rise in 60ms steps, the one orchestrated entrance on the page. The headline, tagline and lede paint with the first frame, because on phones the lede is the LCP node. Section reveals rise as a whole and their children only fade in with them. Stagger steps are literal class names in `src/components/site/type.ts` so Tailwind can generate them, and the step index is a type, so an out-of-range step fails to compile.

The hero's diagram uses the stage wash only (no separate caption scrim): a feathered, borderless layer with no blur that lifts the forest photo toward the page colour. Caption and map legend use `text-fg-muted` on the page stack. `tests/unit/site/hero-stage.test.ts` asserts the caption scrim layer is absent so dark theme does not add an extra shade behind the diagram footer.

## Components

### Buttons

Capsule-shaped, 44px minimum on touch. Primary is tinted Liquid Glass: Ink on the Plant gradient with a specular rim and emerald glow. Secondary is a glass control (rim and translucent fill, no blur). Ghost is quiet. Danger is madder.

The header's call to action reads "Demo" below 1280px and "Access NEWMA" from there. Its accessible name always starts with "Access NEWMA". It is a glass control inside a Plant-gradient ring (Lime, Emerald, Teal). On arrival the ring orbits twice with a soft emerald glow, in under five seconds (WCAG 2.2.2), and hovering replays one turn. Under reduced motion the ring stays still; under increased contrast it becomes a solid ink rim. The header keeps one row from 360px up: the wordmark steps down on phones (it never goes below 110px wide), and the section anchors appear from 1024px. Below that, Menu opens the sheet.

### Chips

Rounded tags. Status vocabulary is the gate enum: PASS, HOLD, PENDING, FAIL, INVALIDATED, NOT_STARTED. Screen readers hear "Status: PASS".

### Cards / Containers

Elevated white on light grounds, `.surface-material` on plates. Not glass. The six ecosystem cards carry only their colour swatch, no icon.

### Navigation

A sticky, floating Liquid Glass capsule with the newma wordmark. On mobile the capsule grows into a rounded glass sheet for section links. The footer is a Forest band with the reversed logo and tagline on screen and in a dark forced-colours theme; print and a light forced-colours theme show the dark-ink logo instead.

### Appearance (user theme)

Visitors choose **Light**, **Dark**, or **System** from `ThemeToggle`. From the large layout breakpoint up, the control is icon-only in the header bar; below that it sits at the bottom of the mobile Menu sheet beside a **Theme** label. With no stored preference, the site defaults to **Light** (the guide's 60% white). Choice persists in `localStorage` under `newma.theme.v1` and is applied with `useSyncExternalStore` (no React context): `ThemeSync` in the root layout mirrors storage onto `html` on every route.

- **Light (default):** `@theme` tokens (`color.css`); the root ships with `.light`.
- **Dark:** semantic remaps in `color.dark.css` on `.dark` or `@media (prefers-color-scheme: dark)` when `:root:not(.light)` — Deep Forest stack; **plate tokens unchanged**.
- **Classes:** `html.light` and `html.dark` are manual overrides; **System** follows the OS via media query when neither class is set.
- **Independent of header tone:** scroll-based `[data-site-header][data-tone]` (content beneath the capsule) still drives glass and wordmark swaps; it is not the user theme preference.
- **Browser chrome:** `#newma-theme-color` meta tracks the resolved stack (`#f7f8f4` / `#1b3319`).

### Ecosystem diagram

The homepage diagram is a three-column pipeline: Input (Interface as People plus API), AI core (Agentic Compute and Scientific Review in a refinement loop over a records server — Data on the lower rack, Provenance dashed on the upper rack), and Validation (Wet Lab). There is no Clinical column. Keyboard, no-JS static SVG and a lazy Motion twin are required. Hover or focus explodes the columns; reduced motion shows the exploded view at rest.

## Do's and Don'ts

### Do:

- **Do** keep the existing layout, copy and claim register.
- **Do** use the brand capsule for bullets and ornaments (`.leaf-list` masks `capsule-bullet.svg`).
- **Do** pair every light fill with its ink when a stroke carries meaning.
- **Do** add a contrast pair before shipping a new colour pairing.
- **Do** honour reduced motion.

### Don't:

- **Don't** bring back the survey sheet, neatlines, grid ticks or map key.
- **Don't** let hue alone carry status.
- **Don't** set headings, buttons or body copy in Geist Mono.
- **Don't** put Liquid Glass in the content layer, or tint more than one action per view.
- **Don't** stretch, rotate, recolour or add effects to the logo.
- **Don't** document placeholder claims; text is governed by the claims register.
- **Don't** take photography from Pinterest or any source that is not free for commercial use.
