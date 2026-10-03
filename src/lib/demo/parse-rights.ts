import {
  isBoundedString,
  isBoundedStringArray,
  isIsoDate,
  isRecord,
  isUuid,
  oneOf,
  pick,
} from "./guards";
import { ASSET_TYPES, POLICY_ACTIONS, PURPOSES, type PolicyRequest, SUBJECT_TYPES } from "./types";

// W1 body guards at the BFF boundary; undefined means "reject with 422".
const isPurpose = oneOf(PURPOSES);
const isAction = oneOf(POLICY_ACTIONS);
const isAssetType = oneOf(ASSET_TYPES);
const isSubjectType = oneOf(SUBJECT_TYPES);
// Caps follow the backend column sizes (PIC/MAT 80) and keep bodies small.
const MAX_AUTHORITY = 200;
const MAX_JURISDICTION = 64;
const MAX_RESTRICTIONS = 20;
const MAX_RESTRICTION = 120;
const MAX_REFERENCE = 80;
const MAX_REASON = 2000;
const isOptional = (value: unknown, valid: (v: unknown) => boolean) =>
  value === undefined || value === null || valid(value);

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

const isUses = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.length >= 1 &&
  value.length <= PURPOSES.length &&
  value.every(isPurpose) &&
  new Set(value).size === value.length;

export function parseRightsRecord(body: unknown): Record<string, unknown> | undefined {
  if (!isRecord(body)) return undefined;
  const required =
    isSubjectType(body.subject_type) &&
    isUuid(body.subject_id) &&
    isBoundedString(body.authority, MAX_AUTHORITY) &&
    isUses(body.permitted_uses) &&
    isBoundedStringArray(body.restrictions, MAX_RESTRICTIONS, MAX_RESTRICTION) &&
    isBoundedString(body.jurisdiction, MAX_JURISDICTION) &&
    isIsoDate(body.valid_from);
  const optional =
    isOptional(body.valid_until, isIsoDate) &&
    isOptional(body.pic_reference, (v) => isBoundedString(v, MAX_REFERENCE)) &&
    isOptional(body.mat_reference, (v) => isBoundedString(v, MAX_REFERENCE));
  return required && optional ? pick(body, RECORD_KEYS) : undefined;
}

export function parseWithdraw(body: unknown): { reason: string } | undefined {
  if (!isRecord(body) || !isBoundedString(body.reason, MAX_REASON)) return undefined;
  return { reason: body.reason.trim() };
}

export function parsePolicyRequest(body: unknown): PolicyRequest | undefined {
  if (!isRecord(body)) return undefined;
  const { purpose, action, asset_type, asset_id, jurisdiction } = body;
  if (!isPurpose(purpose) || !isAction(action) || !isAssetType(asset_type)) return undefined;
  if (!isUuid(asset_id)) return undefined;
  if (!isOptional(jurisdiction, (v) => isBoundedString(v, MAX_JURISDICTION))) return undefined;
  const base: PolicyRequest = { purpose, action, asset_type, asset_id };
  return typeof jurisdiction === "string" ? { ...base, jurisdiction } : base;
}
