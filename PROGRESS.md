# PROGRESS — newma-frontend (NEWMA sprint D1)

Resume protocol: read this file in both repos, then Section 3 below, then the active phase card. Continue from the first D-item not marked `done`.

## Invariant block (Sections 1–5 of the D1 implementation prompt, copied verbatim)

## 1. Mission

You are implementing sprint D1 of NEWMA, an ethnobotanical drug-discovery platform by LivFul. The sprint ships two things to production URLs:

1. The **fully featured public homepage** on Vercel: sticky header with "Access NEWMA", the interactive NEWMA Ecosystem hero (SVG + Motion), product introduction, About LivFul, footer, and six component detail pages at `/ecosystem/<slug>`.
2. A **clickable NEWMA demo** at `/demo/*` on Vercel, talking only through a BFF to a Railway-hosted mock backend (`demo` environment). Every workflow W1–W10 in sprint plan §3.2 runs end to end on synthetic data, with simulated compute and a scripted agent.

Rules of engagement:

- You are a **single agent replacing a six-person team**. Sprint plan §7 (the day-by-day schedule) does not apply. The phase plan in Section 7 of this prompt does.
- **Homepage alone is a failed sprint.** You are not done until the CP-4 checklist in Section 7 passes with evidence.
- Work autonomously between checkpoints. Stop only at the five named checkpoints (CP-0..CP-4) and for destructive actions.
- Never claim completion of a D-item without the acceptance criterion from sprint plan §5 passing as an automated test or a logged manual check.

## 2. Required reading

Document root: `/Users/daniel/Library/CloudStorage/OneDrive-LivFul/In_SilicoDD/Newma_dev_files/Documents`

Read these in Phase P0, once, in full:

| Order | File (relative to document root)                           | Lines                                                                                    |
| ----- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1     | `outputs/implementation-plan/NEWMA_Demo_Sprint_Plan.md`    | all (271)                                                                                |
| 2     | `outputs/implementation-plan/NEWMA_Implementation_Plan.md` | L1–25 (source abbreviations and reading conventions)                                     |
| 3     | same                                                       | L320–381 (§5.3 environments, §5.4 auth flow, §5.5 secrets, §5.6 CI/CD contract workflow) |
| 4     | same                                                       | L420–523 (§6.1 frontend tree, §6.2 backend tree, §6.3 stack, §6.4 hero)                  |

Read these on demand, only when the active phase card cites them:

| Abbrev. | File (relative to document root)                                                               | Cited for                                                                          |
| ------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| TA      | `outputs/NEWMA_Technology_Architecture.md`                                                     | §1–4 workflow definitions and state names                                          |
| ARCH    | `outputs/newma-architecture/NEWMA_Technological_Architecture.md`                               | §2A–F component boundaries, §3 Nagoya/CBD                                          |
| PRD     | `outputs/newma-prd/NEWMA_PRD_v1.0.md`                                                          | §2 personas, §3.2–3.5 features, §6.2 failure paths, ABS/IS/LAB/ENT requirement IDs |
| RM      | `outputs/product-development-plan/Product_Development_Roadmap_and_Technical_Execution_Plan.md` | §1.4 ingestion stages, §1.5 API surface, §2.6 H0–L1 evidence stages                |
| WP      | `outputs/newma-technical-white-paper/NEWMA_Technical_White_Paper.md`                           | §3.6 settlement                                                                    |
| BC      | `outputs/ethnobotanical-business-case/Business_Case.md`                                        | App. B1 claim register; §1.1–1.2 About copy source                                 |
| OSS     | `outputs/newma-open-source-research/recommendations.md`                                        | tool choices                                                                       |
| NUM     | `NEWMA_Canonical_Numbers_Sheet_DRAFT.xlsx`                                                     | **Do not use any figure from it.** DRAFT only.                                     |

Reading rules:

- Re-read only the sprint plan rows and source sections the active card cites.
- Do not write summaries of source documents into new files. Cite them by `document § section` as the IP does.
- When you need a fact the documents do not give, record it in `PROGRESS.md` under "Assumption register" as `[Agent assumption]` with your choice and reason. Never invent a citation that looks sourced.
- The sprint plan's prerequisite P-2 cites "IP §5; standing instruction". The IP contains no such instruction. Treat the rule as stated by this prompt (Section 4): outward-facing actions need explicit user confirmation.

## 3. Non-negotiables

These survive every compaction. Violating any of them fails the sprint.

### 3.1 Labelling (sprint plan §1.2, verbatim)

| Real platform component                             | In the demo                                                                            | Label shown in UI                    |
| --------------------------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------ |
| Hermes Agent Harness + K-Dense-AI skills (ARCH §2B) | **Scripted agent**: deterministic responses keyed to the demo scenario; no LLM calls   | "Simulated agent"                    |
| Temporal durable workflows (ARCH §2B)               | Postgres-backed job table plus a simulation worker that drives the same state machines | "Simulated workflow engine"          |
| HPC screening (AutoDock Vina) and MD (ARCH §2C)     | Timed progress, pre-computed synthetic scores, injected failures and retries           | "Simulated compute"                  |
| eLabFTW (ARCH §2D)                                  | **Mock ELN** module behind the same adapter interface (REST-v2-shaped payloads)        | "Mock ELN"                           |
| Keycloak IAM (IP C-13)                              | **Persona sign-in**: pick a role, receive a demo session. No passwords.                | "Demo sign-in"                       |
| AWS KMS signing (IP C-10)                           | Ed25519 **demo key** held in Railway variables; signatures verifiable in-app           | "Demo signature, not production key" |
| Optional DLT, ZKP and anchoring (TA §4)             | Simulated verification and anchoring receipts                                          | "Optional, simulated"                |

A **persistent banner** on every `/demo/*` page reads, verbatim:

> Demo with synthetic data. Not evidence of scientific performance, deployment or compliance (PRD front matter).

### 3.2 Synthetic data only (sprint plan §4.5; IP A-07, A-12, C-17, C-23)

- Every seeded record carries `synthetic: true`.
- Taxa, targets, beneficiaries and organisations are fictional and carry "fictional" in their display name (e.g. _Exemplaria viridis_ — fictional; "Community Cooperative A — fictional"; "Target-α").
- Every score, activity or prediction is invented and labelled "Synthetic" in the UI.
- Monetary values use the unit "demo credits", never a currency.
- No percentage, royalty split or financial figure from NUM. Settlement rules are illustrative and labelled so.
- No real partner names or logos, no real community or Indigenous group names, no real traditional-knowledge content, no LV-series asset identifiers, no quantified AI-benefit claims.
- Allowed proper nouns in code and copy: LivFul, NEWMA, Vercel, Railway, and the open-source tool names in IP §6.3. Nothing else without a `[Agent assumption]` entry and CP-2 approval.
- Compound IDs are `DEMO-C-001` … `DEMO-C-024`.

### 3.3 Demo code isolation (sprint plan §4, §10)

- Backend demo code lives only in `services/api/<package>/demo/`, `services/sim-worker/`, and `fixtures/demo/`.
- Frontend demo code lives only in `src/app/(platform)/demo/`, `src/lib/demo/`, and the BFF routes under `src/app/api/demo/`. All of it is gated by `NEXT_PUBLIC_DEMO_MODE`.
- The production module directories named in IP §6.2 (identity, tenancy, rights, entities, chemistry, ingestion, jobs, review, lab, provenance, retrieval, settlement, assets) may hold **interfaces, schemas and adapter protocols** that the demo implements. They may not import from `demo/`.
- A CI check (`scripts/check-demo-isolation.sh` in each repo) greps for `demo` imports outside the demo subtrees and for `NEXT_PUBLIC_DEMO_MODE` outside the frontend demo subtree, and fails the build on a hit.
- State names must match production: PRD §3.3 gate statuses (H0, H1, H2, H3, L1, L2, D), TA §3 wet-lab loop states, and the job states used by RM §1.5. Do not invent parallel vocabularies.

### 3.4 Definition of Done (sprint plan §8, verbatim)

1. **Homepage live** on the Vercel production URL. It meets these budgets on mobile and desktop: CWV LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1; Lighthouse Accessibility 100; zero serious axe issues, plus a manual keyboard and screen-reader pass; approved copy and six cited detail pages.
2. **Hero** works by mouse, keyboard and touch, has a reduced-motion static diagram and a no-JS fallback, and stays within the ≤80 KB gzip budget.
3. **Demo live:** the Vercel `/demo/*` app talks only to the Railway `demo` environment through the BFF. Every Must workflow (W1–W6) and each delivered Should workflow (W7–W10) passes its happy-path and failure-path Playwright tests against the production URLs.
4. **Synthetic only:** the seed carries `synthetic: true` on every record; the demo banner appears on every demo page; there are no real names, figures, partner logos or DRAFT numbers; a claim-register check is signed by VP Product.
5. **Contract discipline:** `docs/openapi.yaml` is tagged `api-v0.1.0-demo`, the generated client is current, and oasdiff and drift checks are green.
6. **Ops:** Sentry is receiving events from both platforms, a runbook (deploy, reset, purge, rollback) is written, and rollback has been rehearsed once.
7. **Isolation:** concurrent sessions cannot see each other's tenant (automated test).

### 3.5 Cut line (sprint plan §6, verbatim)

Apply only after CP-3 confirmation, in this order:

1. Cut first: D-20 guided tour (a written demo script replaces it).
2. Then D-19 custodian view: show W10 inside the W1 rights view.
3. Then D-17: keep receipts → reconciliation only; drop ZKP and anchoring simulation.
4. Then D-18 W9: show quotas on the job screen only.

The homepage items (D-02..D-07) and W1–W6 are **never cut**.

### 3.6 Budgets

| Budget               | Value                                       | Where enforced                     |
| -------------------- | ------------------------------------------- | ---------------------------------- |
| Hero JS              | ≤80 KB gzip                                 | bundle analysis step in CI         |
| CWV                  | LCP ≤2.5 s, INP ≤200 ms, CLS ≤0.1           | Lighthouse CI on preview           |
| Lighthouse           | Performance ≥90, Accessibility 100, SEO ≥95 | Lighthouse CI on preview           |
| axe                  | zero serious issues                         | `@axe-core/playwright` in E2E      |
| Custodian view (W10) | ≤200 KB page weight                         | Playwright resource-size assertion |
| W3 full sequence     | ≤3 min at demo speed                        | Playwright timing assertion        |
| Guided tour          | 12–15 min, no dead ends                     | manual run logged in PROGRESS.md   |

### 3.7 Engineering rules (user's standing rules)

- TDD: write the failing test first for every endpoint, state machine, component and BFF route. Coverage ≥80% on new modules.
- Immutable data patterns; no in-place mutation of shared objects.
- Source files under 800 lines; functions under 50 lines; no nesting deeper than four levels.
- Conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`, `ci:`). Squash-merge to a protected `main`. Branches `feat/*`, `fix/*`.
- No secrets in any repo file. `.env.example` holds names only. Never print a secret value to the terminal, chat or logs.
- After every D-item: run `ecc:code-reviewer` and the domain reviewer, fix CRITICAL and HIGH findings before moving on.

## 4. Control flow

### 4.1 Phase loop

For each phase card in Section 7:

1. Read the card and the sprint plan rows it cites.
2. Invoke `superpowers:writing-plans` to produce `docs/plans/<phase>.md` in the owning repo (frontend plan in `newma-frontend`, backend in `newma-backend`, cross-repo items in both with a shared task list).
3. Execute with `superpowers:subagent-driven-development` (or `superpowers:executing-plans` when tasks are tightly coupled), applying `superpowers:test-driven-development` to every task.
4. After each D-item: `ecc:code-reviewer`, then `ecc:fastapi-reviewer` for backend items or `ecc:react-reviewer` for frontend items. For D-08, D-09, D-10, D-16 also run `ecc:security-reviewer`. For D-04, D-07, D-19 also run `ecc:a11y-architect`.
5. Run `superpowers:verification-before-completion` against the card's exit criteria. Every criterion must map to a test name or a logged manual check.
6. Update `PROGRESS.md` (Section 5). Commit.
7. If the card ends in a checkpoint, stop and ask using the exact question text in the card. Do not proceed until the user answers. Log the answer verbatim.

### 4.2 Actions forbidden outside a checkpoint

Do not perform any of these until the checkpoint that authorises them has been answered "yes" by the user:

- `git remote add`, `git push`, creating GitHub repositories, enabling branch protection on a remote.
- `vercel link`, `vercel deploy`, `vercel env add`, creating or modifying a Vercel project.
- Railway: creating a project, environment, service, volume, domain, or setting variables (CLI or MCP tools).
- Creating or changing DNS records.
- Creating a Sentry project or any other third-party account or resource.
- Generating the Ed25519 demo key or the BFF service token for a remote environment. Local dev keys may be generated under `.env.local` (git-ignored).
- Deleting any remote resource, database, deployment or environment. This remains forbidden even after checkpoints unless the user asks for that specific deletion.

### 4.3 Tooling to prefer

- `vercel:nextjs`, `vercel:deploy`, `vercel:env-vars` skills for the frontend platform.
- `use-railway` skill and the Railway MCP tools for the backend platform; `mcp__railway__docs_search` before guessing Railway behaviour.
- `frontend-design` and `impeccable` for the hero and homepage visual work; `dataviz` for any chart in the demo.
- `graft build` after each phase, then `graft ask` / `graft skeleton` for navigation instead of re-reading files.
- `ecc:e2e-runner` to scaffold and maintain Playwright suites.

### 4.4 Compaction recovery

On resume: read `PROGRESS.md` in both repos, then Section 3 of this prompt, then the active card. Continue from the first D-item not marked `done`. Do not restart a phase.

## 5. Progress and resume protocol

Create `PROGRESS.md` at the root of each repo in P0 with these sections:

1. **Invariant block** — Sections 1–5 of this prompt, copied.
2. **Phase status** — a table: `D-item | Phase | Status (not-started / in-progress / done / cut) | Evidence (test name, URL, or commit)`.
3. **Checkpoint log** — `CP-n | Date | Question asked (verbatim) | User answer (verbatim) | Actions unlocked`.
4. **Assumption register** — `[Agent assumption]` entries with reason and the sprint plan or IP item they fill.
5. **Claim register** — every user-visible number, name, label or capability claim in homepage copy or demo UI, with its source (`document § section`) or the word `synthetic`. This is what VP Product signs at CP-2 and CP-4 (DoD item 4).

Update rules: after every completed D-item and immediately before every checkpoint. Commit as `chore(progress): <what changed>`.

Also create in P0: `newma-backend/docs/runbooks/DEMO_RUNBOOK.md` with headings Deploy, Reset, Purge, Rollback, left as stubs until P6.

---

## Phase status

| D-item                       | Phase | Status      | Evidence                                                                                                                                                                                                                                  |
| ---------------------------- | ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 (local half)            | P0    | done        | `pnpm check` green (lint, typecheck, prettier, vitest coverage, api:check, isolation guard); `tests/unit/api-check.test.ts`, `tests/unit/api-client.test.ts`, `tests/unit/demo-isolation.test.ts`; commit 8677bc7                         |
| D-01 (remote half)           | P1    | not-started | —                                                                                                                                                                                                                                         |
| D-02                         | P0    | done        | `tests/unit/tokens.test.ts` (all 10 token pairs ≥4.5:1 or ≥3:1 focus; reduced-motion zeros durations), `tests/unit/ui/*.test.tsx` (axe-clean primitives), `tests/a11y/primitives.spec.ts` (zero axe violations, both Playwright projects) |
| D-03                         | P4    | not-started | —                                                                                                                                                                                                                                         |
| D-04                         | P4    | not-started | —                                                                                                                                                                                                                                         |
| D-05                         | P4    | not-started | —                                                                                                                                                                                                                                         |
| D-06 (claim-register stub)   | P0    | in-progress | —                                                                                                                                                                                                                                         |
| D-06 (copy + register)       | P4    | not-started | —                                                                                                                                                                                                                                         |
| D-07                         | P4    | not-started | —                                                                                                                                                                                                                                         |
| D-08 (schema + seed half)    | P0    | in-progress | —                                                                                                                                                                                                                                         |
| D-08 (cloning, reset, purge) | P2    | not-started | —                                                                                                                                                                                                                                         |
| D-09                         | P2    | not-started | —                                                                                                                                                                                                                                         |
| D-10                         | P2    | not-started | —                                                                                                                                                                                                                                         |
| D-11                         | P3    | not-started | —                                                                                                                                                                                                                                         |
| D-12                         | P3    | not-started | —                                                                                                                                                                                                                                         |
| D-13                         | P3    | not-started | —                                                                                                                                                                                                                                         |
| D-14                         | P3    | not-started | —                                                                                                                                                                                                                                         |
| D-15                         | P3    | not-started | —                                                                                                                                                                                                                                         |
| D-16                         | P3    | not-started | —                                                                                                                                                                                                                                         |
| D-17                         | P5    | not-started | —                                                                                                                                                                                                                                         |
| D-18                         | P5    | not-started | —                                                                                                                                                                                                                                         |
| D-19                         | P5    | not-started | —                                                                                                                                                                                                                                         |
| D-20                         | P5    | not-started | —                                                                                                                                                                                                                                         |
| D-21                         | P6    | not-started | —                                                                                                                                                                                                                                         |
| D-22                         | P6    | not-started | —                                                                                                                                                                                                                                         |

## Stack versions

Resolved by `pnpm install` on 2026-10-02 (create-next-app defaults accepted).

| Package                                          | Version                 |
| ------------------------------------------------ | ----------------------- |
| node                                             | 26.9.0                  |
| pnpm                                             | 12.8.1                  |
| next                                             | 16.3.8                  |
| react / react-dom                                | 19.2.8                  |
| typescript                                       | 5.9.3                   |
| tailwindcss / @tailwindcss/postcss               | 4.3.3                   |
| radix-ui                                         | 1.6.7                   |
| class-variance-authority / clsx / tailwind-merge | 0.7.1 / 2.1.1 / 3.7.0   |
| openapi-typescript                               | 7.13.0                  |
| openapi-fetch                                    | 0.17.0                  |
| vitest / @vitest/coverage-v8                     | 5.0.3                   |
| @vitejs/plugin-react                             | 6.1.1                   |
| @testing-library/react / jest-dom / user-event   | 16.3.3 / 7.0.1 / 14.6.7 |
| jsdom                                            | 30.1.1                  |
| axe-core                                         | 4.13.0                  |
| @playwright/test                                 | 1.63.0                  |
| @axe-core/playwright                             | 4.13.0                  |
| @lhci/cli                                        | 0.15.1                  |
| eslint / eslint-config-next                      | 9.39.5 / 16.3.8         |
| prettier                                         | 3.9.9                   |

## Checkpoint log

| CP-n | Date | Question asked (verbatim) | User answer (verbatim) | Actions unlocked |
| ---- | ---- | ------------------------- | ---------------------- | ---------------- |
| —    | —    | —                         | —                      | —                |

## Assumption register

| #        | `[Agent assumption]`                                                                                                                                                                                          | Reason                                                                                                                                                                                                                                  | Fills                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| A-P0-01  | Repo parent is `/Users/daniel/Dev/Newma` (same directory as `~/dev/newma/` on this case-insensitive filesystem; inode verified).                                                                              | Session started there; prompt §6.1 default. Confirmed at CP-0.                                                                                                                                                                          | Prompt §6.1                                     |
| A-P0-F01 | Dark-first colour token palette chosen by the agent.                                                                                                                                                          | No brand palette exists in any source document; hex values were picked so every pair in `src/styles/tokens/contrast-pairs.json` passes WCAG 4.5:1 (focus ring 3:1), verified by `tests/unit/tokens.test.ts`. CP-2 may replace it.       | Sprint plan §5 row D-02                         |
| A-P0-F02 | `/primitives` route kept as a `noindex` gallery page for browser axe scans.                                                                                                                                   | Playwright + axe need a real rendered page; metadata sets `robots: { index: false, follow: false }`.                                                                                                                                    | Sprint plan §5 row D-02; prompt §3.6 axe budget |
| A-P0-F03 | Tailwind v4 CSS-first tokens: `@theme inline` maps utilities onto unlayered `:root` custom properties in `src/styles/tokens/`.                                                                                | IP §6.3 names Tailwind; v4 has no JS config, and unlayered token declarations win the cascade over the layered theme.                                                                                                                   | IP §6.3                                         |
| A-P0-F04 | Playwright dev-server port is configurable via `PORT` (default 3000); local runs use `PORT=3100`.                                                                                                             | Port 3000 on the dev machine is held by an unrelated Docker container; with `reuseExistingServer` Playwright would otherwise test the wrong app. `PLAYWRIGHT_BASE_URL` targets previews in P1+.                                         | Sprint plan §5 row D-01 (local tooling)         |
| A-P0-F05 | Component-level axe helper (`tests/unit/ui/axe.ts`) disables `color-contrast` and `region`.                                                                                                                   | jsdom has no layout engine, and `region` is a page-level landmark rule meaningless for a bare component; both rules run for real in Chromium via `tests/a11y/primitives.spec.ts`.                                                       | Prompt §3.6 axe budget                          |
| A-P0-F06 | `api/openapi.lock.source` is the relative path `../newma-backend/docs/openapi.yaml` in P0.                                                                                                                    | The sibling checkout is the only contract source before the `api-v0.1.0-demo` tag is published; it becomes a URL in P1. The spec version is read with a same-line regex on `version:`; a YAML parser replaces it if the contract grows. | IP §5.6                                         |
| A-P0-F07 | `scripts/api-check.mjs` is an importable module (`runApiCheck`) with a direct-run `main`.                                                                                                                     | Vitest 5 reports every `coverage.include` file, so a child-process-only script would count as 0%; in-process tests keep `scripts/**` above the 80% threshold while the CLI tests from the plan remain.                                  | Prompt §3.7 coverage ≥80%                       |
| A-P0-F08 | Tokens are declared inside `@theme` blocks in `src/styles/tokens/*.css`; the plan's `@theme inline` aliasing block in `globals.css` is gone.                                                                  | Review round 1 (code): the alias was self-referential and only worked by cascade order. `--default-transition-duration/-timing-function` now consume the motion tokens; a global reduced-motion safety net is in `motion.css`.          | Sprint plan §5 row D-02; plan Task 2            |
| A-P0-F09 | A single `TooltipProvider` lives in `src/app/providers.tsx` (mounted by the root layout); `Tooltip` renders no per-instance Provider.                                                                         | Review round 1 (React): Radix exposes no way to detect a missing provider, so the Provider is documented as required; unit tests wrap renders in it.                                                                                    | Plan Task 3                                     |
| A-P0-F10 | `src/lib/api/index.ts` exports types only; `createApiClient` is imported from `src/lib/api/server.ts`, which is marked `server-only`.                                                                         | Review round 1 (code): keeps the BFF service token out of any client bundle. Vitest aliases `server-only` to `tests/stubs/server-only.ts`.                                                                                              | IP §5.4 auth flow; plan Task 5                  |
| A-P0-F11 | `api:check` parses the spec with `yaml` and reads `info.version`; `--update` validates the spec first, then rewrites both `sha256` and `version` in the lock.                                                 | Review round 1 (code): the plan's regex matched a schema property named `version`. `source` fetches time out after 15 s; a non-git cwd is a clear `ApiCheckError`.                                                                      | IP §5.6; plan Task 5                            |
| A-P0-F12 | Lighthouse CI builds and starts its own production server on port 3100 (`startServerCommand`), default URL `http://localhost:3100/`.                                                                          | Review round 1 (code): `next dev` numbers are not budget evidence; INP cannot be measured by Lighthouse, so that assertion was dropped.                                                                                                 | Prompt §3.6; plan Task 7                        |
| A-P0-F13 | `StatusBadge` vocabulary is `PASS, HOLD, FAIL, PENDING, NOT_STARTED, INVALIDATED` as given by the a11y review; it is not yet reconciled with PRD §3.3 gate statuses (H0–H3, L1, L2, D) or RM §1.5 job states. | Non-negotiable §3.3 requires production state names; reconciliation happens when the first demo workflow (P3) consumes it.                                                                                                              | Prompt §3.3                                     |
| A-P0-F14 | The browser axe scan with a tooltip visible disables only the best-practice `region` rule.                                                                                                                    | Radix portals tooltip content to `<body>`; axe exempts dialogs but not transient tooltip overlays from `region`, so this is a known false positive. Every other scan of the page keeps the rule.                                        | Prompt §3.6 axe budget                          |

## Review log

| Round | Reviewer             | Verdict | Outcome                                                                                                                                                                                                                             |
| ----- | -------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `ecc:code-reviewer`  | Warning | fixed (tokens in `@theme`, isolation-guard regex, server-only API client, yaml-based `api:check`, Lighthouse CI server)                                                                                                             |
| 1     | `ecc:react-reviewer` | Block   | fixed (Button server-usable and min-height sizing, Dialog close/describedby/layering/forwarded props, single `TooltipProvider`, Badge/StatusBadge, `DialogClose` on Confirm)                                                        |
| 1     | `ecc:a11y-architect` | Warning | fixed (two-tone focus ring, `--color-border-strong`, `color-scheme: dark` + viewport, skip link and `main#main`, extra contrast pairs, wider axe tags, dialog/tooltip scans, 320 px overflow check, reduced-motion Playwright test) |

Plan deviations introduced by round 1 are recorded as A-P0-F08…F14 above; `docs/plans/p0.md` is left as written.

## Open items

Deferred from review round 1 (one line each; not implemented in P0):

- React 19 ref-as-prop instead of `forwardRef` in `Button` — the plan mandated `forwardRef`; revisit when the primitives are next touched.
- Click-toggled "toggletip" variant for touch users wherever a hint is genuinely needed (Tooltip is hover/focus only).
- Link tokens with underline styling — P4 (homepage copy).
- Unit coverage for `src/app/**` (pages, layout, providers) — P4.
- `next.config.ts` security headers (CSP, frame-ancestors, referrer policy) — P1 (deploy).

## Claim register

Every user-visible number, name, label or capability claim in homepage copy or demo UI, with its source (`document § section`) or the word `synthetic`. Signed by VP Product at CP-2 and CP-4 (DoD 4).

| #    | Surface              | Claim / string                                                                                                                                               | Source or `synthetic`            | Status           |
| ---- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | ---------------- |
| C-01 | every `/demo/*` page | "Demo with synthetic data. Not evidence of scientific performance, deployment or compliance (PRD front matter)."                                             | sprint plan §1.2 (verbatim)      | pending sign-off |
| C-02 | demo UI              | "Simulated agent", "Simulated workflow engine", "Simulated compute", "Mock ELN", "Demo sign-in", "Demo signature, not production key", "Optional, simulated" | sprint plan §1.2 labelling table | pending sign-off |
| C-03 | seed data            | all taxa, targets, beneficiaries, organisations, scores, activities, predictions, credits                                                                    | synthetic                        | pending sign-off |
