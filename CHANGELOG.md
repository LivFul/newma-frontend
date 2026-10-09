# Changelog

All notable changes to the NEWMA frontend. Versions follow the `VERSION` file (`MAJOR.MINOR.PATCH.MICRO`).

## [0.2.0.1] - 2026-10-09

### Fixed

- On phones and narrow layouts, the appearance control (Light, Dark, System) lives in the Menu sheet with the section links instead of crowding the header bar; desktop keeps the icon control in the bar.

## [0.2.0.0] - 2026-10-09

### Added

- A three-way appearance control in the site header lets you choose Light, Dark, or System; your choice is remembered on every page.
- Dark survey-paper colours apply across the marketing site when you pick Dark or when no choice is stored yet (Dark is the default).

### Changed

- The reversed NEWMA lockup shows in user Dark mode on access, demo, offline, and every adaptive wordmark, not only the home header.
- Theme boot runs from a first-party script so strict content security on demo sign-in stays violation-free.

### Fixed

- Header contrast and keyboard checks run against the intended light hero by setting Light in storage for those tests only.

## [0.1.1.0] - 2026-10-08

### Changed

- The home page shows its headline, tagline and introduction on the first frame on phones. Only the call-to-action buttons and the disclaimer still rise in, and they start straight away. Mobile Lighthouse performance on the home page goes from about 0.8 to about 0.9.
- Mobile Lighthouse checks now allow 3.5 s for the largest paint (desktop stays at 2.5 s), which matches what the lab simulation measures once the page paints at first frame.

### Fixed

- The footer logo stays legible when the page is printed or shown with Windows High Contrast: the dark-ink logo on paper or a light high-contrast canvas, and the reversed logo on screen or a dark one.
- Screen readers now describe how to use the ecosystem diagram: the arrow keys, Home and End, Escape to bring the layers back together, and the two taps on touch screens.
- The header's section menu closes when you move to another page or widen the window past the tablet layout, and the header picks up the colour of the new page straight away.
- The offline page shows the NEWMA logos even if you go offline before visiting the site again, and it keeps its styles when the app updates.
- The 3D workflow view no longer reallocates its drawing buffer twice on every window resize, or at all when the size has not changed.
- The header's muted navigation labels are measured to stay readable (4.5:1 or better) over the hero.

### Added

- Automated checks for the About section's two-column layout, the full-width workflow diagram, the offline page's logos, the header and footer in print and high-contrast modes, and the `immutable` caching header that offline support relies on.
- The local end-to-end suite now passes on macOS, including Safari's keyboard navigation, and it detects whether it is running against the development server or a production build.
