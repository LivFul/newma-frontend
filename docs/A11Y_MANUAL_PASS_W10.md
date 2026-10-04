# Manual accessibility pass: W10 custodian view (D-19)

The automated suites (axe on `/demo/w10-custodian` in both Playwright projects with the grievance
`<details>` closed and open, the no-JavaScript form post, the first-load weight assertion) prove the
structure and the budget. This checklist covers what only a person can judge: a real screen reader, real
zoom, a slow link and plain-language reading. The controller runs it against the preview or production
URL as the Community liaison persona and logs each line in `PROGRESS.md` under "Manual accessibility log
(P5)" as `pass`, `fail` or `not run`, with the date and browser.

## Automated proxies (P6 hardening)

Rows marked _automated_ come from `tests/a11y/keyboard.spec.ts` and `tests/a11y/emulation.spec.ts`
(tag `@needs-backend`), run on desktop Chromium against `https://demo.newmalabs.com` with `DEMO_E2E=1`;
they create one disposable demo session as Community liaison and submit nothing. Reduced motion and dark
scheme were also checked there (no running animation, axe clean). Rows marked _manual_ still need a person.

## Preparation

- URL under test: `/demo/w10-custodian` after "Demo sign-in" as Community liaison.
- Browsers: Chrome (latest) for items 1, 3 and 4; Safari then Chrome with VoiceOver for item 2.
- Reset zoom to 100 percent and clear any emulation before each item.

## 1. Keyboard only, Chrome

- [ ] The skip link is the first stop; Enter moves focus to the main content.
      _automated: pass against https://demo.newmalabs.com with DEMO_E2E=1 (`tests/a11y/keyboard.spec.ts › w10: walk, skip link, open the concern form and Tab through it`, 2026-10-04)_
- [ ] Tab reaches every `<summary>` ("Raise a concern about this agreement") in order; Enter and Space open
      and close it; the focus ring is visible on every stop.
      _automated: pass for Tab reaching every summary, Enter opening the first and a visible indicator on every stop; Space stays manual (`tests/a11y/keyboard.spec.ts › w10`, 2026-10-04)_
- [ ] Inside an open form Tab moves category, promise, description, "Send concern"; there is no trap.
      _automated: pass for the order select, select, textarea, Send concern and no trap in either direction with the form open (`tests/a11y/keyboard.spec.ts › w10`, 2026-10-04)_
- [ ] Enter on "Send concern" submits; after the redirect the page shows the notice and keyboard focus is
      at the top of the document (no lost focus).
      _manual: not automated (the keyboard spec does not submit)_

## 2. Screen reader (VoiceOver on macOS, Safari then Chrome), rotor `VO+U`

_Manual: every row in this section needs a person with a screen reader; none is automated._

- [ ] Landmarks: banner and main (the demo layout has no footer, so no contentinfo). Headings: one h1, one h2 per
      agreement, h3 for its sections and h4 for the two use lists.
- [ ] Each agreement is announced as an article named by its title.
- [ ] The obligations table is announced with its caption and the column headers "What was promised",
      "Due", "Where it stands"; moving by cell reads the header, and each status is read as words ("Done",
      "Due", "Late") followed by the sentence.
- [ ] The `<details>` forms announce expanded and collapsed; every control has a spoken label; the length
      hint is read with the description field.
- [ ] After sending, the redirect ends in `#outcome`: the "Your concern was sent" section takes focus and its
      heading is read (a live region alone is not announced for content present at page load). Check where the
      reading cursor lands in each screen reader.
- [ ] After an empty submit the "We could not send your concern" section is read, the failed agreement's form is
      open, the description is marked invalid and its error is read with the field. The typed text is not kept
      by design (the description never travels in a URL); note this against WCAG 3.3.7.

## 2b. More screen readers and input modes

_Manual: not automated._

- [ ] NVDA with Firefox and Chrome, and Narrator with Edge: repeat the table, form and outcome checks (live-region
      behaviour on page load differs between them). iOS VoiceOver and TalkBack at 320 px.
- [ ] Voice Control or Dragon: "Click Raise a concern" opens a form (the visible label is part of the accessible
      name); target sizes are comfortable by touch.

## 3. Zoom and reflow, Chrome

- [ ] 200 percent zoom: nothing is clipped, no horizontal scroll except inside the tables' scroll groups.
      _automated: pass at 640 CSS px against https://demo.newmalabs.com with DEMO_E2E=1 (`tests/a11y/emulation.spec.ts › /demo/w10-custodian: 200% zoom (640 CSS px) reflows without clipping`, 2026-10-04)_
- [ ] 320 CSS px wide (400 percent zoom): the cards, tables and form reflow; every control stays reachable.
      _automated: pass for reflow, clipping and axe at 320 CSS px against https://demo.newmalabs.com with DEMO_E2E=1; reachability is the 1280 px keyboard walk (`tests/a11y/emulation.spec.ts › /demo/w10-custodian: 400% zoom (320 CSS px)`, 2026-10-04)_

## 4. Slow link (A-P5B-F03)

_Manual: not automated in this pass (the 200 KB weight is `tests/e2e/demo-w10-weight.spec.ts`)._

- [ ] DevTools: CPU 4x slower, network "Slow 3G", disable cache. The agreement list is readable and the form
      is usable within 10 seconds of navigation (the 10 seconds is an agent target; the only source
      budget is 200 KB, asserted by `tests/e2e/demo-w10-weight.spec.ts`).
- [ ] The form posts and the page returns with the page still usable on the slow link.

## 4b. Other states

- [ ] Forced colours (Chrome `forced-colors: active` emulation and Windows High Contrast): the summary marker, field
      borders, the Send button, badges, the Done, Due and Late symbols and the focus ring stay visible.
      _automated: pass in Chrome emulation against https://demo.newmalabs.com with DEMO_E2E=1; Windows High Contrast stays manual (`tests/a11y/emulation.spec.ts › /demo/w10-custodian: forced colours keep focus visible and axe clean`, 2026-10-04)_
- [ ] 1.4.12 text spacing and 200 percent text-only resize: nothing is clipped; a very long concern text wraps.
      _automated: pass for 1.4.12 text spacing at 1280 and 320 px against https://demo.newmalabs.com with DEMO_E2E=1; 200 percent text-only resize and a long concern stay manual (`tests/a11y/emulation.spec.ts › /demo/w10-custodian: WCAG 1.4.12 text spacing clips nothing`, 2026-10-04)_
- [ ] Other personas: Data steward and Tenant admin see the agreements with "Only a community liaison can send a
      concern" and no form; Scientist sees the persona notice; a backend error shows the error notice.
- [ ] Variants: a withdrawn agreement ("taken back" wording), an agreement with no promises, no uses and no
      concerns, and several agreements (each form named after its agreement).
- [ ] Page title: "Custodian view" in the tab and in the history.
- [ ] A reload after the redirect shows the notice again (a no-JS limit, noted, not a defect).

## 5. Reading level and meaning

_Manual: not automated._

- [ ] Record a measured grade (Flesch-Kincaid, target 8 or lower) for the real strings, including the
      server-composed status, validity and use sentences, and who reviewed it.
- [ ] Read every string aloud (summary, status sentences, uses, promises, form labels, notices): plain
      words, short sentences, no jargon (no "withdrawn", "obligation", "policy", "consent record").
- [ ] No information by colour alone: every status is also words; the Due, Done and Late symbols are
      decorative.
- [ ] A withdrawn agreement reads as taken back, not as a technical state.
