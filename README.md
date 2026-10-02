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
