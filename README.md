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

See `docs/ARCHITECTURE.md` and `PROGRESS.md`.

## Demo end-to-end run (`@needs-backend` specs)

`tests/e2e/demo-*.spec.ts` drive the demo spine through the BFF and need a real API. They are
skipped unless `DEMO_E2E=1`. Recipe (names only; values live in your shell and `.env.local`):

1. In `../newma-backend`: `make db-up`, `uv run alembic upgrade head`, then start the API with
   `BFF_SERVICE_TOKEN_HASH` (sha256 of your local token), `DEMO_SIGNING_KEY`, `DATABASE_URL`:
   `uv run uvicorn newma_api.main:app --port 8000`, plus the worker `uv run python -m newma_sim`.
2. In this repo, `.env.local`: `NEXT_PUBLIC_DEMO_MODE=true`, `NEWMA_API_URL=http://localhost:8000`,
   `BFF_SERVICE_TOKEN=<the same local token>`.
3. `DEMO_E2E=1 PORT=3100 pnpm test:e2e`

Without `DEMO_E2E`, `pnpm test:e2e` and `pnpm test:a11y` run the backend-free suites only.
