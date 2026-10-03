import { JsonView } from "@/components/ui";

type Props = Readonly<{
  manifest: unknown;
  canonical: string;
  serverSha256: string;
  browserSha256: string | undefined;
  canonicalMatchesServer: boolean | undefined;
  tamperedPath: string | undefined;
}>;

/** The canonical string, the browser-computed SHA-256 next to the server's, and the manifest. */
export function ManifestViewer({
  manifest,
  canonical,
  serverSha256,
  browserSha256,
  canonicalMatchesServer,
  tamperedPath,
}: Props) {
  const match = browserSha256 === undefined ? undefined : browserSha256 === serverSha256;
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid gap-1">
        <div>
          <dt className="inline text-fg-muted">Server SHA-256: </dt>
          <dd className="inline break-all font-mono">{serverSha256}</dd>
        </div>
        <div>
          <dt className="inline text-fg-muted">Browser SHA-256: </dt>
          <dd className="inline break-all font-mono">{browserSha256 ?? "computing…"}</dd>
        </div>
      </dl>
      <p
        data-testid="hash-comparison"
        aria-live="polite"
        className={match === false ? "font-semibold text-danger" : "font-semibold"}
      >
        {match === undefined ? "Computing hash…" : match ? "Hashes match" : "Hashes differ"}
      </p>
      {canonicalMatchesServer !== undefined ? (
        <p data-testid="canonical-comparison">
          {canonicalMatchesServer
            ? "Browser canonical form matches the server byte-for-byte."
            : "Browser canonical form differs from the server's signed string."}
        </p>
      ) : null}
      <section aria-label="Canonical string" className="space-y-1">
        <h3 className="text-sm font-medium">Canonical string</h3>
        <pre
          tabIndex={0}
          className="max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-md border border-border bg-bg-elevated p-3 text-xs"
        >
          {canonical}
        </pre>
      </section>
      <JsonView value={manifest} label="Manifest" highlightPath={tamperedPath} />
    </div>
  );
}
