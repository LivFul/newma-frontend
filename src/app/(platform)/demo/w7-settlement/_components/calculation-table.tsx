import { IllustrativeBadge } from "@/components/ui";
import { checkConservation, formatBasisPoints, formatCredits } from "@/lib/credits";
import type { CalcLine, Calculation } from "@/lib/demo/types";
import { CopyHash } from "./copy-hash";

const CAPTION = "Illustrative calculation — rules are illustrative, amounts in demo credits";

function lineLabel(line: CalcLine): string {
  if (line.kind === "reserve") return "Reserve (illustrative)";
  if (line.kind === "residual") return "Rounding residual (carried to the reserve pool)";
  return line.beneficiary_display_name ?? "Beneficiary";
}

/** Shared by the calculation and the ledger: sums the displayed integers (Review Focus 1). */
export function ConservationStatus({
  lines,
  distributable,
  testId,
}: {
  lines: readonly Readonly<{ amount_demo_credits: number }>[];
  distributable: number;
  testId: string;
}) {
  const { conserved, total } = checkConservation({
    distributable_demo_credits: distributable,
    lines,
  });
  if (conserved) {
    return (
      <p data-testid={testId} role="status" className="text-sm font-medium">
        Conserved: {formatCredits(total)}
      </p>
    );
  }
  return (
    <p
      data-testid={testId}
      role="alert"
      className="rounded-md border border-danger px-3 py-2 text-sm"
    >
      Not conserved: the lines sum to{" "}
      {Number.isSafeInteger(total) ? formatCredits(total) : "an unusable total"} but{" "}
      {formatCredits(distributable)} is distributable.
    </p>
  );
}

/** The backend's integer lines in served order; the browser only adds them for the check. */
export function CalculationTable({ calculation }: { calculation: Calculation | null }) {
  if (calculation === null) {
    return <p className="text-sm text-fg-muted">No calculation yet: record a receipt first.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="flex flex-wrap items-center gap-2 text-sm">
        <IllustrativeBadge />
        <span>{calculation.frozen ? "Frozen at reconciliation" : "Live preview"}</span>
        <span className="text-fg-muted">SHA-256</span>
        <CopyHash value={calculation.sha256} label="calculation SHA-256" />
      </p>
      <div className="overflow-x-auto">
        <table aria-label={CAPTION} className="w-full text-left text-sm">
          <caption className="sr-only">{CAPTION}</caption>
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="py-1 pr-3">
                Line
              </th>
              <th scope="col" className="py-1 pr-3">
                Share
              </th>
              <th scope="col" className="py-1 text-right">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {calculation.lines.map((line, index) => (
              <tr
                key={`${line.kind}-${line.beneficiary_id ?? index}`}
                data-testid="calc-line"
                data-kind={line.kind}
                className="border-b border-border"
              >
                <th scope="row" className="py-1 pr-3 font-normal">
                  {lineLabel(line)}
                </th>
                <td className="py-1 pr-3">
                  {line.kind === "residual" ? (
                    "—"
                  ) : (
                    <span className="inline-flex flex-wrap items-center gap-2">
                      <span className="font-mono">
                        {formatBasisPoints(line.share_basis_points)}
                      </span>
                      <IllustrativeBadge />
                    </span>
                  )}
                </td>
                <td className="py-1 text-right font-mono">
                  {formatCredits(line.amount_demo_credits)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" className="py-1 pr-3 text-left">
                Distributable total
              </th>
              <td />
              <td
                data-testid="calc-distributable"
                className="py-1 text-right font-mono font-semibold"
              >
                {formatCredits(calculation.distributable_demo_credits)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
      {calculation.held_demo_credits > 0 ? (
        <p data-testid="calc-held" className="text-sm">
          {formatCredits(calculation.held_demo_credits)} held — not payable (outside the
          distributable total)
        </p>
      ) : null}
      <ConservationStatus
        lines={calculation.lines}
        distributable={calculation.distributable_demo_credits}
        testId="conservation"
      />
    </div>
  );
}
