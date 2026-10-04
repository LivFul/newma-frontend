# Content matrix (D-06)

Where every piece of public copy comes from. Source labels follow the plan: TA, ARCH and PRD are the
three documents the detail pages cite (assumption A-P4-09); BC is the business case (About LivFul
only); the sprint plan is cited for the demo labels. Status values: `draft` (agent-written),
`CP-2 pending` (waiting for the user's approval at the CP-2 checkpoint), `approved`. Nothing is
`approved` yet. `[Recommendation]` marks wording the agent proposed because no source supplies it.

`pnpm claims:check` reads this file: every `C-nn` below must exist in the claim register in
`PROGRESS.md`, and every register row from `C-20` upward must be referenced here or in a content file.

## Home page

| Section                     | Copy source (file)                                        | Source §                           | Claim ids        | Tag                  | Status       |
| --------------------------- | --------------------------------------------------------- | ---------------------------------- | ---------------- | -------------------- | ------------ |
| Hero h1 and lede            | `src/content/home/copy.ts` (`HERO`)                       | PRD §1.1                           | C-20             | [Recommendation]     | CP-2 pending |
| Demo disclaimer and CTAs    | `src/content/home/copy.ts` (`HERO`, `PRODUCT.demoCta`)    | sprint plan §1.2; PRD front matter | C-21             | sourced              | CP-2 pending |
| What NEWMA is               | `src/content/home/copy.ts` (`PRODUCT.what`)               | PRD title, §1.1                    | C-22             | sourced              | CP-2 pending |
| The problem                 | `src/content/home/copy.ts` (`PRODUCT.problem`)            | BC §1.1                            | C-23             | sourced              | CP-2 pending |
| How it works and guardrail  | `src/content/home/how-it-works.ts`, `copy.ts` (guardrail) | TA §1–3                            | C-24             | sourced              | CP-2 pending |
| Personas                    | `src/content/home/personas.ts`, `copy.ts` (supporting)    | PRD §2                             | C-25             | sourced (paraphrase) | CP-2 pending |
| Workflow section            | `src/content/home/workflow.ts`                            | user workflow diagram (A-W-01)     | C-53, C-54, C-55 | [Recommendation]     | CP-2 pending |
| Components index            | `src/content/home/copy.ts` (`COMPONENTS_INDEX`), registry | registry; TA §1                    | C-48             | sourced              | CP-2 pending |
| About LivFul: mission       | `src/content/home/about.ts` (`MISSION`)                   | PRD §1.1                           | C-26             | [Recommendation]     | CP-2 pending |
| About LivFul: vision        | `src/content/home/about.ts` (`VISION`)                    | BC §1.2                            | C-27             | [Recommendation]     | CP-2 pending |
| About LivFul: approach      | `src/content/home/about.ts` (`APPROACH`, `APPROACH_NOTE`) | BC §1.2                            | C-28             | [Recommendation]     | CP-2 pending |
| Hero labels and descriptors | `src/content/ecosystem/registry.ts` (`HERO_LABELS`)       | TA §1                              | C-48             | sourced              | CP-2 pending |
| Hero accessible text        | `src/content/ecosystem/hero-text.ts`, `registry.ts`       | TA §1                              | C-48             | sourced              | CP-2 pending |
| Hero hint, toggle, key help | `src/content/home/hero-help.ts`                           | IP §6.4 interaction model          | C-48             | [Recommendation]     | CP-2 pending |
| Glyph caption               | `src/content/home/hero-caption.ts`                        | A-P4-17                            | C-49             | [Recommendation]     | CP-2 pending |
| Header, footer, wordmark    | `src/content/home/chrome.ts`                              | structural; A-P4-01                | C-21, C-29, C-30 | [Recommendation]     | CP-2 pending |

## About LivFul: the source sentence behind each draft line (assumption A-P4-04)

BC contains no LivFul mission or vision statement (IP C-23), so these three are re-voiced from the
sources below. Publishing paraphrases of the internal business case is a CP-2 approval item.

- **Mission** (C-26) re-voices the vision paragraph of PRD §1.1 (first sentence: enabling research
  teams to turn authorized knowledge and authenticated materials into reproducible, experimentally
  supported decisions while preserving attribution, confidentiality and benefit obligations).
- **Vision** (C-27) condenses BC §1.2 (the three delivery capabilities and the shared infrastructure).
- **Approach** (C-28) lists the same three capabilities, one sentence each, and adds a note that
  they are design goals, in line with the claim discipline of BC Appendix B1.

The exact source sentences are deliberately not quoted here: this repository is public and the
sources are internal. They are available to the reviewer in the document set named in `PROGRESS.md`
section 2 (reading list), and are checked against the three lines above at CP-2.

## Component pages

| Section                                                     | Copy source (file)                     | Source §                        | Claim ids                                | Tag     | Status       |
| ----------------------------------------------------------- | -------------------------------------- | ------------------------------- | ---------------------------------------- | ------- | ------------ |
| Interface                                                   | `registry.ts`, `interface.mdx`         | TA §1; ARCH §2A                 | C-40                                     | sourced | CP-2 pending |
| Agentic Compute                                             | `registry.ts`, `agentic-compute.mdx`   | TA §2; ARCH §2B, §2C            | C-41, C-47                               | sourced | CP-2 pending |
| Scientific Review                                           | `registry.ts`, `scientific-review.mdx` | TA §2, §3; PRD §3.3             | C-42, C-47                               | sourced | CP-2 pending |
| Wet Lab                                                     | `registry.ts`, `wet-lab.mdx`           | TA §3; ARCH §2D; PRD §3.3       | C-43, C-47                               | sourced | CP-2 pending |
| Data & Knowledge                                            | `registry.ts`, `data-knowledge.mdx`    | TA §1; ARCH §2E; PRD §3.5       | C-44                                     | sourced | CP-2 pending |
| Provenance & DLT                                            | `registry.ts`, `provenance-dlt.mdx`    | TA §4; ARCH §2F; PRD §3.4       | C-45, C-46, C-47                         | sourced | CP-2 pending |
| Shared headings, proposed-architecture sentence, demo block | `src/content/ecosystem/detail-copy.ts` | ARCH preamble; sprint plan §1.2 | C-40, C-41, C-42, C-43, C-44, C-45, C-47 | sourced | CP-2 pending |

PRD §3.3 to §3.5 were read by heading only, so those pages lean on TA and ARCH statements and cite the
PRD at heading level.

## Legal pages and metadata

| Section                     | Copy source (file)                                         | Source §                  | Claim ids                    | Tag              | Status       |
| --------------------------- | ---------------------------------------------------------- | ------------------------- | ---------------------------- | ---------------- | ------------ |
| Privacy                     | `src/content/legal/privacy.ts`                             | A-P4-03; A-P2-F02         | C-29, C-31, C-51, C-52       | [Recommendation] | CP-2 pending |
| Terms                       | `src/content/legal/terms.ts`                               | A-P4-03; sprint plan §1.2 | C-01, C-22, C-29, C-31, C-52 | [Recommendation] | CP-2 pending |
| Draft label and page titles | `src/content/legal/types.ts`                               | A-P4-03                   | C-30, C-31                   | [Recommendation] | CP-2 pending |
| Home and component metadata | `src/content/home/copy.ts` (`HOME_META`), `detail-copy.ts` | derived                   | C-50                         | derived          | CP-2 pending |

## Inputs the user must supply or approve at CP-2

1. Homepage and detail-page copy, including the agent-drafted H1, lede, mission, vision and approach.
2. Whether paraphrases of the internal business case and public citation of the three internal
   document titles are acceptable (A-P4-04, A-P4-09).
3. Contact details for the footer and legal pages (A-P4-02).
4. Privacy and terms text and the regimes that apply (IP Q-16); until then the legal pages stay
   "Draft for review", `noindex` and out of the sitemap (A-P4-03).
5. Logo, favicon, brand fonts and the colour additions (A-P4-01, A-P4-05, A-P4-06).
