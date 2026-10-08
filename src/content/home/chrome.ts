import type { CopyBlock } from "../types";

const block = (id: string, text: string, claims: readonly string[]): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([...claims]) });

// Structural words (navigation labels) carry no claim.
export const WORDMARK = Object.freeze({
  org: block("chrome.wordmark.org", "LivFul", []),
  product: block("chrome.wordmark.product", "NEWMA", []),
  homeLabel: block("chrome.wordmark.label", "NEWMA by LivFul Therapeutics", []),
});

export const NAV_LINKS = Object.freeze([
  Object.freeze({ block: block("chrome.nav.overview", "Overview", []), href: "/#product" }),
  Object.freeze({
    block: block("chrome.nav.how", "How it works", []),
    href: "/#workflow",
  }),
  Object.freeze({ block: block("chrome.nav.ecosystem", "Ecosystem", []), href: "/#components" }),
  Object.freeze({ block: block("chrome.nav.about", "About Newma", []), href: "/#about" }),
]);

export const ACCESS_LABEL = block("chrome.access", "Access NEWMA", ["C-21"]);
// The header's label for the same link below xl (1280px); "Access NEWMA" stays in its accessible name.
export const ACCESS_SHORT = block("chrome.access.short", "Demo", ["C-21"]);
export const DEMO_CTA = block("chrome.demo", "Explore the demo", ["C-21"]);

// Staff-only tool on its own origin behind Cloudflare Access; a navigation label, so no claim.
export const AVELOZ_LINK = Object.freeze({
  block: block("chrome.aveloz", "Aveloz (LivFul staff)", []),
  short: block("chrome.aveloz.short", "Aveloz", []),
  suffix: block("chrome.aveloz.suffix", " (LivFul staff)", []),
  href: "https://aveloz.livful.com",
});

export const FOOTER_DESCRIPTOR = block(
  "chrome.footer.descriptor",
  "Connecting authorized botanical knowledge with computational research and experimental evidence.",
  ["C-29"],
);

export const FOOTER_DISCLAIMER = block(
  "chrome.footer.disclaimer",
  "NEWMA is in development. The demo uses synthetic data and does not establish scientific performance, production readiness or regulatory compliance.",
  ["C-21"],
);

export const FOOTER_LINKS = Object.freeze([
  Object.freeze({ block: DEMO_CTA, href: "/access" }),
  Object.freeze({ block: block("chrome.footer.about", "About Newma", []), href: "/#about" }),
  Object.freeze({
    block: block("chrome.footer.privacy", "Privacy", ["C-30"]),
    href: "/legal/privacy",
  }),
  Object.freeze({ block: block("chrome.footer.terms", "Terms", ["C-30"]), href: "/legal/terms" }),
]);

export const FOOTER_NAV_LABEL = block("chrome.footer.nav", "Footer", ["C-30"]);
export const HEADER_NAV_LABEL = block("chrome.header.nav", "Sections", []);
export const HEADER_MENU = block("chrome.header.menu", "Menu", []);
export const HEADER_MOBILE_NAV = block("chrome.header.mobile", "Mobile sections", []);

export const PWA_COPY = Object.freeze({
  region: block("chrome.pwa.region", "App install", []),
  updated: block("chrome.pwa.updated", "A new version of NEWMA is available. Reload to update.", [
    "C-56",
  ]),
  iosHint: block(
    "chrome.pwa.ios",
    "Install NEWMA from the share menu, then add it to the home screen.",
    ["C-56"],
  ),
  install: block("chrome.pwa.install", "Install NEWMA on this device for a full-screen app.", [
    "C-56",
  ]),
  reload: block("chrome.pwa.reload", "Reload", []),
  installAction: block("chrome.pwa.installAction", "Install", []),
  dismiss: block("chrome.pwa.dismiss", "Not now", []),
});
