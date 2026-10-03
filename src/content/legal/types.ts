import type { CopyBlock } from "../types";

export type LegalSection = Readonly<{ heading: CopyBlock; paragraphs: readonly CopyBlock[] }>;
export type LegalDocument = Readonly<{
  title: CopyBlock;
  /** Meta description (claim C-50, derived). */
  description: CopyBlock;
  draftLabel: CopyBlock;
  sections: readonly LegalSection[];
}>;

const freeze = <T extends object>(value: T): Readonly<T> => Object.freeze(value);

export const block = (id: string, text: string, claims: readonly string[] = []): CopyBlock =>
  freeze({ id, text, claims: Object.freeze([...claims]) });

export const section = (heading: CopyBlock, ...paragraphs: CopyBlock[]): LegalSection =>
  freeze({ heading, paragraphs: Object.freeze(paragraphs) });

// Assumption A-P4-03: neutral placeholders, technical facts of this site only, no jurisdiction,
// regime or controller (IP Q-16 is open). Claim C-31 covers the draft label.
export const DRAFT_LABEL: CopyBlock = block("legal.draft", "Draft for review — not legal advice", [
  "C-31",
]);

/** Page title of a legal page (claim C-30, derived). */
export const legalTitle = (doc: LegalDocument): string => `${doc.title.text} \u2014 NEWMA`;
