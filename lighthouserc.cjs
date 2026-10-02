// lighthouserc.cjs — budgets from prompt §3.6 / sprint plan §5 row D-07.
// Locally it builds and serves on port 3100 (the default port is busy on dev machines). In CI,
// LHCI_URL points at the Vercel preview (with the protection-bypass query parameters, because
// Lighthouse cannot set headers) and no local server is started. The CI report stays on the filesystem
// (uploaded as a workflow artifact) because a public report URL would embed the bypass token.
const PORT = 3100;
const remoteUrl = process.env.LHCI_URL;
const localServer = {
  startServerCommand: `pnpm build && pnpm start --port ${PORT}`,
  startServerReadyPattern: "Ready",
};
// Vercel previews answer with `X-Robots-Tag: noindex`, which fails `is-crawlable` and caps the SEO
// category at 0.6. On previews the category is a warning and the audits a preview can satisfy are
// asserted individually; the category stays an error locally and in production (verified in P4).
const PREVIEW_SEO_AUDITS = [
  "document-title",
  "meta-description",
  "http-status-code",
  "link-text",
  "crawlable-anchors",
  "viewport",
  "font-size",
  "hreflang",
  "canonical",
];
const seoAssertions = remoteUrl
  ? {
      "categories:seo": ["warn", { minScore: 0.95 }],
      ...Object.fromEntries(PREVIEW_SEO_AUDITS.map((audit) => [audit, "error"])),
    }
  : { "categories:seo": ["error", { minScore: 0.95 }] };
module.exports = {
  ci: {
    collect: {
      url: [remoteUrl ?? `http://localhost:${PORT}/`],
      numberOfRuns: 3,
      settings: { preset: "desktop" },
      ...(remoteUrl ? {} : localServer),
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        ...seoAssertions,
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-byte-weight": ["warn", { maxNumericValue: 1_000_000 }],
      },
    },
    upload: remoteUrl
      ? { target: "filesystem", outputDir: ".lighthouseci" }
      : { target: "temporary-public-storage" },
  },
};
