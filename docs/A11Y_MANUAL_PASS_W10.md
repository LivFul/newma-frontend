# Manual accessibility pass: W10 custodian view (D-19)

The automated suites (axe on `/demo/w10-custodian` in both Playwright projects with the grievance
`<details>` closed and open, the no-JavaScript form post, the first-load weight assertion) prove the
structure and the budget. This checklist covers what only a person can judge: a real screen reader, real
zoom, a slow link and plain-language reading. The controller runs it against the preview or production
URL as the Community liaison persona and logs each line in `PROGRESS.md` under "Manual accessibility log
(P5)" as `pass`, `fail` or `not run`, with the date and browser.

## Preparation

- URL under test: `/demo/w10-custodian` after "Demo sign-in" as Community liaison.
- Browsers: Chrome (latest) for items 1, 3 and 4; Safari then Chrome with VoiceOver for item 2.
- Reset zoom to 100 percent and clear any emulation before each item.

## 1. Keyboard only, Chrome

- [ ] The skip link is the first stop; Enter moves focus to the main content.
- [ ] Tab reaches every `<summary>` ("Raise a concern about this agreement") in order; Enter and Space open
      and close it; the focus ring is visible on every stop.
- [ ] Inside an open form Tab moves category, promise, description, "Send concern"; there is no trap.
- [ ] Enter on "Send concern" submits; after the redirect the page shows the notice and keyboard focus is
      at the top of the document (no lost focus).

## 2. Screen reader (VoiceOver on macOS, Safari then Chrome), rotor `VO+U`

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

- [ ] NVDA with Firefox and Chrome, and Narrator with Edge: repeat the table, form and outcome checks (live-region
      behaviour on page load differs between them). iOS VoiceOver and TalkBack at 320 px.
- [ ] Voice Control or Dragon: "Click Raise a concern" opens a form (the visible label is part of the accessible
      name); target sizes are comfortable by touch.

## 3. Zoom and reflow, Chrome

- [ ] 200 percent zoom: nothing is clipped, no horizontal scroll except inside the tables' scroll groups.
- [ ] 320 CSS px wide (400 percent zoom): the cards, tables and form reflow; every control stays reachable.

## 4. Slow link (A-P5B-F03)

- [ ] DevTools: CPU 4x slower, network "Slow 3G", disable cache. The agreement list is readable and the form
      is usable within 10 seconds of navigation (the 10 seconds is an agent target; the only source
      budget is 200 KB, asserted by `tests/e2e/demo-w10-weight.spec.ts`).
- [ ] The form posts and the page returns with the page still usable on the slow link.

## 4b. Other states

- [ ] Forced colours (Chrome `forced-colors: active` emulation and Windows High Contrast): the summary marker, field
      borders, the Send button, badges, the Done, Due and Late symbols and the focus ring stay visible.
- [ ] 1.4.12 text spacing and 200 percent text-only resize: nothing is clipped; a very long concern text wraps.
- [ ] Other personas: Data steward and Tenant admin see the agreements with "Only a community liaison can send a
      concern" and no form; Scientist sees the persona notice; a backend error shows the error notice.
- [ ] Variants: a withdrawn agreement ("taken back" wording), an agreement with no promises, no uses and no
      concerns, and several agreements (each form named after its agreement).
- [ ] Page title: "Custodian view" in the tab and in the history.
- [ ] A reload after the redirect shows the notice again (a no-JS limit, noted, not a defect).

## 5. Reading level and meaning

- [ ] Record a measured grade (Flesch-Kincaid, target 8 or lower) for the real strings, including the
      server-composed status, validity and use sentences, and who reviewed it.
- [ ] Read every string aloud (summary, status sentences, uses, promises, form labels, notices): plain
      words, short sentences, no jargon (no "withdrawn", "obligation", "policy", "consent record").
- [ ] No information by colour alone: every status is also words; the Due, Done and Late symbols are
      decorative.
- [ ] A withdrawn agreement reads as taken back, not as a technical state.
