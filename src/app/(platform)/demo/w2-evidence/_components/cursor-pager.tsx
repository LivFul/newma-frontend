import Link from "next/link";

type Props = Readonly<{ tab: string; cursor: string | undefined; nextCursor: string | null }>;

const href = (tab: string, cursor?: string) => {
  const params = new URLSearchParams({ tab, ...(cursor ? { cursor } : {}) });
  return `/demo/w2-evidence?${params.toString()}`;
};

/** Keyset paging: the cursor lives in the URL and is never decoded client-side (A-P3-13). */
export function CursorPager({ tab, cursor, nextCursor }: Props) {
  if (!cursor && !nextCursor) return null;
  return (
    <nav aria-label="Pagination" className="flex gap-4 text-sm">
      {cursor ? (
        <Link href={href(tab)} className="underline underline-offset-4">
          First page
        </Link>
      ) : null}
      {nextCursor ? (
        <Link href={href(tab, nextCursor)} className="underline underline-offset-4">
          Next page
        </Link>
      ) : null}
    </nav>
  );
}
