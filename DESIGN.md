---
name: NEWMA
description: NEWMA brand v1.0 (from plant to patient) in an Apple WWDC26 Liquid Glass shell.
colors:
  bg: "#f1f6f1"
  bg-elevated: "#ffffff"
  bg-deep: "#e3ede6"
  fg: "#082b33"
  fg-muted: "#4f6b70"
  accent: "#0b3f4b"
  accent-fg: "#f1f6f1"
  prominent: "#0fa36b"
  prominent-fg: "#082b33"
  border: "#cfdcd5"
  border-strong: "#6c8689"
  danger: "#a3352b"
  warning: "#f2c46b"
  warning-ink: "#8a5a00"
  success: "#8fd3b4"
  success-ink: "#0b7a52"
  focus: "#1c8a99"
  route: "#fbd699"
  route-edge: "#b8643a"
  contour: "#8fb3b0"
  plate: "#06242b"
  plate-fg: "#f1f6f1"
  plate-muted: "#8fb3b0"
  plate-accent: "#a6e04a"
  eco-compute: "#b69cff"
  eco-optional: "#a8442a"
typography:
  display:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.5rem, 1.4rem + 3.6vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  statement:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Work Sans, ui-sans-serif, system-ui, -apple-system, sans-serif"
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

**Creative North Star: "From plant to patient, behind Liquid Glass."**

NEWMA is a LivFul Therapeutics product. The identity (brand pack v1.0, `docs/newma_brand_pack`) carries one idea: the journey from a plant, the source, to a pill, the medicine. It lives in a single shape, a 2:1 capsule rotated 45° and split by a seam, plant half (Lime to Emerald) lower left and pill half (Deep Teal to Teal) upper right. The same capsule replaces the crossbar of the A in the newmA wordmark. Tone is precise, grounded and hopeful; every element should feel engineered, not decorated.

The interface follows Apple's WWDC26 Human Interface Guidelines. Liquid Glass forms a separate functional layer for navigation and controls that floats above content; content stays on standard materials. Motion is restrained: the pipeline's flow, a short settle on the nodes, hover lift and scroll reveals, all transform and opacity, all off under reduced motion. Because the ambient loops run longer than five seconds, WCAG 2.2.2 would also want a visible pause control, which is not built yet.

The public site and the demo share one visual language. Layout (section order, 6/6 hero, 7/5 splits, four-step row, six-component index) is the thing that stays.

**Key Characteristics:**

- Neutrals carry the identity: Ink on Mist and white, Night plates. Emerald, Lime and Teal are accents only.
- Work Sans Bold headlines, Work Sans Regular body, Geist Mono Bold for labels, bylines and data.
- A floating Liquid Glass capsule header, tinted glass for the one primary action, glass controls (rim and translucent fill, no blur) for secondary actions.
- Concentric corners: a control's radius is its container's radius minus the inset between them.

## Logos and icons

Files live in `public/brand`, copied from the brand pack. Logo SVGs are cropped to their ink.

- `newma-wordmark.svg` / `-reversed.svg`: newmA alone, for tight spaces (header, demo). Minimum 110px wide.
- `newma-logo.svg` / `-reversed.svg`: with the BY LIVFUL THERAPEUTICS byline (footer, access, offline, OG). Minimum 160px wide.
- Use the reversed file on Night; never recolour a lockup with filters, shadows or effects.
- `CapsuleIcon` (`src/components/brand/capsule-icon.tsx`) draws the pill icon in `color`, `reversed` or `mono`. Never place it beside the wordmark: the capsule already lives inside the A.
- The legacy `LeafIcon` and `PillIcon` remain only for the How it works step markers and guardrail line, which are deliberately unchanged.

## Colors

Brand palette v1.0, roughly 45% Ink/Night, 30% Mist, 12% Deep Teal, then small amounts of Emerald, Lime and Teal.

- **Ink** (fg) `#082B33`, **Slate** (fg-muted) `#4F6B70` on **Mist** (bg) `#F1F6F1` and white.
- **Deep Teal** (accent) `#0B3F4B`: links and outline actions. Emerald and Teal never set body text on light grounds (3.24:1 and 4.08:1).
- **Prominent** (Emerald, `#0FA36B`) with Ink: the Plant gradient (`#A6E04A` to `#0FA36B`) is the primary button fill. Every stop holds 4.5:1 against Ink, resting and at hover brightness; `tests/unit/contrast.test.ts` enforces it.
- **Plates**: Night `#06242B` to Deep Teal, Mist text, Slate-light muted text, **Lime** `#A6E04A` as the plate accent. Lime is for dark grounds and small highlights only.
- Status colours (madder, ochre, sage), apricot route and the ecosystem hues are functional and stay paired with glyphs.

### Named Rules

**The Spot Ink Rule.** A new colour enters only with a pair in `contrast-pairs.json`.

**The Fill-and-Ink Rule.** Light fills never carry meaning as a stroke; use warning-ink, success-ink, route-edge.

**The Never-Hue-Alone Rule.** Status, plate identity and restriction are doubled by a glyph, dash, hatch or text.

**The Gradient Rule.** Gradients are for the pill, the primary action and large decorative fields. Text sits on a solid token or a contrast-tested gradient.

## Typography

**Display and body:** Work Sans (Bold for headlines, Semibold for titles, Regular for body at 16 to 18px, 162.5% line height).
**Labels and data:** Geist Mono Bold, uppercase and tracked (`.place`), plus hashes, codes and measured values (`.gridref`).

Don't set headings, buttons or body copy in Geist Mono.

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

Only the hero cascades: its four items rise in 60ms steps, the one orchestrated entrance on the page. Section reveals rise as a whole and their children only fade in with them. Stagger steps are literal class names in `src/components/site/type.ts` so Tailwind can generate them, and the step index is a type, so an out-of-range step fails to compile.

The hero's diagram sits on a scrim, not a card: a feathered, borderless wash with no blur, densest under the caption and hint (`--hero-scrim-text`) and lightest at the top where only the photo shows. `tests/unit/site/hero-stage.test.ts` proves AA for the muted caption text from that alpha over a black photo pixel, so the check does not depend on viewport width.

## Components

### Buttons

Capsule-shaped, 44px minimum on touch. Primary is tinted Liquid Glass: Ink on the Plant gradient with a specular rim and emerald glow. Secondary is a glass control (rim and translucent fill, no blur). Ghost is quiet. Danger is madder.

The header's call to action reads "Demo" below 1280px and "Access NEWMA" from there. Its accessible name always starts with "Access NEWMA". It is a glass control inside a Plant-gradient ring (Lime, Emerald, Teal). On arrival the ring orbits twice with a soft emerald glow, in under five seconds (WCAG 2.2.2), and hovering replays one turn. Under reduced motion the ring stays still; under increased contrast it becomes a solid ink rim. The header keeps one row from 360px up: the wordmark steps down on phones (it never goes below 110px wide), and the section anchors appear from 1024px. Below that, Menu opens the sheet.

### Chips

Rounded tags. Status vocabulary is the gate enum: PASS, HOLD, PENDING, FAIL, INVALIDATED, NOT_STARTED. Screen readers hear "Status: PASS".

### Cards / Containers

Elevated white on light grounds, `.surface-material` on plates. Not glass. The six ecosystem cards carry only their colour swatch, no icon.

### Navigation

A sticky, floating Liquid Glass capsule with the newmA wordmark. On mobile the capsule grows into a rounded glass sheet for section links. The footer is a Night band with the reversed logo and byline.

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
