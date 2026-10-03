import type { EvidencePackage } from "@/lib/demo/types";

type Props = Readonly<{
  candidateId: string;
  packages: readonly EvidencePackage[];
  from?: number;
  to?: number;
}>;

/** Plain GET form (works without JS): from/to land in the URL and the page renders the diff. */
export function DiffPicker({ candidateId, packages, from, to }: Props) {
  const options = packages.map((p) => (
    <option key={`${p.stage}:${p.version}`} value={p.version}>
      v{p.version} ({p.stage})
    </option>
  ));
  return (
    <form
      method="get"
      action={`/demo/w4-gates/${encodeURIComponent(candidateId)}`}
      className="flex flex-wrap items-end gap-3"
      aria-label="Compare evidence packages"
    >
      <label className="flex flex-col gap-1 text-sm">
        From
        <select
          name="from"
          defaultValue={from}
          className="min-h-10 rounded-md border border-border-strong bg-bg-elevated px-3"
        >
          {options}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        To
        <select
          name="to"
          defaultValue={to}
          className="min-h-10 rounded-md border border-border-strong bg-bg-elevated px-3"
        >
          {options}
        </select>
      </label>
      <button
        type="submit"
        className="min-h-10 rounded-md border border-border-strong bg-bg-elevated px-4"
      >
        Compare
      </button>
    </form>
  );
}
