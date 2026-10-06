import type { CopyBlock } from "../types";
import { HERO } from "./copy";

const block = (id: string, text: string, claims: readonly string[]): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze([...claims]) });

// Structural words (navigation labels) carry no claim.
export const WORDMARK = Object.freeze({
  org: block("chrome.wordmark.org", "LivFul", []),
  product: block("chrome.wordmark.product", "NEWMA", []),
  homeLabel: block("chrome.wordmark.label", "LivFul NEWMA home", []),
});

export const NAV_LINKS = Object.freeze([
  Object.freeze({ block: block("chrome.nav.product", "Product", []), href: "/#product" }),
  Object.freeze({ block: block("chrome.nav.about", "About LivFul", []), href: "/#about" }),
]);

export const ACCESS_LABEL = block("chrome.access", "Access NEWMA", ["C-21"]);

// Staff-only tool on its own origin behind Cloudflare Access; a navigation label, so no claim.
export const AVELOZ_LINK = Object.freeze({
  block: block("chrome.aveloz", "Aveloz (LivFul staff)", []),
  short: block("chrome.aveloz.short", "Aveloz", []),
  suffix: block("chrome.aveloz.suffix", " (LivFul staff)", []),
  href: "https://aveloz.livful.com",
});

// Assumption A-P4-02: no contact detail exists in any source.
export const FOOTER_CONTACT = block(
  "chrome.footer.contact",
  "Contact details to be supplied by LivFul.",
  ["C-29"],
);
export const FOOTER_DISCLAIMER = HERO.disclaimer;
export const FOOTER_LEGAL_LINKS = Object.freeze([
  Object.freeze({
    block: block("chrome.footer.privacy", "Privacy", ["C-30"]),
    href: "/legal/privacy",
  }),
  Object.freeze({ block: block("chrome.footer.terms", "Terms", ["C-30"]), href: "/legal/terms" }),
]);
export const FOOTER_NAV_LABEL = block("chrome.footer.nav", "Legal", ["C-30"]);
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
