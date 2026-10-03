import Link from "next/link";
import { EXPORT_PURPOSES, type ExportPurpose, type GateStage } from "@/lib/demo/types";
import { w8Href } from "./w8-href";

type Props = Readonly<{
  asset: string;
  stage: GateStage | null;
  purpose: ExportPurpose;
}>;

/** The pack and the export decision follow the purpose in the address, so the choice is a link. */
export function PurposeTabs({ asset, stage, purpose }: Props) {
  return (
    <nav aria-label="Purpose">
      <ul className="flex list-none flex-wrap gap-2 p-0">
        {EXPORT_PURPOSES.map((value) => (
          <li key={value}>
            <Link
              href={w8Href({ asset, stage, purpose: value })}
              aria-current={value === purpose ? "page" : undefined}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 aria-[current=page]:border-border-strong aria-[current=page]:bg-bg-elevated aria-[current=page]:font-semibold"
            >
              Purpose: {value}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
