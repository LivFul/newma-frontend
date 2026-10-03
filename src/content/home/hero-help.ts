import { HERO_LABELS, type EcosystemSlug } from "../ecosystem/registry";
import type { CopyBlock } from "../types";

const block = (id: string, text: string): CopyBlock =>
  Object.freeze({ id, text, claims: Object.freeze(["C-48"]) });

// Hint shown in the fixed-height row under the graphic (claim C-48: interface strings of the hero).
export const HERO_HINT = block("hero.hint", "Select a component to open its page.");
export const HERO_TOGGLE_LABEL = block("hero.toggle", "Explore components");
export const HERO_HELP_SUMMARY = block("hero.help.summary", "Keyboard help");

// The input model, as read by the visible "Keyboard help" disclosure (assumption A-P4-15).
export const HERO_HELP_ITEMS: readonly CopyBlock[] = Object.freeze([
  block("hero.help.tab", "Tab and Shift+Tab move between components."),
  block(
    "hero.help.arrows",
    "When animation is on, the arrow keys, Home and End also move between components.",
  ),
  block("hero.help.enter", "Enter opens the focused component."),
  block("hero.help.escape", "Escape puts the layers back together."),
  block(
    "hero.help.touch",
    "On a touch screen, the first tap separates the layers and the second tap opens a component, or use Explore components.",
  ),
  block(
    "hero.help.reduced",
    "With reduced motion the diagram stays separated and only Tab applies.",
  ),
]);

// Polite status text for the one silent step: the first touch tap separates the layers instead of
// opening the page it names.
export function heroTouchAnnouncement(slug: EcosystemSlug): string {
  return `Components separated. Activate again to open ${HERO_LABELS[slug].title}.`;
}
