import type { ClientError } from "./client";
import { isRecord, isStringArray } from "./guards";
import { isPersonaId, personaLabel } from "@/lib/personas";
import { formatCredits } from "@/lib/credits";

// Readable one-line renderings of the allow-listed W7 error details (error-details.ts). Details
// are untrusted at the type level, so every key is re-checked before it is shown.
const SHA_PREVIEW = 12;
const str = (details: Record<string, unknown>, key: string): string | undefined =>
  typeof details[key] === "string" ? (details[key] as string) : undefined;
const spaced = (value: string) => value.replaceAll("_", " ");

type Describe = (details: Record<string, unknown>) => string | undefined;

const withKey =
  (key: string, build: (value: string) => string): Describe =>
  (d) => {
    const value = str(d, key);
    return value === undefined ? undefined : build(value);
  };

function personaApproved(d: Record<string, unknown>): string | undefined {
  const persona = str(d, "persona");
  if (persona === undefined) return undefined;
  return `${isPersonaId(persona) ? personaLabel(persona) : persona} has already approved.`;
}

function conservation(d: Record<string, unknown>): string | undefined {
  const { distributable_demo_credits: a, ledger_demo_credits: b } = d;
  if (!Number.isSafeInteger(a) || !Number.isSafeInteger(b)) return undefined;
  return `Distributable ${formatCredits(a as number)}, ledger ${formatCredits(b as number)}.`;
}

function disputedCount(d: Record<string, unknown>): string | undefined {
  if (!isStringArray(d.receipt_ids)) return undefined;
  const n = d.receipt_ids.length;
  return `${n} disputed receipt${n === 1 ? "" : "s"} must be resolved first.`;
}

const UNCHECKED_CREDENTIAL =
  "Run the credential check before approving: the supplied credential has not been checked yet.";

function stateConflict(subject: string): Describe {
  return (d) => {
    const state = str(d, "state");
    const attempted = str(d, "attempted");
    if (subject === "License" && state === "requested" && attempted === "approve") {
      return UNCHECKED_CREDENTIAL;
    }
    return state && attempted
      ? `${subject} is ${spaced(state)}; attempted ${spaced(attempted)}.`
      : undefined;
  };
}

const DESCRIBERS: Readonly<Record<string, Describe>> = {
  agreement_superseded: withKey("latest_agreement_id", (v) => `Latest agreement: ${v}`),
  settlement_state_conflict: stateConflict("Settlement"),
  license_state_conflict: stateConflict("License"),
  approver_already_approved: personaApproved,
  calculation_stale: withKey(
    "current_sha256",
    (v) => `The calculation changed (now ${v.slice(0, SHA_PREVIEW)}…); review it again.`,
  ),
  conservation_violation: conservation,
  credential_check_failed: withKey("reason", (v) => `Credential check failed: ${spaced(v)}.`),
  license_not_approved: withKey("status", (v) => `License status: ${spaced(v)}.`),
  settlement_exists: withKey("settlement_id", (v) => `Settlement already exists: ${v}`),
  receipt_not_disputable: withKey("status", (v) => `Receipt status: ${spaced(v)}.`),
  receipt_not_disputed: withKey("status", (v) => `Receipt status: ${spaced(v)}.`),
  benefit_state_conflict: withKey("state", (v) => `Benefit is ${spaced(v)}.`),
  settlement_has_disputed_receipts: disputedCount,
};

export function errorDetailLine(error: ClientError): string | undefined {
  if (!isRecord(error.details)) return undefined;
  return Object.hasOwn(DESCRIBERS, error.code) ? DESCRIBERS[error.code](error.details) : undefined;
}

export type PolicyReasonLine = Readonly<{ code: string; message: string | undefined }>;

/** The policy engine's reasons carried by 409 license_rights_not_allowed. */
export function policyReasons(error: ClientError): readonly PolicyReasonLine[] {
  if (error.code !== "license_rights_not_allowed" || !isRecord(error.details)) return [];
  const { reasons } = error.details;
  if (!Array.isArray(reasons)) return [];
  return reasons.flatMap((reason) =>
    isRecord(reason) && typeof reason.code === "string"
      ? [
          {
            code: reason.code,
            message: typeof reason.message === "string" ? reason.message : undefined,
          },
        ]
      : [],
  );
}
