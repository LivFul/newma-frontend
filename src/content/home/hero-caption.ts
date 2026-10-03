import type { CopyBlock } from "../types";

// Claim C-49 (assumption A-P4-17): the glyphs are abstract and illustrative.
export const HERO_CAPTION: CopyBlock = Object.freeze({
  id: "hero.caption",
  text: "Illustrative diagram. Glyphs are abstract and do not depict real species or deployed systems.",
  claims: Object.freeze(["C-49"]),
});
