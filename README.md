# newma-frontend

NEWMA public homepage and demo app (Vercel). Sprint D1.

    pnpm install
    pnpm dev            # http://localhost:3000
    pnpm check          # lint, typecheck, unit tests, api:check, demo-isolation guard
    pnpm test:e2e       # Playwright + axe (starts next dev)

Contract check: `api/openapi.lock` pins the deployed spec (`source`, `version`, `sha256`).
For local development against the sibling backend checkout, read the spec from disk instead:

    API_CHECK_SPEC_SOURCE=../newma-backend/docs/openapi.yaml pnpm check

The pinned sha is enforced against whichever source is used.

## Review the homepage

Port 3000 is held by an unrelated container on the dev machine, so review runs on 3100 (A-P0-F04):

    PORT=3100 pnpm dev                      # then open http://localhost:3100/
    PORT=3100 pnpm screenshots              # desktop and mobile shots into docs/screenshots/ (git-ignored)

The homepage is `/`; the six component pages are `/ecosystem/<slug>`; the draft legal pages are
`/legal/privacy` and `/legal/terms`. Dev-mode performance is not budget evidence (A-P0-F12): for a
production-mode review use

    pnpm build && pnpm start --port 3100

Budgets and checks specific to the public site: `pnpm claims:check` (copy against the claim register),
`pnpm hero:check` (hero JS at most 80 KiB gzip, after `pnpm build`), `pnpm lhci` and `pnpm lhci:mobile`
(Lighthouse, desktop and mobile). Copy provenance is in `docs/CONTENT_MATRIX.md`; the manual keyboard
and screen-reader checklist is `docs/A11Y_MANUAL_PASS.md`.

Two deployment notes: set `NEXT_PUBLIC_SITE_URL` to the canonical production origin (metadata,
sitemap and JSON-LD use it; without it a build warns and uses the placeholder project domain), and do
not promote a preview build to production, because `robots.txt` is built per environment and a
preview build disallows crawling. Check `/robots.txt` on production after every deploy.

See `docs/ARCHITECTURE.md` and `PROGRESS.md`.

## Demo end-to-end run (`@needs-backend` specs)

`tests/e2e/demo-*.spec.ts` drive the demo spine through the BFF and need a real API. They are
skipped unless `DEMO_E2E=1`. Recipe (names only; values live in your shell and `.env.local`):

1. In `../newma-backend`: `make db-up`, `uv run alembic upgrade head`, then start the API with
   `BFF_SERVICE_TOKEN_HASH` (sha256 of your local token), `DEMO_SIGNING_KEY`, `DATABASE_URL`:
   `uv run uvicorn newma_api.main:app --port 8000`, plus the worker `uv run python -m newma_sim`.
2. In this repo, `.env.local`: `NEXT_PUBLIC_DEMO_MODE=true`, `NEWMA_API_URL=http://localhost:8000`,
   `BFF_SERVICE_TOKEN=<the same local token>`.
3. `DEMO_E2E=1 PORT=3100 pnpm test:e2e` (and `pnpm test:a11y`). The P3 workflow specs
   (`demo-w1-rights` … `demo-w6-provenance`, `tests/a11y/demo-workflows`) need the worker with
   `SIM_SPEED_FACTOR=4`, `ENVIRONMENT=development` and `DEMO_SIGNING_KEY` on the API; W3 and W5
   wait on simulated jobs. Session creation clones the seed, so prefer `--workers=1` or `2`.
   After the backend changes `fixtures/canonical/vectors.json` run `pnpm vectors:sync`
   (`pnpm vectors:check` is part of `pnpm check`).

Without `DEMO_E2E`, `pnpm test:e2e` and `pnpm test:a11y` run the backend-free suites only.
