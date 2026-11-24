# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing: Next.js 16 (App Router), React 19, Tailwind CSS v4 (tokens in `src/styles/tokens/`), Radix primitives, `motion`, three.js (3D workflow scene), MDX for ecosystem pages. Deployed on Vercel. pnpm.

## What NEWMA is

NEWMA is a proposed hybrid computational and experimental platform for ethnobotanical drug discovery, built by LivFul. It connects authorized ethnobotanical knowledge and authenticated botanical materials to computational prioritization, controlled experiments and scientist-approved observations, while keeping source attribution, confidentiality and benefit obligations attached to every record.

The distinctive mechanism: rights and material checks come _before_ experiments; computational outputs remain hypotheses; scientists approve experimental work and advancement; provenance is signed and versioned. The evidence workflow is a loop, not a funnel — failed checks route to investigation or a hold, not forward.

## Users and jobs

The public site serves a mixed audience with equal weight (confirmed 2026-10-04):

- **Investors / funders** — deciding whether NEWMA is credible and worth backing.
- **Biopharma partners** — judging whether NEWMA can supply traceable, rights-clean discovery leads.
- **Communities and knowledge custodians** — needing to trust how consent, confidentiality and benefit-sharing work.
- **Scientists** (computational biologists, wet-lab / CRO) — evaluating whether the workflow respects scientific judgment.

The demo platform (`/demo`, W1–W10 + guided tour) is used by those same visitors acting as one of eight personas: community liaison, scientist, data steward, scientific approver, wet-lab / CRO, biopharma partner, finance, tenant admin. Each persona completes role-specific tasks (rights decisions, evidence curation, agent queries, gate sign-off, wet-lab loop, provenance verification, settlement, partner export, custodian view).

## Surfaces

- Public site: homepage, six ecosystem component pages (`/ecosystem/<slug>`), legal pages.
- PWA: install prompt (service worker at `/sw.js`) and offline fallback (`/offline`).
- Demo access: persona sign-in (`/access`).
- Demo platform: workflow workspaces W1–W10, jobs, guided tour.

## Constraints future work must preserve

- **Claim discipline.** All copy is tied to a claim register (`pnpm claims:check`, `docs/CONTENT_MATRIX.md`). Wording is design intent ("proposed", "is designed to"). Never add claims, metrics, testimonials, customers or deployment statements. Copy will be revised separately from design work.
- **Synthetic-data honesty.** Demo data is synthetic; synthetic/illustrative/simulated labels and the demo disclaimer must stay visible.
- **Accessibility.** WCAG 2.2 AA; contrast pairs are unit-tested (`contrast-pairs.json`, `tests/unit/tokens.test.ts`); axe runs in Playwright; keyboard and screen-reader manual passes are documented. Reduced-motion variants are required.
- **Performance budgets.** Hero JS ≤ 80 KiB gzip (`pnpm hero:check`); Lighthouse desktop and mobile budgets (`pnpm lhci`, `pnpm lhci:mobile`). 3D scene is lazy-loaded.
- **Demo isolation.** Demo code stays isolated from the public site (`scripts/check-demo-isolation.sh`).

## Brand commitments

- **Align with LivFul.** NEWMA is a LivFul product. Shipped identity follows brand guide v1 (`NEWMA_GUIDE_V1.pdf`): Playfair Display titles, Figtree body (stand-in for Fabio XM) and Geist Mono labels; Forest / Sage / Lavender on 60% white; the gradient newma™ wordmark and wʌʌ wave mark; Liquid Glass header and the white-card + fog-panel hero — documented in `DESIGN.md` and `docs/newma_brand_pack/`.
- **Keep the concepts** of the interactive ecosystem graphic (six components; pipeline layout) and the 3D workflow scene; restyling must stay within the token system.
- **Mark language.** The wʌʌ wave (solid, or as the pixel bitmap wave) and the Forest → Sage → Lavender gradient are the recurring motifs; use the bitmap effect sparingly. The capsule icon stays as a UI glyph.

## Open decisions

- Official LivFul parent-logo usage on NEWMA surfaces beyond the wordmark byline.
