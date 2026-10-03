import Link from "next/link";
import type { AssetEvidence, ExportPurpose } from "@/lib/demo/types";
import { w8Href } from "./w8-href";

type Props = Readonly<{ pack: AssetEvidence; asset: string; purpose: ExportPurpose }>;

/** One link per stage that has a package; "released" only when the gate passed (A-P5B-04). */
export function StageTabs({ pack, asset, purpose }: Props) {
  const current = pack.requested_stage ?? pack.stage;
  return (
    <nav aria-label="Stages">
      <ul className="flex list-none flex-wrap gap-2 p-0">
        {pack.available_stages.map((entry) => (
          <li key={entry.stage}>
            <Link
              href={w8Href({ asset, stage: entry.stage, purpose })}
              aria-current={entry.stage === current ? "page" : undefined}
              className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 aria-[current=page]:border-border-strong aria-[current=page]:bg-bg-elevated aria-[current=page]:font-semibold"
            >
              <span className="font-mono">{entry.stage}</span>
              <span className="text-sm">
                {entry.released ? "released" : "not released: stage not passed"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
