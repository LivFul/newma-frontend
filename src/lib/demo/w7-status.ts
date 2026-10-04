import type {
  AnchorStatus,
  BenefitStatus,
  LicenseState,
  ReceiptStatus,
  SettlementState,
} from "./types";

type Tone = "neutral" | "accent" | "warning" | "danger" | "success";

// One tone mapping per W7 vocabulary; the badge always prints the state text as well.
export const W7_STATE_TONES = {
  settlement: {
    submitted: "neutral",
    reviewed: "accent",
    approved: "accent",
    disputed: "warning",
    receipts_reconciled: "accent",
    distribution_authorized: "accent",
    funded: "accent",
    paid: "success",
    audited: "success",
    paused: "neutral",
  },
  license: {
    requested: "neutral",
    credential_check: "accent",
    approved: "success",
    denied: "danger",
  },
  receipt: { recorded: "success", duplicate: "danger", disputed: "warning" },
  benefit: { planned: "neutral", scheduled: "accent", delivered: "success" },
  anchor: { not_requested: "neutral", pending: "warning", anchored: "success" },
} as const satisfies {
  settlement: Record<SettlementState, Tone>;
  license: Record<LicenseState, Tone>;
  receipt: Record<ReceiptStatus, Tone>;
  benefit: Record<BenefitStatus, Tone>;
  anchor: Record<AnchorStatus, Tone>;
};

export type W7Vocabulary = keyof typeof W7_STATE_TONES;
