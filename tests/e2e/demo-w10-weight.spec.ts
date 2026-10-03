import { expect, test } from "../support/test";
import { needsBackend, signIn } from "../support/demo";
import {
  W10_WEIGHT_BUDGET_BYTES,
  assertLight,
  formatBreakdown,
  isProductionTarget,
  measureFirstLoad,
} from "../support/weight";

// The budget is a first-load figure for a production build: `next dev` ships unminified code, so
// this runs only against `next start` (PLAYWRIGHT_PROD_BUILD=1) or a deployed host.
test.describe("W10 weight", { tag: "@needs-backend" }, () => {
  test.beforeEach(({ baseURL }) => {
    needsBackend();
    test.skip(
      !isProductionTarget(baseURL, process.env.PLAYWRIGHT_PROD_BUILD),
      "Set PLAYWRIGHT_PROD_BUILD=1 against a production build (next start) to measure weight.",
    );
  });

  test("w10 first load stays within 200 KB with no fonts or raster images", async ({
    page,
    context,
  }, info) => {
    await signIn(page, "community_liaison");
    // A fresh page: nothing from the dashboard (prefetches, cached chunks) leaks into the number.
    const fresh = await context.newPage();
    const result = await measureFirstLoad(fresh, "/demo/w10-custodian");
    const breakdown = formatBreakdown(result.requests);
    await info.attach("w10-weight-breakdown.txt", { body: breakdown, contentType: "text/plain" });
    console.log(`W10 first load ${info.project.name}: ${result.total} bytes\n${breakdown}`);

    expect(result.total, breakdown).toBeLessThanOrEqual(W10_WEIGHT_BUDGET_BYTES);
    expect(assertLight(result.requests), "no font or raster image may load").toEqual([]);
    expect(
      result.requests.filter((r) => /tour/i.test(r.url)),
      "the tour dock must not load a tour chunk when no tour is active",
    ).toEqual([]);
  });
});
