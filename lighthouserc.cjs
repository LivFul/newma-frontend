// lighthouserc.cjs — budgets from prompt §3.6 / sprint plan §5 row D-07.
// Locally it builds and serves on port 3100 (the default port is busy on dev machines). In CI,
// LHCI_URL points at the Vercel preview (with the protection-bypass query parameters, because
// Lighthouse cannot set headers) and no local server is started.
const PORT = 3100;
const remoteUrl = process.env.LHCI_URL;
const localServer = {
  startServerCommand: `pnpm build && pnpm start --port ${PORT}`,
  startServerReadyPattern: "Ready",
};
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
        "categories:seo": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-byte-weight": ["warn", { maxNumericValue: 1_000_000 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
