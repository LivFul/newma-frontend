# Manual accessibility pass (D-07, DoD item 1)

The automated suites (axe on `/`, `/ecosystem/*` and `/legal/*` in both Playwright projects, the hero
keyboard, touch, reduced-motion and no-JavaScript specs, forced-colours and 320 px reflow checks)
prove the structure. This checklist covers what only a person can judge: real screen readers, real
focus order, real zoom. The controller runs it against the preview or production URL and logs each
line in `PROGRESS.md` under "Manual accessibility log (P4)" as `pass`, `fail` or `not run`, with the
date and browser.

## Automated proxies (P6 hardening)

Rows marked _automated_ are covered by Playwright specs on the desktop Chromium project against a
local production build (`pnpm build && pnpm start --port 3160`, `PLAYWRIGHT_BASE_URL`). They run in the
preview E2E workflow (`pnpm test:a11y`). A pass there replaces the manual check only for what the note
says; rows marked _manual_ still need a person.

## Preparation

- URL under test: `https://newma-frontend.vercel.app` (or the preview), pages `/`, `/ecosystem/provenance-dlt`
  and `/legal/privacy`.
- Browsers: Chrome (latest) for items 1 and 3; Safari then Chrome with VoiceOver for item 2.
- Reset zoom to 100 percent and clear any emulation before each item.

## 1. Keyboard only, Chrome

Start with the focus in the address bar and use only the keyboard.

- [ ] Tab: the skip link is the first stop, with a visible focus ring; Enter moves focus to the main content.
      _automated: pass (`tests/a11y/keyboard.spec.ts › the skip link is the first stop and moves focus to main`, 2026-10-04)_
- [ ] The focus ring is visible everywhere (three to one contrast) and never hidden behind the sticky
      header, including when tabbing backwards with Shift+Tab from the footer.
      _automated: pass for a non-zero outline, box-shadow or SVG stroke on every stop and none hidden under the header in both directions; the 3:1 contrast of the ring stays manual (`tests/a11y/keyboard.spec.ts › keyboard-only walk reaches everything with visible focus`, 2026-10-04)_
- [ ] Access NEWMA in the header is reachable and opens the demo sign-in page.
      _automated: pass for reachability by Tab; opening it with Enter stays manual (`tests/a11y/keyboard.spec.ts › keyboard-only walk`, 2026-10-04)_
- [ ] Hero: Tab reaches the six components in order; the diagram separates on the first focus; the
      arrow keys, Home and End move between components; Enter opens the focused one; Escape puts the
      layers back together and keeps focus; Tab leaves the figure without a trap.
      _automated: pass for Tab reaching the six components, Escape keeping focus, Enter opening the focused one and no trap; arrow keys, Home and End stay manual (`tests/a11y/keyboard.spec.ts › hero: Escape keeps focus on the component; Enter opens it`, 2026-10-04)_
- [ ] "Explore components" works with Enter and Space.
      _manual: not automated_
- [ ] The Product and About LivFul header links and the "How it works" button land with the section
      heading fully visible below the header.
      _manual: not automated by keyboard (pointer coverage in `tests/e2e/sticky-header.spec.ts`)_
- [ ] A component page: Sources list, "See it in the demo" link, the other-components links and the
      footer links are all reachable. There is no keyboard trap anywhere.
      _automated: pass on `/ecosystem/wet-lab` and `/access` (`tests/a11y/keyboard.spec.ts › keyboard-only walk reaches everything with visible focus`, 2026-10-04)_

## 2. Screen reader (VoiceOver on macOS, Safari then Chrome), rotor `VO+U`

_Manual: every row in this section needs a person with a screen reader; none is automated._

- [ ] Landmarks list: banner, main, contentinfo (and the navigation regions by name).
- [ ] Headings list: one h1, then h2 sections, with no skipped level, on the home page and a component page.
- [ ] Links list: each hero component is announced with its descriptor, for example "Interface. Where
      people sign in. Opens the Interface page." There is no bare "link, link".
- [ ] The diagram is announced as a group named "NEWMA ecosystem diagram", with the description available.
- [ ] "Explore components" is announced as a toggle button with its pressed state.
- [ ] On a touch device or with a pointer-driven first activation, the status "Components separated.
      Activate again to open ..." is announced once.
- [ ] The Provenance & DLT page announces that the component is optional and that records stay off-chain.
- [ ] The legal pages announce "Draft for review — not legal advice" first.
- [ ] After the skip link, focus lands on the main region and reading continues from there.
- [ ] While the page loads and after about two seconds (when the interactive hero replaces the static
      one), the screen reader's position is not lost. Note any change in behaviour here: the swap is the
      known residual risk of the idle load.

## 3. Chrome DevTools

- [ ] Rendering panel, `prefers-reduced-motion: reduce`: the diagram is static and separated, and nothing moves.
      _automated: pass for no running animation and axe clean (`tests/a11y/emulation.spec.ts › reduced motion leaves nothing animating`, 2026-10-04)_
- [ ] Rendering panel, `forced-colors: active`: the six components, the header button and the focus
      outlines remain visible.
      _automated: pass for a visible focus indicator, no text drawn in its background colour and axe clean (contrast rule off: the UA picks colours) (`tests/a11y/emulation.spec.ts › forced colours keep focus visible and axe clean`, 2026-10-04)_
- [ ] Rendering panel, vision deficiencies (blurred vision, protanopia, deuteranopia, achromatopsia):
      the six components are still told apart by glyph shape and label.
      _manual: not automated_
- [ ] Device toolbar with touch (iPhone 14 and Pixel 7): the first tap separates the layers, the second
      tap opens a component, the toggle works, there is no tap delay and no accidental zoom.
      _manual: not automated here_
- [ ] Zoom to 400 percent at 1280 px width and at 320 px width: content reflows, nothing scrolls
      horizontally, the header stays intact.
      _automated: pass at 640 and 320 CSS px (200 and 400 percent of 1280 px): no horizontal scroll, no clipped or overlapping text, axe clean; 400 percent of 320 px stays manual (`tests/a11y/emulation.spec.ts › 200% / 400% zoom reflows without clipping`, 2026-10-04)_
- [ ] Accessibility tree panel: each component link has the expected name and the link role.
      _manual: not automated here_
- [ ] Lighthouse accessibility reports 100 on `/` and on one component page.
      _manual: `pnpm lhci` (not run in this pass)_

## 4. Text spacing and zoom

- [ ] Apply the WCAG text-spacing values (line height 1.5, paragraph spacing 2, letter spacing 0.12,
      word spacing 0.16 em, as a bookmarklet or the Chrome extension): no clipped or overlapping text
      in the header, hero or footer.
      _automated: pass at 1280 and 320 px on `/`, `/ecosystem/wet-lab`, `/access`, `/legal/privacy`: no clipped (overflow hidden/clip with scroll size over client size) or overlapping text, no horizontal scroll, axe clean (`tests/a11y/emulation.spec.ts › WCAG 1.4.12 text spacing clips nothing`, 2026-10-04)_

## 5. NVDA on Windows

_Manual: not automated._

- [ ] Run items 2 and 1 with NVDA and Firefox or Chrome if a Windows machine is available; otherwise
      record "not run" with the reason. The DoD asks for a screen-reader pass; VoiceOver satisfies it
      and NVDA is a recorded gap.

## Log template

Copy into `PROGRESS.md`, one row per checklist line that was run.

| Item | Result (pass / fail / not run) | Date | Browser and assistive technology | Notes |
| ---- | ------------------------------ | ---- | -------------------------------- | ----- |
