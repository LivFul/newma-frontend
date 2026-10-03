import type { CopyBlock } from "../types";

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

// Assumption A-P4-02: no contact detail exists in any source.
export const FOOTER_CONTACT = block(
  "chrome.footer.contact",
  "Contact details to be supplied by LivFul.",
  ["C-29"],
);
export const FOOTER_DISCLAIMER = block(
  "chrome.footer.disclaimer",
  "The demo uses synthetic data and is not evidence of scientific performance, deployment or compliance.",
  ["C-21"],
);
export const FOOTER_LEGAL_LINKS = Object.freeze([
  Object.freeze({
    block: block("chrome.footer.privacy", "Privacy", ["C-30"]),
    href: "/legal/privacy",
  }),
  Object.freeze({ block: block("chrome.footer.terms", "Terms", ["C-30"]), href: "/legal/terms" }),
]);
export const FOOTER_NAV_LABEL = block("chrome.footer.nav", "Legal", ["C-30"]);
export const HEADER_NAV_LABEL = block("chrome.header.nav", "Sections", []);
