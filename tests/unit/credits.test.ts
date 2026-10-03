import { describe, expect, it } from "vitest";
import { checkConservation, formatBasisPoints, formatCredits } from "@/lib/credits";

const line = (amount: number, kind: "beneficiary" | "reserve" | "residual" = "beneficiary") => ({
  kind,
  beneficiary_id: kind === "beneficiary" ? "b" : null,
  beneficiary_display_name: null,
  share_basis_points: 0,
  amount_demo_credits: amount,
});

describe("credits formatting (A-P5A-F02)", () => {
  it("formats integers with the unit and never a currency", () => {
    expect(formatCredits(1234)).toBe("1,234 demo credits");
    expect(formatCredits(0)).toBe("0 demo credits");
    expect(formatCredits(1)).toBe("1 demo credits");
  });

  it("formats shares as basis points, never a percentage", () => {
    expect(formatBasisPoints(2500)).toBe("2,500 basis points");
    expect(formatBasisPoints(2500)).not.toContain("%");
  });
});

describe("checkConservation sums the displayed integers (Review Focus 1)", () => {
  it("is conserved for 100 + 60 + 240 + 0 vs 400", () => {
    const calc = { distributable_demo_credits: 400, lines: [100, 60, 240, 0].map((n) => line(n)) };
    expect(checkConservation(calc)).toEqual({ conserved: true, total: 400 });
  });

  it("is conserved for the awkward 7 demo credits fixture with a residual line", () => {
    const calc = {
      distributable_demo_credits: 7,
      lines: [line(1), line(1), line(4, "reserve"), line(1, "residual")],
    };
    expect(checkConservation(calc)).toEqual({ conserved: true, total: 7 });
  });

  it("flags a broken fixture", () => {
    const calc = { distributable_demo_credits: 400, lines: [100, 60, 239].map((n) => line(n)) };
    expect(checkConservation(calc)).toEqual({ conserved: false, total: 399 });
  });

  it("treats a non-integer line as broken instead of rounding", () => {
    const calc = { distributable_demo_credits: 3, lines: [line(1.5), line(1.5)] };
    expect(checkConservation(calc).conserved).toBe(false);
  });
});

describe("checkConservation edge cases", () => {
  it("treats a negative line as broken", () => {
    const calc = { distributable_demo_credits: 5, lines: [line(10), line(-5)] };
    expect(checkConservation(calc).conserved).toBe(false);
  });
});
