# Content matrix (D-06)

Where every piece of public copy comes from. Primary source for the 2026 consolidated content
update: `NEWMA_Website_Content_Consolidated.md` (internal). Source labels follow the plan: TA, ARCH
and PRD are the three documents the detail pages cite (assumption A-P4-09). Status values: `draft`,
`CP-2 pending`, `approved`. See `docs/IMPLEMENTATION_CHECKLIST.md` for omitted controls and approval
items not shown on the public site.

`pnpm claims:check` reads this file: every `C-nn` below must exist in the claim register in
`PROGRESS.md`, and every register row from `C-20` upward must be referenced here or in a content file.

## Home page

| Section                     | Copy source (file)                                        | Source §                       | Claim ids        | Tag              | Status       |
| --------------------------- | --------------------------------------------------------- | ------------------------------ | ---------------- | ---------------- | ------------ |
| Hero h1, tagline and lede   | `src/content/home/copy.ts` (`HERO`)                       | consolidated §2                | C-20             | sourced          | CP-2 pending |
| Demo disclaimer and CTAs    | `src/content/home/copy.ts`, `chrome.ts`                   | consolidated §2, §7            | C-21             | sourced          | CP-2 pending |
| What NEWMA is               | `src/content/home/copy.ts` (`PRODUCT`)                    | consolidated §3                | C-22             | sourced          | CP-2 pending |
| The problem                 | `src/content/home/copy.ts` (`PRODUCT.problem*`)           | consolidated §3                | C-23             | sourced          | CP-2 pending |
| How it works and guardrail  | `src/content/home/how-it-works.ts`, `copy.ts` (guardrail) | consolidated §3                | C-24             | sourced          | CP-2 pending |
| Personas                    | `src/content/home/personas.ts`, `copy.ts` (supporting)    | consolidated §3                | C-25             | sourced          | CP-2 pending |
| Workflow section            | `src/content/home/workflow.ts`                            | consolidated §4; prior diagram | C-53, C-54, C-55 | sourced          | CP-2 pending |
| Components index            | `src/content/home/copy.ts`, `registry.ts`                 | consolidated §5                | C-48             | sourced          | CP-2 pending |
| About Newma: purpose        | `src/content/home/about.ts` (`PURPOSE*`)                  | consolidated §6                | C-26             | sourced          | CP-2 pending |
| About Newma: mission        | `src/content/home/about.ts` (`MISSION`)                   | consolidated §6                | C-26             | pending approval | CP-2 pending |
| About Newma: vision         | `src/content/home/about.ts` (`VISION`)                    | consolidated §6                | C-27             | sourced          | CP-2 pending |
| About Newma: approach       | `src/content/home/about.ts` (`APPROACH`)                  | consolidated §6                | C-28             | sourced          | CP-2 pending |
| Closing section             | `src/content/home/copy.ts` (`CLOSING`)                    | consolidated Optional Closing  | C-50             | sourced          | CP-2 pending |
| Hero labels and descriptors | `src/content/ecosystem/registry.ts` (`HERO_LABELS`)       | consolidated §5                | C-48             | sourced          | CP-2 pending |
| Hero accessible text        | `src/content/ecosystem/hero-text.ts`, `hero-caption.ts`   | consolidated §2, §5            | C-48, C-49       | sourced          | CP-2 pending |
| Hero hint, toggle, key help | `src/content/home/hero-help.ts`                           | IP §6.4 interaction model      | C-48             | [Recommendation] | CP-2 pending |
| Header, footer, wordmark    | `src/content/home/chrome.ts`                              | consolidated §1, §7            | C-21, C-29, C-30 | sourced          | CP-2 pending |
| App install and offline     | `chrome.ts` (`PWA_COPY`), `copy.ts` (`OFFLINE`)           | structural; A-P4-01            | C-56             | [Recommendation] | CP-2 pending |

## Component pages

| Section                                                     | Copy source (file)                     | Source §                       | Claim ids                                | Tag     | Status       |
| ----------------------------------------------------------- | -------------------------------------- | ------------------------------ | ---------------------------------------- | ------- | ------------ |
| Interface through Provenance & DLT                          | `registry.ts` (`ECOSYSTEM`)            | consolidated Component Pages   | C-40..C-46, C-47                         | sourced | CP-2 pending |
| Shared headings, proposed-architecture sentence, demo block | `src/content/ecosystem/detail-copy.ts` | ARCH preamble; consolidated §7 | C-40, C-41, C-42, C-43, C-44, C-45, C-47 | sourced | CP-2 pending |

MDX files under `src/content/ecosystem/*.mdx` are retained but no longer rendered; page body copy
is driven from `registry.ts`.

## Legal pages and metadata

| Section                     | Copy source (file)                                         | Source §                  | Claim ids                    | Tag              | Status       |
| --------------------------- | ---------------------------------------------------------- | ------------------------- | ---------------------------- | ---------------- | ------------ |
| Privacy                     | `src/content/legal/privacy.ts`                             | A-P4-03; A-P2-F02         | C-29, C-31, C-51, C-52       | [Recommendation] | CP-2 pending |
| Terms                       | `src/content/legal/terms.ts`                               | A-P4-03; sprint plan §1.2 | C-01, C-22, C-29, C-31, C-52 | [Recommendation] | CP-2 pending |
| Draft label and page titles | `src/content/legal/types.ts`                               | A-P4-03                   | C-30, C-31                   | [Recommendation] | CP-2 pending |
| Home and component metadata | `src/content/home/copy.ts` (`HOME_META`), `detail-copy.ts` | consolidated metadata     | C-50                         | derived          | CP-2 pending |

## Inputs the user must supply or approve at CP-2

1. NEWMA mission wording (implemented; formal approval required — see implementation checklist).
2. Contact details, copyright and research-enquiry destinations (omitted from UI until supplied).
3. Whether Aveloz staff access remains in the public header.
4. Privacy and terms text and the regimes that apply (IP Q-16).
5. Logo, favicon, brand fonts and colour additions (A-P4-01, A-P4-05, A-P4-06).
