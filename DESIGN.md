---
name: NEWMA
description: A modern ethnobotanical instrument — LivFul greens fading into capsule teals.
colors:
  bg: "#e8f2ef"
  bg-elevated: "#f6faf8"
  bg-deep: "#d7ebe6"
  fg: "#09191f"
  fg-muted: "#4a6467"
  accent: "#1d5c52"
  accent-fg: "#f6faf8"
  border: "#c3d5d0"
  border-strong: "#6e8986"
  danger: "#a3352b"
  warning: "#f2c46b"
  warning-ink: "#8a5a00"
  success: "#8dbab3"
  success-ink: "#3f7a70"
  focus: "#1b8896"
  route: "#fbd699"
  route-edge: "#b8643a"
  contour: "#8dbab3"
  plate: "#06242b"
  plate-fg: "#e8f2ef"
  plate-muted: "#8dbab3"
  eco-compute: "#9a5230"
  eco-optional: "#a8442a"
typography:
  display:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.4rem + 3.6vw, 4.75rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  statement:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.08em"
  gridref:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.accent-fg}"
  button-primary-lg:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
    height: "40px"
  button-secondary-hover:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.bg}"
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

**Creative North Star: "The Ethnobotanical Instrument"**

NEWMA is a LivFul product: scientific, future-facing and botanical. Surfaces are full-bleed mint-to-teal fields, not printed survey sheets. The leaf and the capsule from the mark are the recurring glyphs. Depth comes from soft layered light, glass panels and green-to-blue fades. Motion is restrained: the pipeline's flow (a slowly turning loop and pulsing chevrons), a short float and settle on the nodes (under five seconds, then still), hover lift and scroll reveals, all transform and opacity, all off under reduced motion. The aurora wash is static. The deliberate ambient loops are the pipeline flow and the hero's botanical lines, which drift one 720px tile a minute on their own layer, by transform only, so they never repaint the wash; because these loops run longer than five seconds, WCAG 2.2.2 would also want a visible pause control, which is not built yet.

The public site and the demo share one visual language. Layout (section order, 6/6 hero, 7/5 splits, four-step row, six-component index) is the thing that stays; the paper, neatlines, grid ticks and map key are gone.

**Key Characteristics:**

- LivFul mint wash, leaf lime-to-emerald, capsule teal-to-cyan, ink-teal type.
- Soft colour-fade gradients and aurora meshes; apricot only as a rare warm band.
- Geologica for display and UI; Martian Mono only for hashes, codes and measured values.
- Pill buttons, rounded cards, glass panels, a glow on primary actions.
- Leaf bullets and pill step markers; hue never carries meaning alone.

## Colors

A mint field that blends LivFul greens into the logo's capsule blues.

### Primary

- **Field Green** (accent): action, links, primary fills. Text on it is accent-fg.

### Secondary

- **Leaf** (`#b3e570` → `#15a676`): botanical light, leaf glyphs, positive ornaments.
- **Capsule** (`#0b404d` → `#1b8896`): pharma light, pill glyphs, focus ring, deep plates.
- **Brand gradient** (`#0c7552` → `#1d5c52` → `#12707d`): the primary button fill. Every stop holds 4.5:1 against accent-fg, resting and at hover brightness; `tests/unit/contrast.test.ts` enforces it.

### Tertiary

- **Madder** (danger), **Ochre** (warning) with **Ochre Ink**, **Sage** (success) with **Sage Ink**.
- **Apricot** (route): rare warm accent, staytec-like peach bands.
- **Deepened Sienna** (eco-compute) and **Provenance Madder** (eco-optional), always paired with a glyph or dash.

### Neutral

- **Mint wash** (bg), **Elevated glass** (bg-elevated), **Mint band** (bg-deep).
- **Ink-teal** (fg), **Faded ink** (fg-muted).
- **Plates** (plate / plate-fg / plate-muted): the dark teal-blue field for the workflow, legend and 3D scene. `.plate-surface` remaps semantic tokens.

### Named Rules

**The Spot Ink Rule.** A new colour enters only with a pair in `contrast-pairs.json`.

**The Fill-and-Ink Rule.** Light fills never carry meaning as a stroke; use warning-ink, success-ink, route-edge.

**The Never-Hue-Alone Rule.** Status, plate identity and restriction are doubled by a glyph, dash, hatch or text.

**The Blend Rule.** Brand surfaces may fade leaf into capsule. Text sits on a solid token, never on the middle of a gradient, unless that pairing is contrast-tested.

## Typography

**Display Font:** Geologica  
**Body Font:** Geologica  
**Mono Font:** Martian Mono

Display lettering is tight and large. Labels are tracked, not shouted map caps. Mono is the instrument voice.

## Layout

Pages are full-bleed. Horizontal padding is 20px on phones, 48px from md. Sections pad 80px / 112px vertically. Composition is a 12-column grid: hero 6/6, content 7/5. Safe-area insets apply in standalone PWA mode. The sticky header is 4rem; scroll-padding clears it. The header unsticks below 32rem viewport height.

## Elevation & Depth

Depth is allowed: stacked shadows, a brand glow, and glass (backdrop-filter with an opaque fallback). Nothing uses a harsh drop under type.

## Shapes

Buttons are pills. Cards use 1.25rem corners. The leaf and the capsule are the only brand silhouettes. Loop cards are rounded rectangles; Interface faces stay circular.

## Motion

Tokens: fast 150ms, base 280ms, slow 600ms. Animate transform and opacity only. `prefers-reduced-motion: reduce` zeros every duration.

Springs are CSS `linear()` curves sampled from damped-spring step responses, with a cubic-bezier fallback. `--motion-spring-settle` (critically damped, no overshoot) drives entrances, reveals, card lift and the mobile menu. `--motion-spring-snappy` (about 16% overshoot) is for the `scale` of pressable controls only: hover lifts to 1.04, press sinks to 0.96, and a transition retargets from its live value, so a press or lift can be interrupted mid-flight. Position carries over on interruption; velocity does not, because CSS restarts the curve. Colour, filter and shadow never use the overshooting curve.

Only the hero cascades: its four items rise in 60ms steps, the one orchestrated entrance on the page. Section reveals rise as a whole and their children only fade in with them. Stagger steps are literal class names in `src/components/site/type.ts` so Tailwind can generate them, and the step index is a type, so an out-of-range step fails to compile.

The hero's diagram sits on a scrim, not a card: a feathered, borderless wash with no blur, densest under the caption and hint (`--hero-scrim-text`) and lightest at the top where only the photo shows. `tests/unit/site/hero-stage.test.ts` proves AA for the muted caption text from that alpha over a black photo pixel, so the check does not depend on viewport width.

## Components

### Buttons

Pill-shaped, 44px minimum on touch. Primary uses the brand gradient and a glow on hover. Secondary is an ink outline. Ghost is quiet. Danger is madder.

### Chips

Rounded tags. Status vocabulary is the gate enum: PASS, HOLD, PENDING, FAIL, INVALIDATED, NOT_STARTED. Screen readers hear "Status: PASS".

### Cards / Containers

Rounded glass or elevated mint. No neatline ticks.

### Navigation

Sticky translucent header. Mobile opens a sheet for section links. Footer is a deep teal-blue band.

### Ecosystem diagram

The homepage diagram is a three-column pipeline: Input (Interface as People plus API), AI core (Agentic Compute and Scientific Review in a refinement loop over a records server — Data on the lower rack, Provenance dashed on the upper rack), and Validation (Wet Lab). There is no Clinical column. Keyboard, no-JS static SVG and a lazy Motion twin are required. Hover or focus explodes the columns; reduced motion shows the exploded view at rest.

## Do's and Don'ts

### Do:

- **Do** keep the existing layout, copy and claim register.
- **Do** use leaf glyphs for bullets and pass accents; pill glyphs for steps and optional marks.
- **Do** pair every light fill with its ink when a stroke carries meaning.
- **Do** add a contrast pair before shipping a new colour pairing.
- **Do** honour reduced motion.

### Don't:

- **Don't** bring back the survey sheet, neatlines, grid ticks or map key.
- **Don't** let hue alone carry status.
- **Don't** set headings, buttons or body copy in Martian Mono.
- **Don't** document placeholder claims; text is governed by the claims register.
- **Don't** take photography from Pinterest or any source that is not free for commercial use.
