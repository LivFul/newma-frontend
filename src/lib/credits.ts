// Demo-credit and basis-point formatting plus the on-screen conservation check (A-P5A-F02).
// Browser arithmetic is integer addition only: no division, no rounding, no percentages.
const NUMBER = new Intl.NumberFormat("en-US");

export const CREDITS_UNIT = "demo credits";

export const formatCredits = (amount: number): string => `${NUMBER.format(amount)} ${CREDITS_UNIT}`;

export const formatBasisPoints = (basisPoints: number): string =>
  `${NUMBER.format(basisPoints)} basis points`;

type CalculationLike = Readonly<{
  distributable_demo_credits: number;
  lines: readonly Readonly<{ amount_demo_credits: number }>[];
}>;

export type Conservation = Readonly<{ conserved: boolean; total: number }>;

/** Sums the displayed integer lines and compares with the distributable amount. */
export function checkConservation(calculation: CalculationLike): Conservation {
  let total = 0;
  let integers = true;
  for (const { amount_demo_credits: amount } of calculation.lines) {
    if (!Number.isSafeInteger(amount)) integers = false;
    total += amount;
  }
  return { conserved: integers && total === calculation.distributable_demo_credits, total };
}
