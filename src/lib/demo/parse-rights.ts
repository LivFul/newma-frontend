import { isNonEmptyString, isRecord, isStringArray, isUuid, oneOf, pick } from "./guards";
import { ASSET_TYPES, POLICY_ACTIONS, PURPOSES, type PolicyRequest, SUBJECT_TYPES } from "./types";

// W1 body guards at the BFF boundary; undefined means "reject with 422".
const isPurpose = oneOf(PURPOSES);
const isAction = oneOf(POLICY_ACTIONS);
const isAssetType = oneOf(ASSET_TYPES);
const isSubjectType = oneOf(SUBJECT_TYPES);
const isOptionalString = (value: unknown) => value === undefined || typeof value === "string";

const RECORD_KEYS = [
  "subject_type",
  "subject_id",
  "authority",
  "permitted_uses",
  "restrictions",
  "jurisdiction",
  "valid_from",
  "valid_until",
  "pic_reference",
  "mat_reference",
] as const;

export function parseRightsRecord(body: unknown): Record<string, unknown> | undefined {
  if (!isRecord(body)) return undefined;
  const { subject_type, subject_id, authority, permitted_uses, restrictions } = body;
  const required =
    isSubjectType(subject_type) &&
    isUuid(subject_id) &&
    isNonEmptyString(authority) &&
    Array.isArray(permitted_uses) &&
    permitted_uses.every(isPurpose) &&
    isStringArray(restrictions) &&
    isNonEmptyString(body.jurisdiction) &&
    isNonEmptyString(body.valid_from);
  const optional = ["valid_until", "pic_reference", "mat_reference"].every((key) =>
    isOptionalString(body[key]),
  );
  return required && optional ? pick(body, RECORD_KEYS) : undefined;
}

export function parseWithdraw(body: unknown): { reason: string } | undefined {
  if (!isRecord(body) || !isNonEmptyString(body.reason)) return undefined;
  return { reason: body.reason.trim() };
}

export function parsePolicyRequest(body: unknown): PolicyRequest | undefined {
  if (!isRecord(body)) return undefined;
  const { purpose, action, asset_type, asset_id, jurisdiction } = body;
  if (!isPurpose(purpose) || !isAction(action) || !isAssetType(asset_type)) return undefined;
  if (!isUuid(asset_id) || !isOptionalString(jurisdiction)) return undefined;
  const base: PolicyRequest = { purpose, action, asset_type, asset_id };
  return jurisdiction ? { ...base, jurisdiction: jurisdiction as string } : base;
}
