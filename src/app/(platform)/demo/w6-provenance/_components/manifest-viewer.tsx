import { JsonView } from "@/components/ui";
import type { BrowserHash } from "./use-browser-hash";

type Props = Readonly<{
  manifest: unknown;
  canonical: string;
  serverSha256: string;
  browser: BrowserHash;
  /** The server's signed canonical string to compare with; undefined for a tampered copy. */
  compareWithServer: string | undefined;
  tamperedPath: string | undefined;
}>;

function hashStatus(browser: BrowserHash, serverSha256: string): { text: string; bad: boolean } {
  if (browser.canonicalError)
    return { text: "No browser hash: the manifest cannot be canonicalised.", bad: true };
  if (browser.hashError === "unavailable") {
    return {
      text: "Browser hashing unavailable (crypto.subtle needs https or localhost).",
      bad: true,
    };
  }
  if (browser.hashError) return { text: "Browser hashing failed.", bad: true };
  if (browser.sha256 === undefined) return { text: "Computing hash…", bad: false };
  const match = browser.sha256 === serverSha256;
  return { text: match ? "Hashes match" : "Hashes differ", bad: !match };
}

function CanonicalComparison({
  browser,
  server,
}: {
  browser: BrowserHash;
  server: string | undefined;
}) {
  if (server === undefined || browser.canonical === undefined) return null;
  const same = browser.canonical === server;
  return (
    <p data-testid="canonical-comparison">
      {same
        ? "Browser canonical form matches the server byte-for-byte."
        : "Browser canonical form differs from the server's signed string (integral floats such as 1.0 and -0 do not survive the JSON round trip)."}
    </p>
  );
}

/** The canonical string, the browser-computed SHA-256 next to the server's, and the manifest. */
export function ManifestViewer({
  manifest,
  canonical,
  serverSha256,
  browser,
  compareWithServer,
  tamperedPath,
}: Props) {
  const status = hashStatus(browser, serverSha256);
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid gap-1">
        <div>
          <dt className="inline text-fg-muted">Server SHA-256: </dt>
          <dd className="inline break-all font-mono">{serverSha256}</dd>
        </div>
        <div>
          <dt className="inline text-fg-muted">Browser SHA-256: </dt>
          <dd className="inline break-all font-mono">{browser.sha256 ?? "—"}</dd>
        </div>
      </dl>
      <p
        data-testid="hash-comparison"
        aria-live="polite"
        className={status.bad ? "font-semibold text-danger" : "font-semibold"}
      >
        {status.text}
      </p>
      {browser.canonicalError ? (
        <p data-testid="canonical-error" className="text-danger">
          Cannot canonicalise: {browser.canonicalError}
        </p>
      ) : null}
      <CanonicalComparison browser={browser} server={compareWithServer} />
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
