---
name: NEWMA
description: A surveyed field sheet for nature-to-medicine, printed in spot inks on mint survey paper.
colors:
  bg: "#e8f2ef"
  bg-elevated: "#f6faf8"
  bg-deep: "#dce9e4"
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
  focus: "#b8643a"
  route: "#fbd699"
  route-edge: "#b8643a"
  contour: "#8dbab3"
  plate: "#09191f"
  plate-fg: "#e8f2ef"
  plate-muted: "#8dbab3"
  eco-compute: "#9a5230"
  eco-optional: "#a8442a"
typography:
  display:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 1.5rem + 3.2vw, 4.5rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.035em"
    fontVariation: '"SHRP" 60'
  headline:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.03em"
    fontVariation: '"SHRP" 60'
  statement:
    fontFamily: "Geologica, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.375
    letterSpacing: "-0.02em"
    fontVariation: '"SHRP" 60'
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
    letterSpacing: "0.14em"
  gridref:
    fontFamily: "Martian Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.02em"
    fontFeature: '"tnum"'
rounded:
  sm: "1px"
  md: "2px"
  lg: "4px"
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
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.fg}"
    textColor: "{colors.accent-fg}"
  button-primary-lg:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-fg}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
    height: "48px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
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
    rounded: "{rounded.md}"
    padding: "8px 16px"
  badge-neutral:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    height: "24px"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.fg}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.bg-elevated}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  sheet:
    backgroundColor: "{colors.bg-elevated}"
    textColor: "{colors.fg}"
    rounded: "0"
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

**Creative North Star: "The Field Survey Sheet"**

Every NEWMA surface is a printed survey sheet: mint survey paper carrying a small set of spot inks, framed by an ink neatline with corner ticks, lettered like a map. Farm to patient is drawn as a real route, an apricot band edged in sienna, and each check along it is a surveyed benchmark. The public site uses the sheet to persuade; the demo workspace uses the same sheet in its working register, with legend keys, ruled tables and title-block fields. There is no second visual language for the product.

The density is printed, not decorated. Structure comes from ink rules (1px hairlines, 1.5–2px heavier rules for heads and section tops), hatching for parcels whose data is restricted or held, and numbered legend keys. Hue never carries meaning by itself: a glyph shape, a stroke pattern (dashed for optional or out of scope, hatched for restricted or held) or a text label always says the same thing.

The world refuses the dark biotech hero with a glowing diagram and the leafy wellness landing. Surfaces are flat paper; the only breaks in the paper rhythm are the three deep ink-teal plates: the hero terrain half, the workflow diagram (and its 3D twin) and the legend plate.

**Key Characteristics:**

- Mint paper, ink-teal linework, spot inks only; every text and stroke pair is contrast-tested.
- Geologica with its sharpness axis raised for display lettering; Martian Mono only for grid references, coordinates, hashes and measured values.
- Neatlines, corner ticks, grid references, hatched parcels, numbered legend keys and benchmark markers as the recurring vocabulary.
- Square corners (1–2px) everywhere a surface or control has an edge; circles only for benchmarks and waypoints.
- Flat: depth comes from paper tones and the deep plate, never from soft shadows.

## Colors

A cool mint survey paper printed in ink-teal, with field green for action, apricot and sienna for the route, and madder and ochre for refusals and holds.

### Primary

- **Field Green** (accent): the only action colour. Filled primary buttons, links, the patient cross on the terrain. Text on it is the fresh-sheet tone (accent-fg).

### Secondary

- **Apricot Route** (route): the farm-to-patient band, the route profile behind waypoints, the walked segments of the gate tracker, and text selection. Ink-teal text only.
- **Surveyor's Sienna** (route-edge / focus): the route's edge and the focus ring pencil. One value, two roles on paper (it clears 3:1 on paper and the elevated sheet); inside a plate it is re-cut lighter (route-edge #c97a4d, focus #f2b27e). Also the underline ink for header nav hover.

### Tertiary (status and plate inks)

- **Madder** (danger): refusals, failed checks, restricted hatching (mixed to 28% in the hatch).
- **Ochre** (warning) with **Ochre Ink** (warning-ink): fill for holds and pending checks; the ink is the stroke wherever a line must carry meaning on paper (WCAG 1.4.11).
- **Sage** (success) with **Sage Ink** (success-ink): fill for passed checks; the ink strokes trees, sprouts and badge edges. Contour lines and plate-muted text reuse the sage value.
- **Deepened Sienna** (eco-compute): the Agentic Compute plate tone, deepened from the route edge so it holds 4.5:1 as text.
- **Provenance Madder** (eco-optional): the Provenance & DLT plate, always paired with a dashed stroke because it is optional.

### Neutral

- **Survey Paper** (bg): the page.
- **Fresh Sheet** (bg-elevated): a sheet laid on the paper; inputs, sheet interiors, fill-on-colour text.
- **Paper Band** (bg-deep): section rhythm bands (with the survey grid), ghost-button and rail-item hover.
- **Ink-Teal** (fg): type and all linework, neatlines, table head rules, current rail item fill.
- **Faded Ink** (fg-muted): secondary text, ledes, grid ticks. Passes 4.5:1 on all three paper tones.
- **Grid Line** (border): table row dividers, light rules.
- **Pencil Outline** (border-strong): interactive outlines (neutral badge edge, toggles), the Data & Knowledge plate, scrollbar thumb.
- **Plates** (plate / plate-fg / plate-muted, plus the plate-* re-cuts): the deep ink-teal surface of the hero terrain half, the workflow diagram and its 3D twin, the legend section. (The demo banner is a flat plate-coloured strip, not a fourth plate.) Inside a plate the semantic tokens are remapped (`.plate-surface`): text is paper-tone, secondary text sage, accent a lighter field green, danger/warning/success/compute/optional lighter re-cuts, contour a dim sage, route edge and focus lighter sienna (#c97a4d, #f2b27e). Every re-cut pair is in contrast-pairs.json.

### Named Rules

**The Spot Ink Rule.** Every colour is a named ink with a job. A new colour enters only with a pair in `contrast-pairs.json` that the token test verifies; no ad-hoc hex in components.

**The Fill-and-Ink Rule.** Light fills (ochre, sage, apricot) never carry meaning as a stroke on paper. Where a line must be seen, use the matching ink (warning-ink, success-ink, route-edge).

**The Never-Hue-Alone Rule.** Status, plate identity and restriction are always doubled by a glyph, a dash or hatch pattern, or text. Status badges read "Status: PASS" to screen readers.

## Typography

**Display Font:** Geologica (variable, SHRP axis), with ui-sans-serif, system-ui fallback
**Body Font:** Geologica
**Label/Mono Font:** Martian Mono, with ui-monospace fallback

**Character:** Geologica is set like map lettering: tight, slightly cut display titles and tracked-caps place names. Martian Mono is the surveyor's instrument voice and appears only where something is measured or referenced.

### Hierarchy

- **Display** (500, clamp 2.5rem to 4.5rem, 0.98, -0.035em, SHRP 60): the hero headline in the title block only. Detail page and legal h1s use 2.25rem on phones, 3rem from sm and 3.75rem from xl, at the same weight and tracking.
- **Headline** (500, 2.25rem to 3rem, 1.02, -0.03em, SHRP 60): section h2s, balanced wrap.
- **Statement** (400, 1.5rem to 1.875rem, snug, -0.02em, SHRP 60): a single declarative line under a headline, capped near 30–34ch.
- **Title** (500, 1.5rem, -0.015em): sentence-case sub-headings inside a section; 1.25rem/-0.01em for waypoint and card titles. Demo h2/h3 sit at 500 with -0.015em.
- **Body** (400, 1rem; ledes 1.125rem, relaxed 1.625): prose capped at 38–52ch on the site, 72ch in demo intros.
- **Label** (500, 0.75rem, 0.14em, uppercase): place names, legend headings, nav group labels and form labels. Demo table heads and definition terms use 0.6875rem at 0.12em, heads at 600.
- **Grid reference** (Martian Mono 400, 0.6875rem, 0.02em, tabular figures): sheet refs, grid ticks, scale text, the hero disclaimer as a map note, legend key numbers and W-codes.

### Named Rules

**The Instrument Mono Rule.** Martian Mono is for grid references, coordinates, hashes, codes and measured values. Never for headings, buttons or body copy.

**The Sharp Display Rule.** Display, headline and statement lettering carry `font-variation-settings: "SHRP" 60`; UI and body text stay at the default axis.

**The Tabular Rule.** Tables and anything tagged tabular use tabular numerals.

## Layout

Every page sits inside a paper margin: 12px on phones, 0.5in from md (48rem), so the neatline reads as a sheet laid on paper; content spans the full width inside it (no max-width container, only line-length caps in ch on running text). Sections pad 20px horizontally and 80px vertically on phones, 48px and 112px from md. Composition is a 12-column grid: the hero splits 6/6 with an ink rule between title block and terrain; content sections pair a 7-column headline with a 5-column ruled aside. Spacing follows a 4px base (0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4rem).

Section rhythm alternates paper (bg), paper band with the 64px survey grid (bg-deep), and once, the deep legend plate. In the demo, each top-level section starts on a 15%-ink hairline with 2.5rem above its content, like a new block on the sheet. The workflow rail is a sticky 16rem left margin from xl (80rem); below that it becomes a horizontally scrolling strip of keys under the header. The sticky header is 4rem; scroll-padding clears it, and it unsticks on viewports shorter than 32rem. Vertical grid ticks drop below 48rem.

## Elevation & Depth

The system is flat. Depth is tonal: Survey Paper underneath, Fresh Sheet laid on top inside a neatline, Paper Band for recessed rhythm, and the plates as the only dark fields. The hero's six ecosystem plates sit as translucent overprints (tone mixed 18% into the sheet at 0.84 opacity) so the route shows through them; isolating a plate dims the others to 0.24 rather than lifting the chosen one.

### Shadow Vocabulary

- **Focus halo** (`box-shadow: 0 0 0 2px var(--color-bg)`): the inner half of the two-tone focus ring, paired with a 2px sienna outline offset 3px. The only sanctioned shadow.

### Named Rules

**The Printed Sheet Rule.** Nothing floats. No drop shadows, glass or blur on any surface; separation is an ink rule, a paper tone or the plate.

## Shapes

Edges are square: 1px for badges (stamped tags), 2px for buttons and native inputs, 4px as the ceiling. Containers take an ink neatline, not a rounded shell: the sheet is a 1px ink border with 10px corner ticks inset 5px. Circles appear only for surveyed points: gate benchmarks (28px, 1.5px stroke), numbered route waypoints (36px) and terrain markers. Dashed strokes mean optional, unsurveyed or out of scope; diagonal hatching means restricted (madder, -45deg, 7px pitch) or held (ochre, 45deg, 8px pitch). Hard-stop CSS gradients are the world's drawing tool for ticks, hatching and the survey grid; they never fade between colours.

Drawn marks replace text glyphs: a 16-unit box, one 1.6px stroke weight, currentColor, always decorative beside text that carries the meaning.

## Components

### Buttons

Inked, square and decisive.

- **Shape:** square-cornered (2px), 1px border on every variant so forced-colors mode draws an outline.
- **Primary:** field green fill, fresh-sheet text, 500 weight; sizes 32/40/48px min-height with 12/16/24px side padding.
- **Hover / Focus:** primary and danger hover to ink-teal fill; secondary inverts to ink fill with paper text; ghost gains a paper-band fill and underline. Active nudges down 1px. Focus is the global two-tone sienna ring. Transitions run 150ms on the standard ease.
- **Secondary:** transparent with an ink-teal 1px border, paired beside primary in the title block.
- **Ghost / Danger:** ghost for low-emphasis actions; danger is a madder fill.

### Chips (Status Badges)

- **Style:** stamped tags: 24px min-height, 1px corners, 12px 500 text, a fill plus a darker ink edge from the same family (sage fill with sage ink, ochre with ochre ink, neutral fresh sheet with pencil outline).
- **State:** the vocabulary is exactly the gate status enum: PASS (sage), HOLD and PENDING (ochre), FAIL and INVALIDATED (madder), NOT_STARTED (neutral).

### Cards / Containers

- **Corner Style:** square; the sheet has no radius.
- **Background:** Fresh Sheet on Survey Paper.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1px ink neatline with corner ticks; sections inside are divided by ink rules (1px, or 2px for heavier section tops).
- **Internal Padding:** 20px on phones, 40px from md.

### Inputs / Fields

- **Style:** native controls with 2px corners on a Fresh Sheet fill; the border darkens to ink-teal on hover.
- **Focus:** the global two-tone sienna ring.

### Navigation

- **Site header:** sticky 4rem paper bar on a 15%-ink hairline; muted links that turn ink with a 2px sienna underline on hover; a compact primary button for access.
- **Workflow rail (demo):** numbered legend keys (W-codes in mono) with 40px rows; hover takes the paper band, the current page is a solid ink-teal fill with paper text. Group labels use the tracked-caps label style.

### Legend Plate

The deep ink-teal section printed as the map legend: numbered keys (mono counters in plate-muted), each a ruled row with a plate swatch, title and descriptor; hover lifts the row by a 6% paper-tone wash.

### Map Key

The strip along the bottom of a sheet: sheet ref in mono, a tracked-caps legend heading, swatches for route (apricot with sienna edges), contour (sage hairline) and restricted (hatched box), and an alternating ink scale bar.

### Benchmark Tracker

Gates as surveyed benchmarks down a vertical route: sage fill with a drawn check for passed, ochre hatching for held, madder fill for failed, open ink ring for not started, dashed muted ring for out of scope. Walked segments are the apricot band with sienna edges; unwalked segments are a dashed muted line.

### Workflow Key

Each demo h1 opens with its W-code in a square ink-bordered mono key that matches the rail.

## Do's and Don'ts

### Do:

- **Do** frame primary surfaces as sheets: a 1px ink neatline, corner ticks, and a map key or grid references where the surface warrants them.
- **Do** use field green (accent) for action and nothing else; hover filled actions to ink-teal.
- **Do** pair every light fill with its ink (warning-ink, success-ink, route-edge) whenever a stroke carries meaning.
- **Do** double hue with a glyph, dash, hatch or label; dashed means optional or out of scope, hatched means restricted or held.
- **Do** set place names and table heads in tracked caps (0.12–0.14em) and reserve Martian Mono for references, codes and measurements.
- **Do** add a contrast pair to `contrast-pairs.json` for any new colour pairing before it ships.
- **Do** use drawn SVG marks (16-unit box, 1.6px stroke, currentColor) instead of text glyphs for status.
- **Do** honour reduced motion: the route is shown complete and token durations drop to 0ms.

### Don't:

- **Don't** use soft drop shadows, glass or backdrop blur; the focus halo is the only shadow.
- **Don't** use colour-fade gradients; hard-stop gradients for ticks, hatching and grids are the only gradients.
- **Don't** wrap content in rounded card shells or exceed 4px corners; circles are for benchmarks and waypoints only.
- **Don't** set headings, buttons or body copy in Martian Mono.
- **Don't** let hue alone carry status, plate identity or restriction.
- **Don't** add dark regions beyond the three blessed plates: the hero terrain half, the workflow diagram (and its 3D twin) and the legend plate. Everything dark is the same `.plate-surface`, never a bespoke dark colour.
- **Don't** document or design around placeholder copy; text is governed by the claims register.
