// lighthouserc.cjs — budgets from prompt §3.6 / sprint plan §5 row D-07
const url = process.env.LHCI_URL ?? "http://localhost:3000/";
module.exports = {
  ci: {
    collect: { url: [url], numberOfRuns: 3, settings: { preset: "desktop" } },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:seo": ["error", { minScore: 0.95 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "interaction-to-next-paint": ["warn", { maxNumericValue: 200 }],
        "total-byte-weight": ["warn", { maxNumericValue: 1_000_000 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
