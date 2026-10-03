// Every user-visible prose block carries the claim-register ids that cover it, so
// scripts/check-claims.mjs can resolve each sentence to a register row (D-06).
export type CopyBlock = {
  readonly id: string;
  readonly text: string;
  readonly claims: readonly string[];
};
