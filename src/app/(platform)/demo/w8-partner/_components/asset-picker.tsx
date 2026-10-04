import Link from "next/link";
import type { Candidate, ExportPurpose } from "@/lib/demo/types";
import { w8Href } from "./w8-href";

type Props = Readonly<{
  candidates: readonly Candidate[];
  selected: string | undefined;
  purpose: ExportPurpose;
}>;

/** Candidates are the licensable assets (A-P5B-02): one link each, current page marked. */
export function AssetPicker({ candidates, selected, purpose }: Props) {
  return (
    <nav aria-label="Assets">
      <ul className="flex list-none flex-wrap gap-2 p-0">
        {candidates.map((candidate) => (
          <li key={candidate.id} data-rank={candidate.rank}>
            <Link
              href={w8Href({ asset: candidate.id, purpose })}
              aria-current={candidate.id === selected ? "page" : undefined}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 aria-[current=page]:border-border-strong aria-[current=page]:bg-bg-elevated aria-[current=page]:font-semibold"
            >
              {candidate.display_id} (rank {candidate.rank})
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
