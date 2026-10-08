# Architecture (stub)

Follows IP §6.1. Marketing routes under `src/app/(site)/`, persona sign-in under `src/app/(auth)/access/`, demo app under `src/app/(platform)/demo/` with BFF route handlers under `src/app/api/demo/`. The typed API client in `src/lib/api/generated/` is generated from the backend contract pinned in `api/openapi.lock` (IP §5.6). Demo code isolation is enforced by `scripts/check-demo-isolation.sh`.
