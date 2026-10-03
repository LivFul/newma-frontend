export function RevisionNotice({ revision }: { revision: number }) {
  return (
    <p role="status" className="rounded-md border border-warning px-3 py-2 text-sm font-semibold">
      New revision {revision} — re-review required
    </p>
  );
}
