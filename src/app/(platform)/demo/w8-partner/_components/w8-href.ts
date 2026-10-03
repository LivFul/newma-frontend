import type { ExportPurpose, GateStage } from "@/lib/demo/types";

export const W8_ROUTE = "/demo/w8-partner";

/** The W8 page address for an asset, optional stage and purpose (all values are plain ids). */
export function w8Href(args: {
  asset: string;
  stage?: GateStage | null;
  purpose: ExportPurpose;
}): string {
  const query = new URLSearchParams({ asset: args.asset });
  if (args.stage) query.set("stage", args.stage);
  query.set("purpose", args.purpose);
  return `${W8_ROUTE}?${query.toString()}`;
}

/** The W6 timeline for a policy decision: where the signed export events live. */
export const decisionTimelineHref = (policyDecisionId: string): string =>
  `/demo/w6-provenance/policy_decision/${encodeURIComponent(policyDecisionId)}`;
