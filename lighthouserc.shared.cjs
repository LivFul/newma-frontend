// Shared Lighthouse CI configuration factory (budgets from prompt 3.6 / sprint plan 5 row D-07).
// lighthouserc.cjs builds the desktop run and lighthouserc.mobile.cjs the mobile run, from here.
//
// Locally it builds and serves on port 3100 (the default port is busy on dev machines). On a preview,
// LHCI_BASE_URL plus LHCI_QUERY (the Vercel bypass parameters, because Lighthouse cannot set headers)
// give one URL per page; the older single LHCI_URL is still honoured. Reports stay on the filesystem
// on previews because a public report URL would embed the bypass token.
const PORT = 3100;
const PAGES = ["/", "/ecosystem/interface"];

// Vercel previews answer with `X-Robots-Tag: noindex`, which fails `is-crawlable` and caps the SEO
// category at 0.6. On previews the category is a warning and the audits a preview can satisfy are
// asserted individually; the category stays an error locally and in production.
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

function targets(env) {
  const base = env.LHCI_BASE_URL?.replace(/\/+$/, "");
  if (base) {
    const query = env.LHCI_QUERY ?? "";
    return { remote: true, urls: PAGES.map((page) => `${base}${page}${query}`) };
  }
  if (env.LHCI_URL) return { remote: true, urls: [env.LHCI_URL] };
  return { remote: false, urls: PAGES.map((page) => `http://localhost:${PORT}${page}`) };
}

function buildConfig({ preset, env = process.env }) {
  const { remote, urls } = targets(env);
  const seo = remote
    ? {
        "categories:seo": ["warn", { minScore: 0.95 }],
        ...Object.fromEntries(PREVIEW_SEO_AUDITS.map((audit) => [audit, "error"])),
      }
    : { "categories:seo": ["error", { minScore: 0.95 }] };
  return {
    ci: {
      collect: {
        url: urls,
        numberOfRuns: 3,
        settings: preset === "desktop" ? { preset: "desktop" } : { formFactor: "mobile" },
        ...(remote
          ? {}
          : {
              startServerCommand: `pnpm build && pnpm start --port ${PORT}`,
              startServerReadyPattern: "Ready",
              // The command builds before it starts; lhci waits 10 s by default, far less than a build.
              startServerReadyTimeout: 600_000,
            }),
      },
      assert: {
        assertions: {
          "categories:performance": ["error", { minScore: 0.9 }],
          "categories:accessibility": ["error", { minScore: 1 }],
          ...seo,
          "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
          "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
          "installable-manifest": "warn",
          "service-worker": "warn",
          // Lighthouse cannot measure INP; total blocking time is the lab proxy (A-P4-13).
          "total-blocking-time": ["warn", { maxNumericValue: 200 }],
          "total-byte-weight": ["warn", { maxNumericValue: 1_000_000 }],
        },
      },
      upload: remote
        ? { target: "filesystem", outputDir: `.lighthouseci/${preset}` }
        : { target: "temporary-public-storage" },
    },
  };
}

module.exports = { buildConfig, PAGES, PORT };
