# Manual accessibility pass (D-07, DoD item 1)

The automated suites (axe on `/`, `/ecosystem/*` and `/legal/*` in both Playwright projects, the hero
keyboard, touch, reduced-motion and no-JavaScript specs, forced-colours and 320 px reflow checks)
prove the structure. This checklist covers what only a person can judge: real screen readers, real
focus order, real zoom. The controller runs it against the preview or production URL and logs each
line in `PROGRESS.md` under "Manual accessibility log (P4)" as `pass`, `fail` or `not run`, with the
date and browser.

## Preparation

- URL under test: `https://newma-frontend.vercel.app` (or the preview), pages `/`, `/ecosystem/provenance-dlt`
  and `/legal/privacy`.
- Browsers: Chrome (latest) for items 1 and 3; Safari then Chrome with VoiceOver for item 2.
- Reset zoom to 100 percent and clear any emulation before each item.

## 1. Keyboard only, Chrome

Start with the focus in the address bar and use only the keyboard.

- [ ] Tab: the skip link is the first stop, with a visible focus ring; Enter moves focus to the main content.
- [ ] The focus ring is visible everywhere (three to one contrast) and never hidden behind the sticky
      header, including when tabbing backwards with Shift+Tab from the footer.
- [ ] Access NEWMA in the header is reachable and opens the demo sign-in page.
- [ ] Hero: Tab reaches the six components in order; the diagram separates on the first focus; the
      arrow keys, Home and End move between components; Enter opens the focused one; Escape puts the
      layers back together and keeps focus; Tab leaves the figure without a trap.
- [ ] "Explore components" works with Enter and Space; "Keyboard help" opens and closes with Enter and Space.
- [ ] The Product and About LivFul header links and the "How it works" button land with the section
      heading fully visible below the header.
- [ ] A component page: Sources list, "See it in the demo" link, the other-components links and the
      footer links are all reachable. There is no keyboard trap anywhere.

## 2. Screen reader (VoiceOver on macOS, Safari then Chrome), rotor `VO+U`

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
- [ ] Rendering panel, `forced-colors: active`: the six components, the header button and the focus
      outlines remain visible.
- [ ] Rendering panel, vision deficiencies (blurred vision, protanopia, deuteranopia, achromatopsia):
      the six components are still told apart by glyph shape and label.
- [ ] Device toolbar with touch (iPhone 14 and Pixel 7): the first tap separates the layers, the second
      tap opens a component, the toggle works, there is no tap delay and no accidental zoom.
- [ ] Zoom to 400 percent at 1280 px width and at 320 px width: content reflows, nothing scrolls
      horizontally, the header stays intact.
- [ ] Accessibility tree panel: each component link has the expected name and the link role.
- [ ] Lighthouse accessibility reports 100 on `/` and on one component page.

## 4. Text spacing and zoom

- [ ] Apply the WCAG text-spacing values (line height 1.5, paragraph spacing 2, letter spacing 0.12,
      word spacing 0.16 em, as a bookmarklet or the Chrome extension): no clipped or overlapping text
      in the header, hero or footer.

## 5. NVDA on Windows

- [ ] Run items 2 and 1 with NVDA and Firefox or Chrome if a Windows machine is available; otherwise
      record "not run" with the reason. The DoD asks for a screen-reader pass; VoiceOver satisfies it
      and NVDA is a recorded gap.

## Log template

Copy into `PROGRESS.md`, one row per checklist line that was run.

| Item | Result (pass / fail / not run) | Date | Browser and assistive technology | Notes |
| ---- | ------------------------------ | ---- | -------------------------------- | ----- |
