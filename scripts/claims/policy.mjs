// Policy for the claims check (D-06): what published copy may not contain, and the closed lists it
// may draw on. Everything here is data plus small pure helpers, so the check stays auditable.

export const SCAN_DIRS = {
  /** Copy lives here. Every string is prose-checked; every file needs a claim declaration. */
  content: ["src/content"],
  /** UI code. No prose may be written inline here: copy must come from src/content. */
  ui: ["src/components/site", "src/components/ecosystem-graphic", "src/app/(site)"],
  /**
   * Demo pages and demo libraries (P6). Inline copy is expected here, so only NUM figures and names
   * are checked: a figure needs a `claims: C-nn` marker on its line or the line before, a listed name never passes.
   */
  demo: ["src/app/(platform)/demo", "src/lib/demo"],
};

/** Claim ids reserved for the public site (assumption A-P4 claim register: C-20 upward). */
export const P4_CLAIM_RANGE = { min: 20, max: 59 };

/** A string needs this many consecutive letters to count as inline prose. */
export const PROSE_LETTERS = /[A-Za-z]{3}/;

/** Attribute names whose literal values are user-visible text. */
export const UI_ATTRIBUTES = new Set([
  "aria-label",
  "alt",
  "title",
  "label",
  "description",
  "placeholder",
]);
/** Object properties that carry user-visible text (metadata, image alt). */
export const UI_PROPERTIES = new Set(["title", "description", "alt", "label"]);

/**
 * Figures of the kind the canonical numbers sheet (NUM, DRAFT) holds: percentages, currency amounts,
 * scaled quantities, royalty splits and basis points. A plain count ("step 3 of 16") or an amount in
 * demo credits is not one. Demo pages may show a figure only under a registered claim id; copy under
 * src/content may not show one at all (every digit is already refused there).
 * @type {{ id: string; test: RegExp; message: string }[]}
 */
export const NUM_FIGURES = [
  {
    id: "percentage",
    test: /\d[\d.,]*\s*(%|percent(age)?\b)/i,
    message: "a percentage is a NUM figure",
  },
  {
    id: "currency",
    test: /[$€£¥]\s*\d|\d\s*[$€£¥]|\b\d[\d.,]*\s*(USD|EUR|GBP|JPY|CHF)\b|\b(USD|EUR|GBP|JPY|CHF)\s*\d/,
    message: "a currency amount is a NUM figure",
  },
  {
    id: "scaled-quantity",
    test: /\b\d[\d.,]*\s*(thousand|million|billion|trillion|mn|bn)\b/i,
    message: "a scaled quantity is a NUM figure",
  },
  {
    id: "split",
    test: /\b\d[\d.,]*\s*(royalty|royalties|revenue share|split|basis points?|bps)\b/i,
    message: "a royalty split or share is a NUM figure",
  },
];

/** Exact strings that may contain digits (citation titles); everything else may not. */
export const DIGIT_ALLOW = new Set(["NEWMA Product Requirements Document v1.0"]);

/** @type {{ id: string; test: RegExp; message: string }[]} */
export const FORBIDDEN = [
  {
    id: "percentage",
    test: /\d\s*%|\bpercent(age)?\b/i,
    message: "percentages are not allowed in copy",
  },
  {
    id: "currency",
    test: /[$€£¥]|\b(USD|EUR|GBP|JPY|CHF)\b/,
    message: "currency symbols and codes are not allowed in copy",
  },
  { id: "lv-series", test: /\bLV-?\d/i, message: "LV-series asset identifiers are not allowed" },
  {
    id: "demo-compound",
    test: /DEMO-C-/,
    message: "demo compound ids are not allowed on the public site",
  },
  {
    id: "quantified-ai",
    test: /\b(faster|cheaper|more accurate|better)\b[^.]{0,20}\d|\d+\s*x\s+(faster|cheaper)\b/i,
    message: "quantified AI-benefit claims are not allowed",
  },
  { id: "partner-logo", test: /partner logos?/i, message: "partner logos are not allowed" },
  {
    id: "superlative",
    test: /\b(proven|guarantee[sd]?|best-in-class|outperform\w*|state-of-the-art|breakthrough|revolutionary)\b/i,
    message: "unsupported superlative; use design-intent wording",
  },
  { id: "digit", test: /\d/, message: "digits are not allowed in copy" },
];

/** Closed list of capitalised words and phrases allowed mid-sentence (prompt 3.2 and A-P4-07). */
export const ALLOWED_TERMS = {
  phrases: [
    "Open Policy Agent",
    "Hermes Agent",
    "K-Dense-AI",
    "AutoDock Vina",
    "Demo signature, not production key",
    "Optional, simulated",
    "Simulated workflow engine",
    "Simulated compute",
    "Simulated agent",
    "Mock ELN",
    "Demo sign-in",
    "Vercel Web Analytics",
    // Closed set of three cited documents (assumption A-P4-09); keep in step with SOURCE_TITLES.
    "NEWMA Technology Architecture and Workflows",
    "NEWMA technological architecture and technology stack",
    "NEWMA Product Requirements Document v1.0",
  ],
  words: [
    "LivFul",
    "Aveloz",
    "NEWMA",
    "Vercel",
    "Railway",
    "RDKit",
    "Meeko",
    "Indigenous",
    "Interface",
    "Agentic",
    "Compute",
    "Scientific",
    "Review",
    "Wet",
    "Lab",
    "Data",
    "Knowledge",
    "Provenance",
    "DLT",
    "CRO",
    "ELN",
    "API",
    "Demo",
    "Access",
    "Privacy",
    "Terms",
    // Names of keys and controls in the keyboard help.
    "Tab",
    "Shift",
    "Home",
    "End",
    "Enter",
    "Escape",
    "Explore",
  ],
};
