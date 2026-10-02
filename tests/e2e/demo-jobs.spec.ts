import { expect, test } from "../support/test";
import { needsBackend, signIn } from "../support/demo";

const TERMINAL_TIMEOUT_MS = 120_000;
const TERMINAL_STATES = ["SUCCEEDED", "FAILED", "CANCELLED"];
const ONE_SHOT_BOUND_MS = 15_000;

const valueNow = async (page: import("@playwright/test").Page) =>
  Number(
    await page.getByRole("progressbar", { name: "Job progress" }).getAttribute("aria-valuenow"),
  );

test.describe("demo jobs", { tag: "@needs-backend" }, () => {
  test.beforeEach(needsBackend);

  test("a simulated screening progresses across polls and reaches a terminal state", async ({
    page,
  }) => {
    test.setTimeout(TERMINAL_TIMEOUT_MS + 30_000);
    await signIn(page, "scientist");
    await page.goto("/demo/jobs");
    await page.getByRole("button", { name: "Start simulated screening" }).click();
    await page.waitForURL(/\/demo\/jobs\/[^/]+$/);

    const poll = await page.waitForResponse((r) => /\/api\/demo\/jobs\/[^/]+$/.test(r.url()));
    expect(poll.headers()["cache-control"]).toBe("no-store");
    expect(poll.status()).toBe(200);

    // Progress must grow between polls unless the simulated run already finished while next dev
    // compiled the page.
    const first = await valueNow(page);
    if (first < 100) {
      await expect.poll(() => valueNow(page), { timeout: 30_000 }).toBeGreaterThan(first);
    }

    const badge = page.getByTestId("job-state");
    await expect
      .poll(async () => badge.getAttribute("data-state"), { timeout: TERMINAL_TIMEOUT_MS })
      .toMatch(new RegExp(TERMINAL_STATES.join("|")));
    await expect(page.getByText("Simulated workflow engine")).toBeVisible();
    await expect(page.getByText("Simulated compute")).toBeVisible();
  });

  test("an injected failure surfaces the retry notice", async ({ page }) => {
    test.setTimeout(TERMINAL_TIMEOUT_MS + 30_000);
    await signIn(page, "scientist");
    await page.goto("/demo/jobs");
    await page.getByRole("checkbox", { name: "Inject one retried failure" }).check();
    await page.getByRole("button", { name: "Start simulated screening" }).click();
    await page.waitForURL(/\/demo\/jobs\/[^/]+$/);
    await expect(page.getByRole("status")).toContainText(/Retried 1 time/, {
      timeout: TERMINAL_TIMEOUT_MS,
    });
  });

  test("the polling proxy responds at once (no streaming)", async ({ page }) => {
    await signIn(page, "scientist");
    await page.goto("/demo/jobs");
    await page.getByRole("button", { name: "Start simulated screening" }).click();
    await page.waitForURL(/\/demo\/jobs\/[^/]+$/);
    // A streaming proxy would hold the response open for the job's lifetime (minutes); a one-shot
    // proxy finishes within one poll interval plus dev-server overhead.
    const started = Date.now();
    const poll = await page.waitForResponse((r) => /\/api\/demo\/jobs\/[^/]+$/.test(r.url()));
    await poll.finished();
    expect(Date.now() - started).toBeLessThan(ONE_SHOT_BOUND_MS);
  });
});
