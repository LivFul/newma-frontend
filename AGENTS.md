<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Node 26.11.1 and pnpm 12.8.1 are installed under `/usr/local/node` (`.nvmrc` is `26`; `packageManager` is `pnpm@12.8.1`). Login shells pick them up from `/etc/profile.d/node26.sh`. If `node -v` is not 26, prefix the toolchain before install, dev, test, or build:

```bash
export PATH="/usr/local/node/bin:$PATH"
```

- Dependencies: `pnpm install --frozen-lockfile`
- Dev server: `pnpm dev --hostname 0.0.0.0 --port 3000` (http://localhost:3000)
- Checks: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`

The public site and unit tests run without API secrets. `NEXT_PUBLIC_SITE_URL` is optional locally; a production build warns and uses the placeholder project domain. Full demo end-to-end (`DEMO_E2E=1`) needs the sibling backend and the `.env.local` names in the README (`NEWMA_API_URL`, `BFF_SERVICE_TOKEN`, `NEXT_PUBLIC_DEMO_MODE`).
