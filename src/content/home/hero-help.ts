import { HERO_LABELS, type EcosystemSlug } from "../ecosystem/registry";
import type { CopyBlock } from "../types";

const block = (id: string, text: string): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze(["C-48"]) });

// Hint shown in the fixed-height row under the graphic (claim C-48: interface strings of the hero).
export const HERO_HINT = block("hero.hint", "Select a component to open its page.");
export const HERO_TOGGLE_LABEL = block("hero.toggle", "Explore components");
// Read after the diagram's description on the interactive layer only, which is the one that answers
// these keys and taps. There is no visible keyboard help (D12), so this is where the controls are named.
export const HERO_CONTROLS = block(
  "hero.controls",
  "Use the arrow keys to move between components, Home and End to jump to the first or last, and Escape to bring the layers back together. On a touch screen, the first tap separates the layers and a second tap opens the component.",
);

// Polite status text for the one silent step: the first touch tap separates the layers instead of
// opening the page it names.
export function heroTouchAnnouncement(slug: EcosystemSlug): string {
  return `Components separated. Activate again to open ${HERO_LABELS[slug].title}.`;
}
