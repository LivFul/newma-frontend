import { HERO_LABELS, type EcosystemSlug } from "../ecosystem/registry";
import type { CopyBlock } from "../types";

const block = (id: string, text: string): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze(["C-48"]) });

// Hint shown in the fixed-height row under the graphic (claim C-48: interface strings of the hero).
export const HERO_HINT = block("hero.hint", "Select a component to open its page.");
export const HERO_TOGGLE_LABEL = block("hero.toggle", "Explore components");

// Polite status text for the one silent step: the first touch tap separates the layers instead of
// opening the page it names.
export function heroTouchAnnouncement(slug: EcosystemSlug): string {
  return `Components separated. Activate again to open ${HERO_LABELS[slug].title}.`;
}
