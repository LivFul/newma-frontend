import Link from "next/link";

export const W2_TABS = ["taxa", "compounds", "observations", "curation"] as const;
export type W2Tab = (typeof W2_TABS)[number];

const LABEL: Readonly<Record<W2Tab, string>> = {
  taxa: "Taxa",
  compounds: "Compounds",
  observations: "Observations",
  curation: "Curation",
};

/** Plain links (no client JS): the tab lives in ?tab= so it is shareable and back-button safe. */
export function TabNav({ active }: { active: W2Tab }) {
  return (
    <nav aria-label="Evidence views">
      <ul className="flex list-none flex-wrap gap-2 p-0">
        {W2_TABS.map((tab) => (
          <li key={tab}>
            <Link
              href={`/demo/w2-evidence?tab=${tab}`}
              aria-current={tab === active ? "page" : undefined}
              className="inline-flex min-h-10 items-center rounded-md border border-border px-3 aria-[current=page]:border-accent aria-[current=page]:font-semibold"
            >
              {LABEL[tab]}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
