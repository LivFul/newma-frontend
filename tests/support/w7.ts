// Playwright helpers for W7: API-driven setup through the BFF with the page's own session cookie
// (A-P5A-F05); the specs exercise the UI only for the steps under test.
import type { Page } from "@playwright/test";
import { type PersonaId, switchPersona } from "./demo";
import { expect } from "./test";

export const W7_ROUTE = "/demo/w7-settlement";
export const VALID_CREDENTIAL = "DEMO-CRED-VALID-001";

/* eslint-disable @typescript-eslint/no-explicit-any -- BFF bodies are asserted field by field */
export type ApiResult = Readonly<{ status: number; body: any; replayed: boolean }>;

const nonce = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export async function bff(
  page: Page,
  method: "GET" | "POST" | "PUT",
  path: string,
  data?: Record<string, unknown>,
): Promise<ApiResult> {
  const response = await page.request.fetch(path, {
    method,
    headers: { origin: new URL(page.url()).origin },
    data: method === "GET" ? undefined : data,
  });
  return {
    status: response.status(),
    body: await response.json().catch(() => null),
    replayed: response.headers()["idempotent-replayed"] === "true",
  };
}

const key = () => ({ idempotency_key: `e2e-${nonce()}-${nonce()}` });

/** A 2xx result's body, or a failed assertion that names the refused request. */
async function ok(label: string, pending: Promise<ApiResult>): Promise<any> {
  const result = await pending;
  expect(result.status, `${label}: ${JSON.stringify(result.body)}`).toBeLessThan(300);
  return result.body;
}

/** Switches the session persona without touching the UI. */
export async function as(page: Page, persona: PersonaId): Promise<void> {
  await ok("persona", bff(page, "POST", "/api/demo/sessions/persona", { persona }));
}

/** Partner requests (with a valid fictional credential), checks it; tenant admin approves. */
export async function approvedLicense(page: Page): Promise<any> {
  await as(page, "partner");
  const options = await ok("options", bff(page, "GET", "/api/demo/licenses/options"));
  const agreement = options.agreements.find((a: any) => a.latest);
  const license = await ok(
    "license",
    bff(page, "POST", "/api/demo/licenses", {
      agreement_id: agreement.id,
      licensee_organization_id: options.licensee_organizations[0].id,
      purpose: "research",
      scope_summary: "E2E illustrative research scope",
      term_months: 12,
      credential_ref: VALID_CREDENTIAL,
      ...key(),
    }),
  );
  await ok("check", bff(page, "POST", `/api/demo/licenses/${license.id}/credential-check`, key()));
  await as(page, "tenant_admin");
  await ok(
    "decision",
    bff(page, "POST", `/api/demo/licenses/${license.id}/decision`, {
      decision: "approve",
      rationale: "E2E approval",
      ...key(),
    }),
  );
  return license;
}

export type Stage = "submitted" | "reviewed" | "approved" | "reconciled" | "authorized" | "paid";
const ORDER: readonly Stage[] = [
  "submitted",
  "reviewed",
  "approved",
  "reconciled",
  "authorized",
  "paid",
];
const reached = (target: Stage, stage: Stage) => ORDER.indexOf(target) >= ORDER.indexOf(stage);

/** Drives a fresh settlement through the BFF up to `target`; ends as finance. */
export async function settlementAt(
  page: Page,
  target: Stage,
  opts: { amount?: number } = {},
): Promise<{
  settlement: any;
  license: any;
  reference: string;
  calculationSha: string | undefined;
}> {
  const license = await approvedLicense(page);
  await as(page, "finance");
  const base = "/api/demo/settlements";
  let settlement = await ok(
    "create",
    bff(page, "POST", base, { license_id: license.id, ...key() }),
  );
  const at = (path: string) => `${base}/${settlement.id}/${path}`;
  const reference = `DEMO-E2E-${nonce()}`;
  await ok(
    "receipt",
    bff(page, "POST", at("receipts"), {
      external_ref: reference,
      amount_demo_credits: opts.amount ?? 600,
      ...key(),
    }),
  );
  if (reached(target, "reviewed"))
    settlement = await ok("review", bff(page, "POST", at("review"), key()));
  if (reached(target, "approved")) {
    settlement = await ok(
      "evidence",
      bff(page, "POST", at("evidence-approval"), { rationale: "E2E evidence ok", ...key() }),
    );
  }
  if (reached(target, "reconciled"))
    settlement = await ok("reconcile", bff(page, "POST", at("reconcile"), key()));
  const calculationSha: string | undefined = settlement.calculation?.sha256;
  if (reached(target, "authorized")) {
    for (const persona of ["finance", "tenant_admin"] as const) {
      await as(page, persona);
      await ok(
        `approve ${persona}`,
        bff(page, "POST", at("approvals"), {
          calculation_sha256: calculationSha,
          rationale: `${persona} E2E`,
          ...key(),
        }),
      );
    }
    await as(page, "finance");
  }
  if (reached(target, "paid"))
    settlement = await ok("distribution", bff(page, "POST", at("distribution"), key()));
  return { settlement, license, reference, calculationSha };
}

/** Opens a settlement page as the given persona. */
export async function openSettlement(page: Page, id: string, persona: PersonaId): Promise<void> {
  await page.goto(`${W7_ROUTE}/settlements/${id}`);
  await switchPersona(page, persona);
}
