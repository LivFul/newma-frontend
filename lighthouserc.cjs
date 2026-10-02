// lighthouserc.cjs — budgets from prompt §3.6 / sprint plan §5 row D-07.
// Runs against a production build; port 3100 avoids the busy default port on dev machines.
const PORT = 3100;
const url = process.env.LHCI_URL ?? `http://localhost:${PORT}/`;
module.exports = {
  ci: {
    collect: {
      url: [url],
      numberOfRuns: 3,
      startServerCommand: `pnpm build && pnpm start --port ${PORT}`,
      startServerReadyPattern: "Ready",
      settings: { preset: "desktop" },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-byte-weight": ["warn", { maxNumericValue: 1_000_000 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
