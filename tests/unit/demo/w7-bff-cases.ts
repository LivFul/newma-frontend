// Route tables for the W7 BFF tests: one row per Contract endpoint (A1–A26).
import type { NextRequest } from "next/server";
import { GET as LICENSE_OPTIONS } from "@/app/api/demo/licenses/options/route";
import { GET as LICENSES, POST as CREATE_LICENSE } from "@/app/api/demo/licenses/route";
import { GET as LICENSE } from "@/app/api/demo/licenses/[id]/route";
import { POST as CREDENTIAL_CHECK } from "@/app/api/demo/licenses/[id]/credential-check/route";
import { POST as DECISION } from "@/app/api/demo/licenses/[id]/decision/route";
import { GET as LICENSE_EVENTS } from "@/app/api/demo/licenses/[id]/events/route";
import { GET as SETTLEMENTS, POST as CREATE_SETTLEMENT } from "@/app/api/demo/settlements/route";
import { GET as SETTLEMENT } from "@/app/api/demo/settlements/[id]/route";
import { GET as SETTLEMENT_EVENTS } from "@/app/api/demo/settlements/[id]/events/route";
import { POST as RECEIPTS } from "@/app/api/demo/settlements/[id]/receipts/route";
import { POST as REVIEW } from "@/app/api/demo/settlements/[id]/review/route";
import { POST as DISPUTE } from "@/app/api/demo/settlements/[id]/dispute/route";
import { POST as RESOLVE } from "@/app/api/demo/settlements/[id]/resolve/route";
import { POST as EVIDENCE_APPROVAL } from "@/app/api/demo/settlements/[id]/evidence-approval/route";
import { POST as RECONCILE } from "@/app/api/demo/settlements/[id]/reconcile/route";
import { POST as APPROVALS } from "@/app/api/demo/settlements/[id]/approvals/route";
import { POST as DISTRIBUTION } from "@/app/api/demo/settlements/[id]/distribution/route";
import { POST as AUDIT } from "@/app/api/demo/settlements/[id]/audit/route";
import { GET as BENEFITS } from "@/app/api/demo/benefits/route";
import { POST as SCHEDULE } from "@/app/api/demo/benefits/[id]/schedule/route";
import { POST as DELIVER } from "@/app/api/demo/benefits/[id]/deliver/route";
import { GET as BENEFICIARIES } from "@/app/api/demo/beneficiaries/route";
import { GET as OUTAGE_GET, PUT as OUTAGE_PUT } from "@/app/api/demo/anchoring/outage/route";

export const ID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
export const SHA = "b".repeat(64);
const KEY = { idempotency_key: "k-1" };

type Handler = (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => Promise<Response>;
type PlainHandler = (req: NextRequest) => Promise<Response>;

export type PostCase = Readonly<{
  name: string;
  handler: Handler;
  upstream: string;
  body: Record<string, unknown>;
  /** A body the parser must reject. */
  invalid: unknown;
}>;

const post = (
  name: string,
  handler: Handler,
  upstream: string,
  body: Record<string, unknown>,
  invalid: unknown,
): PostCase => ({ name, handler, upstream, body: { ...body, ...KEY }, invalid });

const S = `/v1/settlements/${ID}`;
const L = `/v1/licenses/${ID}`;

export const POST_CASES: readonly PostCase[] = [
  post("credential-check", CREDENTIAL_CHECK, `${L}/credential-check`, {}, "not-an-object"),
  post(
    "decision",
    DECISION,
    `${L}/decision`,
    { decision: "approve", rationale: "Scope fits" },
    { decision: "maybe", rationale: "x" },
  ),
  post(
    "receipts",
    RECEIPTS,
    `${S}/receipts`,
    { external_ref: "DEMO-E2E-001", amount_demo_credits: 600 },
    { external_ref: "DEMO", amount_demo_credits: 6.5 },
  ),
  post("review", REVIEW, `${S}/review`, {}, "x"),
  post(
    "dispute",
    DISPUTE,
    `${S}/dispute`,
    { receipt_id: ID, reason: "Amount mismatch" },
    { receipt_id: "x", reason: "ok ok" },
  ),
  post(
    "resolve",
    RESOLVE,
    `${S}/resolve`,
    { receipt_id: ID, rationale: "Reinstated" },
    { receipt_id: ID, rationale: "" },
  ),
  post(
    "evidence-approval",
    EVIDENCE_APPROVAL,
    `${S}/evidence-approval`,
    { rationale: "Evidence ok" },
    { rationale: "" },
  ),
  post("reconcile", RECONCILE, `${S}/reconcile`, {}, "x"),
  post(
    "approvals",
    APPROVALS,
    `${S}/approvals`,
    { calculation_sha256: SHA, rationale: "Checked" },
    { calculation_sha256: "abc", rationale: "Checked" },
  ),
  post("distribution", DISTRIBUTION, `${S}/distribution`, {}, "x"),
  post("audit", AUDIT, `${S}/audit`, { anchor: true }, { anchor: "yes" }),
  post(
    "schedule",
    SCHEDULE,
    `/v1/benefits/${ID}/schedule`,
    { scheduled_for: "2026-11-02" },
    { scheduled_for: "tomorrow" },
  ),
  post(
    "deliver",
    DELIVER,
    `/v1/benefits/${ID}/deliver`,
    { evidence_note: "Photos filed" },
    { evidence_note: "x" },
  ),
];

export type CollectionPost = Readonly<{
  name: string;
  handler: PlainHandler;
  upstream: string;
  body: Record<string, unknown>;
  invalid: unknown;
}>;

export const COLLECTION_POSTS: readonly CollectionPost[] = [
  {
    name: "licenses",
    handler: CREATE_LICENSE,
    upstream: "/v1/licenses",
    body: {
      agreement_id: ID,
      licensee_organization_id: ID,
      purpose: "research",
      scope_summary: "Illustrative scope",
      term_months: 12,
      idempotency_key: "k-1",
    },
    invalid: { purpose: "disclosure" },
  },
  {
    name: "settlements",
    handler: CREATE_SETTLEMENT,
    upstream: "/v1/settlements",
    body: { license_id: ID, idempotency_key: "k-1" },
    invalid: { license_id: "x" },
  },
];

export type GetCase = Readonly<{
  name: string;
  call: (req: NextRequest) => Promise<Response>;
  path: string;
  upstream: string;
}>;
const withId = (handler: Handler) => (req: NextRequest) =>
  handler(req, { params: Promise.resolve({ id: ID }) });

export const GET_CASES: readonly GetCase[] = [
  {
    name: "license options",
    call: LICENSE_OPTIONS,
    path: "/api/demo/licenses/options",
    upstream: "/v1/licenses/options",
  },
  { name: "licenses", call: LICENSES, path: "/api/demo/licenses", upstream: "/v1/licenses" },
  { name: "license", call: withId(LICENSE), path: "/x", upstream: L },
  { name: "license events", call: withId(LICENSE_EVENTS), path: "/x", upstream: `${L}/events` },
  {
    name: "settlements",
    call: SETTLEMENTS,
    path: "/api/demo/settlements",
    upstream: "/v1/settlements",
  },
  { name: "settlement", call: withId(SETTLEMENT), path: "/x", upstream: S },
  {
    name: "settlement events",
    call: withId(SETTLEMENT_EVENTS),
    path: "/x",
    upstream: `${S}/events`,
  },
  { name: "benefits", call: BENEFITS, path: "/api/demo/benefits", upstream: "/v1/benefits" },
  {
    name: "beneficiaries",
    call: BENEFICIARIES,
    path: "/api/demo/beneficiaries",
    upstream: "/v1/beneficiaries",
  },
  {
    name: "outage",
    call: OUTAGE_GET,
    path: "/api/demo/anchoring/outage",
    upstream: "/v1/demo/anchoring/outage",
  },
];

export { OUTAGE_PUT };
export const idHandlers: ReadonlyArray<readonly [string, Handler]> = [
  ["license", LICENSE],
  ["license events", LICENSE_EVENTS],
  ["settlement", SETTLEMENT],
  ["settlement events", SETTLEMENT_EVENTS],
];
